import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link
            to="/"
            className="font-serif text-xl font-semibold text-brand-dark"
          >
            Mental Notes
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted sm:inline">{user?.name}</span>
            <button
              onClick={logout}
              className="rounded-md border border-line px-3 py-1.5 font-medium hover:bg-page"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
