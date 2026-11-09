import api from "./client.js";

const adminApi = {
  queue: () => api.get("/admin/queue").then((res) => res.data),
  approve: (kind, id) => api.post(`/admin/${kind}s/${id}/approve`).then((res) => res.data),
  remove: (kind, id) => api.delete(`/admin/${kind}s/${id}`).then((res) => res.data),
  stats: () => api.get("/admin/stats").then((res) => res.data),
  consults: () => api.get("/admin/consults").then((res) => res.data),
  audit: () => api.get("/admin/audit").then((res) => res.data),
  analytics: (range) =>
    api.get("/admin/analytics", { params: { range } }).then((res) => res.data),
  users: () => api.get("/admin/users").then((res) => res.data),
  people: (query) =>
    api
      .get("/admin/users", { params: query ? { q: query } : undefined })
      .then((res) => res.data),
  setRole: (id, role, password) =>
    api.patch(`/admin/users/${id}/role`, { role, password }).then((res) => res.data),
};

export default adminApi;
