"use client";

import { ChatsSidebar } from "@/features/conversations/ChatsSidebar";
import { useAppStore } from "@/store/app-store";

export default function ChatsPage() {
  const user = useAppStore((s) => s.user);
  if (!user) return null;
  return (
    <>
      <ChatsSidebar meId={user.id} />
      <div className="flex flex-1 items-center justify-center text-[var(--muted)]">
        Select a conversation or start a new chat
      </div>
    </>
  );
}
