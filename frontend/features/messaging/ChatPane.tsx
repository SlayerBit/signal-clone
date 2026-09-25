"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BellOff,
  ChevronDown,
  ChevronUp,
  Clock,
  MoreVertical,
  Phone,
  Search,
  Send,
  Smile,
  Users,
  Video,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import { wsClient } from "@/lib/ws-client";
import { useAppStore } from "@/store/app-store";
import type { ConversationDetail, Message, User } from "@/types";
import { MessageBubble } from "./MessageBubble";

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
const QUICK_EMOJIS = ["😊", "👍", "❤️", "😂", "🔥", "🎉", "🙏", "👏", "✨", "🙌", "👋", "🚀"];

export function ChatPane({
  conversationId,
  detail,
  me,
}: {
  conversationId: number;
  detail: ConversationDetail;
  me: User;
}) {
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
  const [contacts, setContacts] = useState<User[]>([]);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [emojiBarOpen, setEmojiBarOpen] = useState(false);
  const [callModal, setCallModal] = useState<{
    type: "video" | "audio";
    title: string;
    description: string;
  } | null>(null);

  // In-chat message search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (membersOpen) {
      api.contacts().then(setContacts).catch(() => {});
    }
  }, [membersOpen]);

  const availableContacts = contacts.filter(
    (c) => !activeDetail.members.some((m) => m.user_id === c.id)
  );

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
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

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
    setEmojiBarOpen(false);
    wsClient.send("typing.stop", { conversation_id: conversationId });
    try {
      const saved = await api.sendMessage(conversationId, body, replyTo?.id, client_id);
      updateMessage({ ...saved, sender_status: saved.sender_status ?? "sent" });
    } catch {
      /* toast in prod */
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

  function insertEmoji(emoji: string) {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  }

  const isAdmin = detail.members.find((m) => m.user_id === me.id)?.role === "admin";

  return (
    <div className="relative flex h-full flex-1 flex-col bg-[var(--bg)]">
      {/* Chat Header */}
      <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar user={headerUser} size={38} />
          <div className="min-w-0">
            <h2 className="truncate font-semibold text-[15px] leading-tight text-[var(--text)]">
              {title}
            </h2>
            <p className="truncate text-xs text-[var(--muted)]">
              {detail.type === "group"
                ? `${detail.members.length} members`
                : headerUser.is_online
                  ? "Online"
                  : headerUser.last_seen_at
                    ? `Last seen recently`
                    : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 text-[var(--muted)]">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
            title="Video call"
            onClick={() =>
              setCallModal({
                type: "video",
                title: "Video Calls",
                description:
                  "Video calls aren't implemented in this demo. End-to-end messaging, reactions, and media synchronization remain active.",
              })
            }
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
            title="Voice call"
            onClick={() =>
              setCallModal({
                type: "audio",
                title: "Voice Calls",
                description:
                  "Voice calls aren't implemented in this demo. You can continue sending instant messages, replies, and reactions.",
              })
            }
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            type="button"
            className={`rounded-lg p-2 transition-colors ${
              searchOpen
                ? "bg-[var(--selected)] text-[var(--text)]"
                : "hover:bg-[var(--hover)] hover:text-[var(--text)]"
            }`}
            title="Search in conversation"
            onClick={() => {
              setSearchOpen((o) => !o);
              if (searchOpen) setSearchQuery("");
            }}
          >
            <Search className="h-5 w-5" />
          </button>
          {detail.type === "group" && (
            <button
              type="button"
              className="rounded-lg p-2 hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
              title="Group members"
              onClick={() => setMembersOpen(true)}
            >
              <Users className="h-5 w-5" />
            </button>
          )}
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
            title="More options"
            onClick={() => setOverflowOpen((o) => !o)}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Overflow dropdown menu */}
        {overflowOpen && (
          <div className="absolute right-4 top-14 z-30 w-56 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1.5 shadow-xl animate-in fade-in duration-100">
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--hover)]"
              onClick={() => {
                setSearchOpen(true);
                setOverflowOpen(false);
              }}
            >
              <Search className="h-4 w-4 text-[var(--muted)]" />
              Search in conversation
            </button>
            {detail.type === "group" && (
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--hover)]"
                onClick={() => {
                  setMembersOpen(true);
                  setOverflowOpen(false);
                }}
              >
                <Users className="h-4 w-4 text-[var(--muted)]" />
                Group members & info
              </button>
            )}
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--hover)]"
              onClick={() => setOverflowOpen(false)}
            >
              <Clock className="h-4 w-4 text-[var(--muted)]" />
              Disappearing messages (Off)
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--hover)]"
              onClick={() => setOverflowOpen(false)}
            >
              <BellOff className="h-4 w-4 text-[var(--muted)]" />
              Mute notifications
            </button>
          </div>
        )}
      </header>

      {/* In-Chat Message Search Bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm shadow-xs animate-in slide-in-from-top-2 duration-150">
          <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchMatchIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (e.shiftKey) handlePrevMatch();
                else handleNextMatch();
              } else if (e.key === "Escape") {
                setSearchOpen(false);
                setSearchQuery("");
              }
            }}
            placeholder="Search in conversation..."
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
          />
          {searchQuery && (
            <span className="shrink-0 text-xs text-[var(--muted)] tabular-nums">
              {matchingMessageIds.length > 0
                ? `${searchMatchIndex + 1} of ${matchingMessageIds.length}`
                : "No matches"}
            </span>
          )}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              disabled={matchingMessageIds.length === 0}
              onClick={handlePrevMatch}
              className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-30"
              title="Previous match (Shift+Enter)"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={matchingMessageIds.length === 0}
              onClick={handleNextMatch}
              className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-30"
              title="Next match (Enter)"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              title="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
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
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const showSender =
                detail.type === "group" && (!prev || prev.sender_id !== m.sender_id);
              const sender = members.find((u) => u.id === m.sender_id);
              return (
                <div key={m.client_id ?? m.id} className="relative">
                  {showSender && sender && (
                    <p className="mb-0.5 px-2 text-[11px] font-semibold text-[var(--accent)]">
                      {sender.display_name}
                    </p>
                  )}
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
              <div className="flex items-center gap-2 px-2 py-1 text-xs italic text-[var(--muted)] animate-pulse">
                <span>{typingLabel(typingIds, members, me.id)}</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Quoted Reply Preview Bar (Attached directly above composer) */}
      {replyTo && (
        <div className="border-t border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm shadow-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0 flex-1 border-l-2 border-[var(--accent)] pl-3">
              <p className="text-xs font-semibold text-[var(--accent)]">
                Replying to{" "}
                {replyTo.sender_id === me.id
                  ? "yourself"
                  : members.find((m) => m.id === replyTo.sender_id)?.display_name ?? "message"}
              </p>
              <p className="truncate text-xs text-[var(--muted)] mt-0.5">{replyTo.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
              title="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Emoji Bar above composer */}
      {emojiBarOpen && (
        <div className="border-t border-[var(--border)] bg-[var(--panel)] px-4 py-2">
          <div className="mx-auto flex max-w-3xl items-center gap-1.5 overflow-x-auto py-0.5">
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg hover:bg-[var(--hover)] transition-transform hover:scale-115"
                onClick={() => insertEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Composer Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--panel)] p-3">
        <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-1.5 shadow-xs focus-within:border-[var(--accent)] transition-colors">
          <button
            type="button"
            className={`p-1.5 text-[var(--muted)] transition-colors hover:text-[var(--text)] ${
              emojiBarOpen ? "text-[var(--accent)]" : ""
            }`}
            title="Emoji selector"
            onClick={() => setEmojiBarOpen((o) => !o)}
          >
            <Smile className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message"
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[14.5px] text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!text.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-xs transition-opacity hover:opacity-95 disabled:opacity-30"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>

      {/* Group Members Side Drawer */}
      {membersOpen && (
        <div className="absolute inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-[var(--text)]">Group members</h3>
                <p className="text-xs text-[var(--muted)]">{activeDetail.members.length} members</p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
                onClick={() => setMembersOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAdmin && (
              <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Add Member
                </p>
                <div className="flex gap-2">
                  <select
                    id="add-member-select"
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--text)] outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a contact to add...
                    </option>
                    {availableContacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.display_name} (@{c.username})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                    onClick={async () => {
                      const select = document.getElementById("add-member-select") as HTMLSelectElement;
                      const uid = Number(select?.value);
                      if (!uid) return;
                      await api.addMember(conversationId, uid);
                      const updated = await api.conversation(conversationId);
                      setConversationDetail(updated);
                      select.value = "";
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            <ul className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {activeDetail.members.map((m) => (
                <li
                  key={m.user_id}
                  className="flex items-center justify-between gap-2 rounded-xl p-2 hover:bg-[var(--hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={m.user} size={36} />
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{m.user.display_name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {m.role === "admin" ? (
                          <span className="font-semibold text-[var(--accent)]">Admin</span>
                        ) : (
                          "Member"
                        )}
                        {m.user_id === me.id && " (You)"}
                      </p>
                    </div>
                  </div>
                  {isAdmin && m.user_id !== me.id && (
                    <button
                      type="button"
                      className="rounded-lg px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                      onClick={async () => {
                        await api.removeMember(conversationId, m.user_id);
                        const updated = await api.conversation(conversationId);
                        setConversationDetail(updated);
                      }}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Video & Voice Call Dialog */}
      {callModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dialog-overlay)] p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)]">
              {callModal.type === "video" ? (
                <Video className="h-6 w-6" />
              ) : (
                <Phone className="h-6 w-6" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-[var(--text)]">{callModal.title}</h3>
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              {callModal.description}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setCallModal(null)}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
