from fastapi import APIRouter, Depends, HTTPException
from app.utils.dependencies import get_current_user
from app.utils.database import tasks_collection
from datetime import datetime, timedelta
from typing import List

router = APIRouter(prefix="/templates", tags=["Templates"])

TEMPLATES = {
    "morning_routine": {
        "name": "🌅 Morning Routine",
        "description": "Start every day strong",
        "tasks": [
            {"title": "Drink 2 glasses of water", "category": "Health", "priority": "High", "estimated_minutes": 2},
            {"title": "10-minute meditation or breathing", "category": "Health", "priority": "High", "estimated_minutes": 10},
            {"title": "Review today's task list", "category": "Work", "priority": "High", "estimated_minutes": 5},
            {"title": "Exercise / stretching", "category": "Health", "priority": "Medium", "estimated_minutes": 20},
            {"title": "Healthy breakfast", "category": "Health", "priority": "Medium", "estimated_minutes": 15},
        ]
    },
    "weekly_review": {
        "name": "📋 Weekly Review",
        "description": "Reflect and plan ahead",
        "tasks": [
            {"title": "Review all incomplete tasks from last week", "category": "Work", "priority": "High", "estimated_minutes": 15},
            {"title": "Update project progress and notes", "category": "Work", "priority": "High", "estimated_minutes": 20},
            {"title": "Plan top 3 priorities for next week", "category": "Work", "priority": "High", "estimated_minutes": 15},
            {"title": "Review and update goals", "category": "Personal", "priority": "Medium", "estimated_minutes": 10},
            {"title": "Clear email inbox to zero", "category": "Work", "priority": "Medium", "estimated_minutes": 20},
            {"title": "Schedule important meetings for next week", "category": "Work", "priority": "Medium", "estimated_minutes": 10},
        ]
    },
    "project_launch": {
        "name": "🚀 Project Launch Checklist",
        "description": "Everything needed to ship",
        "tasks": [
            {"title": "Define project goals and success metrics", "category": "Work", "priority": "Critical", "estimated_minutes": 30},
            {"title": "Create project timeline and milestones", "category": "Work", "priority": "High", "estimated_minutes": 45},
            {"title": "Identify stakeholders and assign roles", "category": "Work", "priority": "High", "estimated_minutes": 20},
            {"title": "Set up project documentation/wiki", "category": "Work", "priority": "Medium", "estimated_minutes": 30},
            {"title": "Schedule kickoff meeting", "category": "Work", "priority": "High", "estimated_minutes": 10},
            {"title": "Create task backlog", "category": "Work", "priority": "High", "estimated_minutes": 40},
            {"title": "Define communication channels", "category": "Work", "priority": "Medium", "estimated_minutes": 15},
        ]
    },
    "study_session": {
        "name": "📚 Study Session",
        "description": "Maximize learning",
        "tasks": [
            {"title": "Review previous session notes (15 min)", "category": "Study", "priority": "High", "estimated_minutes": 15},
            {"title": "Study new material — Block 1 (25 min)", "category": "Study", "priority": "High", "estimated_minutes": 25},
            {"title": "Take a break and walk (5 min)", "category": "Health", "priority": "Low", "estimated_minutes": 5},
            {"title": "Study new material — Block 2 (25 min)", "category": "Study", "priority": "High", "estimated_minutes": 25},
            {"title": "Write summary notes and key points", "category": "Study", "priority": "High", "estimated_minutes": 20},
            {"title": "Create 5 practice questions", "category": "Study", "priority": "Medium", "estimated_minutes": 15},
        ]
    },
    "health_week": {
        "name": "💪 Health Week Reset",
        "description": "Get back on track",
        "tasks": [
            {"title": "Plan healthy meals for the week", "category": "Health", "priority": "High", "estimated_minutes": 20},
            {"title": "Grocery shopping for healthy food", "category": "Health", "priority": "High", "estimated_minutes": 45},
            {"title": "Schedule 3 workout sessions", "category": "Health", "priority": "High", "estimated_minutes": 10},
            {"title": "8 hours sleep goal — set alarm", "category": "Health", "priority": "Medium", "estimated_minutes": 5},
            {"title": "Drink 2L water daily — set reminders", "category": "Health", "priority": "Medium", "estimated_minutes": 5},
            {"title": "No screens 1hr before bed", "category": "Health", "priority": "Medium", "estimated_minutes": 0},
        ]
    },
    "finance_review": {
        "name": "💰 Monthly Finance Review",
        "description": "Stay on top of money",
        "tasks": [
            {"title": "Review all bank statements", "category": "Finance", "priority": "High", "estimated_minutes": 20},
            {"title": "Categorize and track all expenses", "category": "Finance", "priority": "High", "estimated_minutes": 30},
            {"title": "Compare spending vs budget", "category": "Finance", "priority": "High", "estimated_minutes": 15},
            {"title": "Pay all outstanding bills", "category": "Finance", "priority": "Critical", "estimated_minutes": 20},
            {"title": "Review investment/savings contributions", "category": "Finance", "priority": "Medium", "estimated_minutes": 15},
            {"title": "Set budget for next month", "category": "Finance", "priority": "High", "estimated_minutes": 20},
        ]
    }
}


@router.get("/")
async def list_templates():
    """Get all available templates."""
    return [
        {
            "id": tid,
            "name": t["name"],
            "description": t["description"],
            "task_count": len(t["tasks"]),
            "categories": list(set(task["category"] for task in t["tasks"]))
        }
        for tid, t in TEMPLATES.items()
    ]


@router.post("/{template_id}/apply")
async def apply_template(
    template_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Apply a template — creates all tasks instantly for the user."""
    if template_id not in TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")

    template = TEMPLATES[template_id]
    user_id = str(current_user["_id"])
    now = datetime.utcnow()

    docs = []
    for i, task in enumerate(template["tasks"]):
        docs.append({
            "user_id": user_id,
            "title": task["title"],
            "category": task["category"],
            "priority": task["priority"],
            "scheduled_time": now + timedelta(hours=i),
            "completed": False,
            "reminder_sent": False,
            "recurring": "none",
            "subtasks": [],
            "tags": ["template", template_id],
            "notes": f"From template: {template['name']}",
            "estimated_minutes": task.get("estimated_minutes", 30),
            "auto_created": True,
            "from_template": template_id,
            "created_at": now
        })

    if docs:
        await tasks_collection.insert_many(docs)

    return {
        "message": f"Created {len(docs)} tasks from template '{template['name']}'",
        "tasks_created": len(docs),
        "template_name": template["name"]
    }