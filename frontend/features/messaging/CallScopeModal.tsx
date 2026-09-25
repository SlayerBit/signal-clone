"use client";

import { useEffect, useRef } from "react";
import { Phone, Video } from "lucide-react";

export type CallModalInfo = {
  type: "video" | "audio";
  title: string;
  description: string;
};

export function CallScopeModal({
  modal,
  onClose,
}: {
  modal: CallModalInfo | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (modal) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [modal, onClose]);

  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dialog-overlay)] p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)]">
          {modal.type === "video" ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
        </div>
        <h3 className="text-lg font-semibold text-[var(--text)]">{modal.title}</h3>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">{modal.description}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
