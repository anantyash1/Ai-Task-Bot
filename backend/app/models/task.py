from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

TaskPriority = Literal["Low", "Medium", "High", "Critical"]
TaskCategory = Literal["Work", "Personal", "Study", "Other"]
TaskRecurring = Literal["none", "daily", "weekly", "monthly"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    category: TaskCategory = "Other"
    priority: TaskPriority = "Medium"
    scheduled_time: Optional[datetime] = None
    natural_input: Optional[str] = None
    recurring: TaskRecurring = "none"
    subtasks: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    notes: str = ""
    estimated_minutes: Optional[int] = Field(default=None, ge=1, le=1440)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=500)
    category: Optional[TaskCategory] = None
    priority: Optional[TaskPriority] = None
    scheduled_time: Optional[datetime] = None
    completed: Optional[bool] = None
    recurring: Optional[TaskRecurring] = None
    subtasks: Optional[list[dict]] = None
    tags: Optional[list[str]] = None
    notes: Optional[str] = None
    estimated_minutes: Optional[int] = Field(default=None, ge=1, le=1440)


class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    category: str
    priority: str
    scheduled_time: Optional[datetime]
    completed: bool
    reminder_sent: bool
    created_at: datetime


class NLPInput(BaseModel):
    text: str = Field(..., min_length=2, max_length=1000)


class AIBreakdownInput(BaseModel):
    title: str = Field(..., min_length=3, max_length=500)
