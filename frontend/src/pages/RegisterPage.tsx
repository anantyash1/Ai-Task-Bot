import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const STEPS = ["Create Account", "Start Tasking", "Achieve More"];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-3xl shadow-glow-violet mb-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            <Zap className="w-7 h-7 text-white" />
          </motion.div>
          <h1 className="font-display font-extrabold text-3xl text-white">Start your journey</h1>
          <p className="text-white/40 mt-2 font-body text-sm">It's free. No credit card needed.</p>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${i === 0 ? "text-violet-400" : "text-white/20"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${i === 0 ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-white/20"}`}>
                    {i + 1}
                  </div>
                  <span className="hidden sm:block">{step}</span>
                </div>
                {i < 2 && <div className="w-8 h-px bg-white/10" />}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8">
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
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="cosmic-input pl-11"
                  placeholder="Alex Johnson"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-widest mb-2">
                Email
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="cosmic-input pl-11"
                  placeholder="Min. 6 characters"
                />
              </div>
              {password.length >= 6 && (
                <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Strong enough
                </p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Create Free Account</span> <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          <p className="text-white/20 text-xs text-center mt-5 font-body">
            By signing up, you agree to our Terms & Privacy Policy
          </p>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/30 text-sm font-body">
              Already have an account?{" "}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}