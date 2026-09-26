"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { useRealtime } from "@/hooks/use-realtime";
import { useIsMobile } from "@/hooks/use-media-query";
import { NavRail } from "./NavRail";
import { MobileBottomNav } from "./MobileBottomNav";

export function MessengerShell({
  children,
  activeConversationId,
}: {
  children: React.ReactNode;
  activeConversationId?: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const isMobile = useIsMobile();

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

  // On mobile, hide bottom tab bar when inside a specific active conversation
  const isInsideChat = Boolean(activeConversationId) || (pathname.startsWith("/chats/") && pathname !== "/chats");
  const showBottomNav = isMobile && !isInsideChat;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Desktop: vertical nav rail on the left */}
      {!isMobile && <NavRail />}
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden" style={showBottomNav ? { paddingBottom: 56 } : undefined}>
        {children}
      </div>
      {/* Mobile: bottom tab bar when in root views (Chats list, Calls, Stories, Settings) */}
      {showBottomNav && <MobileBottomNav />}
    </div>
  );
}
