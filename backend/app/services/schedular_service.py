# app/services/scheduler_service.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta

scheduler = AsyncIOScheduler()


async def check_and_send_reminders():
    """Check for tasks due in next 5 minutes and send reminders."""
    try:
        from app.utils.database import tasks_collection, users_collection
        from app.services.email_service import send_task_reminder
        from bson import ObjectId

        now = datetime.utcnow()
        upcoming = now + timedelta(minutes=5)

        cursor = tasks_collection.find({
            "scheduled_time": {"$gte": now, "$lte": upcoming},
            "reminder_sent": False,
            "completed": False
        })

        async for task in cursor:
            user = await users_collection.find_one(
                {"_id": ObjectId(task["user_id"])}
            )
            if user:
                try:
                    from app.services.email_service import send_task_reminder
                    send_task_reminder(
                        to_email=user["email"],
                        user_name=user["name"],
                        task_title=task["title"],
                        scheduled_time=task["scheduled_time"]
                    )
                    await tasks_collection.update_one(
                        {"_id": task["_id"]},
                        {"$set": {"reminder_sent": True}}
                    )
                except Exception as e:
                    print(f"Failed to send reminder: {e}")
    except Exception as e:
        print(f"Reminder check error: {e}")


async def send_daily_summaries():
    """Send daily summary emails at 8 PM."""
    try:
        from app.utils.database import tasks_collection, users_collection
        from app.services.email_service import send_daily_summary

        today_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        today_end = today_start + timedelta(days=1)

        async for user in users_collection.find({}):
            user_id = str(user["_id"])
            tasks = []
            completed_count = 0

            async for task in tasks_collection.find({
                "user_id": user_id,
                "created_at": {"$gte": today_start, "$lt": today_end}
            }):
                tasks.append(task)
                if task.get("completed"):
                    completed_count += 1

            if tasks:
                try:
                    send_daily_summary(
                        to_email=user["email"],
                        user_name=user["name"],
                        tasks=tasks,
                        completed_count=completed_count,
                        total_count=len(tasks)
                    )
                except Exception as e:
                    print(f"Failed to send summary to {user['email']}: {e}")
    except Exception as e:
        print(f"Daily summary error: {e}")


def start_scheduler():
    """Start the background task scheduler."""
    scheduler.add_job(
        check_and_send_reminders,
        trigger="interval",
        minutes=1,
        id="reminder_check",
        replace_existing=True
    )
    scheduler.add_job(
        send_daily_summaries,
        trigger=CronTrigger(hour=20, minute=0),
        id="daily_summary",
        replace_existing=True
    )
    scheduler.start()
    print("✅ Scheduler started")


def stop_scheduler():
    """Stop the scheduler on shutdown."""
    if scheduler.running:
        scheduler.shutdown()
        print("✅ Scheduler stopped")