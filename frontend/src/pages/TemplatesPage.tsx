// frontend/src/pages/TemplatesPage.tsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LayoutTemplate, CheckCircle2, Loader } from "lucide-react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

const BG_PATTERNS: Record<string, string> = {
  morning_routine: "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(249,115,22,0.05))",
  weekly_review:   "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.05))",
  project_launch:  "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.05))",
  study_session:   "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))",
  health_week:     "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))",
  finance_review:  "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(202,138,4,0.05))",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [applying, setApplying] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/templates/").then(r => setTemplates(r.data));
  }, []);

  const apply = async (id: string, name: string) => {
    setApplying(id);
    try {
      const r = await api.post(`/templates/${id}/apply`);
      setDone(d => new Set([...d, id]));
      setTimeout(() => {
        navigate("/tasks");
      }, 1500);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <LayoutTemplate className="w-6 h-6 text-violet-400" /> Task Templates
        </h1>
        <p className="text-white/30 text-sm mt-1">One click creates all tasks. No manual entry.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {templates.map((t, i) => (
          <motion.div key={t.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: BG_PATTERNS[t.id] || BG_PATTERNS.morning_routine,
              border: done.has(t.id) ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-display font-bold text-white text-base">{t.name}</p>
                <p className="text-white/40 text-xs font-body mt-0.5">{t.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-white/30 text-xs font-body">{t.task_count} tasks</span>
              <div className="flex gap-1.5">
                {t.categories.slice(0, 3).map((c: string) => (
                  <span key={c} className="px-2 py-0.5 rounded-full text-xs font-body"
                        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => apply(t.id, t.name)}
              disabled={applying === t.id || done.has(t.id)}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
              style={done.has(t.id) ? {
                background: "rgba(16,185,129,0.2)",
                border: "1px solid rgba(16,185,129,0.3)",
                color: "#34d399"
              } : {
                background: "rgba(124,58,237,0.25)",
                border: "1px solid rgba(124,58,237,0.4)",
                color: "#a78bfa"
              }}
            >
              {done.has(t.id) ? (
                <><CheckCircle2 className="w-4 h-4" /> Tasks created! Redirecting...</>
              ) : applying === t.id ? (
                <><Loader className="w-4 h-4 animate-spin" /> Creating tasks...</>
              ) : (
                <>⚡ Apply Template — {t.task_count} tasks</>
              )}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}