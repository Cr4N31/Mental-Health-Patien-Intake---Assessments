import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="p-8 text-muted">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "user") return <Navigate to="/pending" replace />;
  if (!["admin", "moderator"].includes(user.role) || !user.staffSession) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
