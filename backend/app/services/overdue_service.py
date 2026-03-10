from datetime import datetime
from app.utils.database import tasks_collection, users_collection
from bson import ObjectId


async def handle_overdue_tasks():
    """
    Runs every 30 minutes.
    Finds newly-overdue tasks, notifies user via Telegram,
    and marks them so they only alert once.
    """
    now = datetime.utcnow()
    notified = 0

    async for task in tasks_collection.find({
        "completed": False,
        "scheduled_time": {"$lt": now},
        "overdue_notified": {"$ne": True}
    }):
        user_id = task.get("user_id")
        if not user_id:
            continue

        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            continue

        # Send Telegram alert
        if user.get("telegram_chat_id"):
            from app.services.telegram_service import send_telegram_message
            scheduled = task.get("scheduled_time")
            time_ago = ""
            if scheduled:
                diff = int((now - scheduled).total_seconds() / 60)
                if diff < 60:
                    time_ago = f"{diff} minutes ago"
                else:
                    time_ago = f"{diff // 60} hours ago"

            await send_telegram_message(
                user["telegram_chat_id"],
                f"⚠️ <b>Overdue Task!</b>\n\n"
                f"📌 <b>{task['title']}</b>\n"
                f"🕐 Was due: {time_ago}\n\n"
                f"Open AI Task Bot to reschedule or complete it."
            )

        # Mark as notified so we don't spam
        await tasks_collection.update_one(
            {"_id": task["_id"]},
            {"$set": {
                "overdue": True,
                "overdue_notified": True,
                "overdue_at": now
            }}
        )
        notified += 1

    if notified:
        print(f"Overdue handler: notified {notified} tasks")
    return notified


async def get_overdue_count(user_id: str) -> int:
    now = datetime.utcnow()
    return await tasks_collection.count_documents({
        "user_id": user_id,
        "completed": False,
        "scheduled_time": {"$lt": now}
    })


from datetime import datetime
from app.utils.database import tasks_collection, users_collection
from bson import ObjectId


async def handle_overdue_tasks():
    now = datetime.utcnow()
    notified = 0
    async for task in tasks_collection.find({
        "completed": False,
        "scheduled_time": {"$lt": now},
        "overdue_notified": {"$ne": True}
    }):
        user = await users_collection.find_one({"_id": ObjectId(task["user_id"])})
        if user and user.get("telegram_chat_id"):
            try:
                from app.services.telegram_service import send_telegram_message
                diff = int((now - task["scheduled_time"]).total_seconds() / 60)
                time_ago = f"{diff}m ago" if diff < 60 else f"{diff//60}h ago"
                await send_telegram_message(
                    user["telegram_chat_id"],
                    f"OVERDUE: {task['title']} (was due {time_ago})"
                )
            except Exception:
                pass
        await tasks_collection.update_one(
            {"_id": task["_id"]},
            {"$set": {"overdue": True, "overdue_notified": True}}
        )
        notified += 1
    return notified


async def get_overdue_count(user_id: str) -> int:
    now = datetime.utcnow()
    return await tasks_collection.count_documents({
        "user_id": user_id,
        "completed": False,
        "scheduled_time": {"$lt": now}
    })