"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { ChatsSidebar } from "@/features/conversations/ChatsSidebar";
import { ChatPane } from "@/features/messaging/ChatPane";
import type { ConversationDetail } from "@/types";

export default function ChatPage() {
  const params = useParams();
  const id = Number(params.id);
  const user = useAppStore((s) => s.user);
  const setConversationDetail = useAppStore((s) => s.setConversationDetail);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);

  useEffect(() => {
    if (!id) return;
    api.conversation(id).then((d) => {
      setDetail(d);
      setConversationDetail(d);
    });
  }, [id, setConversationDetail]);

  if (!user) return null;

  return (
    <>
      <ChatsSidebar meId={user.id} />
      {detail ? <ChatPane conversationId={id} detail={detail} me={user} /> : (
        <div className="flex flex-1 items-center justify-center text-[var(--muted)]">Loading chat…</div>
      )}
    </>
  );
}
