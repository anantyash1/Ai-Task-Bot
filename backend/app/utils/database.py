import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError, ConfigurationError

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL") or os.getenv("MONGODB_URL")
DB_NAME = os.getenv("MONGO_DB_NAME", "ai_task_bot")

if not MONGO_URL:
    MONGO_URL = "mongodb://127.0.0.1:27017"
    print("Warning: MONGO_URL/MONGODB_URL not set. Falling back to mongodb://127.0.0.1:27017")

def _build_client(mongo_url: str) -> AsyncIOMotorClient:
    return AsyncIOMotorClient(
        mongo_url,
        serverSelectionTimeoutMS=8000,
        connectTimeoutMS=8000,
    )


try:
    client = _build_client(MONGO_URL)
except ConfigurationError as exc:
    fallback_url = "mongodb://127.0.0.1:27017"
    print(f"Mongo configuration error for '{MONGO_URL}': {exc}")
    print(f"Falling back to {fallback_url}")
    client = _build_client(fallback_url)
except Exception as exc:
    fallback_url = "mongodb://127.0.0.1:27017"
    print(f"Mongo client init failed for '{MONGO_URL}': {exc}")
    print(f"Falling back to {fallback_url}")
    client = _build_client(fallback_url)

database = client[DB_NAME]

users_collection = database.users
tasks_collection = database.tasks

goals_collection = database.goals
activity_collection = database.activity
push_subscriptions_collection = database.push_subscriptions
db_ready = False


async def create_indexes() -> bool:
    global db_ready
    try:
        await users_collection.create_index("email", unique=True)
        await tasks_collection.create_index([("user_id", 1), ("created_at", -1)])
        await tasks_collection.create_index("scheduled_time")
        await tasks_collection.create_index([("user_id", 1), ("completed", 1)])
        await tasks_collection.create_index([("user_id", 1), ("scheduled_time", 1), ("completed", 1)])

        # Goals
        await goals_collection.create_index("user_id")

        # Activity feed
        await activity_collection.create_index("user_id")
        await activity_collection.create_index("timestamp")
        await activity_collection.create_index([("user_id", 1), ("timestamp", -1)])

        # Push subscriptions
        await push_subscriptions_collection.create_index("user_id")

        print("Database indexes created")

        db_ready = True
        return True
    except PyMongoError as exc:
        db_ready = False
        print(f"Database index initialization failed: {exc}")
        return False



