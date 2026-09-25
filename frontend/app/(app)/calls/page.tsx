"use client";

import { useState } from "react";
import { Phone, PhoneCall, Video, X } from "lucide-react";

export default function CallsPage() {
  const [filter, setFilter] = useState<"all" | "missed">("all");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-[var(--bg)]">
      {/* Calls Sidebar */}
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5">
          <h1 className="text-xl font-bold text-[var(--text)]">Calls</h1>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
            title="Start new call"
            onClick={() => setModalOpen(true)}
          >
            <PhoneCall className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex border-b border-[var(--border)] px-4 pt-2">
          <button
            type="button"
            className={`border-b-2 pb-2 px-3 text-xs font-medium transition-colors ${
              filter === "all"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`border-b-2 pb-2 px-3 text-xs font-medium transition-colors ${
              filter === "missed"
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--text)]"
            }`}
            onClick={() => setFilter("missed")}
          >
            Missed
          </button>
        </div>

        {/* Calls list or empty state */}
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--hover)] text-[var(--muted)]">
            <Phone className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-[var(--text)]">No call history</p>
          <p className="mt-1 text-xs text-[var(--muted)] max-w-xs leading-relaxed">
            Encrypted voice and video calls will show up here.
          </p>
        </div>
      </aside>

      {/* Main Calls Detail Pane */}
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] shadow-xs">
            <Phone className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text)]">Voice & Video Calls</h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Connect privately with end-to-end encrypted calls from your computer.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
          >
            <PhoneCall className="h-4 w-4" />
            <span>Start a call</span>
          </button>
        </div>
      </main>

      {/* Call info modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dialog-overlay)] p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
                  <Video className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-[var(--text)]">Call Feature</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Voice and video calls aren&apos;t available in this demo. Realtime messaging, group chat, delivery receipts, and emoji reactions are fully operational.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
