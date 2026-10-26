import api from "./client";
import type { SafetyLevel } from "./reflection";

export type Professional = {
  _id: string;
  name: string;
  title: string;
  specializations: string[];
  languages: string[];
  bio: string;
  location: string;
  formats: string[];
  priceNote: string;
  availabilityNote: string;
  isSample: boolean;
};

export type ConsultStatus = "pending" | "accepted" | "declined" | "cancelled";

export type ConsultRequest = {
  _id: string;
  message: string;
  preferredTime: string;
  status: ConsultStatus;
  createdAt: string;
  professional: {
    _id: string;
    name: string;
    title: string;
    isSample: boolean;
  } | null;
};

export type Filters = { specializations: string[]; languages: string[] };
export type RequestInput = { message: string; preferredTime: string };

export const alliesApi = {
  list: (params?: { q?: string; specialization?: string; language?: string }) =>
    api.get<Professional[]>("/allies", { params }).then((res) => res.data),
  filters: () => api.get<Filters>("/allies/filters").then((res) => res.data),
  get: (id: string) =>
    api.get<Professional>(`/allies/${id}`).then((res) => res.data),
  request: (id: string, input: RequestInput) =>
    api
      .post<
        ConsultRequest & { safety?: SafetyLevel }
      >(`/allies/${id}/request`, input)
      .then((res) => res.data),
  mine: () =>
    api.get<ConsultRequest[]>("/allies/requests/mine").then((res) => res.data),
  cancel: (id: string) =>
    api
      .patch<ConsultRequest>(`/allies/requests/${id}/cancel`)
      .then((res) => res.data),
};
