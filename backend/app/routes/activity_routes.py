from fastapi import APIRouter, Depends, Query
from app.utils.dependencies import get_current_user
from app.utils.database import activity_collection
from datetime import datetime, timedelta
from bson import ObjectId
from typing import Optional

router = APIRouter(prefix="/activity", tags=["Activity"])


async def log_activity(
    user_id: str,
    action: str,
    task_title: str,
    extra: Optional[dict] = None
):
    """
    Call this from anywhere to log user activity.
    action options: 'created', 'completed', 'deleted', 'overdue',
                    'goal_reached', 'streak_milestone', 'template_used'
    """
    ACTION_ICONS = {
        "created": "✨",
        "completed": "✅",
        "deleted": "🗑️",
        "overdue": "⚠️",
        "goal_reached": "🎯",
        "streak_milestone": "🔥",
        "template_used": "📋",
        "bulk_completed": "⚡",
    }
    await activity_collection.insert_one({
        "user_id": user_id,
        "action": action,
        "icon": ACTION_ICONS.get(action, "📌"),
        "task_title": task_title,
        "extra": extra or {},
        "timestamp": datetime.utcnow()
    })


@router.get("/")
async def get_activity(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(default=30, le=100),
    days: int = Query(default=7, le=30)
):
    """Get recent activity timeline."""
    user_id = str(current_user["_id"])
    since = datetime.utcnow() - timedelta(days=days)

    events = []
    async for event in activity_collection.find({
        "user_id": user_id,
        "timestamp": {"$gte": since}
    }).sort("timestamp", -1).limit(limit):
        events.append({
            "id": str(event["_id"]),
            "action": event["action"],
            "icon": event.get("icon", "📌"),
            "task_title": event["task_title"],
            "extra": event.get("extra", {}),
            "timestamp": event["timestamp"].isoformat(),
            "time_ago": _time_ago(event["timestamp"])
        })

    return events


def _time_ago(dt: datetime) -> str:
    diff = (datetime.utcnow() - dt).total_seconds()
    if diff < 60:
        return "just now"
    if diff < 3600:
        return f"{int(diff // 60)}m ago"
    if diff < 86400:
        return f"{int(diff // 3600)}h ago"
    return f"{int(diff // 86400)}d ago"