
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "./context/AuthContext";
// import Layout from "./components/Layout";
// import LoginPage from "./pages/LoginPage";
// import RegisterPage from "./pages/RegisterPage";
// import DashboardPage from "./pages/DashboardPage";
// import TasksPage from "./pages/TasksPage";
// import AddTaskPage from "./pages/AddTaskPage";
// import AnalyticsPage from "./pages/AnalyticsPage";

// function PrivateRoute({ children }: { children: React.ReactNode }) {
//   const { user, isLoading } = useAuth();
//   if (isLoading) return (
//     <div className="min-h-screen bg-cosmic-950 flex items-center justify-center">
//       <div className="spinner" />
//     </div>
//   );
//   return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
// }

// function PublicRoute({ children }: { children: React.ReactNode }) {
//   const { user, isLoading } = useAuth();
//   if (isLoading) return null;
//   return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
// }

// function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<Navigate to="/dashboard" replace />} />
//       <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
//       <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
//       <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
//       <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
//       <Route path="/add-task" element={<PrivateRoute><AddTaskPage /></PrivateRoute>} />
//       <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
//     </Routes>
//   );
// }

// export default function App() {
//   return (
//     <AuthProvider>
//       <BrowserRouter>
//         <AppRoutes />
//       </BrowserRouter>
//     </AuthProvider>
//   );
// }


import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import AddTaskPage from "./pages/AddTaskPage";
import AnalyticsPage from "./pages/AnalyticsPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
      <Route path="/add-task" element={<PrivateRoute><AddTaskPage /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter future={{ v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );

}
