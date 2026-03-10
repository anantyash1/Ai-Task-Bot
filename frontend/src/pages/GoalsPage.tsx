// frontend/src/pages/GoalsPage.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, Trash2, Trophy, TrendingUp, CheckCircle2 } from "lucide-react";
import api from "../api/axios";

const CATEGORY_OPTIONS = ["Work", "Personal", "Study", "Health", "Finance", "Other", "Any"];
const EMOJI_OPTIONS = ["🎯", "💪", "📚", "🏃", "💰", "⚡", "🌟", "🔥", "✅", "🚀"];

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", target_count: 5, period: "weekly",
    category: "", emoji: "🎯"
  });
  const [saving, setSaving] = useState(false);

  const load = () => api.get("/goals/").then(r => setGoals(r.data));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.target_count) return;
    setSaving(true);
    try {
      await api.post("/goals/", {
        ...form,
        category: form.category || null,
        target_count: Number(form.target_count)
      });
      setShowForm(false);
      setForm({ title: "", target_count: 5, period: "weekly", category: "", emoji: "🎯" });
      load();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    await api.delete(`/goals/${id}`);
    load();
  };

  const weekly = goals.filter(g => g.period === "weekly");
  const monthly = goals.filter(g => g.period === "monthly");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-violet-400" /> Goals
          </h1>
          <p className="text-white/30 text-sm mt-1">Progress auto-tracks from your completed tasks</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6 overflow-hidden"
            style={{ border: "1px solid rgba(124,58,237,0.3)" }}
          >
            <h2 className="font-display font-semibold text-white mb-4 text-sm">Create Goal</h2>
            <div className="space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="text-white/30 text-xs uppercase tracking-widest font-display block mb-2">Emoji</label>
                <div className="flex gap-2 flex-wrap">
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({...f, emoji: e}))}
                      className={`w-9 h-9 rounded-xl text-lg transition-all ${form.emoji === e ? "bg-violet-500/30 scale-110" : "bg-white/5 hover:bg-white/10"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/30 text-xs uppercase tracking-widest font-display block mb-2">Goal Title</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="Complete 10 work tasks" className="cosmic-input w-full" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-white/30 text-xs uppercase tracking-widest font-display block mb-2">Target</label>
                  <input type="number" value={form.target_count}
                    onChange={e => setForm(f => ({...f, target_count: Number(e.target.value)}))}
                    min={1} className="cosmic-input w-full" />
                </div>
                <div>
                  <label className="text-white/30 text-xs uppercase tracking-widest font-display block mb-2">Period</label>
                  <select value={form.period} onChange={e => setForm(f => ({...f, period: e.target.value}))}
                    className="cosmic-input w-full">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/30 text-xs uppercase tracking-widest font-display block mb-2">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}
                    className="cosmic-input w-full">
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c === "Any" ? "" : c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={save} disabled={saving || !form.title} className="btn-primary">
                  {saving ? "Creating..." : "Create Goal"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 text-sm transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-white/30 font-body">No goals yet. Create one to track your progress!</p>
        </div>
      ) : (
        <>
          {weekly.length > 0 && <GoalSection title="📅 This Week" goals={weekly} onDelete={del} />}
          {monthly.length > 0 && <GoalSection title="📆 This Month" goals={monthly} onDelete={del} />}
        </>
      )}
    </div>
  );
}

function GoalSection({ title, goals, onDelete }: any) {
  return (
    <div>
      <p className="text-white/30 text-xs uppercase tracking-widest font-display mb-3">{title}</p>
      <div className="space-y-3">
        {goals.map((goal: any, i: number) => (
          <GoalCard key={goal.id} goal={goal} onDelete={onDelete} index={i} />
        ))}
      </div>
    </div>
  );
}

function GoalCard({ goal, onDelete, index }: any) {
  const pct = goal.progress_pct;
  const done = goal.completed;
  const barColor = done ? "#10b981" : pct >= 70 ? "#a78bfa" : pct >= 40 ? "#06b6d4" : "#f97316";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-2xl p-5"
      style={{ border: done ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{goal.emoji}</span>
          <div>
            <p className={`font-body font-semibold ${done ? "text-emerald-400" : "text-white"}`}>
              {goal.title}
              {done && <span className="ml-2 text-xs">🏆</span>}
            </p>
            <p className="text-white/30 text-xs font-body mt-0.5">
              {goal.category || "All categories"} · {goal.period}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-lg" style={{ color: barColor }}>
            {goal.current_count}<span className="text-white/30 text-sm font-normal">/{goal.target_count}</span>
          </span>
          <button onClick={() => onDelete(goal.id)}
            className="w-8 h-8 rounded-xl bg-red-500/0 hover:bg-red-500/15 flex items-center justify-center text-white/20 hover:text-red-400 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
            boxShadow: `0 0 8px ${barColor}60`
          }}
        />
      </div>
      <p className="text-white/20 text-xs font-body mt-2">
        {done ? "Goal achieved!" : `${Math.max(0, goal.target_count - goal.current_count)} more to reach target`}
      </p>
    </motion.div>
  );
}