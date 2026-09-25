"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  Clock,
  MoreVertical,
  Phone,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { User } from "@/types";
import type { CallModalInfo } from "./CallScopeModal";

export function ChatHeader({
  title,
  headerUser,
  isGroup,
  memberCount,
  searchOpen,
  onToggleSearch,
  onOpenMembers,
  onOpenCallModal,
}: {
  title: string | null;
  headerUser: User;
  isGroup: boolean;
  memberCount: number;
  searchOpen: boolean;
  onToggleSearch: () => void;
  onOpenMembers?: () => void;
  onOpenCallModal: (info: CallModalInfo) => void;
}) {
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOverflowOpen(false);
      }
    }
    if (overflowOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [overflowOpen]);

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-4">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar user={headerUser} size={38} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-[15px] leading-tight text-[var(--text)]">
            {title}
          </h2>
          <p className="truncate text-xs text-[var(--muted)]">
            {isGroup
              ? `${memberCount} members`
              : headerUser.is_online
                ? "Online"
                : headerUser.last_seen_at
                  ? "Last seen recently"
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
            onOpenCallModal({
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
            onOpenCallModal({
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
          onClick={onToggleSearch}
        >
          <Search className="h-5 w-5" />
        </button>
        {isGroup && onOpenMembers && (
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
            title="Group members"
            onClick={onOpenMembers}
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

      {/* Overflow dropdown menu with click outside handler */}
      {overflowOpen && (
        <div
          ref={menuRef}
          className="absolute right-4 top-14 z-30 w-56 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1.5 shadow-xl animate-in fade-in duration-100"
        >
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            onClick={() => {
              onToggleSearch();
              setOverflowOpen(false);
            }}
          >
            <Search className="h-4 w-4 text-[var(--muted)]" />
            Search in conversation
          </button>
          {isGroup && onOpenMembers && (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                onOpenMembers();
                setOverflowOpen(false);
              }}
            >
              <Users className="h-4 w-4 text-[var(--muted)]" />
              Group members & info
            </button>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            onClick={() => {
              setOverflowOpen(false);
              setInfoModal({
                title: "Disappearing Messages",
                message:
                  "Disappearing messages are currently Off. In this assignment demo, conversation history is persistently saved to the SQLite ACID database.",
              });
            }}
          >
            <Clock className="h-4 w-4 text-[var(--muted)]" />
            Disappearing messages (Off)
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            onClick={() => {
              setOverflowOpen(false);
              const nextMuted = !muted;
              setMuted(nextMuted);
              setInfoModal({
                title: nextMuted ? "Notifications Muted" : "Notifications Unmuted",
                message: nextMuted
                  ? "Notifications for this conversation have been muted."
                  : "Notifications for this conversation have been restored.",
              });
            }}
          >
            {muted ? (
              <Bell className="h-4 w-4 text-[var(--accent)]" />
            ) : (
              <BellOff className="h-4 w-4 text-[var(--muted)]" />
            )}
            {muted ? "Unmute notifications" : "Mute notifications"}
          </button>
        </div>
      )}

      {/* Intentional Feature Capability Modal */}
      {infoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dialog-overlay)] p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setInfoModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-[var(--text)]">{infoModal.title}</h3>
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">{infoModal.message}</p>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
