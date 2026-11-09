import axios from "axios";

export const SESSION_KEY = "mental-notes-session";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(SESSION_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (err) => {
    if (err.response?.status === 401) {
      window.localStorage.removeItem(SESSION_KEY);
      window.dispatchEvent(new Event("auth:session-expired"));
    }
    return Promise.reject(err);
  },
);

export const errorMessage = (err) =>
  err.response?.data?.message || "Something went wrong. Please try again.";

export default api;
