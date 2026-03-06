import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, Calendar, Sparkles, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "You don't have to be great to start, but you must start to be great.", author: "Zig Ziglar" },
  { text: "One task at a time. Done right.", author: "AI Task Bot" },
  { text: "Small actions compound into extraordinary results.", author: "James Clear" },
];

function StatCard({ label, value, icon: Icon, color, delay = 0 }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`glass-card rounded-2xl p-5 border ${color} relative overflow-hidden`}
    >
      <div className="absolute inset-0 opacity-5" style={{ background: "radial-gradient(circle at top right, white, transparent)" }} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest font-display mb-2">{label}</p>
          <p className="text-3xl font-display font-bold text-white">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/60" />
        </div>
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-xl px-4 py-3 text-xs">
      <p className="text-white/60 mb-1 font-display">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.fill }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [dailyPlan, setDailyPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardResponse, insightsResponse, planResponse] = await Promise.all([
        api.get("/tasks/dashboard"),
        api.get("/tasks/ai/insights"),
        api.get("/tasks/ai/daily-plan", { params: { limit: 5 } }),
      ]);
      setData(dashboardResponse.data);
      setAiInsights(insightsResponse.data);
      setDailyPlan(planResponse.data.plan || []);
    } catch {
      setError("Could not load dashboard. Please try again.");
      setData(null);
      setAiInsights(null);
      setDailyPlan([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-white/30 text-sm font-body">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="glass-card rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center max-w-2xl mx-auto">
      <p className="text-red-200 font-body mb-4">{error}</p>
      <button onClick={loadDashboard} className="btn-primary">Retry</button>
    </div>
  );

  if (!data) return null;

  const { stats, weekly_data, upcoming_tasks } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display font-extrabold text-2xl lg:text-3xl text-white">
          {greeting}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-white/30 font-body text-sm mt-1">
          You have <span className="text-violet-400 font-medium">{stats.pending} pending</span> tasks today
        </p>
      </motion.div>

      {/* Quote card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl p-5"
        style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.15))", border: "1px solid rgba(124,58,237,0.3)" }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="flex items-start gap-3 relative z-10">
          <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-1" />
          <div>
            <p className="text-white/80 text-sm font-body italic leading-relaxed">"{quote.text}"</p>
            <p className="text-white/30 text-xs mt-1 font-display">— {quote.author}</p>
          </div>
        </div>
      </motion.div>

      {aiInsights && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-5 border border-violet-500/25"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <p className="text-white/50 text-xs uppercase tracking-widest font-display">AI Coach</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <div>
              <p className="text-white/35 text-xs font-display mb-2">Recommendations</p>
              <ul className="space-y-1.5">
                {(aiInsights.recommendations || []).slice(0, 3).map((tip: string, index: number) => (
                  <li key={index} className="text-white/75 text-sm font-body">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-white/35 text-xs font-display mb-2">Suggested Focus Order</p>
              <div className="space-y-1.5">
                {dailyPlan.slice(0, 3).map((item: any) => (
                  <div key={item.task_id} className="text-white/75 text-sm font-body truncate">
                    {item.title}
                  </div>
                ))}
                {dailyPlan.length === 0 && (
                  <p className="text-white/35 text-sm font-body">No pending tasks for planning.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Productivity" value={`${stats.productivity_score}%`} icon={TrendingUp} color="stat-violet" delay={0.1} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="stat-emerald" delay={0.15} />
        <StatCard label="Pending" value={stats.pending} icon={Clock} color="stat-cyan" delay={0.2} />
        <StatCard label="Missed" value={stats.missed} icon={AlertTriangle} color="stat-red" delay={0.25} />
      </div>

      {/* Productivity ring + chart */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6 flex flex-col items-center justify-center"
        >
          <Target className="w-4 h-4 text-white/40 mb-3" />
          <p className="text-white/40 text-xs uppercase tracking-widest font-display mb-4">Productivity Score</p>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(stats.productivity_score / 100) * 264} 264`}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-extrabold text-2xl text-white">{stats.productivity_score}%</span>
              <span className="text-white/30 text-xs">score</span>
            </div>
          </div>
          <p className="text-white/30 text-xs mt-4 font-body text-center">
            {stats.completed} of {stats.total} tasks completed
          </p>
        </motion.div>

        {/* Weekly chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-2xl p-6 lg:col-span-2"
        >
          <p className="text-white/40 text-xs uppercase tracking-widest font-display mb-5">Weekly Performance</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weekly_data} barGap={4}>
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill="rgba(124,58,237,0.3)" />
              <Bar dataKey="completed" name="Done" radius={[4, 4, 0, 0]} fill="#7c3aed" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Upcoming tasks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <p className="text-white/40 text-xs uppercase tracking-widest font-display">Upcoming Tasks</p>
        </div>
        {upcoming_tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-white/30 text-sm font-body">All clear! No upcoming tasks.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming_tasks.map((task: any, i: number) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-colors border border-white/5"
              >
                <div className={`flex-shrink-0 priority-dot-${task.priority.toLowerCase()}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-body font-medium truncate">{task.title}</p>
                  {task.scheduled_time && (
                    <p className="text-white/30 text-xs font-mono mt-0.5">
                      {new Date(task.scheduled_time).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`badge badge-${task.category.toLowerCase()}`}>{task.category}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
