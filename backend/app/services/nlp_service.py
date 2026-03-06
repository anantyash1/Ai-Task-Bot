import re
from datetime import datetime, timedelta
from typing import Optional

import dateparser


_PRIORITY_KEYWORDS = {
    "High": ("urgent", "asap", "important", "critical", "high priority"),
    "Low": ("low priority", "someday", "whenever", "later"),
}

_CATEGORY_KEYWORDS = {
    "Work": ("work", "meeting", "project", "deadline", "client", "report", "email"),
    "Personal": ("personal", "home", "family", "doctor", "gym", "workout", "health"),
    "Study": ("study", "learn", "course", "class", "homework", "assignment", "read"),
}

_RELATIVE_TIME_RE = re.compile(
    r"\bin\s+(?P<num>\d+)\s*(?P<unit>minute|minutes|min|mins|hour|hours|hr|hrs|day|days|week|weeks)\b",
    flags=re.IGNORECASE,
)

_NOISE_PATTERNS = [
    r"\b(remind me to|please|kindly|need to|i should|i have to)\b",
    r"\b(high|low|medium)\s*priority\b",
    r"\b(urgent|important|asap|critical)\b",
    r"\b(today|tomorrow|tonight|this morning|this evening|next week|next month)\b",
    r"\bat\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b",
    r"\bon\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
]


def _extract_priority(text: str) -> str:
    lowered = text.lower()
    for level, keywords in _PRIORITY_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return level
    return "Medium"


def _extract_category(text: str) -> str:
    lowered = text.lower()
    for category, keywords in _CATEGORY_KEYWORDS.items():
        if any(keyword in lowered for keyword in keywords):
            return category
    return "Other"


def _parse_relative_time(text: str, now: datetime) -> Optional[datetime]:
    match = _RELATIVE_TIME_RE.search(text)
    if not match:
        return None

    count = int(match.group("num"))
    unit = match.group("unit").lower()
    if unit.startswith("min"):
        return now + timedelta(minutes=count)
    if unit.startswith(("hour", "hr")):
        return now + timedelta(hours=count)
    if unit.startswith("day"):
        return now + timedelta(days=count)
    if unit.startswith("week"):
        return now + timedelta(weeks=count)
    return None


def _parse_scheduled_time(text: str) -> Optional[datetime]:
    now = datetime.utcnow()
    parsed = dateparser.parse(
        text,
        settings={
            "PREFER_DATES_FROM": "future",
            "RELATIVE_BASE": now,
            "RETURN_AS_TIMEZONE_AWARE": False,
            "TIMEZONE": "UTC",
        },
    )

    if parsed:
        return parsed.replace(second=0, microsecond=0)

    relative_time = _parse_relative_time(text, now)
    if relative_time:
        return relative_time.replace(second=0, microsecond=0)

    return None


def _clean_title(text: str) -> str:
    cleaned = text
    for pattern in _NOISE_PATTERNS:
        cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" .,-")
    if not cleaned:
        return text.strip()
    return cleaned[:1].upper() + cleaned[1:]


def _confidence_score(title: str, scheduled_time: Optional[datetime]) -> float:
    score = 0.55
    if title and len(title.split()) >= 2:
        score += 0.2
    if scheduled_time is not None:
        score += 0.2
    return min(score, 0.95)


def parse_natural_language(text: str) -> dict:
    normalized = text.strip()
    scheduled_time = _parse_scheduled_time(normalized)
    title = _clean_title(normalized)
    priority = _extract_priority(normalized)
    category = _extract_category(normalized)
    confidence = _confidence_score(title, scheduled_time)

    scheduled_iso = scheduled_time.isoformat() if scheduled_time else None
    return {
        "title": title,
        "scheduled_time": scheduled_iso,
        "scheduled_time_iso": scheduled_iso,
        "priority": priority,
        "category": category,
        "confidence": confidence,
    }
