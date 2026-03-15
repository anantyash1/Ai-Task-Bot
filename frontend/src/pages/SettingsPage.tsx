import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Download, User, Send, CheckCircle2, FileJson, FileText, Smartphone } from "lucide-react";
import api, { API_BASE_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  const [telegramId, setTelegramId] = useState("");
  const [dailyGoal, setDailyGoal] = useState(5);
  const [pomodoroMin, setPomodoroMin] = useState(25);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    api.get("/users/profile").then((r) => {
      setTelegramId(r.data.telegram_chat_id || "");
      setDailyGoal(r.data.daily_goal || 5);
      setPomodoroMin(r.data.pomodoro_duration || 25);
    });
  }, []);

  const save = async () => {
    setSaving(true); setSaveMsg("");
    try {
      await api.put("/users/profile", {
        telegram_chat_id: telegramId || null,
        daily_goal: dailyGoal,
        pomodoro_duration: pomodoroMin,
      });
      setSaveMsg("✅ Saved!");
    } catch { setSaveMsg("❌ Save failed"); }
    finally { setSaving(false); setTimeout(() => setSaveMsg(""), 3000); }
  };

  const testTelegram = async () => {
    setTesting(true); setTestMsg("");
    try {
      await api.post("/users/telegram/test");
      setTestMsg("✅ Message sent! Check Telegram.");
    } catch (e: any) {
      setTestMsg("❌ " + (e.response?.data?.detail || "Failed. Check Chat ID."));
    } finally { setTesting(false); }
  };

  const apiBase = API_BASE_URL;
  const token = localStorage.getItem("token");

  const Section = ({ title, icon: Icon, children }: any) => (
    <div className="rounded-2xl p-6"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2 mb-5">
        <Icon className="w-4 h-4 text-violet-400" />
        <h2 className="font-display font-semibold text-white text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-white">Settings</h1>
        <p className="text-white/30 text-sm mt-1">Customize your AI Task Bot</p>
      </div>

      {/* Profile */}
      <Section title="Your Profile" icon={User}>
        <div className="flex items-center gap-4 p-4 rounded-xl mb-5"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-display font-semibold text-white">{user?.name}</p>
            <p className="text-white/40 text-sm font-body">{user?.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white/30 text-xs uppercase tracking-widest font-display block mb-2">Daily Task Goal</label>
            <input type="number" value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              min={1} max={50}
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
          <div>
            <label className="text-white/30 text-xs uppercase tracking-widest font-display block mb-2">Pomodoro (mins)</label>
            <input type="number" value={pomodoroMin}
              onChange={(e) => setPomodoroMin(Number(e.target.value))}
              min={5} max={60}
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
          </div>
        </div>
      </Section>

      {/* Telegram */}
      <Section title="Telegram Notifications (Free)" icon={Smartphone}>
        <div className="p-4 rounded-xl text-sm mb-4"
          style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.15)" }}>
          <p className="text-cyan-400 font-medium mb-2">📱 Setup guide (free, no limits):</p>
          <ol className="text-white/45 space-y-1 list-decimal list-inside text-xs font-body">
            <li>Open Telegram → search <span className="text-cyan-300">@BotFather</span></li>
            <li>Send <span className="text-cyan-300">/newbot</span> → get your token → add to backend .env as TELEGRAM_BOT_TOKEN</li>
            <li>Search <span className="text-cyan-300">@userinfobot</span> → message it → copy your numeric ID</li>
            <li>Paste that ID below and save</li>
          </ol>
        </div>
        <label className="text-white/30 text-xs uppercase tracking-widest font-display block mb-2">
          Your Telegram Chat ID
        </label>
        <input value={telegramId} onChange={(e) => setTelegramId(e.target.value)}
          placeholder="e.g. 123456789"
          className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none mb-3"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }} />
        <button onClick={testTelegram} disabled={!telegramId || testing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
          style={{ border: "1px solid rgba(6,182,212,0.25)", color: "#22d3ee", background: "rgba(6,182,212,0.08)" }}>
          <Send className="w-4 h-4" />
          {testing ? "Sending..." : "Send Test Message"}
        </button>
        {testMsg && (
          <p className={`mt-2 text-sm ${testMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>{testMsg}</p>
        )}
      </Section>

      {/* Export */}
      <Section title="Export Your Data" icon={Download}>
        <p className="text-white/30 text-sm font-body mb-4">Download all your tasks for backup or analysis</p>
        <div className="grid grid-cols-2 gap-3">
          <a href={`${apiBase}/stats/export/csv`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-3 p-4 rounded-xl transition-all"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399" }}>
            <FileText className="w-5 h-5" />
            <div>
              <p className="font-display font-medium text-sm">Export CSV</p>
              <p className="text-xs opacity-60">Open in Excel</p>
            </div>
          </a>
          <a href={`${apiBase}/stats/export/json`} target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-3 p-4 rounded-xl transition-all"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa" }}>
            <FileJson className="w-5 h-5" />
            <div>
              <p className="font-display font-medium text-sm">Export JSON</p>
              <p className="text-xs opacity-60">For developers</p>
            </div>
          </a>
        </div>
      </Section>

      {/* Save */}
      <button onClick={save} disabled={saving}
        className="w-full py-3 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}>
        {saving
          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <><CheckCircle2 className="w-4 h-4" /> Save All Settings</>}
      </button>
      {saveMsg && (
        <p className={`text-center text-sm ${saveMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>{saveMsg}</p>
      )}
    </div>
  );
}
