from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    category: Literal["Work", "Personal", "Study", "Other"] = "Other"
    priority: Literal["Low", "Medium", "High"] = "Medium"
    scheduled_time: Optional[datetime] = None
    natural_input: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    completed: Optional[bool] = None


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
