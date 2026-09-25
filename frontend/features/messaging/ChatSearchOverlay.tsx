"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

export function ChatSearchOverlay({
  searchQuery,
  setSearchQuery,
  searchMatchIndex,
  matchingCount,
  onNext,
  onPrev,
  onClose,
}: {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchMatchIndex: number;
  matchingCount: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm shadow-xs animate-in slide-in-from-top-2 duration-150">
      <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
      <input
        ref={inputRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (e.shiftKey) onPrev();
            else onNext();
          } else if (e.key === "Escape") {
            onClose();
          }
        }}
        placeholder="Search in conversation..."
        className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none"
      />
      {searchQuery && (
        <span className="shrink-0 text-xs text-[var(--muted)] tabular-nums">
          {matchingCount > 0 ? `${searchMatchIndex + 1} of ${matchingCount}` : "No matches"}
        </span>
      )}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          disabled={matchingCount === 0}
          onClick={onPrev}
          className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={matchingCount === 0}
          onClick={onNext}
          className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] disabled:opacity-30 transition-colors"
          title="Next match (Enter)"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
          title="Close search"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
