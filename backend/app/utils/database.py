import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGODB_URL")
DB_NAME = os.getenv("MONGO_DB_NAME", "ai_task_bot")

if not MONGO_URL:
    raise ValueError("MONGO_URL or MONGODB_URL environment variable is not set")

client = AsyncIOMotorClient(
    MONGO_URL,
    serverSelectionTimeoutMS=8000,
    connectTimeoutMS=8000,
)
database = client[DB_NAME]

users_collection = database.users
tasks_collection = database.tasks
db_ready = False


async def create_indexes() -> bool:
    global db_ready
    try:
        await users_collection.create_index("email", unique=True)
        await tasks_collection.create_index([("user_id", 1), ("created_at", -1)])
        await tasks_collection.create_index("scheduled_time")
        await tasks_collection.create_index([("user_id", 1), ("completed", 1)])
        await tasks_collection.create_index([("user_id", 1), ("scheduled_time", 1), ("completed", 1)])
        db_ready = True
        return True
    except PyMongoError as exc:
        db_ready = False
        print(f"Database index initialization failed: {exc}")
        return False
