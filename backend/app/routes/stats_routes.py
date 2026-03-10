from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.utils.dependencies import get_current_user
from app.utils.database import tasks_collection
from app.services.streak_service import calculate_streak
from datetime import datetime, timedelta
import csv, json, io

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/streak")
async def get_streak(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    return await calculate_streak(user_id)


@router.get("/productivity")
async def get_productivity(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    now = datetime.utcnow()
    all_tasks = [t async for t in tasks_collection.find({"user_id": user_id})]
    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.get("completed"))

    cat_stats = {}
    for task in all_tasks:
        c = task.get("category", "Other")
        if c not in cat_stats:
            cat_stats[c] = {"total": 0, "completed": 0}
        cat_stats[c]["total"] += 1
        if task.get("completed"):
            cat_stats[c]["completed"] += 1

    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    weekly_data = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_end = day + timedelta(days=1)
        day_tasks = [t for t in all_tasks if day <= t.get("created_at", datetime.min) < day_end]
        weekly_data.append({
            "day": day.strftime("%a"),
            "total": len(day_tasks),
            "completed": sum(1 for t in day_tasks if t.get("completed"))
        })

    return {
        "overview": {
            "total_tasks": total,
            "completed_tasks": completed,
            "completion_rate": round((completed / total * 100), 1) if total else 0,
        },
        "category_breakdown": [
            {"name": c, "total": d["total"], "completed": d["completed"],
             "rate": round(d["completed"]/d["total"]*100,1) if d["total"] else 0}
            for c, d in cat_stats.items()
        ],
        "weekly_data": weekly_data
    }


@router.get("/export/csv")
async def export_csv(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Title", "Category", "Priority", "Status", "Scheduled Time", "Tags", "Created At"])
    async for task in tasks_collection.find({"user_id": user_id}).sort("created_at", -1):
        writer.writerow([
            task.get("title", ""),
            task.get("category", ""),
            task.get("priority", ""),
            "Completed" if task.get("completed") else "Pending",
            task.get("scheduled_time", "").strftime("%Y-%m-%d %H:%M") if task.get("scheduled_time") else "",
            ", ".join(task.get("tags", [])),
            task.get("created_at", "").strftime("%Y-%m-%d %H:%M") if task.get("created_at") else "",
        ])
    output.seek(0)
    filename = f"tasks_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/json")
async def export_json(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    tasks = []
    async for task in tasks_collection.find({"user_id": user_id}).sort("created_at", -1):
        tasks.append({
            "title": task.get("title", ""),
            "category": task.get("category", ""),
            "priority": task.get("priority", ""),
            "completed": task.get("completed", False),
            "scheduled_time": task.get("scheduled_time", "").isoformat() if task.get("scheduled_time") else None,
            "tags": task.get("tags", []),
            "created_at": task.get("created_at", "").isoformat() if task.get("created_at") else None,
        })
    content = json.dumps({"tasks": tasks, "exported_at": datetime.now().isoformat()}, indent=2)
    filename = f"tasks_{datetime.now().strftime('%Y%m%d')}.json"
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )