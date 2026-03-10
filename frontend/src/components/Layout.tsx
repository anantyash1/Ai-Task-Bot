import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart2,
  Calendar,
  CheckSquare,
  Flame,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Plus,
  Settings,
  Target,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

type NavItem = {
  path: string;
  icon: any;
  label: string;
  color: string;
};

const NAV: NavItem[] = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "text-violet-400" },
  { path: "/tasks", icon: CheckSquare, label: "My Tasks", color: "text-cyan-400" },
  { path: "/add-task", icon: Plus, label: "Add Task", color: "text-emerald-400" },
  { path: "/calendar", icon: Calendar, label: "Calendar", color: "text-blue-400" },
  { path: "/goals", icon: Target, label: "Goals", color: "text-yellow-400" },
  { path: "/streak", icon: Flame, label: "Streak", color: "text-orange-400" },
  { path: "/focus", icon: Zap, label: "Focus", color: "text-purple-400" },
  { path: "/templates", icon: LayoutTemplate, label: "Templates", color: "text-teal-400" },
  { path: "/analytics", icon: BarChart2, label: "Analytics", color: "text-pink-400" },
  { path: "/activity", icon: Activity, label: "Activity", color: "text-indigo-400" },
  { path: "/settings", icon: Settings, label: "Settings", color: "text-slate-300" },
];

function SidebarNav({ onNavigate }: { onNavigate: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const activePath = location.pathname;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
          >
            <Zap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-white">TaskBot AI</p>
            <p className="text-xs text-white/50">Smart Workspace</p>
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#ec4899,#7c3aed)" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-white/60">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {NAV.map((item) => {
          const isActive = activePath === item.path || activePath.startsWith(`${item.path}/`);
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                onNavigate();
              }}
              className={`w-full rounded-xl px-3 py-2.5 text-left transition-all ${
                isActive
                  ? "border border-violet-500/40 bg-violet-500/20 text-white"
                  : "border border-transparent text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? item.color : "text-white/70"}`} />
                <span className="text-sm font-medium">{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => {
            logout();
            navigate("/login");
            onNavigate();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-300/80 transition-all hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const pageTitle = NAV.find((item) => item.path === location.pathname)?.label || "Workspace";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-cosmic-950">
      <aside className="hidden w-64 flex-shrink-0 border-r border-white/10 bg-cosmic-900 lg:flex">
        <SidebarNav onNavigate={() => {}} />
      </aside>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-white/10 bg-cosmic-900 lg:hidden"
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white/70 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex flex-shrink-0 items-center gap-3 border-b border-white/10 bg-cosmic-900/90 px-4 py-3 backdrop-blur lg:px-6">
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80 hover:text-white lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <h2 className="flex-1 truncate font-display text-sm font-bold text-white sm:text-base">{pageTitle}</h2>
          <Link
            to="/add-task"
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-white sm:flex"
            style={{
              background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
              boxShadow: "0 0 14px rgba(124,58,237,0.35)",
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Task
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-5 lg:p-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
