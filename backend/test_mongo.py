from pymongo import MongoClient

uri = "mongodb+srv://anantyash:1H43vxC6wXndyKcS@cluster0.1bkqabo.mongodb.net/ai_task_bot?retryWrites=true&w=majority&appName=Anant&authSource=admin"
print(f"Testing URI: {uri}")

client = MongoClient(uri, serverSelectionTimeoutMS=5000)
try:
    client.admin.command('ping')
    print("✅ Connection successful")
except Exception as e:
    print(f"❌ Connection failed: {e}")