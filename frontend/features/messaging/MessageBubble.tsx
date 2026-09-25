"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Check, MoreHorizontal, Reply, Smile } from "lucide-react";
import type { Message, User } from "@/types";
import { MessageStatus } from "./MessageStatus";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export function MessageBubble({
  message,
  isOwn,
  me,
  showSender,
  searchQuery,
  onScrollToMessage,
}: {
  message: Message;
  isOwn: boolean;
  me: User;
  showSender?: boolean;
  searchQuery?: string;
  onScrollToMessage?: (id: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [activePopover, setActivePopover] = useState<"reaction" | "menu" | null>(null);
  const [copied, setCopied] = useState(false);
  const [openUpward, setOpenUpward] = useState(true);

  const setReplyTo = useAppStore((s) => s.setReplyTo);
  const patchReactions = useAppStore((s) => s.patchReactions);

  const containerRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(
    (delay = 180) => {
      cancelClose();
      closeTimerRef.current = setTimeout(() => {
        setActivePopover(null);
        setHovered(false);
      }, delay);
    },
    [cancelClose]
  );

  const closeImmediately = useCallback(() => {
    cancelClose();
    setActivePopover(null);
  }, [cancelClose]);

  const openPopover = useCallback(
    (type: "reaction" | "menu") => {
      cancelClose();
      if (toolbarRef.current) {
        const rect = toolbarRef.current.getBoundingClientRect();
        // If message is near viewport top (within 110px), pop downward to avoid clipping
        setOpenUpward(rect.top >= 110);
      }
      setActivePopover(type);
    },
    [cancelClose]
  );

  // Outside click & Escape dismissal
  useEffect(() => {
    if (!activePopover) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeImmediately();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeImmediately();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePopover, closeImmediately]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const grouped = message.reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] ?? 0) + 1;
    return acc;
  }, {});

  async function react(emoji: string) {
    closeImmediately();
    const existing = message.reactions.find((r) => r.user_id === me.id);
    let reactions: Message["reactions"];
    if (existing && existing.emoji === emoji) {
      reactions = await api.removeReaction(message.conversation_id, message.id);
    } else {
      reactions = await api.react(message.conversation_id, message.id, emoji);
    }
    patchReactions(message.id, reactions);
  }

  function handleCopy() {
    navigator.clipboard?.writeText(message.body);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      closeImmediately();
    }, 1000);
  }

  // Highlight message search query
  function renderBody(body: string) {
    if (!searchQuery || !searchQuery.trim()) {
      return body;
    }
    const query = searchQuery.trim();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = body.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="rounded-xs bg-[var(--search-highlight)] px-0.5 font-medium text-[var(--search-highlight-text)]"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  const isPickerOpen = activePopover === "reaction";
  const isMenuOpen = activePopover === "menu";
  const isToolbarVisible = hovered || activePopover !== null;

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex w-full ${isOwn ? "justify-end" : "justify-start"} py-0.5`}
      onMouseEnter={() => {
        cancelClose();
        setHovered(true);
      }}
      onMouseLeave={() => {
        if (activePopover) {
          scheduleClose(220);
        } else {
          scheduleClose(80);
        }
      }}
    >
      <div
        ref={containerRef}
        className={`relative flex max-w-[min(540px,78%)] items-end gap-1.5 ${
          isOwn ? "flex-row" : "flex-row-reverse"
        }`}
      >
        {/* Contextual Action Toolbar & Attached Popovers */}
        <div
          ref={toolbarRef}
          className="relative z-20 mb-1"
          onMouseEnter={cancelClose}
          onMouseLeave={() => {
            if (activePopover) scheduleClose(180);
          }}
        >
          {/* Reaction Picker Popup (Anchored directly to the toolbar as ONE continuous interactive region) */}
          {isPickerOpen && (
            <div
              className={`absolute z-30 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel)] px-2 py-1 shadow-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100 ${
                openUpward
                  ? "bottom-full mb-1.5 after:absolute after:-bottom-2.5 after:left-0 after:right-0 after:h-3 after:content-['']"
                  : "top-full mt-1.5 before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-3 before:content-['']"
              } ${isOwn ? "right-0" : "left-0"}`}
              onMouseEnter={cancelClose}
              onMouseLeave={() => scheduleClose(180)}
            >
              {REACTIONS.map((emoji) => {
                const isSelected = message.reactions.some(
                  (r) => r.user_id === me.id && r.emoji === emoji
                );
                return (
                  <button
                    key={emoji}
                    type="button"
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                      isSelected ? "bg-[var(--selected)] scale-110" : "hover:bg-[var(--hover)]"
                    }`}
                    onClick={() => react(emoji)}
                    title={`React ${emoji}`}
                    aria-label={`React ${emoji}`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}

          {/* More Actions Menu (Anchored directly to the toolbar as ONE continuous interactive region) */}
          {isMenuOpen && (
            <div
              className={`absolute z-30 w-36 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-1 shadow-xl animate-in fade-in duration-100 ${
                openUpward
                  ? "bottom-full mb-1.5 after:absolute after:-bottom-2.5 after:left-0 after:right-0 after:h-3 after:content-['']"
                  : "top-full mt-1.5 before:absolute before:-top-2.5 before:left-0 before:right-0 before:h-3 before:content-['']"
              } ${isOwn ? "right-0" : "left-0"}`}
              onMouseEnter={cancelClose}
              onMouseLeave={() => scheduleClose(180)}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--hover)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-[var(--muted)]" />
                )}
                {copied ? "Copied!" : "Copy message"}
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[var(--text)] hover:bg-[var(--hover)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                onClick={() => {
                  setReplyTo(message);
                  closeImmediately();
                }}
              >
                <Reply className="h-3.5 w-3.5 text-[var(--muted)]" />
                Reply
              </button>
            </div>
          )}

          {/* Action Toolbar Button Pill */}
          <div
            className={`flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--panel)] px-1 py-0.5 shadow-md transition-all duration-150 ${
              isToolbarVisible
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
            style={{ willChange: "transform, opacity" }}
          >
            {/* Reaction Trigger */}
            <button
              type="button"
              title="React"
              aria-label="React"
              className={`rounded-full p-1 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                isPickerOpen ? "bg-[var(--selected)] text-[var(--text)]" : ""
              }`}
              onMouseEnter={() => openPopover("reaction")}
              onMouseLeave={() => scheduleClose(180)}
              onClick={(e) => {
                e.stopPropagation();
                if (isPickerOpen) closeImmediately();
                else openPopover("reaction");
              }}
            >
              <Smile className="h-4 w-4" />
            </button>

            {/* Reply Trigger */}
            <button
              type="button"
              title="Reply"
              aria-label="Reply"
              className="rounded-full p-1 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              onClick={(e) => {
                e.stopPropagation();
                setReplyTo(message);
                closeImmediately();
              }}
            >
              <Reply className="h-4 w-4" />
            </button>

            {/* More options menu trigger */}
            <button
              type="button"
              title="More actions"
              aria-label="More actions"
              className={`rounded-full p-1 text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                isMenuOpen ? "bg-[var(--selected)] text-[var(--text)]" : ""
              }`}
              onMouseEnter={() => {
                if (isMenuOpen) cancelClose();
              }}
              onMouseLeave={() => {
                if (isMenuOpen) scheduleClose(180);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (isMenuOpen) closeImmediately();
                else openPopover("menu");
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message Bubble + Attached Reactions container */}
        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          {showSender && !isOwn && (
            <span
              className="mb-1 ml-1 text-xs font-semibold select-none"
              style={{ color: message.sender_avatar_color || "var(--accent)" }}
            >
              {message.sender_name || "Member"}
            </span>
          )}
          <div
            className={`relative rounded-2xl px-3.5 py-2 text-[14.5px] leading-snug shadow-xs transition-colors ${
              isOwn
                ? "rounded-br-xs bg-[var(--bubble-out)] text-[var(--bubble-out-text)]"
                : "rounded-bl-xs bg-[var(--bubble-in)] text-[var(--bubble-in-text)]"
            }`}
          >
            {/* Embedded Quote / Reply-To context */}
            {message.reply_to && (
              <div
                onClick={() => message.reply_to && onScrollToMessage?.(message.reply_to.id)}
                className={`mb-1.5 cursor-pointer rounded-lg border-l-2 pl-2.5 pr-2 py-1 text-xs transition-opacity hover:opacity-80 ${
                  isOwn
                    ? "border-white/90 bg-[var(--quote-out-bg)] text-white"
                    : "border-[var(--accent)] bg-[var(--quote-in-bg)] text-[var(--text)]"
                }`}
                title="Click to jump to original message"
              >
                <div className="font-semibold leading-tight text-[11.5px] opacity-95">
                  {message.reply_to.sender_name || "Original message"}
                </div>
                <div className="line-clamp-2 leading-tight opacity-85 text-[11px] mt-0.5">
                  {message.reply_to.body}
                </div>
              </div>
            )}

            {/* Message Body */}
            <p className="whitespace-pre-wrap break-words">{renderBody(message.body)}</p>

            {/* Timestamp & Delivery Receipt Indicator */}
            <div
              className={`mt-1 flex items-center gap-1.5 ${
                isOwn ? "justify-end text-white/80" : "justify-end text-[var(--muted)]"
              }`}
            >
              <span className="text-[10px] tabular-nums font-normal">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {isOwn && <MessageStatus status={message.sender_status ?? "sent"} />}
            </div>
          </div>

          {/* Aggregated Reaction Chips directly BELOW the message bubble */}
          {Object.keys(grouped).length > 0 && (
            <div className={`mt-1 flex flex-wrap gap-1 px-0.5 ${isOwn ? "justify-end" : "justify-start"}`}>
              {Object.entries(grouped).map(([emoji, count]) => {
                const myReaction = message.reactions.some(
                  (r) => r.user_id === me.id && r.emoji === emoji
                );
                return (
                  <button
                    key={emoji}
                    type="button"
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all ${
                      myReaction
                        ? "border border-[var(--reaction-active-border)] bg-[var(--reaction-active-bg)] text-[var(--accent)] font-semibold shadow-xs"
                        : "border border-[var(--reaction-border)] bg-[var(--reaction-bg)] text-[var(--text)] hover:bg-[var(--hover)]"
                    }`}
                    onClick={() => react(emoji)}
                    title={myReaction ? "Click to remove reaction" : `Click to react ${emoji}`}
                  >
                    <span className="text-sm leading-none">{emoji}</span>
                    {count > 1 && <span className="text-[11px] font-medium">{count}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
