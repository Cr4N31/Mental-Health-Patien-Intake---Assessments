import api from "./client";
import type { SafetyLevel } from "./reflection";

export type ResonancePost = {
  _id: string;
  body: string;
  pseudonym: string;
  isMine: boolean;
  reactionCount: number;
  reacted: boolean;
  commentCount: number;
  createdAt: string;
};

export type ResonanceComment = {
  _id: string;
  body: string;
  pseudonym: string;
  isMine: boolean;
  isOP: boolean;
  createdAt: string;
};

export type PostsPage = { posts: ResonancePost[]; nextCursor?: string };

// held:true means the text was not published (high risk). Show the support card only.
export type CreatePostResult = {
  post?: ResonancePost;
  held?: boolean;
  safety: SafetyLevel;
};
export type CreateCommentResult = {
  comment?: ResonanceComment;
  held?: boolean;
  safety: SafetyLevel;
};

export const resonanceApi = {
  feed: (cursor?: string) =>
    api
      .get<PostsPage>("/resonance/posts", {
        params: cursor ? { cursor } : undefined,
      })
      .then((res) => res.data),
  get: (id: string) =>
    api.get<ResonancePost>(`/resonance/posts/${id}`).then((res) => res.data),
  create: (body: string) =>
    api
      .post<CreatePostResult>("/resonance/posts", { body })
      .then((res) => res.data),
  remove: (id: string) =>
    api.delete(`/resonance/posts/${id}`).then((res) => res.data),
  react: (id: string) =>
    api
      .post<{
        reacted: boolean;
        reactionCount: number;
      }>(`/resonance/posts/${id}/react`)
      .then((res) => res.data),
  comments: (id: string) =>
    api
      .get<ResonanceComment[]>(`/resonance/posts/${id}/comments`)
      .then((res) => res.data),
  addComment: (id: string, body: string) =>
    api
      .post<CreateCommentResult>(`/resonance/posts/${id}/comments`, { body })
      .then((res) => res.data),
  removeComment: (id: string) =>
    api.delete(`/resonance/comments/${id}`).then((res) => res.data),
  reportPost: (id: string, reason = "") =>
    api
      .post(`/resonance/posts/${id}/report`, { reason })
      .then((res) => res.data),
  reportComment: (id: string, reason = "") =>
    api
      .post(`/resonance/comments/${id}/report`, { reason })
      .then((res) => res.data),
};
