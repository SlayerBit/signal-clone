"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, CheckCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { ConversationSummary, User } from "@/types";

function formatTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function peer(conv: ConversationSummary, meId: number): User | undefined {
  if (conv.type === "group") return undefined;
  return conv.members.find((m) => m.id !== meId);
}

export function ConversationList({
  conversations,
  meId,
}: {
  conversations: ConversationSummary[];
  meId: number;
}) {
  const pathname = usePathname();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-xs text-[var(--muted)]">
        No conversations found
      </div>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
      {conversations.map((c) => {
        const active = pathname === `/chats/${c.id}`;
        const p = peer(c, meId);
        const title = c.type === "group" ? c.title : p?.display_name ?? c.title;
        const avatarUser = p ?? c.members[0];
        const isOnline = p?.is_online;
        const isLastFromMe = c.last_message && c.last_message.sender_id === meId;

        return (
          <li key={c.id}>
            <Link
              href={`/chats/${c.id}`}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                active
                  ? "bg-[var(--selected)] shadow-xs"
                  : "hover:bg-[var(--hover)] text-[var(--text)]"
              }`}
            >
              <div className="relative shrink-0">
                {avatarUser && <Avatar user={avatarUser} size={46} />}
                {isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--panel)] bg-emerald-500 shadow-xs" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm font-semibold ${
                      c.unread_count > 0 ? "text-[var(--text)]" : "text-[var(--text)] opacity-95"
                    }`}
                  >
                    {title}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--muted)]">
                    {c.last_message ? formatTime(c.last_message.created_at) : formatTime(c.updated_at)}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0 flex-1 text-xs text-[var(--muted)]">
                    {isLastFromMe && (
                      <span className="shrink-0 opacity-80">
                        {c.last_message?.sender_status === "read" ? (
                          <CheckCheck className="h-3.5 w-3.5 text-[var(--accent)]" />
                        ) : c.last_message?.sender_status === "delivered" ? (
                          <CheckCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}
                    <p className="truncate text-xs text-[var(--muted)]">
                      {c.last_message?.body ?? "No messages yet"}
                    </p>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold text-white shadow-xs">
                      {c.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );

}
