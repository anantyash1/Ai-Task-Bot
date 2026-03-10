from fastapi import APIRouter, Depends, HTTPException
from app.utils.dependencies import get_current_user
from app.utils.database import users_collection
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

router = APIRouter(prefix="/users", tags=["Users"])


class UserUpdate(BaseModel):
    name: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    pomodoro_duration: Optional[int] = None
    daily_goal: Optional[int] = None


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "name": current_user["name"],
        "email": current_user["email"],
        "created_at": current_user["created_at"].isoformat(),
        "telegram_chat_id": current_user.get("telegram_chat_id", ""),
        "daily_goal": current_user.get("daily_goal", 5),
        "pomodoro_duration": current_user.get("pomodoro_duration", 25),
        "current_streak": current_user.get("current_streak", 0),
        "longest_streak": current_user.get("longest_streak", 0),
    }


@router.put("/profile")
async def update_profile(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    return {"message": "Profile updated"}


@router.post("/telegram/test")
async def test_telegram(current_user: dict = Depends(get_current_user)):
    chat_id = current_user.get("telegram_chat_id")
    if not chat_id:
        raise HTTPException(status_code=400, detail="No Telegram Chat ID set in profile")
    try:
        from app.services.telegram_service import send_telegram_message
        success = await send_telegram_message(
            chat_id,
            f"Connected! Hey {current_user['name']}, AI Task Bot is linked to your Telegram!"
        )
        if success:
            return {"message": "Test message sent! Check Telegram."}
        raise HTTPException(status_code=500, detail="Send failed. Check your Chat ID and bot token.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))