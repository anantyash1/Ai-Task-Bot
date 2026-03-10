import re
from typing import List, Dict
from datetime import datetime

PRODUCTIVITY_TIPS = {
    "Work": [
        "Break this into 3 smaller 25-min Pomodoro sessions",
        "Schedule a buffer 30 mins before the deadline",
        "Block notifications while working on this task",
    ],
    "Study": [
        "Use Pomodoro: 25 min study, 5 min break",
        "Review notes within 24 hours for better retention",
        "Create a mind map before starting",
    ],
    "Health": [
        "Schedule this at the same time daily to build a habit",
        "Pair this with an existing habit (habit stacking)",
        "Track your progress to stay motivated",
    ],
    "Personal": [
        "Batch similar errands together to save time",
        "Delegate if possible — focus on high-value tasks",
    ],
    "Finance": [
        "Set a calendar reminder 3 days before due dates",
        "Automate this if it recurs monthly",
    ],
    "Other": [
        "Set a clear deadline even if none exists",
        "Define what done looks like before starting",
    ]
}

URGENCY_SUGGESTIONS = {
    "High":     "High priority: Do this FIRST thing today",
    "Critical": "Critical: Drop everything and handle this NOW",
    "Medium":   "Medium priority: Schedule a specific time block",
    "Low":      "Low priority: Batch with similar tasks or delegate",
}

SMART_PATTERNS = [
    {"keywords": ["email","reply","respond"],      "suggestion": "Batch all email replies in one 20-min block"},
    {"keywords": ["meeting","call","standup"],      "suggestion": "Prepare a 3-point agenda to keep it under 30 mins"},
    {"keywords": ["report","document","write"],     "suggestion": "Start with an outline — writing is 3x faster with structure"},
    {"keywords": ["exercise","gym","workout","run"],"suggestion": "Morning workouts have 90% higher completion rates"},
    {"keywords": ["study","exam","quiz"],           "suggestion": "Spaced repetition: study today, review tomorrow"},
    {"keywords": ["buy","shopping","purchase"],     "suggestion": "Batch all purchases in one trip or session"},
    {"keywords": ["clean","organize","tidy"],       "suggestion": "2-minute rule: if under 2 mins, do it immediately"},
]


def get_smart_suggestions(title: str, category: str, priority: str, scheduled_time=None) -> Dict:
    suggestions = []
    title_lower = title.lower()

    if priority in URGENCY_SUGGESTIONS:
        suggestions.append(URGENCY_SUGGESTIONS[priority])

    import random
    if category in PRODUCTIVITY_TIPS:
        suggestions.append(random.choice(PRODUCTIVITY_TIPS[category]))

    for pattern in SMART_PATTERNS:
        if any(kw in title_lower for kw in pattern["keywords"]):
            suggestions.append(pattern["suggestion"])
            break

    if scheduled_time:
        hour = scheduled_time.hour if hasattr(scheduled_time, 'hour') else 9
        if 5 <= hour < 12:
            suggestions.append("Morning tasks leverage peak cognitive energy")
        elif 17 <= hour < 23:
            suggestions.append("Evening is ideal for creative and reflective tasks")

    recurring_kw = ["every","daily","weekly","each day","each week"]
    if any(kw in title_lower for kw in recurring_kw):
        suggestions.append("This sounds recurring — enable recurring to auto-create it!")

    return {
        "suggestions": suggestions[:3],
        "estimated_minutes": _estimate_time(title, category),
        "suggested_priority": _suggest_priority(title),
        "auto_tags": _extract_tags(title)
    }


def _estimate_time(title: str, category: str) -> int:
    title_lower = title.lower()
    estimates = {
        "meeting": 60, "call": 30, "email": 15, "review": 45,
        "write": 90, "read": 30, "exercise": 45, "gym": 60,
        "cook": 30, "clean": 45, "shopping": 60, "study": 60,
        "exam": 120, "assignment": 90, "report": 120,
    }
    for keyword, minutes in estimates.items():
        if keyword in title_lower:
            return minutes
    defaults = {"Work": 45, "Study": 60, "Health": 30, "Personal": 30, "Finance": 20, "Other": 30}
    return defaults.get(category, 30)


def _suggest_priority(title: str) -> str:
    title_lower = title.lower()
    if any(w in title_lower for w in ["urgent","asap","deadline","critical","emergency"]):
        return "Critical"
    if any(w in title_lower for w in ["important","must","today","due"]):
        return "High"
    if any(w in title_lower for w in ["whenever","someday","optional","maybe"]):
        return "Low"
    return "Medium"


def _extract_tags(title: str) -> List[str]:
    tag_map = {
        "work":     ["work","meeting","client","office","project","deadline"],
        "health":   ["gym","exercise","doctor","dentist","workout","health"],
        "study":    ["study","exam","assignment","class","lecture","homework"],
        "finance":  ["pay","bill","invoice","bank","tax","money","budget"],
        "shopping": ["buy","shop","order","purchase","get"],
        "family":   ["family","kids","parent","birthday","anniversary"],
    }
    title_lower = title.lower()
    tags = []
    for tag, keywords in tag_map.items():
        if any(kw in title_lower for kw in keywords):
            tags.append(tag)
    return tags[:3]