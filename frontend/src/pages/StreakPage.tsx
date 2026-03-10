import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy, Calendar, Target, Star } from "lucide-react";
import api from "../api/axios";

export default function StreakPage() {
  const [streak, setStreak] = useState<any>(null);

  useEffect(() => {
    api.get("/stats/streak").then((r) => setStreak(r.data));
  }, []);

  if (!streak) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  const { current_streak, longest_streak, completed_today, weekly_completions, total_active_days } = streak;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-400" /> Streak Tracker
        </h1>
        <p className="text-white/30 text-sm mt-1">Build unstoppable habits daily</p>
      </div>

      {/* Hero streak card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-10 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(124,58,237,0.1))",
          border: "1px solid rgba(249,115,22,0.25)"
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ background: "radial-gradient(circle at 50% 0%, #f97316, transparent 65%)" }} />

        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="text-8xl mb-4 relative z-10"
        >
          {current_streak > 0 ? "🔥" : "💤"}
        </motion.div>

        <p className="font-display font-black text-8xl text-white relative z-10">
          {current_streak}
        </p>
        <p className="text-white/40 font-display text-lg mt-2 relative z-10">day streak</p>

        <div className="mt-5 relative z-10">
          {completed_today ? (
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-emerald-400"
              style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <Star className="w-4 h-4" /> Completed today ✓
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium text-red-400"
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <Target className="w-4 h-4" /> Complete a task to continue!
            </span>
          )}
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Current", value: `${current_streak}d`, icon: Flame, color: "#f97316" },
          { label: "Best Ever", value: `${longest_streak}d`, icon: Trophy, color: "#eab308" },
          { label: "Active Days", value: total_active_days, icon: Calendar, color: "#06b6d4" },
        ].map((stat, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-5 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
            <p className="font-display font-bold text-2xl text-white">{stat.value}</p>
            <p className="text-white/25 text-xs mt-1 font-body">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Weekly heatmap */}
      <div className="rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-white/30 text-xs uppercase tracking-widest font-display mb-5">Last 7 Days</p>
        <div className="grid grid-cols-7 gap-2">
          {weekly_completions?.map((day: any, i: number) => (
            <motion.div key={i}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="flex flex-col items-center gap-2">
              <div className="w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: day.has_completion
                    ? `rgba(249,115,22,${Math.min(0.25 + day.completed * 0.15, 0.85)})`
                    : "rgba(255,255,255,0.03)",
                  border: day.has_completion
                    ? "1px solid rgba(249,115,22,0.4)"
                    : "1px solid rgba(255,255,255,0.05)",
                  boxShadow: day.has_completion ? "0 0 10px rgba(249,115,22,0.15)" : "none"
                }}>
                {day.has_completion
                  ? <span className="text-orange-300">{day.completed > 1 ? day.completed : "✓"}</span>
                  : <span className="text-white/10">–</span>}
              </div>
              <p className="text-white/25 text-xs font-display">{day.date}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Milestone badges */}
      <div className="rounded-2xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-white/30 text-xs uppercase tracking-widest font-display mb-5">Milestones</p>
        <div className="grid grid-cols-6 gap-3">
          {[
            { days: 3, emoji: "🔥", label: "3 days" },
            { days: 7, emoji: "⚡", label: "1 week" },
            { days: 14, emoji: "🌟", label: "2 weeks" },
            { days: 30, emoji: "💎", label: "1 month" },
            { days: 60, emoji: "👑", label: "2 months" },
            { days: 100, emoji: "🏆", label: "100 days" },
          ].map((badge) => {
            const unlocked = current_streak >= badge.days || longest_streak >= badge.days;
            return (
              <div key={badge.days}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${unlocked ? "opacity-100" : "opacity-20 grayscale"}`}
                style={{
                  background: unlocked ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}>
                <span className="text-2xl">{badge.emoji}</span>
                <span className="text-white/40 text-xs font-display text-center leading-tight">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}