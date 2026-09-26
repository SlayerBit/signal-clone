"use client";

import { useState } from "react";
import { Plus, Smartphone, Sparkles, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/app-store";

export default function StoriesPage() {
  const user = useAppStore((s) => s.user);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-[var(--bg)]">
      {/* Stories Sidebar */}
      <aside className="sidebar-responsive flex h-full w-[320px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3.5">
          <h1 className="text-xl font-bold text-[var(--text)]">Stories</h1>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
            title="Create story"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* My Story item */}
          <div>
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              My Story
            </p>
            <div
              onClick={() => setModalOpen(true)}
              className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-[var(--hover)] transition-colors group"
            >
              <div className="relative">
                {user ? (
                  <Avatar user={user} size={44} />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-[var(--selected)]" />
                )}
                <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[10px] font-bold shadow-xs">
                  <Plus className="h-3 w-3 stroke-[3]" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-[var(--text)]">My Story</p>
                <p className="text-xs text-[var(--muted)]">Add to your story</p>
              </div>
            </div>
          </div>

          {/* Recent Updates */}
          <div>
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Recent updates
            </p>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-8 text-center">
              <p className="text-xs font-medium text-[var(--text)]">No recent updates</p>
              <p className="mt-1 text-[11px] text-[var(--muted)] leading-relaxed">
                Stories shared by your contacts will be displayed here for 24 hours.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Stories Content Area */}
      <main className="hide-mobile flex flex-1 flex-col items-center justify-center p-8 text-center">
        <div className="mx-auto max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] shadow-xs">
            <Smartphone className="h-8 w-8 stroke-[1.5]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text)]">Stories</h2>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            Share moments and updates with your contacts. Stories disappear automatically after 24 hours.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs text-[var(--muted)] shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Connect Signal on mobile to view updates shared by your contacts.</span>
          </div>
        </div>
      </main>

      {/* Story action modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--dialog-overlay)] p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--text)]">Create Story</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Create photo, video, or text stories on your mobile device to share updates with your contacts. Your stories will automatically synchronize here.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
