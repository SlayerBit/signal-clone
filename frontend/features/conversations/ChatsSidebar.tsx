"use client";

import { useEffect, useState } from "react";
import { Edit3, MoreHorizontal, SlidersHorizontal } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { ConversationList } from "./ConversationList";
import { NewChatView } from "./NewChatView";

export function ChatsSidebar({ meId }: { meId: number }) {
  const conversations = useAppStore((s) => s.conversations);
  const setConversations = useAppStore((s) => s.setConversations);
  const [search, setSearch] = useState("");
  const [newChat, setNewChat] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    api.conversations(search || undefined).then(setConversations).catch(() => {});
  }, [search, setConversations]);

  if (newChat) {
    return (
      <aside className="flex h-full w-[320px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]">
        <NewChatView onBack={() => setNewChat(false)} />
      </aside>
    );
  }

  const displayedConversations = filterUnread
    ? conversations.filter((c) => c.unread_count > 0)
    : conversations;

  return (
    <aside className="relative flex h-full w-[320px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-bold">Chats</h1>
        <div className="relative flex gap-1">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)]"
            onClick={() => setNewChat(true)}
            aria-label="New chat"
            title="New chat"
          >
            <Edit3 className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)]"
            onClick={() => setMenuOpen((o) => !o)}
            title="More actions"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1.5 shadow-xl">
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[var(--hover)] text-[var(--text)]"
                onClick={() => {
                  setNewChat(true);
                  setMenuOpen(false);
                }}
              >
                New group
              </button>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[var(--hover)] text-[var(--muted)]"
                onClick={() => setMenuOpen(false)}
              >
                Archived chats
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 px-3 pb-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={() => setFilterUnread((v) => !v)}
          className={`rounded-xl border border-[var(--border)] p-2 transition-colors ${
            filterUnread
              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
              : "text-[var(--muted)] hover:bg-[var(--hover)]"
          }`}
          title={filterUnread ? "Show all chats" : "Filter by unread"}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>
      <ConversationList conversations={displayedConversations} meId={meId} />
    </aside>
  );
}
