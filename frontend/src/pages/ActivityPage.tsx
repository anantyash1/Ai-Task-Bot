// frontend/src/pages/ActivityPage.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Filter } from "lucide-react";
import api from "../api/axios";

const ACTION_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  completed:       { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  text: "#34d399" },
  created:         { bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.2)", text: "#a78bfa" },
  deleted:         { bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.15)",  text: "#f87171" },
  overdue:         { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  text: "#fbbf24" },
  goal_reached:    { bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.2)",   text: "#22d3ee" },
  streak_milestone:{ bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.2)",  text: "#fb923c" },
  bulk_completed:  { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", text: "#34d399" },
  template_used:   { bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)",  text: "#c4b5fd" },
};

function groupByDate(events: any[]) {
  const groups: Record<string, any[]> = {};
  events.forEach(e => {
    const d = new Date(e.timestamp);
    const label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(e);
  });
  return groups;
}

function isToday(d: Date) {
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}
function isYesterday(d: Date) {
  const y = new Date(); y.setDate(y.getDate() - 1);
  return d.getDate() === y.getDate() && d.getMonth() === y.getMonth() && d.getFullYear() === y.getFullYear();
}

export default function ActivityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/activity/?days=${days}&limit=100`).then(r => {
      setEvents(r.data);
      setLoading(false);
    });
  }, [days]);

  const grouped = groupByDate(events);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" /> Activity Feed
          </h1>
          <p className="text-white/30 text-sm mt-1">{events.length} events recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/30" />
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="cosmic-input text-sm py-1.5">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : events.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-white/30 font-body">No activity yet. Start completing tasks!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, dateEvents]) => (
          <div key={date}>
            <p className="text-white/20 text-xs uppercase tracking-widest font-display mb-3 px-1">{date}</p>
            <div className="space-y-2">
              {dateEvents.map((event, i) => {
                const style = ACTION_STYLES[event.action] || ACTION_STYLES.created;
                return (
                  <motion.div key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: style.bg, border: `1px solid ${style.border}` }}
                  >
                    <span className="text-xl flex-shrink-0">{event.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-body text-sm font-medium truncate">{event.task_title}</p>
                      <p className="text-xs mt-0.5" style={{ color: style.text }}>
                        {event.action.replace("_", " ")}
                      </p>
                    </div>
                    <span className="text-white/20 text-xs font-mono flex-shrink-0">{event.time_ago}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}