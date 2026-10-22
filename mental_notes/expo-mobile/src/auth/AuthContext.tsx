import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";
import * as SecureStore from "expo-secure-store";

export type User = { id: string; name: string; email: string; emailVerified: boolean };
type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; consent: true }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync("mental-notes-session").then((token) => {
      if (!token) return null;
      return api.get<User>("/auth/me").then((res) => setUser(res.data));
    }).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{ token: string; user: User }>("/auth/mobile/session", { email, password });
    await SecureStore.setItemAsync("mental-notes-session", response.data.token);
    setUser(response.data.user);
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; consent: true }) => {
    const response = await api.post<{ token: string; user: User }>("/auth/mobile/register", data);
    await SecureStore.setItemAsync("mental-notes-session", response.data.token);
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => undefined);
    await SecureStore.deleteItemAsync("mental-notes-session");
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
