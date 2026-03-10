from datetime import datetime, timedelta
from app.utils.database import tasks_collection, users_collection
from app.services.email_service import send_email
from app.services.streak_service import calculate_streak


async def generate_weekly_report(user: dict, tasks: list, streak_data: dict) -> str:
    """Build a rich HTML weekly report email."""
    name = user.get("name", "there")
    total = len(tasks)
    completed = sum(1 for t in tasks if t.get("completed"))
    pending = total - completed
    score = int((completed / total * 100)) if total else 0

    # Category breakdown
    cats = {}
    for t in tasks:
        c = t.get("category", "Other")
        cats[c] = cats.get(c, 0) + 1
    cat_rows = "".join(
        f"<tr><td style='padding:8px 12px;color:#94a3b8;font-size:13px;'>{c}</td>"
        f"<td style='padding:8px 12px;text-align:right;'>"
        f"<span style='background:rgba(124,58,237,0.2);color:#a78bfa;padding:2px 10px;"
        f"border-radius:20px;font-size:12px;'>{n}</span></td></tr>"
        for c, n in sorted(cats.items(), key=lambda x: x[1], reverse=True)
    )

    # Top 5 completed tasks
    completed_tasks = [t for t in tasks if t.get("completed")][:5]
    completed_rows = "".join(
        f"<li style='padding:6px 0;color:#94a3b8;font-size:13px;border-bottom:1px solid #1e293b;'>"
        f"✅ {t.get('title', '')}</li>"
        for t in completed_tasks
    )

    # Score color
    score_color = "#10b981" if score >= 80 else "#f59e0b" if score >= 50 else "#ef4444"
    streak = streak_data.get("current_streak", 0)

    week_start = (datetime.utcnow() - timedelta(days=7)).strftime("%b %d")
    week_end = datetime.utcnow().strftime("%b %d, %Y")

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#030712;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:40px auto;padding:0 20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e0a3c,#0c1445);border-radius:24px 24px 0 0;
                padding:40px;text-align:center;border:1px solid rgba(124,58,237,0.2);">
      <div style="font-size:40px;margin-bottom:12px;">📊</div>
      <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">Weekly Report</h1>
      <p style="color:#6366f1;margin:8px 0 0;font-size:14px;">{week_start} — {week_end}</p>
      <p style="color:#475569;margin:4px 0 0;font-size:13px;">Hey {name}, here's your week!</p>
    </div>

    <!-- Score card -->
    <div style="background:#0f172a;padding:32px;border-left:1px solid rgba(124,58,237,0.15);
                border-right:1px solid rgba(124,58,237,0.15);">
      <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">

        <div style="background:#1e293b;border-radius:16px;padding:20px 28px;text-align:center;min-width:100px;">
          <div style="font-size:36px;font-weight:900;color:{score_color};">{score}%</div>
          <div style="color:#64748b;font-size:12px;margin-top:4px;">Score</div>
        </div>

        <div style="background:#1e293b;border-radius:16px;padding:20px 28px;text-align:center;min-width:100px;">
          <div style="font-size:36px;font-weight:900;color:#34d399;">{completed}</div>
          <div style="color:#64748b;font-size:12px;margin-top:4px;">Done</div>
        </div>

        <div style="background:#1e293b;border-radius:16px;padding:20px 28px;text-align:center;min-width:100px;">
          <div style="font-size:36px;font-weight:900;color:#f97316;">{pending}</div>
          <div style="color:#64748b;font-size:12px;margin-top:4px;">Pending</div>
        </div>

        <div style="background:#1e293b;border-radius:16px;padding:20px 28px;text-align:center;min-width:100px;">
          <div style="font-size:36px;font-weight:900;color:#fb923c;">🔥{streak}</div>
          <div style="color:#64748b;font-size:12px;margin-top:4px;">Streak</div>
        </div>

      </div>
    </div>

    <!-- Category breakdown -->
    <div style="background:#0f172a;padding:28px;border-left:1px solid rgba(124,58,237,0.15);
                border-right:1px solid rgba(124,58,237,0.15);">
      <h3 style="color:white;margin:0 0 16px;font-size:15px;">📂 By Category</h3>
      <table style="width:100%;border-collapse:collapse;">
        {cat_rows if cat_rows else '<tr><td style="color:#475569;font-size:13px;">No tasks this week</td></tr>'}
      </table>
    </div>

    <!-- Completed tasks -->
    {'<div style="background:#0f172a;padding:28px;border-left:1px solid rgba(124,58,237,0.15);border-right:1px solid rgba(124,58,237,0.15);"><h3 style="color:white;margin:0 0 16px;font-size:15px;">🏆 Highlights</h3><ul style="margin:0;padding:0;list-style:none;">' + completed_rows + '</ul></div>' if completed_rows else ''}

    <!-- Footer -->
    <div style="background:linear-gradient(135deg,#1e0a3c,#0c1445);border-radius:0 0 24px 24px;
                padding:28px;text-align:center;border:1px solid rgba(124,58,237,0.2);border-top:none;">
      <p style="color:#4f46e5;font-size:13px;margin:0;">Keep building great habits! 💪</p>
      <p style="color:#1e293b;font-size:11px;margin:8px 0 0;">AI Task Bot · Weekly Digest</p>
    </div>

  </div>
</body>
</html>
"""


async def send_all_weekly_reports():
    """Called by scheduler every Sunday at 6pm."""
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    sent = 0

    async for user in users_collection.find({}):
        user_id = str(user["_id"])
        tasks = [t async for t in tasks_collection.find({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        })]

        if not tasks:
            continue

        streak_data = await calculate_streak(user_id)
        html = await generate_weekly_report(user, tasks, streak_data)

        week_label = now.strftime("%b %d, %Y")
        success = send_email(
            user["email"],
            f"📊 Your Weekly Report — {week_label}",
            html
        )
        if success:
            sent += 1

    print(f"Weekly reports: sent to {sent} users")
    return sent