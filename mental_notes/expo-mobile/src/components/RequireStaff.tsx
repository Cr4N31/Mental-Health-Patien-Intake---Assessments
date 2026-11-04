import { Redirect } from "expo-router";
import { useAuth } from "../auth/AuthContext";

export function RequireStaff({
  children,
  adminOnly,
}: React.PropsWithChildren<{ adminOnly?: boolean }>) {
  const { user } = useAuth();
  const ok =
    user?.role === "admin" || (!adminOnly && user?.role === "moderator");
  if (!ok) return <Redirect href="/screens/home" />;
  if (!user?.staffSession) return <Redirect href={"/auth/staff" as never} />;
  return children;
}
