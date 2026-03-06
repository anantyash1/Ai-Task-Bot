import os
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Mapping, Sequence

from dotenv import load_dotenv

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT") or os.getenv("MAIL_PORT") or "587")
SMTP_USER = os.getenv("SMTP_USER") or os.getenv("MAIL_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL") or os.getenv("MAIL_FROM") or SMTP_USER
FROM_NAME = os.getenv("MAIL_FROM_NAME", "AI Task Bot")


def _send_html_email(to_email: str, subject: str, html_body: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD or not to_email:
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception:
        return False


def send_reminder_email(task: Mapping[str, Any]) -> bool:
    to_email = str(task.get("user_email") or "")
    scheduled_time = task.get("scheduled_time")
    if isinstance(scheduled_time, datetime):
        scheduled_display = scheduled_time.strftime("%Y-%m-%d %H:%M UTC")
    else:
        scheduled_display = "Not scheduled"

    body = f"""
    <h2>Task Reminder</h2>
    <p>This is a reminder for your task:</p>
    <p><strong>{task.get("title", "Untitled Task")}</strong></p>
    <p>Priority: {task.get("priority", "Medium")}</p>
    <p>Category: {task.get("category", "Other")}</p>
    <p>Scheduled: {scheduled_display}</p>
    """
    return _send_html_email(to_email, f"Reminder: {task.get('title', 'Task')}", body)


def send_task_reminder(
    to_email: str,
    user_name: str,
    task_title: str,
    scheduled_time: datetime | None,
) -> bool:
    scheduled_display = scheduled_time.strftime("%Y-%m-%d %H:%M UTC") if scheduled_time else "Not scheduled"
    body = f"""
    <h2>Hello {user_name},</h2>
    <p>Your task is coming up:</p>
    <p><strong>{task_title}</strong></p>
    <p>Scheduled: {scheduled_display}</p>
    """
    return _send_html_email(to_email, f"Task Reminder: {task_title}", body)


def send_daily_summary(
    to_email: str,
    user_name: str,
    tasks: Sequence[Mapping[str, Any]],
    completed_count: int,
    total_count: int,
) -> bool:
    task_items = "".join(
        f"<li>{task.get('title', 'Untitled')} - {'Done' if task.get('completed') else 'Pending'}</li>"
        for task in tasks
    )
    body = f"""
    <h2>Hi {user_name},</h2>
    <p>Here is your daily summary:</p>
    <p>Completed: {completed_count} / {total_count}</p>
    <ul>{task_items}</ul>
    """
    return _send_html_email(to_email, "Your Daily Task Summary", body)
