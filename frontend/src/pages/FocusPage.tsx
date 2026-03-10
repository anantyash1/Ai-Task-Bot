// frontend/src/pages/FocusPage.tsx
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Volume2, VolumeX, Zap } from "lucide-react";
import api from "../api/axios";

type SoundType = "none" | "rain" | "whitenoise" | "forest";

function generateAmbientSound(ctx: AudioContext, type: SoundType): AudioNode | null {
  if (type === "none") return null;

  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    if (type === "whitenoise") {
      data[i] = Math.random() * 2 - 1;
    } else if (type === "rain") {
      data[i] = (Math.random() * 2 - 1) * (0.3 + 0.7 * Math.random());
    } else if (type === "forest") {
      data[i] = Math.sin(i * 0.001) * (Math.random() * 0.3);
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gainNode = ctx.createGain();
  gainNode.gain.value = type === "whitenoise" ? 0.05 : 0.1;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = type === "rain" ? 1200 : type === "forest" ? 600 : 3000;

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();

  return gainNode;
}

export default function FocusPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [focusTask, setFocusTask] = useState<any>(null);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [sound, setSound] = useState<SoundType>("none");
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodeRef = useRef<AudioNode | null>(null);
  const intervalRef = useRef<any>(null);

  const FOCUS = 25 * 60;
  const BREAK = 5 * 60;

  useEffect(() => {
    api.get("/tasks/?completed=false").then(r => setTasks(r.data.slice(0, 10)));
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            playChime();
            if (mode === "focus") {
              setSessions(s => s + 1);
              setMode("break");
              return BREAK;
            } else {
              setMode("focus");
              return FOCUS;
            }
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const playChime = () => {
    try {
      const ctx = new AudioContext();
      [880, 1108, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.8);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.8);
      });
    } catch {}
  };

  const toggleSound = () => {
    if (soundOn) {
      soundNodeRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      setSoundOn(false);
    } else {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      soundNodeRef.current = generateAmbientSound(ctx, sound === "none" ? "rain" : sound);
      if (sound === "none") setSound("rain");
      setSoundOn(true);
    }
  };

  const reset = () => {
    setRunning(false);
    setMode("focus");
    setTimeLeft(FOCUS);
  };

  const complete = async () => {
    if (!focusTask) return;
    await api.patch(`/tasks/${focusTask.id}/complete`);
    setTasks(prev => prev.filter(t => t.id !== focusTask.id));
    setFocusTask(null);
  };

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const progress = mode === "focus"
    ? ((FOCUS - timeLeft) / FOCUS) * 100
    : ((BREAK - timeLeft) / BREAK) * 100;

  const modeColor = mode === "focus" ? "#7c3aed" : "#10b981";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-violet-400" /> Focus Mode
        </h1>
        <p className="text-white/30 text-sm mt-1">Deep work — 25 min focus, 5 min break</p>
      </div>

      {/* Main timer */}
      <motion.div
        className="glass-card rounded-3xl p-8 text-center relative overflow-hidden"
        style={{ border: `1px solid ${modeColor}40` }}
        animate={{ boxShadow: running ? `0 0 60px ${modeColor}20` : "none" }}
      >
        <div className="absolute inset-0" style={{
          background: `radial-gradient(circle at 50% 0%, ${modeColor}08, transparent 60%)`
        }} />

        {/* Mode badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
             style={{ background: `${modeColor}20`, border: `1px solid ${modeColor}40` }}>
          {mode === "focus"
            ? <><Brain className="w-3.5 h-3.5" style={{ color: modeColor }} />
                <span style={{ color: modeColor }} className="text-xs font-display font-medium">Deep Focus</span></>
            : <><Coffee className="w-3.5 h-3.5" style={{ color: modeColor }} />
                <span style={{ color: modeColor }} className="text-xs font-display font-medium">Break Time</span></>
          }
        </div>

        {/* Clock */}
        <div className="relative w-52 h-52 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
            <motion.circle
              cx="60" cy="60" r="52" fill="none"
              stroke={modeColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${progress * 3.267} 326.7`}
              style={{ filter: `drop-shadow(0 0 8px ${modeColor})`, transition: "stroke-dasharray 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono font-black text-5xl text-white">{mins}:{secs}</span>
            <span className="text-white/30 text-xs font-display mt-1">{sessions} sessions today</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button onClick={reset}
            className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
            <RotateCcw className="w-4 h-4" />
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setRunning(!running)}
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all"
            style={{
              background: `linear-gradient(135deg, ${modeColor}, ${modeColor}aa)`,
              boxShadow: running ? `0 0 30px ${modeColor}60` : `0 0 15px ${modeColor}30`
            }}
          >
            {running ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </motion.button>
          <button onClick={toggleSound}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${soundOn ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-white/30 hover:text-white hover:bg-white/10"}`}>
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* Sound selector */}
        {soundOn && (
          <div className="flex gap-2 justify-center">
            {(["rain", "whitenoise", "forest"] as SoundType[]).map(s => (
              <button key={s} onClick={() => {
                setSound(s);
                if (soundOn) {
                  soundNodeRef.current = null;
                  audioCtxRef.current?.close();
                  const ctx = new AudioContext();
                  audioCtxRef.current = ctx;
                  soundNodeRef.current = generateAmbientSound(ctx, s);
                }
              }}
                className={`px-3 py-1 rounded-lg text-xs font-display transition-all ${sound === s ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-white/5 text-white/30 hover:text-white/60"}`}>
                {s === "rain" ? "🌧 Rain" : s === "whitenoise" ? "📻 White" : "🌳 Forest"}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Focus task selector */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-white/30 text-xs uppercase tracking-widest font-display mb-4">
          {focusTask ? "Currently focusing on" : "Choose a task to focus on"}
        </p>

        {focusTask ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-4 rounded-xl mb-3" style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <p className="text-white font-body font-medium">{focusTask.title}</p>
            <p className="text-violet-400/60 text-xs mt-1">{focusTask.category} · {focusTask.priority}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={complete} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 transition-all">
                ✅ Mark Complete
              </button>
              <button onClick={() => setFocusTask(null)} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/40 text-xs hover:bg-white/10 transition-all">
                Change task
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-white/20 text-sm text-center py-4 font-body">All tasks completed! 🎉</p>
            ) : tasks.map(t => (
              <button key={t.id} onClick={() => setFocusTask(t)}
                className="w-full text-left p-3 rounded-xl bg-white/3 hover:bg-white/8 border border-white/5 hover:border-violet-500/30 transition-all group">
                <p className="text-white/70 group-hover:text-white text-sm font-body transition-colors">{t.title}</p>
                <p className="text-white/20 text-xs mt-0.5">{t.category}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}