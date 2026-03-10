import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444", High: "#f97316", Medium: "#a78bfa", Low: "#34d399",
};

export default function CalendarPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const navigate = useNavigate();
  const year = date.getFullYear();
  const month = date.getMonth();

  useEffect(() => {
    api.get(`/tasks/calendar?year=${year}&month=${month + 1}`).then((r) => setTasks(r.data));
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  const getTasksForDay = (day: number) =>
    tasks.filter((t) => {
      if (!t.scheduled_time) return false;
      const d = new Date(t.scheduled_time);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

  const selectedTasks = selected ? getTasksForDay(selected.getDate()) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" /> Calendar
        </h1>
        <button onClick={() => navigate("/add-task")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.35)" }}>
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setDate(new Date(year, month - 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-display font-bold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={() => setDate(new Date(year, month + 1))}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-white/20 text-xs font-display py-2">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {[...Array(firstDay)].map((_, i) => <div key={`e${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dayTasks = getTasksForDay(day);
              const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const isSelected = selected?.getDate() === day && selected.getMonth() === month;

              return (
                <motion.button key={day}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(new Date(year, month, day))}
                  className="aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 transition-all"
                  style={{
                    background: isSelected ? "rgba(124,58,237,0.25)" : isToday ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.03)",
                    border: isSelected ? "1px solid rgba(124,58,237,0.5)" : isToday ? "1px solid rgba(6,182,212,0.3)" : "1px solid rgba(255,255,255,0.04)"
                  }}>
                  <span className={`text-xs font-display font-medium ${isToday ? "text-cyan-400" : isSelected ? "text-white" : "text-white/50"}`}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1 justify-center flex-wrap px-0.5">
                      {dayTasks.slice(0, 3).map((t, ti) => (
                        <div key={ti} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: PRIORITY_COLORS[t.priority] || "#a78bfa" }} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected day panel */}
        <div className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-white/30 text-xs uppercase tracking-widest font-display mb-4">
            {selected ? `${MONTHS[selected.getMonth()]} ${selected.getDate()}` : "Select a day"}
          </p>

          {!selected ? (
            <p className="text-white/20 text-sm text-center py-8 font-body">Click any day to see tasks</p>
          ) : selectedTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-white/20 text-sm font-body">No tasks scheduled</p>
              <button onClick={() => navigate("/add-task")}
                className="mt-3 text-violet-400 text-xs hover:text-violet-300 transition-colors font-body">
                + Schedule a task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((task, i) => (
                <motion.div key={task.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${PRIORITY_COLORS[task.priority]}25`
                  }}>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: PRIORITY_COLORS[task.priority] }} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-body font-medium ${task.completed ? "line-through text-white/25" : "text-white"}`}>
                        {task.title}
                      </p>
                      <p className="text-white/25 text-xs mt-0.5 font-mono">
                        {new Date(task.scheduled_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {task.completed && <span className="text-emerald-400 text-xs">✓</span>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}