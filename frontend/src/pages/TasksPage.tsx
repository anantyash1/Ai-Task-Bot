import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, Circle, Trash2, Clock, Filter, SlidersHorizontal } from "lucide-react";
import api from "../api/axios";

const PRIORITY_DOT: Record<string, string> = {
  High: "priority-dot-high", Medium: "priority-dot-medium", Low: "priority-dot-low",
};

function TaskCard({ task, onToggle, onDelete }: any) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    await onDelete(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25 }}
      className={`glass-card neon-border rounded-2xl p-4 group transition-all duration-300 ${task.completed ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id)}
          className="mt-0.5 flex-shrink-0 transition-transform active:scale-90"
        >
          {task.completed
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            : <Circle className="w-5 h-5 text-white/20 hover:text-violet-400 transition-colors" />
          }
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-body font-medium text-sm leading-snug ${task.completed ? "line-through text-white/30" : "text-white"}`}>
            {task.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className={`flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} />
            <span className={`badge badge-${task.priority.toLowerCase()}`}>{task.priority}</span>
            <span className={`badge badge-${task.category.toLowerCase()}`}>{task.category}</span>
            {task.scheduled_time && (
              <span className="flex items-center gap-1 text-xs text-white/25 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(task.scheduled_time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/0 group-hover:text-red-400/60 hover:!text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [completed, setCompleted] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchTasks = useCallback(async () => {
    const params: any = {};
    if (search) params.search = search;
    if (category) params.category = category;
    if (priority) params.priority = priority;
    if (completed !== "") params.completed = completed === "true";
    const res = await api.get("/tasks/", { params });
    setTasks(res.data);
    setLoading(false);
  }, [search, category, priority, completed]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, 300);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  const toggle = async (id: string) => {
    await api.patch(`/tasks/${id}/complete`);
    fetchTasks();
  };

  const remove = async (id: string) => {
    await api.delete(`/tasks/${id}`);
    setTasks((p) => p.filter((t) => t.id !== id));
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-white">All Tasks</h1>
          <p className="text-white/30 text-sm font-body mt-0.5">
            {completedCount}/{tasks.length} completed
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            showFilters
              ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
              : "border-white/10 text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {(category || priority || completed) && "•"}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="cosmic-input pl-11 w-full"
        />
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-2xl p-4 grid grid-cols-3 gap-3">
              <div>
                <label className="text-white/30 text-xs uppercase tracking-widest mb-2 block font-display">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="cosmic-input text-xs">
                  <option value="">All</option>
                  {["Work","Personal","Study","Other"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/30 text-xs uppercase tracking-widest mb-2 block font-display">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="cosmic-input text-xs">
                  <option value="">All</option>
                  {["High","Medium","Low"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-white/30 text-xs uppercase tracking-widest mb-2 block font-display">Status</label>
                <select value={completed} onChange={(e) => setCompleted(e.target.value)} className="cosmic-input text-xs">
                  <option value="">All</option>
                  <option value="false">Pending</option>
                  <option value="true">Done</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {tasks.length > 0 && (
        <div className="glass-card rounded-xl px-4 py-3">
          <div className="flex items-center justify-between text-xs text-white/30 mb-2 font-display">
            <span>Progress</span>
            <span>{Math.round((completedCount / tasks.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)" }}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="glass-card rounded-2xl text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-white/40 font-body">No tasks match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={toggle} onDelete={remove} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}