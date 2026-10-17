import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export const errorMessage = (err) =>
  err.response?.data?.message || "Something went wrong. Please try again.";

export default api;
