from datetime import datetime, timedelta
from app.utils.database import tasks_collection, users_collection
from bson import ObjectId


async def calculate_streak(user_id: str) -> dict:
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    completed_tasks = [t async for t in tasks_collection.find(
        {"user_id": user_id, "completed": True}
    )]

    if not completed_tasks:
        return {
            "current_streak": 0, "longest_streak": 0,
            "completed_today": False, "last_active": None,
            "total_active_days": 0,
            "weekly_completions": _weekly(completed_tasks, today)
        }

    active_days = set()
    for task in completed_tasks:
        day = task["created_at"].replace(hour=0, minute=0, second=0, microsecond=0)
        active_days.add(day)

    completed_today = today in active_days

    current_streak = 0
    check_day = today if completed_today else today - timedelta(days=1)
    while check_day in active_days:
        current_streak += 1
        check_day -= timedelta(days=1)

    sorted_days = sorted(active_days)
    longest = current = 1
    for i in range(1, len(sorted_days)):
        if (sorted_days[i] - sorted_days[i-1]).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1

    return {
        "current_streak": current_streak,
        "longest_streak": longest,
        "completed_today": completed_today,
        "last_active": sorted_days[-1].isoformat() if sorted_days else None,
        "total_active_days": len(active_days),
        "weekly_completions": _weekly(completed_tasks, today)
    }


def _weekly(tasks: list, today: datetime) -> list:
    result = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_end = day + timedelta(days=1)
        count = sum(1 for t in tasks if day <= t.get("created_at", datetime.min) < day_end)
        result.append({
            "date": day.strftime("%a"),
            "full_date": day.strftime("%Y-%m-%d"),
            "completed": count,
            "has_completion": count > 0
        })
    return result


async def update_user_streak(user_id: str) -> int:
    streak_data = await calculate_streak(user_id)
    current = streak_data["current_streak"]
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {
            "current_streak": current,
            "longest_streak": streak_data["longest_streak"],
            "last_active": datetime.utcnow()
        }}
    )
    return current