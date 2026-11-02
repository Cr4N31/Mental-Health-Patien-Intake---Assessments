import { Redirect } from "expo-router";
import { useAuth } from "../auth/AuthContext";

// Wrap inside RequireAuth. The server enforces roles too; this only hides screens.
export function RequireStaff({
  children,
  adminOnly,
}: React.PropsWithChildren<{ adminOnly?: boolean }>) {
  const { user } = useAuth();
  const ok =
    user?.role === "admin" || (!adminOnly && user?.role === "moderator");
  if (!ok) return <Redirect href="/screens/home" />;
  return children;
}
