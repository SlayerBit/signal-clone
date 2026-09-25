"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { ConversationDetail, User } from "@/types";

export function GroupMembersDrawer({
  isOpen,
  onClose,
  conversationId,
  detail,
  me,
  isAdmin,
  onDetailUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  detail: ConversationDetail;
  me: User;
  isAdmin: boolean;
  onDetailUpdated: (detail: ConversationDetail) => void;
}) {
  const { success, error: toastError } = useToast();
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.contacts().then(setContacts).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const availableContacts = contacts.filter(
    (c) => !detail.members.some((m) => m.user_id === c.id)
  );

  async function handleAddMember() {
    const uid = Number(selectedContactId);
    if (!uid) return;
    setSubmitting(true);
    try {
      await api.addMember(conversationId, uid);
      const updated = await api.conversation(conversationId);
      onDetailUpdated(updated);
      setSelectedContactId("");
      success("Member added to group");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(userId: number) {
    try {
      await api.removeMember(conversationId, userId);
      const updated = await api.conversation(conversationId);
      onDetailUpdated(updated);
      success("Member removed from group");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to remove member. Only admins can manage members.");
    }
  }

  return (
    <div
      className="absolute inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        className="flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--panel)] p-5 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-base text-[var(--text)]">Group members</h3>
            <p className="text-xs text-[var(--muted)]">{detail.members.length} members</p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
            onClick={onClose}
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isAdmin && (
          <div className="mb-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Add Member
            </p>
            <div className="flex gap-2">
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--text)] outline-none"
              >
                <option value="" disabled>
                  Select a contact to add...
                </option>
                {availableContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name} (@{c.username})
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedContactId || submitting}
                className="rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
                onClick={handleAddMember}
              >
                Add
              </button>
            </div>
          </div>
        )}

        <ul className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {detail.members.map((m) => (
            <li
              key={m.user_id}
              className="flex items-center justify-between gap-2 rounded-xl p-2 hover:bg-[var(--hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar user={m.user} size={36} />
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">{m.user.display_name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {m.role === "admin" ? (
                      <span className="font-semibold text-[var(--accent)]">Admin</span>
                    ) : (
                      "Member"
                    )}
                    {m.user_id === me.id && " (You)"}
                  </p>
                </div>
              </div>
              {isAdmin && m.user_id !== me.id && (
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  onClick={() => handleRemoveMember(m.user_id)}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
