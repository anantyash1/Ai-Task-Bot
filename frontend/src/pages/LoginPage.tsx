import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { icon: "🧠", text: "AI understands natural language" },
  { icon: "⏰", text: "Smart reminders via email" },
  { icon: "📊", text: "Beautiful analytics dashboard" },
  { icon: "🎙️", text: "Voice input support" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-950 flex overflow-hidden relative">
      {/* Aurora orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-aurora-1 flex items-center justify-center shadow-glow-violet">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">AI Task Bot</span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="font-display font-extrabold text-5xl text-white leading-tight">
              Your tasks,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                intelligently
              </span>
              <br />managed.
            </h1>
            <p className="text-white/50 mt-4 text-lg font-body leading-relaxed">
              Just type naturally. AI handles the rest — scheduling, reminders, and analytics.
            </p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 glass-card rounded-xl px-4 py-3"
              >
                <span className="text-xl">{f.icon}</span>
                <span className="text-white/70 text-sm font-body">{f.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs font-body">
          © 2024 AI Task Bot · Built with FastAPI + React
        </p>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-aurora-1 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">AI Task Bot</span>
          </div>

          <div className="glass-card rounded-3xl p-8">
            <h2 className="font-display font-bold text-2xl text-white mb-1">Welcome back</h2>
            <p className="text-white/40 text-sm font-body mb-8">Sign in to your mission control</p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-6 font-body"
              >
                ⚠️ {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="cosmic-input pl-11"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="cosmic-input pl-11 pr-12"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center">
              <p className="text-white/30 text-sm font-body">
                New here?{" "}
                <Link to="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}