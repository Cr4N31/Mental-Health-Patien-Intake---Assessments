import { Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/RegisterPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TakeAssessment from "./pages/TakeAssessment.jsx";
import Result from "./pages/Result.jsx";
import History from "./pages/History.jsx";

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
        <Route path="/landing" element={<Landing />} />
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
