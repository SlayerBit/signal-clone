"use client";

import { ChatsSidebar } from "@/features/conversations/ChatsSidebar";
import { useAppStore } from "@/store/app-store";
import { useIsMobile } from "@/hooks/use-media-query";

export default function ChatsPage() {
  const user = useAppStore((s) => s.user);
  const isMobile = useIsMobile();
  if (!user) return null;
  return (
    <>
      <ChatsSidebar meId={user.id} />
      {/* On mobile the sidebar IS the full page; on desktop show the empty state */}
      {!isMobile && (
        <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
          Select a conversation or start a new chat
        </div>
      )}
    </>
  );
}
