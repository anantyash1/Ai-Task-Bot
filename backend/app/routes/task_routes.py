import asyncio
from datetime import datetime, timedelta
from typing import Any, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.task import AIBreakdownInput, NLPInput, TaskCreate, TaskUpdate
from app.services.ai_assistant_service import (
    build_daily_plan,
    generate_productivity_insights,
    suggest_subtasks,
)
from app.services.nlp_service import parse_natural_language
from app.utils.database import tasks_collection
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

TASK_RESPONSE_PROJECTION = {
    "_id": 1,
    "user_id": 1,
    "title": 1,
    "category": 1,
    "priority": 1,
    "scheduled_time": 1,
    "completed": 1,
    "reminder_sent": 1,
    "created_at": 1,
}


def _parse_task_id(task_id: str) -> ObjectId:
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task id")
    return ObjectId(task_id)


def task_to_response(task: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(task["_id"]),
        "user_id": str(task["user_id"]),
        "title": task["title"],
        "category": task["category"],
        "priority": task["priority"],
        "scheduled_time": task.get("scheduled_time"),
        "completed": task.get("completed", False),
        "reminder_sent": task.get("reminder_sent", False),
        "created_at": task["created_at"],
    }


@router.post("/parse-nlp")
async def parse_nlp(data: NLPInput, current_user: dict = Depends(get_current_user)):
    del current_user
    return parse_natural_language(data.text)


@router.post("/", status_code=201)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])

    task_doc = {
        "user_id": user_id,
        "title": task_data.title.strip(),
        "category": task_data.category,
        "priority": task_data.priority,
        "scheduled_time": task_data.scheduled_time,
        "completed": False,
        "reminder_sent": False,
        "created_at": datetime.utcnow(),
    }

    result = await tasks_collection.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    return task_to_response(task_doc)


@router.get("/")
async def get_tasks(
    current_user: dict = Depends(get_current_user),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
):
    user_id = str(current_user["_id"])
    query: dict[str, Any] = {"user_id": user_id}

    if category:
        query["category"] = category
    if priority:
        query["priority"] = priority
    if completed is not None:
        query["completed"] = completed
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    cursor = tasks_collection.find(query).sort("created_at", -1)
    tasks = []
    async for task in cursor:
        tasks.append(task_to_response(task))
    return tasks


@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_start = today_start - timedelta(days=6)

    today_cursor = tasks_collection.find(
        {
            "user_id": user_id,
            "created_at": {"$gte": today_start, "$lt": today_end},
        },
        projection=TASK_RESPONSE_PROJECTION,
    )

    upcoming_cursor = tasks_collection.find(
        {
            "user_id": user_id,
            "scheduled_time": {"$gte": now, "$lte": now + timedelta(days=7)},
            "completed": False,
        },
        projection=TASK_RESPONSE_PROJECTION,
    ).sort("scheduled_time", 1)

    weekly_cursor = tasks_collection.aggregate(
        [
            {
                "$match": {
                    "user_id": user_id,
                    "created_at": {"$gte": week_start, "$lt": today_end},
                }
            },
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                    "total": {"$sum": 1},
                    "completed": {"$sum": {"$cond": [{"$eq": ["$completed", True]}, 1, 0]}},
                }
            },
        ]
    )

    today_raw, upcoming_raw, total, completed_count, missed, weekly_agg = await asyncio.gather(
        today_cursor.to_list(length=None),
        upcoming_cursor.to_list(length=5),
        tasks_collection.count_documents({"user_id": user_id}),
        tasks_collection.count_documents({"user_id": user_id, "completed": True}),
        tasks_collection.count_documents(
            {
                "user_id": user_id,
                "scheduled_time": {"$lt": now},
                "completed": False,
            }
        ),
        weekly_cursor.to_list(length=None),
    )

    today_tasks = [task_to_response(task) for task in today_raw]
    upcoming_tasks = [task_to_response(task) for task in upcoming_raw]
    productivity_score = int((completed_count / total) * 100) if total > 0 else 0
    pending_count = max(total - completed_count, 0)

    weekly_lookup = {row["_id"]: {"total": row["total"], "completed": row["completed"]} for row in weekly_agg}
    weekly_data = []
    for i in range(6, -1, -1):
        day = today_start - timedelta(days=i)
        key = day.strftime("%Y-%m-%d")
        counts = weekly_lookup.get(key, {"total": 0, "completed": 0})
        weekly_data.append(
            {
                "day": day.strftime("%a"),
                "total": counts["total"],
                "completed": counts["completed"],
            }
        )

    return {
        "today_tasks": today_tasks,
        "upcoming_tasks": upcoming_tasks,
        "stats": {
            "total": total,
            "completed": completed_count,
            "pending": pending_count,
            "missed": missed,
            "productivity_score": productivity_score,
        },
        "weekly_data": weekly_data,
    }


@router.get("/ai/insights")
async def get_ai_insights(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    tasks = await tasks_collection.find({"user_id": user_id}, projection=TASK_RESPONSE_PROJECTION).to_list(length=500)
    return generate_productivity_insights(tasks)


@router.get("/ai/daily-plan")
async def get_ai_daily_plan(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(8, ge=3, le=20),
):
    user_id = str(current_user["_id"])
    tasks = await tasks_collection.find({"user_id": user_id, "completed": False}, projection=TASK_RESPONSE_PROJECTION).to_list(length=300)
    return {"plan": build_daily_plan(tasks, limit=limit)}


@router.post("/ai/breakdown")
async def get_ai_breakdown(data: AIBreakdownInput, current_user: dict = Depends(get_current_user)):
    del current_user
    return {"title": data.title, "steps": suggest_subtasks(data.title)}


@router.put("/{task_id}")
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    object_id = _parse_task_id(task_id)

    update_data = task_data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")

    result = await tasks_collection.update_one(
        {"_id": object_id, "user_id": user_id},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")

    task = await tasks_collection.find_one({"_id": object_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_response(task)


@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    object_id = _parse_task_id(task_id)

    result = await tasks_collection.delete_one({"_id": object_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


@router.patch("/{task_id}/complete")
async def toggle_complete(task_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    object_id = _parse_task_id(task_id)

    task = await tasks_collection.find_one({"_id": object_id, "user_id": user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    new_status = not task.get("completed", False)
    await tasks_collection.update_one({"_id": object_id}, {"$set": {"completed": new_status}})
    task["completed"] = new_status
    return task_to_response(task)
