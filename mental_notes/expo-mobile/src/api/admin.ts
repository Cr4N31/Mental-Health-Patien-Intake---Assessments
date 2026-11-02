import api from "./client";

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
  action: "approve" | "delete";
  targetType: "post" | "comment";
  createdAt: string;
};
export type Kind = "post" | "comment";

export const adminApi = {
  queue: () => api.get<Queue>("/admin/queue").then((r) => r.data),
  approve: (kind: Kind, id: string) =>
    api.post(`/admin/${kind}s/${id}/approve`).then((r) => r.data),
  remove: (kind: Kind, id: string) =>
    api.delete(`/admin/${kind}s/${id}`).then((r) => r.data),
  stats: () => api.get<Stats>("/admin/stats").then((r) => r.data),
  consults: () => api.get<ConsultRow[]>("/admin/consults").then((r) => r.data),
  audit: () => api.get<AuditRow[]>("/admin/audit").then((r) => r.data),
};
