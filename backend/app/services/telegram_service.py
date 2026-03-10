import httpx
import os
from dotenv import load_dotenv

load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"


async def send_telegram_message(chat_id: str, text: str) -> bool:
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        return False
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{TELEGRAM_API}/sendMessage",
                json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
                timeout=10
            )
            return resp.status_code == 200
    except Exception as e:
        print(f"Telegram error: {e}")
        return False


async def send_task_reminder_telegram(chat_id: str, task_title: str, scheduled_time) -> bool:
    text = (
        f"REMINDER: {task_title}\n"
        f"Due: {scheduled_time.strftime('%I:%M %p, %b %d')}"
    )
    return await send_telegram_message(chat_id, text)


async def send_daily_summary_telegram(chat_id: str, user_name: str, completed: int, total: int, pending_tasks: list) -> bool:
    score = int((completed / total) * 100) if total else 0
    text = f"Daily Summary for {user_name}\nScore: {score}%\nDone: {completed}/{total}"
    return await send_telegram_message(chat_id, text)


async def send_streak_notification(chat_id: str, user_name: str, streak: int) -> bool:
    if streak in [3, 7, 14, 30, 60, 100]:
        text = f"Streak milestone! {streak} days in a row, {user_name}!"
        return await send_telegram_message(chat_id, text)
    return False