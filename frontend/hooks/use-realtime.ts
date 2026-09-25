"use client";

import { useEffect } from "react";
import { wsClient } from "@/lib/ws-client";
import { useAppStore } from "@/store/app-store";
import type { Message, User } from "@/types";

export function useRealtime(activeConversationId: number | null) {
  const appendMessage = useAppStore((s) => s.appendMessage);
  const updateMessage = useAppStore((s) => s.updateMessage);
  const patchMessageStatus = useAppStore((s) => s.patchMessageStatus);
  const patchReactions = useAppStore((s) => s.patchReactions);
  const setTyping = useAppStore((s) => s.setTyping);
  const patchPresence = useAppStore((s) => s.patchPresence);
  const user = useAppStore((s) => s.user);

  const markConversationRead = useAppStore((s) => s.markConversationRead);
  const setConversationDetail = useAppStore((s) => s.setConversationDetail);
  const setConversations = useAppStore((s) => s.setConversations);
  const conversations = useAppStore((s) => s.conversations);

  useEffect(() => {
    wsClient.connect();
    const ping = setInterval(() => wsClient.send("presence.ping", {}), 30000);
    return () => {
      clearInterval(ping);
    };
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      wsClient.send("subscribe", { conversation_id: activeConversationId });
      return () => wsClient.send("unsubscribe", { conversation_id: activeConversationId });
    }
  }, [activeConversationId]);

  useEffect(() => {
    return wsClient.subscribe((event) => {
      if (event.type === "message.new") {
        const msg = event.payload as unknown as Message;
        appendMessage(msg);
        if (user && msg.sender_id !== user.id) {
          wsClient.send("message.delivered", { message_id: msg.id });
          if (activeConversationId === msg.conversation_id) {
            wsClient.send("message.read", {
              conversation_id: activeConversationId,
              message_id: msg.id,
            });
            markConversationRead(activeConversationId);
          }
        }
        if (!conversations.some((c) => c.id === msg.conversation_id)) {
          import("@/lib/api").then(({ api }) => {
            api.conversations().then(setConversations).catch(() => {});
          });
        }
      }
      if (event.type === "message.status") {
        const { message_id, status } = event.payload as { message_id: number; status: string };
        patchMessageStatus(message_id, status);
      }
      if (event.type === "typing") {
        const { conversation_id, user_id, is_typing } = event.payload as {
          conversation_id: number;
          user_id: number;
          is_typing: boolean;
        };
        setTyping(conversation_id, user_id, is_typing);
      }
      if (event.type === "reaction.updated") {
        const { message_id, reactions } = event.payload as {
          message_id: number;
          reactions: Message["reactions"];
        };
        patchReactions(message_id, reactions);
      }
      if (event.type === "member.updated") {
        const detail = event.payload as unknown as import("@/types").ConversationDetail;
        if (detail && detail.id === activeConversationId) {
          setConversationDetail(detail);
        }
        import("@/lib/api").then(({ api }) => {
          api.conversations().then(setConversations).catch(() => {});
        });
      }
      if (event.type === "presence.updated") {
        patchPresence(event.payload as unknown as User);
      }
    });
  }, [
    activeConversationId,
    appendMessage,
    conversations,
    markConversationRead,
    patchMessageStatus,
    patchPresence,
    patchReactions,
    setConversationDetail,
    setConversations,
    setTyping,
    updateMessage,
    user,
  ]);
}
