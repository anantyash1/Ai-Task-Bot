# # app/services/scheduler_service.py
# from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from apscheduler.triggers.cron import CronTrigger
# from datetime import datetime, timedelta

# scheduler = AsyncIOScheduler()


# async def check_and_send_reminders():
#     """Check for tasks due in next 5 minutes and send reminders."""
#     try:
#         from app.utils.database import tasks_collection, users_collection
#         from app.services.email_service import send_task_reminder
#         from bson import ObjectId

#         now = datetime.utcnow()
#         upcoming = now + timedelta(minutes=5)

#         cursor = tasks_collection.find({
#             "scheduled_time": {"$gte": now, "$lte": upcoming},
#             "reminder_sent": False,
#             "completed": False
#         })

#         async for task in cursor:
#             user = await users_collection.find_one(
#                 {"_id": ObjectId(task["user_id"])}
#             )
#             if user:
#                 try:
#                     from app.services.email_service import send_task_reminder
#                     send_task_reminder(
#                         to_email=user["email"],
#                         user_name=user["name"],
#                         task_title=task["title"],
#                         scheduled_time=task["scheduled_time"]
#                     )
#                     await tasks_collection.update_one(
#                         {"_id": task["_id"]},
#                         {"$set": {"reminder_sent": True}}
#                     )
#                 except Exception as e:
#                     print(f"Failed to send reminder: {e}")
#     except Exception as e:
#         print(f"Reminder check error: {e}")


# async def send_daily_summaries():
#     """Send daily summary emails at 8 PM."""
#     try:
#         from app.utils.database import tasks_collection, users_collection
#         from app.services.email_service import send_daily_summary

#         today_start = datetime.utcnow().replace(
#             hour=0, minute=0, second=0, microsecond=0
#         )
#         today_end = today_start + timedelta(days=1)

#         async for user in users_collection.find({}):
#             user_id = str(user["_id"])
#             tasks = []
#             completed_count = 0

#             async for task in tasks_collection.find({
#                 "user_id": user_id,
#                 "created_at": {"$gte": today_start, "$lt": today_end}
#             }):
#                 tasks.append(task)
#                 if task.get("completed"):
#                     completed_count += 1

#             if tasks:
#                 try:
#                     send_daily_summary(
#                         to_email=user["email"],
#                         user_name=user["name"],
#                         tasks=tasks,
#                         completed_count=completed_count,
#                         total_count=len(tasks)
#                     )
#                 except Exception as e:
#                     print(f"Failed to send summary to {user['email']}: {e}")
#     except Exception as e:
#         print(f"Daily summary error: {e}")


# def start_scheduler():
#     """Start the background task scheduler."""
#     scheduler.add_job(
#         check_and_send_reminders,
#         trigger="interval",
#         minutes=1,
#         id="reminder_check",
#         replace_existing=True
#     )
#     scheduler.add_job(
#         send_daily_summaries,
#         trigger=CronTrigger(hour=20, minute=0),
#         id="daily_summary",
#         replace_existing=True
#     )
#     scheduler.start()
#     print("✅ Scheduler started")


# def stop_scheduler():
#     """Stop the scheduler on shutdown."""
#     if scheduler.running:
#         scheduler.shutdown()
#         print("✅ Scheduler stopped")



from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta

scheduler = AsyncIOScheduler()


async def check_and_send_reminders():
    try:
        from app.utils.database import tasks_collection, users_collection
        from app.services.email_service import send_task_reminder
        from app.services.telegram_service import send_task_reminder_telegram
        from bson import ObjectId

        now = datetime.utcnow()
        upcoming = now + timedelta(minutes=5)

        async for task in tasks_collection.find({
            "scheduled_time": {"$gte": now, "$lte": upcoming},
            "reminder_sent": False,
            "completed": False
        }):
            user = await users_collection.find_one(
                {"_id": ObjectId(task["user_id"])}
            )
            if user:
                send_task_reminder(
                    to_email=user["email"],
                    user_name=user["name"],
                    task_title=task["title"],
                    scheduled_time=task["scheduled_time"]
                )
                if user.get("telegram_chat_id"):
                    await send_task_reminder_telegram(
                        chat_id=user["telegram_chat_id"],
                        task_title=task["title"],
                        scheduled_time=task["scheduled_time"]
                    )
                await tasks_collection.update_one(
                    {"_id": task["_id"]},
                    {"$set": {"reminder_sent": True}}
                )
    except Exception as e:
        print(f"Reminder error: {e}")


async def run_auto_priority():
    try:
        from app.services.auto_priority_service import auto_reprioritize
        await auto_reprioritize()
    except Exception as e:
        print(f"Auto-priority error: {e}")


async def run_overdue_handler():
    try:
        from app.services.overdue_service import handle_overdue_tasks
        await handle_overdue_tasks()
    except Exception as e:
        print(f"Overdue handler error: {e}")


async def process_recurring():
    try:
        from app.services.recurring_service import process_recurring_tasks
        await process_recurring_tasks()
    except Exception as e:
        print(f"Recurring error: {e}")


async def send_daily_summaries():
    try:
        from app.utils.database import tasks_collection, users_collection
        from app.services.email_service import send_daily_summary
        from app.services.telegram_service import send_daily_summary_telegram, send_streak_notification
        from app.services.streak_service import update_user_streak

        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)

        async for user in users_collection.find({}):
            user_id = str(user["_id"])
            tasks = [t async for t in tasks_collection.find({
                "user_id": user_id,
                "created_at": {"$gte": today, "$lt": tomorrow}
            })]
            if not tasks:
                continue

            completed = sum(1 for t in tasks if t.get("completed"))
            pending = [t for t in tasks if not t.get("completed")]

            send_daily_summary(
                to_email=user["email"],
                user_name=user["name"],
                tasks=tasks,
                completed_count=completed,
                total_count=len(tasks)
            )
            if user.get("telegram_chat_id"):
                await send_daily_summary_telegram(
                    chat_id=user["telegram_chat_id"],
                    user_name=user["name"],
                    completed=completed,
                    total=len(tasks),
                    pending_tasks=pending
                )
            streak = await update_user_streak(user_id)
            if user.get("telegram_chat_id") and streak > 0:
                await send_streak_notification(
                    chat_id=user["telegram_chat_id"],
                    user_name=user["name"],
                    streak=streak
                )
    except Exception as e:
        print(f"Daily summary error: {e}")


async def send_weekly_reports():
    try:
        from app.services.report_service import send_all_weekly_reports
        await send_all_weekly_reports()
    except Exception as e:
        print(f"Weekly report error: {e}")


def start_scheduler():
    # Every 1 minute — task reminders
    scheduler.add_job(check_and_send_reminders, "interval", minutes=1,
                      id="reminders", replace_existing=True)

    # Every 1 hour — auto re-prioritize approaching deadlines
    scheduler.add_job(run_auto_priority, "interval", hours=1,
                      id="auto_priority", replace_existing=True)

    # Every 30 minutes — catch overdue tasks
    scheduler.add_job(run_overdue_handler, "interval", minutes=30,
                      id="overdue_handler", replace_existing=True)

    # Daily at 00:05 — create recurring tasks
    scheduler.add_job(process_recurring, CronTrigger(hour=0, minute=5),
                      id="recurring", replace_existing=True)

    # Daily at 20:00 — daily summary email + Telegram
    scheduler.add_job(send_daily_summaries, CronTrigger(hour=20, minute=0),
                      id="daily_summary", replace_existing=True)

    # Every Sunday at 18:00 — weekly report email
    scheduler.add_job(send_weekly_reports, CronTrigger(day_of_week="sun", hour=18, minute=0),
                      id="weekly_report", replace_existing=True)

    scheduler.start()
    print("Scheduler started — 6 jobs running")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()