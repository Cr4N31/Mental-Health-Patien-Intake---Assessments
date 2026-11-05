import api from "./client";
import type { Role } from "../auth/AuthContext";

export type QueueItem = {
  _id: string;
  body: string;
  status: "held" | "hidden";
  postId?: string;
  authorKey: string;
  reportCount: number;
  reasons: string[];
  createdAt: string;
};
export type Queue = { posts: QueueItem[]; comments: QueueItem[] };
export type Counts = Record<string, number>;
export type Stats = {
  users: { total: number; last7Days: number };
  posts: Counts;
  comments: Counts;
  consults: Counts;
  needsReview: number;
};
export type AnalyticsRange = "1h" | "5h" | "24h" | "3m" | "12m";
export type AnalyticsBucket = {
  date: string;
  signups: number;
  logins: number;
  activity: number;
  approved: number;
  deleted: number;
  consultPending: number;
  consultAccepted: number;
  consultDeclined: number;
  consultCancelled: number;
};
export type Analytics = {
  range: AnalyticsRange;
  buckets: AnalyticsBucket[];
};
export type RegisteredAccount = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};
export type ConsultRow = {
  _id: string;
  professional: string;
  status: string;
  preferredTime: string;
  createdAt: string;
};
export type AuditRow = {
  _id: string;
  admin: string;
  action: "approve" | "delete" | "role_change";
  targetType: "post" | "comment" | "user";
  note?: string;
  createdAt: string;
};
export type Kind = "post" | "comment";

export type Person = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export const adminApi = {
  queue: () => api.get<Queue>("/admin/queue").then((r) => r.data),
  approve: (kind: Kind, id: string) =>
    api.post(`/admin/${kind}s/${id}/approve`).then((r) => r.data),
  remove: (kind: Kind, id: string) =>
    api.delete(`/admin/${kind}s/${id}`).then((r) => r.data),
  stats: () => api.get<Stats>("/admin/stats").then((r) => r.data),
  consults: () => api.get<ConsultRow[]>("/admin/consults").then((r) => r.data),
  audit: () => api.get<AuditRow[]>("/admin/audit").then((r) => r.data),
  analytics: (range: AnalyticsRange) =>
    api
      .get<Analytics>("/admin/analytics", { params: { range } })
      .then((r) => r.data),
  users: () => api.get<RegisteredAccount[]>("/admin/users").then((r) => r.data),

  people: (q: string) =>
    api
      .get<Person[]>("/admin/users", { params: q ? { q } : undefined })
      .then((r) => r.data),
  setRole: (id: string, role: Role, password: string) =>
    api
      .patch(`/admin/users/${id}/role`, { role, password })
      .then((r) => r.data),
};
