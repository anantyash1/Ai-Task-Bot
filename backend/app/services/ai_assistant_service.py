from datetime import datetime, timedelta
from typing import Any


def _priority_rank(priority: str) -> int:
    weights = {"High": 3, "Medium": 2, "Low": 1}
    return weights.get(priority, 1)


def _urgency_rank(scheduled_time: datetime | None, now: datetime) -> int:
    if not scheduled_time:
        return 0
    if scheduled_time <= now:
        return 5
    if scheduled_time <= now + timedelta(hours=4):
        return 4
    if scheduled_time <= now + timedelta(hours=24):
        return 3
    if scheduled_time <= now + timedelta(days=3):
        return 2
    return 1


def _task_score(task: dict[str, Any], now: datetime) -> int:
    priority = _priority_rank(str(task.get("priority", "Low")))
    urgency = _urgency_rank(task.get("scheduled_time"), now)
    category_bonus = 1 if task.get("category") == "Work" else 0
    return (priority * 10) + (urgency * 5) + category_bonus


def suggest_subtasks(title: str) -> list[str]:
    lower = title.lower()
    if any(keyword in lower for keyword in ("report", "proposal", "document", "presentation")):
        return [
            "Define the expected output and deadline.",
            "Collect source information and references.",
            "Create the first draft quickly.",
            "Review and polish the final version.",
        ]
    if any(keyword in lower for keyword in ("meeting", "call", "client", "interview")):
        return [
            "List the meeting objective and key talking points.",
            "Prepare required files/notes beforehand.",
            "Execute the meeting with clear outcomes.",
            "Send follow-up notes and next actions.",
        ]
    if any(keyword in lower for keyword in ("study", "learn", "exam", "course")):
        return [
            "Split the topic into small chapters or concepts.",
            "Set a focused study block with no distractions.",
            "Summarize what you learned in your own words.",
            "Test recall with quick questions.",
        ]
    return [
        "Clarify the desired outcome.",
        "Break the task into 2-4 concrete steps.",
        "Block time in your calendar.",
        "Review completion and capture follow-ups.",
    ]


def build_daily_plan(tasks: list[dict[str, Any]], limit: int = 8) -> list[dict[str, Any]]:
    now = datetime.utcnow()
    pending = [task for task in tasks if not task.get("completed")]
    ranked = sorted(pending, key=lambda item: _task_score(item, now), reverse=True)

    plan = []
    for task in ranked[:limit]:
        suggestion = "Start with a 25-minute focus block."
        if task.get("priority") == "High":
            suggestion = "Tackle this first while energy is high."
        elif task.get("scheduled_time"):
            suggestion = "Finish prep before the scheduled time."

        plan.append(
            {
                "task_id": str(task.get("_id")),
                "title": task.get("title", "Untitled task"),
                "priority": task.get("priority", "Medium"),
                "category": task.get("category", "Other"),
                "scheduled_time": task.get("scheduled_time"),
                "suggestion": suggestion,
            }
        )
    return plan


def generate_productivity_insights(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(tasks)
    completed = sum(1 for task in tasks if task.get("completed"))
    pending = total - completed
    high_priority_pending = sum(
        1
        for task in tasks
        if not task.get("completed") and task.get("priority") == "High"
    )

    completion_rate = int((completed / total) * 100) if total else 0
    recommendations: list[str] = []

    if high_priority_pending > 0:
        recommendations.append(f"Clear {high_priority_pending} high-priority task(s) first today.")
    if completion_rate < 40:
        recommendations.append("Break large tasks into smaller subtasks before starting.")
    if pending > 8:
        recommendations.append("Limit today's focus to your top 5-8 pending tasks.")
    if not recommendations:
        recommendations.append("You are on track. Keep your current execution rhythm.")

    return {
        "summary": {
            "total_tasks": total,
            "completed_tasks": completed,
            "pending_tasks": pending,
            "completion_rate": completion_rate,
            "high_priority_pending": high_priority_pending,
        },
        "recommendations": recommendations,
    }
