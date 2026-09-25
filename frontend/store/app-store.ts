"use client";

import { create } from "zustand";
import type { ConversationDetail, ConversationSummary, Message, User } from "@/types";

type TypingMap = Record<number, Record<number, boolean>>;

type AppState = {
  user: User | null;
  conversations: ConversationSummary[];
  activeConversationId: number | null;
  conversationDetail: ConversationDetail | null;
  messages: Record<number, Message[]>;
  typing: TypingMap;
  replyTo: Message | null;
  theme: "dark" | "light";
  chatColor: string;
  setUser: (u: User | null) => void;
  setConversations: (c: ConversationSummary[]) => void;
  setActiveConversation: (id: number | null) => void;
  setConversationDetail: (d: ConversationDetail | null) => void;
  setMessages: (conversationId: number, msgs: Message[]) => void;
  appendMessage: (msg: Message) => void;
  updateMessage: (msg: Message) => void;
  patchMessageStatus: (messageId: number, status: string) => void;
  patchReactions: (messageId: number, reactions: Message["reactions"]) => void;
  setTyping: (conversationId: number, userId: number, isTyping: boolean) => void;
  setReplyTo: (msg: Message | null) => void;
  patchPresence: (user: User) => void;
  markConversationRead: (conversationId: number) => void;
  setTheme: (t: "dark" | "light") => void;
  setChatColor: (color: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  user: null,
  conversations: [],
  activeConversationId: null,
  conversationDetail: null,
  messages: {},
  typing: {},
  replyTo: null,
  theme: "dark",
  chatColor: "#2c6bed",
  setUser: (user) => set({ user }),
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (activeConversationId) => set({ activeConversationId }),
  setConversationDetail: (conversationDetail) => set({ conversationDetail }),
  setTheme: (theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("signal_theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
    set({ theme });
  },
  setChatColor: (chatColor) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("signal_chat_color", chatColor);
      document.documentElement.style.setProperty("--bubble-out", chatColor);
    }
    set({ chatColor });
  },
  setMessages: (conversationId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: msgs } })),
  appendMessage: (msg) =>
    set((s) => {
      const list = s.messages[msg.conversation_id] ?? [];
      if (list.some((m) => m.id === msg.id || (msg.client_id && m.client_id === msg.client_id))) {
        return s;
      }
      const isCurrentActive = s.activeConversationId === msg.conversation_id;
      const isFromMe = s.user && msg.sender_id === s.user.id;
      const updatedConversations = s.conversations.map((c) => {
        if (c.id !== msg.conversation_id) return c;
        return {
          ...c,
          last_message: msg,
          updated_at: msg.created_at,
          unread_count: isCurrentActive || isFromMe ? c.unread_count : c.unread_count + 1,
        };
      });
      updatedConversations.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      return {
        messages: { ...s.messages, [msg.conversation_id]: [...list, msg] },
        conversations: updatedConversations,
      };
    }),
  markConversationRead: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    })),
  updateMessage: (msg) =>
    set((s) => {
      const list = s.messages[msg.conversation_id] ?? [];
      const nextConversations = s.conversations.map((c) => {
        if (c.id === msg.conversation_id && c.last_message?.id === msg.id) {
          return { ...c, last_message: msg };
        }
        return c;
      });
      return {
        conversations: nextConversations,
        messages: {
          ...s.messages,
          [msg.conversation_id]: list.map((m) =>
            m.id === msg.id || (msg.client_id && m.client_id === msg.client_id) ? msg : m
          ),
        },
      };
    }),
  patchMessageStatus: (messageId, status) =>
    set((s) => {
      const next = { ...s.messages };
      for (const cid of Object.keys(next)) {
        next[Number(cid)] = next[Number(cid)].map((m) =>
          m.id === messageId ? { ...m, sender_status: status } : m
        );
      }
      return { messages: next };
    }),
  patchReactions: (messageId, reactions) =>
    set((s) => {
      const next = { ...s.messages };
      for (const cid of Object.keys(next)) {
        next[Number(cid)] = next[Number(cid)].map((m) =>
          m.id === messageId ? { ...m, reactions } : m
        );
      }
      return { messages: next };
    }),
  setTyping: (conversationId, userId, isTyping) =>
    set((s) => ({
      typing: {
        ...s.typing,
        [conversationId]: { ...(s.typing[conversationId] ?? {}), [userId]: isTyping },
      },
    })),
  setReplyTo: (replyTo) => set({ replyTo }),
  patchPresence: (user) =>
    set((s) => ({
      conversations: s.conversations.map((c) => ({
        ...c,
        members: c.members.map((m) => (m.id === user.id ? user : m)),
      })),
      conversationDetail: s.conversationDetail
        ? {
            ...s.conversationDetail,
            members: s.conversationDetail.members.map((m) =>
              m.user.id === user.id ? { ...m, user } : m
            ),
          }
        : null,
    })),
}));
