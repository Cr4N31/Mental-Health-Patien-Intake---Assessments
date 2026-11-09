import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/RegisterPage.jsx";
import ForgotPassword from "./pages/auth/ForgetPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import VerifyEmail from "./components/VerifyEmail.jsx";
import PendingAccess from "./pages/auth/PendingAccess.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import QueuePage from "./pages/admin/QueuePage.jsx";
import PeoplePage from "./pages/admin/PeoplePage.jsx";
import ConsultsPage from "./pages/admin/ConsultsPage.jsx";
import AuditPage from "./pages/admin/AuditPage.jsx";

function Home() {
  const { user, loading, authError } = useAuth();
  if (loading) return <p className="p-8 text-muted">Loading...</p>;
  if (authError) {
    return <p role="alert" className="p-8 text-risk">{authError}</p>;
  }
  if (!user) return <Login />;
  if (user.role === "user") return <Navigate to="/pending" replace />;
  if (user.staffSession) return <Navigate to="/admin" replace />;
  return <Navigate to="/login" replace />;
}

function AdminRoute({ children, adminOnly = false }) {
  return (
    <ProtectedRoute adminOnly={adminOnly}>
      {children}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending" element={<PendingAccess />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="queue" element={<QueuePage />} />
          <Route
            path="people"
            element={
              <AdminRoute adminOnly>
                <PeoplePage />
              </AdminRoute>
            }
          />
          <Route
            path="consults"
            element={
              <AdminRoute adminOnly>
                <ConsultsPage />
              </AdminRoute>
            }
          />
          <Route
            path="audit"
            element={
              <AdminRoute adminOnly>
                <AuditPage />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
