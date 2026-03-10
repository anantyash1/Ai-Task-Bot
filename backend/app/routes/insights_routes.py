
from fastapi import APIRouter, Depends
from app.utils.dependencies import get_current_user
from app.utils.database import tasks_collection
from app.services.overdue_service import get_overdue_count
from datetime import datetime, timedelta

router = APIRouter(prefix="/insights", tags=["Insights"])

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
HOUR_LABELS = {
    6: "early morning", 7: "early morning", 8: "morning", 9: "morning",
    10: "mid-morning", 11: "late morning", 12: "noon", 13: "afternoon",
    14: "afternoon", 15: "mid-afternoon", 16: "late afternoon",
    17: "evening", 18: "evening", 19: "evening", 20: "night",
    21: "night", 22: "late night", 23: "late night"
}


@router.get("/daily")
async def get_daily_insights(current_user: dict = Depends(get_current_user)):
    """
    Returns 3-5 smart, personalized insights generated from the user's task history.
    Runs on every dashboard load. Zero AI API needed.
    """
    user_id = str(current_user["_id"])
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    thirty_ago = now - timedelta(days=30)

    all_tasks = [t async for t in tasks_collection.find({"user_id": user_id})]
    recent_tasks = [t for t in all_tasks if t.get("created_at", now) >= week_ago]
    today_tasks = [t for t in all_tasks if t.get("created_at", now) >= today]
    completed_tasks = [t for t in all_tasks if t.get("completed")]

    insights = []

    # 1. Overdue alert
    overdue_count = await get_overdue_count(user_id)
    if overdue_count > 0:
        insights.append({
            "type": "warning",
            "icon": "⚠️",
            "title": f"You have {overdue_count} overdue task{'s' if overdue_count > 1 else ''}",
            "detail": "Reschedule or complete them to keep your streak alive",
            "action": "/tasks?completed=false",
            "action_label": "View overdue"
        })

    # 2. Today's progress
    today_done = sum(1 for t in today_tasks if t.get("completed"))
    daily_goal = current_user.get("daily_goal", 5)
    remaining = max(0, daily_goal - today_done)
    if remaining > 0:
        insights.append({
            "type": "progress",
            "icon": "🎯",
            "title": f"{today_done}/{daily_goal} tasks done today",
            "detail": f"Complete {remaining} more to hit your daily goal",
            "action": "/tasks",
            "action_label": "See tasks"
        })
    else:
        insights.append({
            "type": "success",
            "icon": "🏆",
            "title": "Daily goal smashed!",
            "detail": f"You completed {today_done} tasks today. Incredible!",
            "action": None,
            "action_label": None
        })

    # 3. Most productive day of week
    if len(completed_tasks) >= 10:
        day_counts = [0] * 7
        for t in completed_tasks:
            ct = t.get("created_at")
            if ct:
                day_counts[ct.weekday()] += 1
        best_day_idx = day_counts.index(max(day_counts))
        best_day_name = DAY_NAMES[best_day_idx]
        today_weekday = now.weekday()
        if today_weekday == best_day_idx:
            insights.append({
                "type": "info",
                "icon": "⚡",
                "title": f"Today is your power day!",
                "detail": f"{best_day_name} is your most productive day — make it count",
                "action": None,
                "action_label": None
            })
        else:
            insights.append({
                "type": "info",
                "icon": "📈",
                "title": f"Most productive on {best_day_name}s",
                "detail": "Schedule your hardest tasks on your best day",
                "action": None,
                "action_label": None
            })

    # 4. Most productive time of day
    if len(completed_tasks) >= 10:
        hour_counts = [0] * 24
        for t in completed_tasks:
            ct = t.get("created_at")
            if ct:
                hour_counts[ct.hour] += 1
        best_hour = hour_counts.index(max(hour_counts))
        time_label = HOUR_LABELS.get(best_hour, f"{best_hour}:00")
        insights.append({
            "type": "tip",
            "icon": "🕐",
            "title": f"Peak focus time: {time_label}",
            "detail": f"You complete most tasks at {best_hour}:00. Schedule key work then.",
            "action": None,
            "action_label": None
        })

    # 5. Category you're neglecting
    if len(all_tasks) >= 10:
        cat_completion = {}
        for t in all_tasks:
            c = t.get("category", "Other")
            if c not in cat_completion:
                cat_completion[c] = {"total": 0, "done": 0}
            cat_completion[c]["total"] += 1
            if t.get("completed"):
                cat_completion[c]["done"] += 1

        worst_cat = None
        worst_rate = 100
        for cat, data in cat_completion.items():
            if data["total"] >= 3:
                rate = (data["done"] / data["total"]) * 100
                if rate < worst_rate:
                    worst_rate = rate
                    worst_cat = cat

        if worst_cat and worst_rate < 50:
            insights.append({
                "type": "warning",
                "icon": "📉",
                "title": f"{worst_cat} tasks need attention",
                "detail": f"Only {int(worst_rate)}% completion rate in {worst_cat}. Focus here today.",
                "action": f"/tasks?category={worst_cat}",
                "action_label": f"View {worst_cat}"
            })

    # 6. Upcoming tasks due soon
    soon = now + timedelta(hours=24)
    due_soon = [
        t for t in all_tasks
        if t.get("scheduled_time") and now <= t["scheduled_time"] <= soon
        and not t.get("completed")
    ]
    if due_soon:
        insights.append({
            "type": "reminder",
            "icon": "🔔",
            "title": f"{len(due_soon)} task{'s' if len(due_soon) > 1 else ''} due in 24 hours",
            "detail": due_soon[0]["title"] if len(due_soon) == 1 else f"Including: {due_soon[0]['title']}",
            "action": "/calendar",
            "action_label": "View calendar"
        })

    # 7. Streak at risk
    streak = current_user.get("current_streak", 0)
    if streak >= 3:
        today_done_count = sum(1 for t in today_tasks if t.get("completed"))
        if today_done_count == 0 and now.hour >= 18:
            insights.append({
                "type": "danger",
                "icon": "🔥",
                "title": f"Streak at risk! {streak} days",
                "detail": "Complete at least 1 task today to keep your streak alive",
                "action": "/tasks",
                "action_label": "Quick complete"
            })

    return insights[:5]  # Return max 5 insights