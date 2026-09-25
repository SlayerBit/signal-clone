"use client";

import { useEffect, useCallback, useRef } from "react";
import { create } from "zustand";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

/* ─── Toast Types ─── */
export type ToastVariant = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
};

/* ─── Toast Store (Zustand) ─── */
type ToastState = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
};

let _toastCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `toast-${++_toastCounter}-${Date.now()}`;
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id }],
    }));
  },
  removeToast: (id) =>
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    })),
}));

/* ─── Convenience hook ─── */
export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  return {
    toast: addToast,
    success: (message: string, duration?: number) =>
      addToast({ message, variant: "success", duration }),
    error: (message: string, duration?: number) =>
      addToast({ message, variant: "error", duration }),
    info: (message: string, duration?: number) =>
      addToast({ message, variant: "info", duration }),
    warning: (message: string, duration?: number) =>
      addToast({ message, variant: "warning", duration }),
  };
}

/* ─── Variant config ─── */
const variants: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; bg: string; border: string; text: string; accent: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
    text: "#10b981",
    accent: "#10b981",
  },
  error: {
    icon: AlertCircle,
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.2)",
    text: "#ef4444",
    accent: "#ef4444",
  },
  info: {
    icon: Info,
    bg: "rgba(44, 107, 237, 0.08)",
    border: "rgba(44, 107, 237, 0.2)",
    text: "#2c6bed",
    accent: "#2c6bed",
  },
  warning: {
    icon: AlertTriangle,
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.2)",
    text: "#f59e0b",
    accent: "#f59e0b",
  },
};

/* ─── Single Toast Item ─── */
function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    const el = elRef.current;
    if (el) {
      el.style.opacity = "0";
      el.style.transform = "translateX(24px)";
      setTimeout(() => removeToast(toast.id), 220);
    } else {
      removeToast(toast.id);
    }
  }, [removeToast, toast.id]);

  useEffect(() => {
    const dur = toast.duration ?? 4000;
    timerRef.current = setTimeout(dismiss, dur);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, toast.duration]);

  const v = variants[toast.variant];
  const Icon = v.icon;

  return (
    <div
      ref={elRef}
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--border)",
        borderLeft: `3.5px solid ${v.accent}`,
        minWidth: 280,
        maxWidth: 420,
        opacity: 1,
        transform: "translateX(0)",
        transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
        animation: "toast-in 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" style={{ color: v.accent }} />
      <p
        className="flex-1 text-[13px] font-medium leading-snug"
        style={{ color: "var(--text)" }}
      >
        {toast.message}
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors"
        style={{ color: "var(--muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Toast Container (mount once in root layout) ─── */
export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-2"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
