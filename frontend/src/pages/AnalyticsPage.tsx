import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { TrendingUp, Award, Zap, BarChart2 } from "lucide-react";
import api from "../api/axios";

const PIE_COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#ec4899"];
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card rounded-xl px-4 py-3 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardResponse, taskResponse] = await Promise.all([
        api.get("/tasks/dashboard"),
        api.get("/tasks/"),
      ]);
      setData(dashboardResponse.data);
      setTasks(taskResponse.data);
    } catch {
      setError("Could not load analytics. Please try again.");
      setData(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  if (loading) return (
    <div className="flex justify-center py-24"><div className="spinner" /></div>
  );

  if (error) return (
    <div className="glass-card rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center max-w-2xl mx-auto">
      <p className="text-red-200 font-body mb-4">{error}</p>
      <button onClick={loadAnalytics} className="btn-primary">Retry</button>
    </div>
  );

  if (!data) return null;

  const { stats, weekly_data } = data;

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  tasks.forEach((t) => { categoryMap[t.category] = (categoryMap[t.category] || 0) + 1; });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Priority breakdown
  const priorityMap: Record<string, { total: number; done: number }> = {};
  tasks.forEach((t) => {
    if (!priorityMap[t.priority]) priorityMap[t.priority] = { total: 0, done: 0 };
    priorityMap[t.priority].total++;
    if (t.completed) priorityMap[t.priority].done++;
  });
  const priorityData = Object.entries(priorityMap).map(([name, v]) => ({
    name, total: v.total, completed: v.done,
    rate: v.total ? Math.round((v.done / v.total) * 100) : 0,
  }));

  const insights = [
    {
      icon: "🔥",
      title: "Most Productive Day",
      value: weekly_data.reduce((a: any, b: any) => b.completed > a.completed ? b : a, weekly_data[0])?.day || "—",
      sub: "This week"
    },
    {
      icon: "📌",
      title: "Top Category",
      value: categoryData.sort((a, b) => b.value - a.value)[0]?.name || "—",
      sub: `${categoryData[0]?.value || 0} tasks`
    },
    {
      icon: "⚡",
      title: "Completion Rate",
      value: `${stats.productivity_score}%`,
      sub: "Overall"
    },
    {
      icon: "🎯",
      title: "Total Tasks",
      value: stats.total,
      sub: "Created"
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-pink-400" /> Analytics Overview
        </h1>
        <p className="text-white/30 text-sm font-body mt-1">Deep insights into your productivity patterns</p>
      </motion.div>

      {/* Insight cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((ins, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass-card rounded-2xl p-5"
          >
            <p className="text-2xl mb-3">{ins.icon}</p>
            <p className="text-white/30 text-xs font-display uppercase tracking-widest">{ins.title}</p>
            <p className="text-2xl font-display font-bold text-white mt-1">{ins.value}</p>
            <p className="text-white/20 text-xs font-body mt-0.5">{ins.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="text-white/40 text-xs uppercase tracking-widest font-display mb-5">7-Day Task Trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekly_data}>
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="doneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total" stroke="#7c3aed" fill="url(#totalGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="completed" name="Done" stroke="#06b6d4" fill="url(#doneGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="text-white/40 text-xs uppercase tracking-widest font-display mb-5">Tasks by Category</p>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-white/20 text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-white/50 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Priority completion */}
      {priorityData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <p className="text-white/40 text-xs uppercase tracking-widest font-display mb-5">Completion by Priority</p>
          <div className="space-y-4">
            {priorityData.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`priority-dot-${p.name.toLowerCase()}`} />
                    <span className="text-white/60 font-body">{p.name} Priority</span>
                  </div>
                  <span className="text-white/40 font-mono">{p.completed}/{p.total} · {p.rate}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: p.name === "High" ? "linear-gradient(90deg, #ef4444, #ec4899)"
                        : p.name === "Medium" ? "linear-gradient(90deg, #f59e0b, #ef4444)"
                        : "linear-gradient(90deg, #10b981, #06b6d4)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${p.rate}%` }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
