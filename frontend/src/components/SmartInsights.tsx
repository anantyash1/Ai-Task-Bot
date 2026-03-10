// frontend/src/components/SmartInsights.tsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, X, RefreshCw } from "lucide-react";
import api from "../api/axios";

const INSIGHT_STYLES = {
  warning:  { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  icon_bg: "rgba(245,158,11,0.2)",  text: "#fbbf24" },
  danger:   { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   icon_bg: "rgba(239,68,68,0.2)",   text: "#f87171" },
  success:  { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  icon_bg: "rgba(16,185,129,0.2)",  text: "#34d399" },
  info:     { bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.2)",   icon_bg: "rgba(124,58,237,0.2)", text: "#a78bfa" },
  tip:      { bg: "rgba(6,182,212,0.08)",  border: "rgba(6,182,212,0.2)",    icon_bg: "rgba(6,182,212,0.2)",   text: "#22d3ee" },
  progress: { bg: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.25)",  icon_bg: "rgba(99,102,241,0.2)",  text: "#818cf8" },
  reminder: { bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)",   icon_bg: "rgba(236,72,153,0.2)",  text: "#f472b6" },
};

export default function SmartInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.get("/insights/daily").then(r => {
      setInsights(r.data);
      setDismissed(new Set());
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const visible = insights.filter((_, i) => !dismissed.has(i));

  if (loading) return null;
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-white/30 text-xs uppercase tracking-widest font-display flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Smart Insights
        </p>
        <button onClick={load} className="text-white/20 hover:text-white/50 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {visible.map((insight, i) => {
          const realIndex = insights.indexOf(insight);
          const style = INSIGHT_STYLES[insight.type as keyof typeof INSIGHT_STYLES] || INSIGHT_STYLES.info;

          return (
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-xl relative overflow-hidden"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                   style={{ background: style.icon_bg }}>
                {insight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-medium text-white text-sm leading-tight">{insight.title}</p>
                <p className="text-white/40 text-xs mt-0.5 font-body leading-tight">{insight.detail}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {insight.action && (
                  <button onClick={() => navigate(insight.action)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                    style={{ background: style.icon_bg, color: style.text }}>
                    {insight.action_label}
                  </button>
                )}
                <button onClick={() => setDismissed(d => new Set([...d, realIndex]))}
                  className="w-6 h-6 flex items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}