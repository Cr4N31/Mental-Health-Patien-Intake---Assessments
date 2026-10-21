import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/client/Landing.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/RegisterPage.jsx";
import Dashboard from "./pages/client/Dashboard.jsx";
import TakeAssessment from "./pages/client/TakeAssessment.jsx";
import Result from "./pages/client/Result.jsx";
import History from "./pages/client/History.jsx";
import Settings from "./pages/client/Settings.jsx";
import ForgotPassword from "./pages/auth/ForgetPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import VerifyEmail from "./components/VerifyEmail.jsx";

// "/" shows the landing page to visitors and the dashboard to logged-in users.
function Home() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-muted">Loading...</p>;
  return user ? <Dashboard /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/assess/:type"
          element={
            <ProtectedRoute>
              <TakeAssessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:id"
          element={
            <ProtectedRoute>
              <Result />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
