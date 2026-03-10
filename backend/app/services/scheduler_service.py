# from datetime import datetime, timedelta

# from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from apscheduler.triggers.interval import IntervalTrigger
# from bson import ObjectId

# from app.services.email_service import send_reminder_email
# from app.utils.database import tasks_collection, users_collection

# scheduler: AsyncIOScheduler | None = None


# def _get_user_filter(user_id: str) -> dict:
#     if ObjectId.is_valid(user_id):
#         return {"_id": ObjectId(user_id)}
#     return {"_id": user_id}


# async def check_reminders() -> None:
#     now = datetime.utcnow()
#     due_cutoff = now + timedelta(minutes=5)

#     cursor = tasks_collection.find(
#         {
#             "scheduled_time": {"$ne": None, "$lte": due_cutoff},
#             "reminder_sent": False,
#             "completed": False,
#         }
#     ).sort("scheduled_time", 1)

#     async for task in cursor:
#         user_email = None
#         user_id = str(task.get("user_id", ""))
#         if user_id:
#             user = await users_collection.find_one(_get_user_filter(user_id), projection={"email": 1})
#             user_email = user.get("email") if user else None

#         email_payload = dict(task)
#         if user_email:
#             email_payload["user_email"] = user_email

#         sent = send_reminder_email(email_payload)
#         if sent:
#             await tasks_collection.update_one(
#                 {"_id": task["_id"], "reminder_sent": False},
#                 {"$set": {"reminder_sent": True}},
#             )


# def start_scheduler() -> None:
#     global scheduler
#     if scheduler and scheduler.running:
#         return

#     scheduler = AsyncIOScheduler(timezone="UTC")
#     scheduler.add_job(
#         check_reminders,
#         trigger=IntervalTrigger(minutes=1),
#         id="task-reminder-check",
#         replace_existing=True,
#         max_instances=1,
#         coalesce=True,
#     )
#     scheduler.start()


# def stop_scheduler() -> None:
#     global scheduler
#     if scheduler and scheduler.running:
#         scheduler.shutdown(wait=False)
#     scheduler = None
