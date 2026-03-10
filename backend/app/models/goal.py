from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    target_count: int = Field(..., ge=1, le=500)
    period: Literal["weekly", "monthly"] = "weekly"
    category: Optional[str] = None
    emoji: Optional[str] = "🎯"


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_count: Optional[int] = None
    emoji: Optional[str] = None


class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    target_count: int
    current_count: int
    period: str
    category: Optional[str]
    emoji: str
    completed: bool
    progress_pct: float
    created_at: str
    period_start: str
    period_end: str