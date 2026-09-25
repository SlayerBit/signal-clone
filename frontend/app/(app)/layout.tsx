"use client";

import { usePathname } from "next/navigation";
import { MessengerShell } from "@/components/layout/MessengerShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const match = pathname.match(/^\/chats\/(\d+)/);
  const activeId = match ? Number(match[1]) : null;
  return <MessengerShell activeConversationId={activeId}>{children}</MessengerShell>;
}
