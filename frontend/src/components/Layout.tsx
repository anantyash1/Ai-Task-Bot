import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CheckSquare, Plus, BarChart2, Zap,
  LogOut, Menu, X, User, Bell
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "text-violet-400" },
  { path: "/tasks", icon: CheckSquare, label: "My Tasks", color: "text-cyan-400" },
  { path: "/add-task", icon: Plus, label: "Add Task", color: "text-emerald-400" },
  { path: "/analytics", icon: BarChart2, label: "Analytics", color: "text-pink-400" },
];

function SidebarNav({ onClose }: { onClose?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full py-6">
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow-violet"
               style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            <Zap className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-none">AI Task Bot</p>
            <p className="text-white/30 text-xs mt-0.5">Mission Control</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <div className="px-4 mb-6">
        <div className="glass-card rounded-2xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
               style={{ background: "linear-gradient(135deg, #ec4899, #7c3aed)" }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate leading-tight">{user?.name}</p>
            <p className="text-white/30 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1">
        <p className="text-white/20 text-xs uppercase tracking-widest px-3 mb-3 font-display">Navigation</p>
        {NAV.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                active ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.2), rgba(79,70,229,0.05))", border: "1px solid rgba(124,58,237,0.3)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={`w-4 h-4 relative z-10 ${active ? item.color : ""}`} />
              <span className="relative z-10 text-sm font-body font-medium">{item.label}</span>
              {active && <div className={`ml-auto w-1.5 h-1.5 rounded-full relative z-10 ${item.color.replace("text-", "bg-")}`} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-4 mt-6 space-y-1">
        <div className="h-px bg-white/5 mb-4" />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 text-sm font-body"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const pageTitle = NAV.find(n => n.path === location.pathname)?.label || "Dashboard";

  return (
    <div className="flex h-screen bg-cosmic-950 overflow-hidden relative">
      <div className="orb orb-1" style={{ opacity: 0.08 }} />
      <div className="orb orb-2" style={{ opacity: 0.08 }} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-cosmic-900 relative z-10 flex-shrink-0">
        <SidebarNav />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 bg-cosmic-900 border-r border-white/5 z-50 lg:hidden"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarNav onClose={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 lg:px-8 py-4 border-b border-white/5 bg-cosmic-900/50 backdrop-blur flex-shrink-0">
          <button onClick={() => setOpen(true)} className="lg:hidden w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:text-white">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-white text-base">{pageTitle}</h2>
            <p className="text-white/30 text-xs font-body hidden sm:block">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/add-task" className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
              <Plus className="w-4 h-4" /> New Task
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}