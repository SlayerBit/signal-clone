"use client";

import { useRef, useState } from "react";
import { Send, Smile, X } from "lucide-react";
import type { Message } from "@/types";

const QUICK_EMOJIS = ["😊", "👍", "❤️", "😂", "🔥", "🎉", "🙏", "👏", "✨", "🙌", "👋", "🚀"];

export function MessageComposer({
  text,
  onInput,
  onSend,
  replyTo,
  onCancelReply,
  replySenderName,
}: {
  text: string;
  onInput: (val: string) => void;
  onSend: () => void;
  replyTo: Message | null;
  onCancelReply: () => void;
  replySenderName?: string;
}) {
  const [emojiBarOpen, setEmojiBarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertEmoji(emoji: string) {
    onInput(text + emoji);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex flex-col">
      {/* Quoted Reply Preview Bar (Attached directly above composer) */}
      {replyTo && (
        <div className="border-t border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm shadow-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0 flex-1 border-l-2 border-[var(--accent)] pl-3">
              <p className="text-xs font-semibold text-[var(--accent)]">
                Replying to {replySenderName || "message"}
              </p>
              <p className="truncate text-xs text-[var(--muted)] mt-0.5">{replyTo.body}</p>
            </div>
            <button
              type="button"
              onClick={onCancelReply}
              className="rounded-full p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
              title="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Emoji Bar */}
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

      {/* Composer Input Bar */}
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
                onSend();
              }
            }}
            placeholder="Message"
            className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-[14.5px] text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!text.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-xs transition-opacity hover:opacity-95 disabled:opacity-30"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
