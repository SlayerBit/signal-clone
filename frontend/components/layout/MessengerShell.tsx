"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { useRealtime } from "@/hooks/use-realtime";
import { NavRail } from "./NavRail";

export function MessengerShell({
  children,
  activeConversationId,
}: {
  children: React.ReactNode;
  activeConversationId?: number | null;
}) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);

  useRealtime(activeConversationId ?? null);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => router.replace("/login"));
  }, [router, setUser]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)] text-[var(--muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <NavRail />
      {children}
    </div>
  );
}
