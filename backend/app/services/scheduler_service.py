from datetime import datetime, timedelta
from typing import Any

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from bson import ObjectId


scheduler = AsyncIOScheduler(timezone="UTC")


def _get_user_filter(user_id: Any) -> dict[str, Any]:
    user_id_str = str(user_id)
    if ObjectId.is_valid(user_id_str):
        return {"_id": ObjectId(user_id_str)}
    return {"_id": user_id_str}


async def check_and_send_reminders() -> None:
    try:
        from app.services.email_service import send_task_reminder
        from app.services.telegram_service import send_task_reminder_telegram
        from app.utils.database import tasks_collection, users_collection

        now = datetime.utcnow()
        upcoming = now + timedelta(minutes=5)
        cursor = tasks_collection.find(
            {
                "scheduled_time": {"$gte": now, "$lte": upcoming},
                "reminder_sent": False,
                "completed": False,
            }
        )

        async for task in cursor:
            user = await users_collection.find_one(_get_user_filter(task.get("user_id")))
            if not user:
                continue

            send_task_reminder(
                to_email=user.get("email", ""),
                user_name=user.get("name", "User"),
                task_title=task.get("title", "Task"),
                scheduled_time=task.get("scheduled_time"),
            )

            chat_id = user.get("telegram_chat_id")
            if chat_id:
                try:
                    await send_task_reminder_telegram(
                        chat_id=chat_id,
                        task_title=task.get("title", "Task"),
                        scheduled_time=task.get("scheduled_time"),
                    )
                except Exception:
                    # Telegram notifications should never block task updates.
                    pass

            await tasks_collection.update_one(
                {"_id": task["_id"]},
                {"$set": {"reminder_sent": True}},
            )
    except Exception as exc:
        print(f"Reminder check failed: {exc}")


async def send_daily_summaries() -> None:
    try:
        from app.services.email_service import send_daily_summary
        from app.services.streak_service import update_user_streak
        from app.utils.database import tasks_collection, users_collection

        day_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)

        async for user in users_collection.find({}):
            user_id = str(user["_id"])
            tasks = [
                task
                async for task in tasks_collection.find(
                    {"user_id": user_id, "created_at": {"$gte": day_start, "$lt": day_end}}
                )
            ]
            if not tasks:
                continue

            completed_count = sum(1 for task in tasks if task.get("completed"))
            send_daily_summary(
                to_email=user.get("email", ""),
                user_name=user.get("name", "User"),
                tasks=tasks,
                completed_count=completed_count,
                total_count=len(tasks),
            )
            await update_user_streak(user_id)
    except Exception as exc:
        print(f"Daily summary failed: {exc}")


async def process_recurring() -> None:
    try:
        from app.services.recurring_service import process_recurring_tasks

        await process_recurring_tasks()
    except Exception as exc:
        print(f"Recurring task processing failed: {exc}")


async def run_auto_priority() -> None:
    try:
        from app.services.auto_priority_service import auto_reprioritize

        await auto_reprioritize()
    except Exception as exc:
        print(f"Auto-priority processing failed: {exc}")


async def run_overdue_handler() -> None:
    try:
        from app.services.overdue_service import handle_overdue_tasks

        await handle_overdue_tasks()
    except Exception as exc:
        print(f"Overdue processing failed: {exc}")


def start_scheduler() -> None:
    if scheduler.running:
        return

    scheduler.add_job(
        check_and_send_reminders,
        "interval",
        minutes=1,
        id="reminders",
        replace_existing=True,
    )
    scheduler.add_job(
        run_auto_priority,
        "interval",
        hours=1,
        id="auto-priority",
        replace_existing=True,
    )
    scheduler.add_job(
        run_overdue_handler,
        "interval",
        minutes=30,
        id="overdue",
        replace_existing=True,
    )
    scheduler.add_job(
        process_recurring,
        CronTrigger(hour=0, minute=5),
        id="recurring",
        replace_existing=True,
    )
    scheduler.add_job(
        send_daily_summaries,
        CronTrigger(hour=20, minute=0),
        id="daily-summary",
        replace_existing=True,
    )
    scheduler.start()
    print("Scheduler started")


def stop_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)
