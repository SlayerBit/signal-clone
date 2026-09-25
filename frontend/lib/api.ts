import { API_URL } from "./config";
import type {
  ConversationDetail,
  ConversationSummary,
  Message,
  User,
} from "@/types";

type ApiError = { detail?: string };

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const body = (await res.json()) as ApiError;
      if (body.detail) msg = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  me: () => request<User>("/api/auth/me"),
  loginStart: (identifier: string) =>
    request<{ pending_token: string; hint: string }>("/api/auth/login/start", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),
  loginOtp: (pending_token: string, otp: string) =>
    request<User>("/api/auth/login/verify-otp", {
      method: "POST",
      body: JSON.stringify({ pending_token, otp }),
    }),
  loginPassword: (identifier: string, password: string) =>
    request<User>("/api/auth/login/password", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    }),
  registerStart: (identifier: string) =>
    request<{ pending_token: string }>("/api/auth/register/start", {
      method: "POST",
      body: JSON.stringify({ identifier }),
    }),
  registerOtp: (pending_token: string, otp: string) =>
    request<{ setup_token: string }>("/api/auth/register/verify-otp", {
      method: "POST",
      body: JSON.stringify({ pending_token, otp }),
    }),
  registerComplete: (setup_token: string, display_name: string, avatar_color?: string) =>
    request<User>("/api/auth/register/complete", {
      method: "POST",
      body: JSON.stringify({ setup_token, display_name, avatar_color }),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  conversations: (q?: string) =>
    request<ConversationSummary[]>(
      `/api/conversations${q ? `?q=${encodeURIComponent(q)}` : ""}`
    ),
  conversation: (id: number) => request<ConversationDetail>(`/api/conversations/${id}`),
  messages: (id: number, beforeId?: number) =>
    request<Message[]>(
      `/api/conversations/${id}/messages${beforeId ? `?before_id=${beforeId}` : ""}`
    ),
  sendMessage: (
    id: number,
    body: string,
    reply_to_id?: number | null,
    client_id?: string
  ) =>
    request<Message>(`/api/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body, reply_to_id, client_id }),
    }),
  markRead: (id: number, message_id?: number) =>
    request<{ updated: number }>(`/api/conversations/${id}/read`, {
      method: "POST",
      body: JSON.stringify({ message_id }),
    }),
  directChat: (user_id: number) =>
    request<{ id: number }>("/api/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ user_id }),
    }),
  createGroup: (title: string, member_ids: number[]) =>
    request<{ id: number }>("/api/conversations/group", {
      method: "POST",
      body: JSON.stringify({ title, member_ids }),
    }),
  addMember: (conversation_id: number, user_id: number) =>
    request<{ ok: boolean }>(`/api/conversations/${conversation_id}/members`, {
      method: "POST",
      body: JSON.stringify({ user_id }),
    }),
  removeMember: (conversation_id: number, user_id: number) =>
    request<{ ok: boolean }>(
      `/api/conversations/${conversation_id}/members/${user_id}`,
      { method: "DELETE" }
    ),
  contacts: () => request<User[]>("/api/contacts"),
  searchUsers: (q: string) =>
    request<User[]>(`/api/users/search?q=${encodeURIComponent(q)}`),
  addContact: (usernameOrId: string | number) =>
    request<User>("/api/contacts", {
      method: "POST",
      body: JSON.stringify(
        typeof usernameOrId === "number"
          ? { user_id: usernameOrId }
          : { username: usernameOrId }
      ),
    }),
  react: (conversation_id: number, message_id: number, emoji: string) =>
    request<Message["reactions"]>(
      `/api/conversations/${conversation_id}/messages/${message_id}/reactions`,
      { method: "POST", body: JSON.stringify({ emoji }) }
    ),
  removeReaction: (conversation_id: number, message_id: number) =>
    request<Message["reactions"]>(
      `/api/conversations/${conversation_id}/messages/${message_id}/reactions`,
      { method: "DELETE" }
    ),
};
