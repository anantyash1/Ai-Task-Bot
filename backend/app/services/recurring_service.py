from datetime import datetime, timedelta
from app.utils.database import tasks_collection


async def process_recurring_tasks():
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    created_count = 0

    async for task in tasks_collection.find({
        "recurring": {"$in": ["daily", "weekly", "monthly"]},
        "completed": True
    }):
        should_create = False
        last_created = task.get("last_recurring_date", task["created_at"])

        if task["recurring"] == "daily" and (now - last_created).days >= 1:
            should_create = True
        elif task["recurring"] == "weekly" and (now - last_created).days >= 7:
            should_create = True
        elif task["recurring"] == "monthly" and (now - last_created).days >= 28:
            should_create = True

        if should_create:
            existing = await tasks_collection.find_one({
                "user_id": task["user_id"],
                "title": task["title"],
                "created_at": {"$gte": today, "$lt": tomorrow}
            })
            if not existing:
                new_task = {
                    "user_id": task["user_id"],
                    "title": task["title"],
                    "category": task.get("category", "Other"),
                    "priority": task.get("priority", "Medium"),
                    "scheduled_time": today + timedelta(hours=9),
                    "completed": False,
                    "reminder_sent": False,
                    "recurring": task["recurring"],
                    "subtasks": task.get("subtasks", []),
                    "tags": task.get("tags", []),
                    "notes": task.get("notes", ""),
                    "estimated_minutes": task.get("estimated_minutes"),
                    "auto_created": True,
                    "created_at": now
                }
                await tasks_collection.insert_one(new_task)
                await tasks_collection.update_one(
                    {"_id": task["_id"]},
                    {"$set": {"last_recurring_date": now}}
                )
                created_count += 1

    if created_count:
        print(f"Recurring: created {created_count} tasks")
    return created_count