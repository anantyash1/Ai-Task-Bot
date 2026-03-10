import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import ActivityPage from "./pages/ActivityPage";
import AddTaskPage from "./pages/AddTaskPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import FocusPage from "./pages/FocusPage";
import GoalsPage from "./pages/Goalspage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import StreakPage from "./pages/Streakpage";
import TasksPage from "./pages/TasksPage";
import SmartInsights from "./components/SmartInsights";

import TemplatesPage from "./pages/TemplatesPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
          <Route path="/add-task" element={<PrivateRoute><AddTaskPage /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><GoalsPage /></PrivateRoute>} />
          <Route path="/streak" element={<PrivateRoute><StreakPage /></PrivateRoute>} />
          <Route path="/focus" element={<PrivateRoute><FocusPage /></PrivateRoute>} />
          <Route path="/templates" element={<PrivateRoute><TemplatesPage /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
          <Route path="/activity" element={<PrivateRoute><ActivityPage /></PrivateRoute>} /> 
          <Route path="/smartinsights" element={<PrivateRoute><SmartInsights /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
