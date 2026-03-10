# import asyncio
# from datetime import datetime, timedelta
# from typing import Any, Optional

# from bson import ObjectId
# from fastapi import APIRouter, Depends, HTTPException, Query

# from app.models.task import AIBreakdownInput, NLPInput, TaskCreate, TaskUpdate
# from app.services.ai_assistant_service import (
#     build_daily_plan,
#     generate_productivity_insights,
#     suggest_subtasks,
# )
# from app.services.nlp_service import parse_natural_language
# from app.utils.database import tasks_collection
# from app.utils.dependencies import get_current_user

# router = APIRouter(prefix="/tasks", tags=["Tasks"])

# TASK_RESPONSE_PROJECTION = {
#     "_id": 1,
#     "user_id": 1,
#     "title": 1,
#     "category": 1,
#     "priority": 1,
#     "scheduled_time": 1,
#     "completed": 1,
#     "reminder_sent": 1,
#     "created_at": 1,
# }


# def _parse_task_id(task_id: str) -> ObjectId:
#     if not ObjectId.is_valid(task_id):
#         raise HTTPException(status_code=400, detail="Invalid task id")
#     return ObjectId(task_id)


# def task_to_response(task: dict[str, Any]) -> dict[str, Any]:
#     return {
#         "id": str(task["_id"]),
#         "user_id": str(task["user_id"]),
#         "title": task["title"],
#         "category": task["category"],
#         "priority": task["priority"],
#         "scheduled_time": task.get("scheduled_time"),
#         "completed": task.get("completed", False),
#         "reminder_sent": task.get("reminder_sent", False),
#         "created_at": task["created_at"],
#     }


# @router.post("/parse-nlp")
# async def parse_nlp(data: NLPInput, current_user: dict = Depends(get_current_user)):
#     del current_user
#     return parse_natural_language(data.text)


# @router.post("/", status_code=201)
# async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
#     user_id = str(current_user["_id"])

#     task_doc = {
#         "user_id": user_id,
#         "title": task_data.title.strip(),
#         "category": task_data.category,
#         "priority": task_data.priority,
#         "scheduled_time": task_data.scheduled_time,
#         "completed": False,
#         "reminder_sent": False,
#         "created_at": datetime.utcnow(),
#     }

#     result = await tasks_collection.insert_one(task_doc)
#     task_doc["_id"] = result.inserted_id
#     return task_to_response(task_doc)


# @router.get("/")
# async def get_tasks(
#     current_user: dict = Depends(get_current_user),
#     category: Optional[str] = Query(None),
#     priority: Optional[str] = Query(None),
#     completed: Optional[bool] = Query(None),
#     search: Optional[str] = Query(None),
# ):
#     user_id = str(current_user["_id"])
#     query: dict[str, Any] = {"user_id": user_id}

#     if category:
#         query["category"] = category
#     if priority:
#         query["priority"] = priority
#     if completed is not None:
#         query["completed"] = completed
#     if search:
#         query["title"] = {"$regex": search, "$options": "i"}

#     cursor = tasks_collection.find(query).sort("created_at", -1)
#     tasks = []
#     async for task in cursor:
#         tasks.append(task_to_response(task))
#     return tasks


# @router.get("/dashboard")
# async def get_dashboard(current_user: dict = Depends(get_current_user)):
#     user_id = str(current_user["_id"])
#     now = datetime.utcnow()
#     today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
#     today_end = today_start + timedelta(days=1)
#     week_start = today_start - timedelta(days=6)

#     today_cursor = tasks_collection.find(
#         {
#             "user_id": user_id,
#             "created_at": {"$gte": today_start, "$lt": today_end},
#         },
#         projection=TASK_RESPONSE_PROJECTION,
#     )

#     upcoming_cursor = tasks_collection.find(
#         {
#             "user_id": user_id,
#             "scheduled_time": {"$gte": now, "$lte": now + timedelta(days=7)},
#             "completed": False,
#         },
#         projection=TASK_RESPONSE_PROJECTION,
#     ).sort("scheduled_time", 1)

#     weekly_cursor = tasks_collection.aggregate(
#         [
#             {
#                 "$match": {
#                     "user_id": user_id,
#                     "created_at": {"$gte": week_start, "$lt": today_end},
#                 }
#             },
#             {
#                 "$group": {
#                     "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
#                     "total": {"$sum": 1},
#                     "completed": {"$sum": {"$cond": [{"$eq": ["$completed", True]}, 1, 0]}},
#                 }
#             },
#         ]
#     )

#     today_raw, upcoming_raw, total, completed_count, missed, weekly_agg = await asyncio.gather(
#         today_cursor.to_list(length=None),
#         upcoming_cursor.to_list(length=5),
#         tasks_collection.count_documents({"user_id": user_id}),
#         tasks_collection.count_documents({"user_id": user_id, "completed": True}),
#         tasks_collection.count_documents(
#             {
#                 "user_id": user_id,
#                 "scheduled_time": {"$lt": now},
#                 "completed": False,
#             }
#         ),
#         weekly_cursor.to_list(length=None),
#     )

#     today_tasks = [task_to_response(task) for task in today_raw]
#     upcoming_tasks = [task_to_response(task) for task in upcoming_raw]
#     productivity_score = int((completed_count / total) * 100) if total > 0 else 0
#     pending_count = max(total - completed_count, 0)

#     weekly_lookup = {row["_id"]: {"total": row["total"], "completed": row["completed"]} for row in weekly_agg}
#     weekly_data = []
#     for i in range(6, -1, -1):
#         day = today_start - timedelta(days=i)
#         key = day.strftime("%Y-%m-%d")
#         counts = weekly_lookup.get(key, {"total": 0, "completed": 0})
#         weekly_data.append(
#             {
#                 "day": day.strftime("%a"),
#                 "total": counts["total"],
#                 "completed": counts["completed"],
#             }
#         )

#     return {
#         "today_tasks": today_tasks,
#         "upcoming_tasks": upcoming_tasks,
#         "stats": {
#             "total": total,
#             "completed": completed_count,
#             "pending": pending_count,
#             "missed": missed,
#             "productivity_score": productivity_score,
#         },
#         "weekly_data": weekly_data,
#     }


# @router.get("/ai/insights")
# async def get_ai_insights(current_user: dict = Depends(get_current_user)):
#     user_id = str(current_user["_id"])
#     tasks = await tasks_collection.find({"user_id": user_id}, projection=TASK_RESPONSE_PROJECTION).to_list(length=500)
#     return generate_productivity_insights(tasks)


# @router.get("/ai/daily-plan")
# async def get_ai_daily_plan(
#     current_user: dict = Depends(get_current_user),
#     limit: int = Query(8, ge=3, le=20),
# ):
#     user_id = str(current_user["_id"])
#     tasks = await tasks_collection.find({"user_id": user_id, "completed": False}, projection=TASK_RESPONSE_PROJECTION).to_list(length=300)
#     return {"plan": build_daily_plan(tasks, limit=limit)}


# @router.post("/ai/breakdown")
# async def get_ai_breakdown(data: AIBreakdownInput, current_user: dict = Depends(get_current_user)):
#     del current_user
#     return {"title": data.title, "steps": suggest_subtasks(data.title)}


# @router.put("/{task_id}")
# async def update_task(
#     task_id: str,
#     task_data: TaskUpdate,
#     current_user: dict = Depends(get_current_user),
# ):
#     user_id = str(current_user["_id"])
#     object_id = _parse_task_id(task_id)

#     update_data = task_data.model_dump(exclude_none=True)
#     if not update_data:
#         raise HTTPException(status_code=400, detail="No data to update")

#     result = await tasks_collection.update_one(
#         {"_id": object_id, "user_id": user_id},
#         {"$set": update_data},
#     )

#     if result.matched_count == 0:
#         raise HTTPException(status_code=404, detail="Task not found")

#     task = await tasks_collection.find_one({"_id": object_id})
#     if not task:
#         raise HTTPException(status_code=404, detail="Task not found")
#     return task_to_response(task)


# @router.delete("/{task_id}")
# async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
#     user_id = str(current_user["_id"])
#     object_id = _parse_task_id(task_id)

#     result = await tasks_collection.delete_one({"_id": object_id, "user_id": user_id})
#     if result.deleted_count == 0:
#         raise HTTPException(status_code=404, detail="Task not found")
#     return {"message": "Task deleted successfully"}


# @router.patch("/{task_id}/complete")
# async def toggle_complete(task_id: str, current_user: dict = Depends(get_current_user)):
#     user_id = str(current_user["_id"])
#     object_id = _parse_task_id(task_id)

#     task = await tasks_collection.find_one({"_id": object_id, "user_id": user_id})
#     if not task:
#         raise HTTPException(status_code=404, detail="Task not found")

#     new_status = not task.get("completed", False)
#     await tasks_collection.update_one({"_id": object_id}, {"$set": {"completed": new_status}})
#     task["completed"] = new_status
#     return task_to_response(task)



from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.task import TaskCreate, TaskUpdate, NLPInput
from app.utils.database import tasks_collection
from app.utils.dependencies import get_current_user
from app.services.nlp_service import parse_natural_language
from app.services.ai_suggest_service import get_smart_suggestions
from app.services.streak_service import update_user_streak
from app.routes.activity_routes import log_activity
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class BulkAction(BaseModel):
    task_ids: List[str]
    action: str  # "complete" | "delete" | "set_priority"
    value: Optional[str] = None  # for set_priority


def _parse_task_id(task_id: str) -> ObjectId:
    if not ObjectId.is_valid(task_id):
        raise HTTPException(status_code=400, detail="Invalid task id")
    return ObjectId(task_id)


def task_to_response(task: dict) -> dict:
    now = datetime.utcnow()
    is_overdue = (
        task.get("scheduled_time") and
        task["scheduled_time"] < now and
        not task.get("completed")
    )
    return {
        "id": str(task["_id"]),
        "user_id": task["user_id"],
        "title": task["title"],
        "category": task.get("category", "Other"),
        "priority": task.get("priority", "Medium"),
        "scheduled_time": task["scheduled_time"].isoformat() if task.get("scheduled_time") else None,
        "completed": task.get("completed", False),
        "reminder_sent": task.get("reminder_sent", False),
        "recurring": task.get("recurring", "none"),
        "subtasks": task.get("subtasks", []),
        "tags": task.get("tags", []),
        "notes": task.get("notes", ""),
        "estimated_minutes": task.get("estimated_minutes"),
        "overdue": is_overdue,
        "priority_auto_set": task.get("priority_auto_set", False),
        "auto_created": task.get("auto_created", False),
        "created_at": task["created_at"].isoformat()
    }


@router.post("/parse-nlp")
async def parse_nlp(data: NLPInput, current_user: dict = Depends(get_current_user)):
    result = parse_natural_language(data.text)
    suggestions = get_smart_suggestions(
        title=result.get("title", data.text),
        category=result.get("category", "Other"),
        priority=result.get("priority", "Medium"),
        scheduled_time=result.get("scheduled_time")
    )
    result["suggestions"] = suggestions
    return result


@router.post("/suggest")
async def get_task_suggestions(data: NLPInput, current_user: dict = Depends(get_current_user)):
    return get_smart_suggestions(title=data.text, category="Other", priority="Medium")


@router.post("/bulk")
async def bulk_action(data: BulkAction, current_user: dict = Depends(get_current_user)):
    """Perform one action on many tasks at once."""
    user_id = str(current_user["_id"])
    object_ids = [ObjectId(tid) for tid in data.task_ids if ObjectId.is_valid(tid)]
    count = 0

    if data.action == "complete":
        result = await tasks_collection.update_many(
            {"_id": {"$in": object_ids}, "user_id": user_id},
            {"$set": {"completed": True}}
        )
        count = result.modified_count
        await log_activity(user_id, "bulk_completed", f"{count} tasks", {"count": count})
        await update_user_streak(user_id)

    elif data.action == "delete":
        result = await tasks_collection.delete_many(
            {"_id": {"$in": object_ids}, "user_id": user_id}
        )
        count = result.deleted_count
        await log_activity(user_id, "deleted", f"{count} tasks", {"count": count, "bulk": True})

    elif data.action == "set_priority" and data.value:
        valid = ["Low", "Medium", "High", "Critical"]
        if data.value not in valid:
            raise HTTPException(status_code=400, detail=f"Priority must be one of {valid}")
        result = await tasks_collection.update_many(
            {"_id": {"$in": object_ids}, "user_id": user_id},
            {"$set": {"priority": data.value, "priority_auto_set": False}}
        )
        count = result.modified_count

    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    return {"action": data.action, "affected": count}


@router.post("/", status_code=201)
async def create_task(task_data: TaskCreate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    raw_subtasks = getattr(task_data, "subtasks", []) or []
    subtasks = [
        {"id": str(uuid.uuid4())[:8], "title": str(s).strip(), "completed": False}
        for s in raw_subtasks
        if str(s).strip()
    ]
    task_doc = {
        "user_id": user_id,
        "title": task_data.title.strip(),
        "category": task_data.category,
        "priority": task_data.priority,
        "scheduled_time": task_data.scheduled_time,
        "completed": False,
        "reminder_sent": False,
        "recurring": getattr(task_data, "recurring", "none") or "none",
        "subtasks": subtasks,
        "tags": [str(tag).strip() for tag in (getattr(task_data, "tags", []) or []) if str(tag).strip()],
        "notes": (getattr(task_data, "notes", "") or "").strip(),
        "estimated_minutes": getattr(task_data, "estimated_minutes", None),
        "auto_created": False,
        "priority_auto_set": False,
        "created_at": datetime.utcnow()
    }
    result = await tasks_collection.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    await log_activity(user_id, "created", task_data.title)
    return task_to_response(task_doc)


@router.get("/dashboard")
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)

    all_tasks = [t async for t in tasks_collection.find({"user_id": user_id})]
    today_tasks = [t for t in all_tasks if today_start <= t.get("created_at", now) < today_end]
    upcoming = sorted(
        [t for t in all_tasks if t.get("scheduled_time") and t["scheduled_time"] >= now and not t.get("completed")],
        key=lambda x: x["scheduled_time"]
    )[:5]

    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.get("completed"))
    overdue = sum(1 for t in all_tasks if t.get("scheduled_time") and t["scheduled_time"] < now and not t.get("completed"))

    weekly_data = []
    for i in range(6, -1, -1):
        day = today_start - timedelta(days=i)
        day_end = day + timedelta(days=1)
        day_tasks = [t for t in all_tasks if day <= t.get("created_at", datetime.min) < day_end]
        weekly_data.append({
            "day": day.strftime("%a"),
            "total": len(day_tasks),
            "completed": sum(1 for t in day_tasks if t.get("completed"))
        })

    return {
        "today_tasks": [task_to_response(t) for t in today_tasks],
        "upcoming_tasks": [task_to_response(t) for t in upcoming],
        "stats": {
            "total": total,
            "completed": completed,
            "pending": total - completed - overdue,
            "overdue": overdue,
            "productivity_score": int((completed / total) * 100) if total else 0
        },
        "weekly_data": weekly_data
    }


@router.get("/calendar")
async def get_calendar_tasks(
    current_user: dict = Depends(get_current_user),
    year: int = Query(None),
    month: int = Query(None)
):
    user_id = str(current_user["_id"])
    now = datetime.utcnow()
    y, m = year or now.year, month or now.month
    from calendar import monthrange
    days_in_month = monthrange(y, m)[1]
    start = datetime(y, m, 1)
    end = datetime(y, m, days_in_month, 23, 59, 59)
    tasks = [task_to_response(t) async for t in tasks_collection.find({
        "user_id": user_id,
        "scheduled_time": {"$gte": start, "$lte": end}
    }).sort("scheduled_time", 1)]
    return tasks


@router.get("/")
async def get_tasks(
    current_user: dict = Depends(get_current_user),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    completed: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    overdue: Optional[bool] = Query(None),
):
    user_id = str(current_user["_id"])
    query: dict = {"user_id": user_id}
    if category: query["category"] = category
    if priority: query["priority"] = priority
    if completed is not None: query["completed"] = completed
    if search: query["title"] = {"$regex": search, "$options": "i"}
    if tag: query["tags"] = {"$in": [tag]}

    tasks = [task_to_response(t) async for t in tasks_collection.find(query).sort("created_at", -1)]

    if overdue is True:
        tasks = [t for t in tasks if t.get("overdue")]

    return tasks


@router.put("/{task_id}")
async def update_task(task_id: str, task_data: TaskUpdate, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    object_id = _parse_task_id(task_id)
    update_data = task_data.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data")
    await tasks_collection.update_one(
        {"_id": object_id, "user_id": user_id},
        {"$set": update_data}
    )
    task = await tasks_collection.find_one({"_id": object_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_to_response(task)


@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    object_id = _parse_task_id(task_id)
    task = await tasks_collection.find_one({"_id": object_id, "user_id": user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await tasks_collection.delete_one({"_id": object_id})
    await log_activity(user_id, "deleted", task["title"])
    return {"message": "Task deleted"}


@router.patch("/{task_id}/complete")
async def toggle_complete(task_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    object_id = _parse_task_id(task_id)
    task = await tasks_collection.find_one({"_id": object_id, "user_id": user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    new_status = not task.get("completed", False)
    await tasks_collection.update_one(
        {"_id": object_id},
        {"$set": {"completed": new_status}}
    )
    if new_status:
        await log_activity(user_id, "completed", task["title"])
        await update_user_streak(user_id)
    task["completed"] = new_status
    return task_to_response(task)


@router.patch("/{task_id}/subtask/{subtask_id}")
async def toggle_subtask(task_id: str, subtask_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    object_id = _parse_task_id(task_id)
    task = await tasks_collection.find_one({"_id": object_id, "user_id": user_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    subtasks = task.get("subtasks", [])
    for st in subtasks:
        if st["id"] == subtask_id:
            st["completed"] = not st["completed"]
            break
    all_done = subtasks and all(st["completed"] for st in subtasks)
    await tasks_collection.update_one(
        {"_id": object_id},
        {"$set": {"subtasks": subtasks, "completed": all_done if all_done else task.get("completed", False)}}
    )
    task["subtasks"] = subtasks
    return task_to_response(task)
