"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { wsClient } from "@/lib/ws-client";
import { useAppStore } from "@/store/app-store";
import type { ConversationDetail, Message, User } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { ChatHeader } from "./ChatHeader";
import { ChatSearchOverlay } from "./ChatSearchOverlay";
import { MessageComposer } from "./MessageComposer";
import { GroupMembersDrawer } from "./GroupMembersDrawer";
import { CallModalInfo, CallScopeModal } from "./CallScopeModal";

function typingLabel(ids: number[], members: User[], meId: number) {
  const names = ids
    .filter((id) => id !== meId)
    .map((id) => members.find((m) => m.id === id)?.display_name)
    .filter(Boolean);
  if (!names.length) return null;
  if (names.length === 1) return `${names[0]} is typing…`;
  return `${names.join(", ")} are typing…`;
}

const EMPTY_MESSAGES: Message[] = [];
const EMPTY_TYPING: Record<number, boolean> = {};

export function ChatPane({
  conversationId,
  detail,
  me,
}: {
  conversationId: number;
  detail: ConversationDetail;
  me: User;
}) {
  const { error: toastError } = useToast();
  const messages = useAppStore((s) => s.messages[conversationId] ?? EMPTY_MESSAGES);
  const replyTo = useAppStore((s) => s.replyTo);
  const setReplyTo = useAppStore((s) => s.setReplyTo);
  const setMessages = useAppStore((s) => s.setMessages);
  const appendMessage = useAppStore((s) => s.appendMessage);
  const updateMessage = useAppStore((s) => s.updateMessage);
  const typingMap = useAppStore((s) => s.typing[conversationId] ?? EMPTY_TYPING);
  const storeDetail = useAppStore((s) => s.conversationDetail);
  const setConversationDetail = useAppStore((s) => s.setConversationDetail);
  const markConversationRead = useAppStore((s) => s.markConversationRead);
  const activeDetail = storeDetail && storeDetail.id === conversationId ? storeDetail : detail;

  const [text, setText] = useState("");
  const [membersOpen, setMembersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [callModal, setCallModal] = useState<CallModalInfo | null>(null);

  // In-chat message search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const members = activeDetail.members.map((m) => m.user);
  const title =
    activeDetail.type === "group"
      ? activeDetail.title
      : members.find((m) => m.id !== me.id)?.display_name ?? activeDetail.title;
  const headerUser = members.find((m) => m.id !== me.id) ?? me;
  const typingIds = Object.entries(typingMap)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));

  const load = useCallback(async () => {
    setLoading(true);
    const msgs = await api.messages(conversationId);
    setMessages(conversationId, msgs);
    if (msgs.length) {
      await api.markRead(conversationId, msgs[msgs.length - 1].id);
      wsClient.send("message.read", {
        conversation_id: conversationId,
        message_id: msgs[msgs.length - 1].id,
      });
      markConversationRead(conversationId);
    }
    setLoading(false);
  }, [conversationId, markConversationRead, setMessages]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!searchOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, typingIds.length, searchOpen]);

  // Search matching message IDs
  const matchingMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return messages.filter((m) => m.body.toLowerCase().includes(q)).map((m) => m.id);
  }, [messages, searchQuery]);

  const handleScrollToMessage = useCallback((id: number) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-[var(--accent-light)]", "transition-colors", "duration-500");
      setTimeout(() => {
        el.classList.remove("bg-[var(--accent-light)]");
      }, 1500);
    }
  }, []);

  function handleNextMatch() {
    if (matchingMessageIds.length === 0) return;
    const nextIdx = (searchMatchIndex + 1) % matchingMessageIds.length;
    setSearchMatchIndex(nextIdx);
    handleScrollToMessage(matchingMessageIds[nextIdx]);
  }

  function handlePrevMatch() {
    if (matchingMessageIds.length === 0) return;
    const prevIdx =
      (searchMatchIndex - 1 + matchingMessageIds.length) % matchingMessageIds.length;
    setSearchMatchIndex(prevIdx);
    handleScrollToMessage(matchingMessageIds[prevIdx]);
  }

  useEffect(() => {
    if (matchingMessageIds.length > 0) {
      handleScrollToMessage(matchingMessageIds[searchMatchIndex]);
    }
  }, [matchingMessageIds, searchMatchIndex, handleScrollToMessage]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    const client_id = crypto.randomUUID();
    const optimistic: Message = {
      id: -Date.now(),
      conversation_id: conversationId,
      sender_id: me.id,
      body,
      reply_to_id: replyTo?.id ?? null,
      reply_to: replyTo
        ? {
            id: replyTo.id,
            sender_id: replyTo.sender_id,
            body: replyTo.body,
            sender_name: members.find((m) => m.id === replyTo.sender_id)?.display_name ?? "",
          }
        : null,
      client_id,
      created_at: new Date().toISOString(),
      sender_status: "sending",
      reactions: [],
    };
    appendMessage(optimistic);
    setText("");
    setReplyTo(null);
    wsClient.send("typing.stop", { conversation_id: conversationId });
    try {
      const saved = await api.sendMessage(conversationId, body, replyTo?.id, client_id);
      updateMessage({ ...saved, sender_status: saved.sender_status ?? "sent" });
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Couldn't send message. Please try again.");
    }
  }

  function onInput(val: string) {
    setText(val);
    wsClient.send("typing.start", { conversation_id: conversationId });
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      wsClient.send("typing.stop", { conversation_id: conversationId });
    }, 1200);
  }

  const isAdmin = activeDetail.members.find((m) => m.user_id === me.id)?.role === "admin";
  const replySenderName = replyTo
    ? replyTo.sender_id === me.id
      ? "yourself"
      : members.find((m) => m.id === replyTo.sender_id)?.display_name ?? "message"
    : undefined;

  return (
    <div className="relative flex h-full flex-1 flex-col bg-[var(--bg)]">
      {/* Modular Header */}
      <ChatHeader
        title={title}
        headerUser={headerUser}
        isGroup={activeDetail.type === "group"}
        memberCount={activeDetail.members.length}
        searchOpen={searchOpen}
        onToggleSearch={() => {
          setSearchOpen((o) => !o);
          if (searchOpen) setSearchQuery("");
        }}
        onOpenMembers={activeDetail.type === "group" ? () => setMembersOpen(true) : undefined}
        onOpenCallModal={(info) => setCallModal(info)}
      />

      {/* Modular In-Chat Search Overlay */}
      {searchOpen && (
        <ChatSearchOverlay
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            setSearchMatchIndex(0);
          }}
          searchMatchIndex={searchMatchIndex}
          matchingCount={matchingMessageIds.length}
          onNext={handleNextMatch}
          onPrev={handlePrevMatch}
          onClose={() => {
            setSearchOpen(false);
            setSearchQuery("");
          }}
        />
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-[var(--muted)]">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="mx-auto mt-16 max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 text-center shadow-xs">
            <Avatar user={headerUser} size={72} className="mx-auto mb-4" />
            <p className="font-semibold text-base text-[var(--text)]">{title}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              No messages here yet. Send a message to start the conversation securely.
            </p>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-5xl flex-col px-2 sm:px-6">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const isSameSender = prev && prev.sender_id === m.sender_id;
              const showSender =
                activeDetail.type === "group" && (!prev || prev.sender_id !== m.sender_id);
              // Consecutive messages from same sender: ~6px gap (mt-1.5); Separate message groups: ~16px gap (mt-4)
              const spacingClass = i === 0 ? "mt-1" : isSameSender ? "mt-1.5" : "mt-4";

              return (
                <div key={m.client_id ?? m.id} className={`relative w-full ${spacingClass}`}>
                  <MessageBubble
                    message={m}
                    isOwn={m.sender_id === me.id}
                    me={me}
                    showSender={showSender}
                    searchQuery={searchQuery}
                    onScrollToMessage={handleScrollToMessage}
                  />
                </div>
              );
            })}
            {typingIds.length > 0 && (
              <div className="mt-2 flex items-center gap-2 px-2 py-1 text-xs italic text-[var(--muted)] animate-pulse">
                <span>{typingLabel(typingIds, members, me.id)}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Modular Message Composer */}
      <MessageComposer
        text={text}
        onInput={onInput}
        onSend={send}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        replySenderName={replySenderName}
      />

      {/* Modular Group Members Drawer */}
      <GroupMembersDrawer
        isOpen={membersOpen}
        onClose={() => setMembersOpen(false)}
        conversationId={conversationId}
        detail={activeDetail}
        me={me}
        isAdmin={isAdmin}
        onDetailUpdated={(updated) => setConversationDetail(updated)}
      />

      {/* Modular Video & Voice Call Dialog */}
      <CallScopeModal modal={callModal} onClose={() => setCallModal(null)} />
    </div>
  );
}
