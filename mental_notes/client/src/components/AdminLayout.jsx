import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api/client.js";

const navItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/queue", label: "Review queue" },
  { to: "/admin/people", label: "Accounts", adminOnly: true },
  { to: "/admin/consults", label: "Consult requests", adminOnly: true },
  { to: "/admin/audit", label: "Activity log", adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  async function signOut() {
    setError("");
    try {
      await logout();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-line bg-paper md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-4 px-5 py-5 md:block md:px-6 md:py-7">
          <div>
            <p className="font-serif text-2xl font-semibold text-brand-dark">
              Mental Notes
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-muted">
              {user?.role === "admin" ? "Administrator" : "Moderator"}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-page md:mt-6"
          >
            Log out
          </button>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:block md:space-y-1 md:px-3">
          {navItems
            .filter((item) => !item.adminOnly || user?.role === "admin")
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                `block whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive
                      ? "bg-brand text-white"
                      : "text-muted hover:bg-page hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="hidden border-t border-line px-6 py-5 text-sm md:block">
          <p className="font-medium text-ink">{user?.name}</p>
          <p className="mt-1 truncate text-muted">{user?.email}</p>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-9">
        {error && (
          <p role="alert" className="mb-5 rounded-lg bg-risk-soft px-4 py-3 text-risk">
            {error}
          </p>
        )}
        <div className="mx-auto max-w-screen-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
