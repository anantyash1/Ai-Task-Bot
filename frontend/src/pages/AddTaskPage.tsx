import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Sparkles, Send, Calendar, Tag,
  AlertCircle, CheckCircle2, Wand2, ChevronRight
} from "lucide-react";
import api from "../api/axios";

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

const EXAMPLE_PROMPTS = [
  "Remind me to submit the report tomorrow at 9 AM",
  "Call the dentist next Monday afternoon",
  "Study for exam this Friday at 6 PM",
  "Team meeting every Monday at 10 AM",
];

const CATEGORIES = ["Work", "Personal", "Study", "Other"];
const PRIORITIES = [
  { value: "High", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  { value: "Medium", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "Low", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
];

export default function AddTaskPage() {
  const [naturalInput, setNaturalInput] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [priority, setPriority] = useState("Medium");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nlpDone, setNlpDone] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice input requires Chrome browser."); return; }
    recognitionRef.current = new SR();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.onresult = (e: any) => {
      setNaturalInput(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopVoice = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const parseNLP = async () => {
    if (!naturalInput.trim()) return;
    setIsParsing(true); setError(""); setNlpDone(false);
    try {
      const res = await api.post("/tasks/parse-nlp", { text: naturalInput });
      const r = res.data;
      setTitle(r.title || "");
      setCategory(r.category || "Other");
      setPriority(r.priority || "Medium");
      const parsedTime = r.scheduled_time_iso || r.scheduled_time;
      if (parsedTime) {
        setScheduledTime(new Date(parsedTime).toISOString().slice(0, 16));
      }
      setNlpDone(true);
    } catch {
      setError("AI parsing failed. Fill in the details manually.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Please enter a task title."); return; }
    setIsSubmitting(true); setError("");
    try {
      await api.post("/tasks/", {
        title, category, priority,
        scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : null,
        natural_input: naturalInput,
      });
      setSuccess(true);
      setTimeout(() => navigate("/tasks"), 1800);
    } catch {
      setError("Failed to create task. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) return (
    <div className="flex items-center justify-center h-64">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl mb-4"
        >✅</motion.div>
        <p className="font-display font-bold text-2xl text-white">Task Created!</p>
        <p className="text-white/30 text-sm font-body mt-2">Redirecting to your tasks...</p>
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm font-body"
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Input Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
        style={{ border: "1px solid rgba(124,58,237,0.3)" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="w-4 h-4 text-violet-400" />
          <h2 className="font-display font-semibold text-white text-sm">AI Smart Input</h2>
          <span className="badge bg-violet-500/15 text-violet-400 border border-violet-500/20 text-xs ml-auto">
            Powered by Smart Parser
          </span>
        </div>
        <p className="text-white/30 text-xs font-body mb-4">Describe your task naturally — AI extracts the details</p>

        {/* Example chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {EXAMPLE_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => setNaturalInput(p)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-white/40 hover:bg-violet-500/15 hover:text-violet-300 border border-white/5 hover:border-violet-500/30 transition-all font-body truncate max-w-[200px]"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              placeholder="e.g. Remind me to submit report tomorrow at 5 PM..."
              rows={2}
              className="cosmic-input w-full resize-none pr-4"
            />
          </div>
          <button
            type="button"
            onClick={isListening ? stopVoice : startVoice}
            className={`flex-shrink-0 w-12 rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? "bg-red-500/20 border border-red-500/40 text-red-400 animate-pulse"
                : "bg-white/5 border border-white/10 text-white/30 hover:text-white hover:bg-white/10"
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>

        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mt-3"
          >
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i} className="w-1 rounded-full bg-red-400" style={{ height: "16px", animation: `pulse 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
              ))}
            </div>
            <span className="text-red-400 text-xs font-body">Listening... speak now</span>
          </motion.div>
        )}

        <button
          type="button"
          onClick={parseNLP}
          disabled={!naturalInput.trim() || isParsing}
          className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
        >
          {isParsing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Parsing...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Parse with AI</>
          )}
        </button>

        {nlpDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-xl text-xs font-body flex items-center gap-2"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-emerald-400">AI extracted task details — review and save below</span>
          </motion.div>
        )}
      </motion.div>

      {/* Task Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-6 space-y-5"
      >
        <h2 className="font-display font-semibold text-white text-sm">Task Details</h2>

        {/* Title */}
        <div>
          <label className="block text-xs text-white/30 uppercase tracking-widest font-display mb-2">
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="cosmic-input w-full"
            placeholder="What do you need to do?"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-white/30 uppercase tracking-widest font-display mb-2">
              <Tag className="inline w-3 h-3 mr-1" />Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c} type="button"
                  onClick={() => setCategory(c)}
                  className={`px-2 py-2 rounded-xl text-xs font-body font-medium transition-all border ${
                    category === c
                      ? `badge-${c.toLowerCase()} border-current`
                      : "bg-white/3 border-white/5 text-white/30 hover:bg-white/8"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/30 uppercase tracking-widest font-display mb-2">
              <AlertCircle className="inline w-3 h-3 mr-1" />Priority
            </label>
            <div className="space-y-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value} type="button"
                  onClick={() => setPriority(p.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-body font-medium text-left transition-all border flex items-center gap-2 ${
                    priority === p.value ? `${p.bg} ${p.color}` : "bg-white/3 border-white/5 text-white/30 hover:bg-white/8"
                  }`}
                >
                  <div className={`priority-dot-${p.value.toLowerCase()}`} />
                  {p.value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scheduled time */}
        <div>
          <label className="block text-xs text-white/30 uppercase tracking-widest font-display mb-2">
            <Calendar className="inline w-3 h-3 mr-1" />Schedule (Optional)
          </label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="cosmic-input w-full"
          />
          {scheduledTime && (
            <p className="text-violet-400 text-xs mt-1.5 font-body">
              📧 Email reminder will be sent 5 minutes before
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><Send className="w-4 h-4" /> Create Task <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
      </motion.form>
    </div>
  );
}
