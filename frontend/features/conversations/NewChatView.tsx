"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AtSign, Hash, Users, ChevronLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { User } from "@/types";

export function NewChatView({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [contacts, setContacts] = useState<User[]>([]);
  const [results, setResults] = useState<User[]>([]);
  const [groupMode, setGroupMode] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    api.contacts().then(setContacts).catch(() => setContacts([]));
  }, []);

  useEffect(() => {
    if (q.length < 1) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.searchUsers(q).then(setResults).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  async function openDirect(userId: number) {
    const { id } = await api.directChat(userId);
    router.push(`/chats/${id}`);
  }

  async function createGroup() {
    if (!groupTitle.trim() || selected.length < 1) return;
    try {
      const { id } = await api.createGroup(groupTitle.trim(), selected);
      success(`Group "${groupTitle.trim()}" created`);
      router.push(`/chats/${id}`);
    } catch {
      toastError("Failed to create group");
    }
  }

  async function handleAddContact(user: User, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api.addContact(user.id);
      setAddedIds((prev) => [...prev, user.id]);
      const updatedContacts = await api.contacts();
      setContacts(updatedContacts);
      success(`${user.display_name} added to contacts`);
    } catch {
      toastError("Failed to add contact");
    }
  }

  const list = q ? results : contacts;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            if (groupMode) setGroupMode(false);
            else onBack();
          }}
          title="Back"
          aria-label="Back"
          className="rounded-lg p-2 hover:bg-[var(--hover)] text-[var(--muted)] hover:text-[var(--text)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-semibold">{groupMode ? "New group" : "New chat"}</h2>
      </div>
      {!groupMode && (
        <>
          <div className="p-3">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, username, or number"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            />
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[var(--hover)] text-[var(--text)] transition-colors"
            onClick={() => setGroupMode(true)}
          >
            <Users className="h-5 w-5 text-[var(--accent)]" />
            <span className="font-medium">New group</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[var(--hover)] text-[var(--text)] transition-colors"
            onClick={() => {
              setQ("@");
              inputRef.current?.focus();
            }}
          >
            <AtSign className="h-5 w-5 text-[var(--muted)]" />
            <span>Find by username</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[var(--hover)] text-[var(--text)] transition-colors"
            onClick={() => {
              setQ("+");
              inputRef.current?.focus();
            }}
          >
            <Hash className="h-5 w-5 text-[var(--muted)]" />
            <span>Find by phone number</span>
          </button>
          <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            {q ? "Search Results" : "Contacts"}
          </p>
        </>
      )}
      {groupMode && (
        <div className="space-y-3 p-3">
          <input
            value={groupTitle}
            onChange={(e) => setGroupTitle(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
          <p className="text-xs text-[var(--muted)]">Select members ({selected.length} selected)</p>
          <button
            type="button"
            disabled={!groupTitle.trim() || selected.length < 1}
            onClick={createGroup}
            className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          >
            Create group
          </button>
        </div>
      )}
      <ul className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <li className="px-4 py-6 text-center text-xs text-[var(--muted)]">
            {q ? "No users found" : "No contacts yet"}
          </li>
        ) : (
          list.map((u) => {
            const isContact = contacts.some((c) => c.id === u.id) || addedIds.includes(u.id);
            return (
              <li key={u.id}>
                <div
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-[var(--hover)] transition-colors"
                  onClick={() =>
                    groupMode
                      ? setSelected((s) => (s.includes(u.id) ? s.filter((x) => x !== u.id) : [...s, u.id]))
                      : openDirect(u.id)
                  }
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar user={u} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm text-[var(--text)]">{u.display_name}</p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        {u.username ? `@${u.username}` : u.phone ?? ""}
                      </p>
                    </div>
                  </div>
                  {groupMode ? (
                    selected.includes(u.id) && (
                      <span className="shrink-0 font-bold text-[var(--accent)]">✓</span>
                    )
                  ) : (
                    q &&
                    !isContact && (
                      <button
                        type="button"
                        className="shrink-0 rounded-lg border border-[var(--border)] px-2 py-1 text-xs text-[var(--accent)] hover:bg-[var(--selected)]"
                        onClick={(e) => handleAddContact(u, e)}
                      >
                        + Add contact
                      </button>
                    )
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
