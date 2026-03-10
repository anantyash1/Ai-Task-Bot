from fastapi import APIRouter, HTTPException, Depends
from app.models.goal import GoalCreate, GoalUpdate
from app.utils.dependencies import get_current_user
from app.utils.database import tasks_collection, goals_collection
from datetime import datetime, timedelta
from bson import ObjectId

router = APIRouter(prefix="/goals", tags=["Goals"])


def _parse_goal_id(goal_id: str) -> ObjectId:
    if not ObjectId.is_valid(goal_id):
        raise HTTPException(status_code=400, detail="Invalid goal id")
    return ObjectId(goal_id)


def get_period_bounds(period: str):
    now = datetime.utcnow()
    if period == "weekly":
        # Start of current week (Monday)
        days_since_monday = now.weekday()
        start = (now - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end = start + timedelta(days=7)
    else:
        # Start of current month
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end = now.replace(year=now.year + 1, month=1, day=1)
        else:
            end = now.replace(month=now.month + 1, day=1)
    return start, end


async def calculate_progress(user_id: str, goal: dict) -> dict:
    start, end = get_period_bounds(goal["period"])
    query = {
        "user_id": user_id,
        "completed": True,
        "created_at": {"$gte": start, "$lt": end}
    }
    if goal.get("category"):
        query["category"] = goal["category"]

    current = await tasks_collection.count_documents(query)
    target = goal["target_count"]
    pct = min(round((current / target) * 100, 1), 100.0)

    return {
        "id": str(goal["_id"]),
        "user_id": user_id,
        "title": goal["title"],
        "target_count": target,
        "current_count": current,
        "period": goal["period"],
        "category": goal.get("category"),
        "emoji": goal.get("emoji", "🎯"),
        "completed": current >= target,
        "progress_pct": pct,
        "created_at": goal["created_at"].isoformat(),
        "period_start": start.isoformat(),
        "period_end": end.isoformat(),
    }


@router.get("/")
async def get_goals(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    goals = []
    async for goal in goals_collection.find({"user_id": user_id}):
        goals.append(await calculate_progress(user_id, goal))
    return goals


@router.post("/", status_code=201)
async def create_goal(
    data: GoalCreate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    doc = {
        "user_id": user_id,
        "title": data.title,
        "target_count": data.target_count,
        "period": data.period,
        "category": data.category,
        "emoji": data.emoji or "🎯",
        "created_at": datetime.utcnow()
    }
    result = await goals_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await calculate_progress(user_id, doc)


@router.put("/{goal_id}")
async def update_goal(
    goal_id: str,
    data: GoalUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    object_id = _parse_goal_id(goal_id)
    updates = {k: v for k, v in data.dict().items() if v is not None}
    await goals_collection.update_one(
        {"_id": object_id, "user_id": user_id},
        {"$set": updates}
    )
    goal = await goals_collection.find_one({"_id": object_id})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return await calculate_progress(user_id, goal)


@router.delete("/{goal_id}")
async def delete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    object_id = _parse_goal_id(goal_id)
    result = await goals_collection.delete_one(
        {"_id": object_id, "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}
