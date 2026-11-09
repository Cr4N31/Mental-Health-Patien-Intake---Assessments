import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import api, { errorMessage, SESSION_KEY } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const expireSession = () => setUser(null);
    window.addEventListener("auth:session-expired", expireSession);

    api
      .get("/auth/me")
      .then((res) => {
        setAuthError("");
        setUser(res.data);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setUser(null);
          return;
        }
        setAuthError(errorMessage(err));
      })
      .finally(() => setLoading(false));
    return () => window.removeEventListener("auth:session-expired", expireSession);
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError("");
    let response;
    try {
      response = await api.post("/auth/staff/session", { email, password });
    } catch (err) {
      if (err.response?.status !== 401) throw err;
      response = await api.post("/auth/mobile/session", { email, password });
    }

    window.localStorage.setItem(SESSION_KEY, response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const register = useCallback(async (data) => {
    setAuthError("");
    const res = await api.post("/auth/mobile/register", data);
    window.localStorage.setItem(SESSION_KEY, res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
    await api.post("/auth/logout");
  }, []);

  const refreshUser = useCallback(async () => {
    const res = await api.get("/auth/me");
    setUser(res.data);
    return res.data;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
