import os
from urllib.parse import urlsplit

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()


def redact_mongo_uri(uri: str) -> str:
    if "@" not in uri or "://" not in uri:
        return uri
    parsed = urlsplit(uri)
    netloc = parsed.netloc
    if "@" not in netloc:
        return uri
    creds, host = netloc.split("@", 1)
    if ":" in creds:
        user, _ = creds.split(":", 1)
        safe_netloc = f"{user}:***@{host}"
    else:
        safe_netloc = f"***@{host}"
    return f"{parsed.scheme}://{safe_netloc}{parsed.path}" + (f"?{parsed.query}" if parsed.query else "")


uri = os.getenv("MONGODB_URL") or os.getenv("MONGO_URL")
if not uri:
    raise ValueError("Set MONGODB_URL or MONGO_URL before running test_mongo.py")

print(f"Testing URI: {redact_mongo_uri(uri)}")

client = MongoClient(uri, serverSelectionTimeoutMS=8000)
try:
    client.admin.command("ping")
    print("Connection successful")
except Exception as exc:
    print(f"Connection failed: {exc}")
