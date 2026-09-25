"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  Moon,
  Phone,
  Settings,
  Smartphone,
  Sun,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SignalLogo } from "@/components/ui/SignalLogo";

export function NavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const setUser = useAppStore((s) => s.setUser);
  const conversations = useAppStore((s) => s.conversations);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [menuOpen]);

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    router.push("/login");
  }

  return (
    <nav className="relative flex w-[60px] shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--rail)] py-3 select-none z-30">
      {/* Menu / App Hamburger */}
      <button
        type="button"
        className="mb-4 rounded-xl p-2.5 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        aria-label="Signal Menu"
        title="Signal Menu"
        onClick={() => setMenuOpen((o) => !o)}
      >
        <Menu className="h-5 w-5" strokeWidth={1.8} />
      </button>

      {/* Main Navigation Items */}
      <div className="flex flex-1 flex-col items-center gap-1.5">
        {/* Chats Tab */}
        <Link
          href="/chats"
          title="Chats"
          className={`relative flex items-center justify-center rounded-xl p-2.5 transition-colors ${
            pathname.startsWith("/chats")
              ? "bg-[var(--selected)] text-[var(--text)] shadow-xs"
              : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          }`}
        >
          {pathname.startsWith("/chats") && (
            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-[var(--accent)]" />
          )}
          <SignalLogo
            size={20}
            color={pathname.startsWith("/chats") ? "currentColor" : "currentColor"}
          />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9.5px] font-bold text-white shadow-xs">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </Link>

        {/* Calls Tab */}
        <Link
          href="/calls"
          title="Calls"
          className={`relative flex items-center justify-center rounded-xl p-2.5 transition-colors ${
            pathname.startsWith("/calls")
              ? "bg-[var(--selected)] text-[var(--text)] shadow-xs"
              : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          }`}
        >
          {pathname.startsWith("/calls") && (
            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-[var(--accent)]" />
          )}
          <Phone className="h-5 w-5" strokeWidth={pathname.startsWith("/calls") ? 2.2 : 1.75} />
        </Link>

        {/* Stories Tab */}
        <Link
          href="/stories"
          title="Stories"
          className={`relative flex items-center justify-center rounded-xl p-2.5 transition-colors ${
            pathname.startsWith("/stories")
              ? "bg-[var(--selected)] text-[var(--text)] shadow-xs"
              : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          }`}
        >
          {pathname.startsWith("/stories") && (
            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-[var(--accent)]" />
          )}
          <Smartphone
            className="h-5 w-5"
            strokeWidth={pathname.startsWith("/stories") ? 2.2 : 1.75}
          />
        </Link>
      </div>

      {/* Settings Navigation */}
      <div className="flex flex-col items-center gap-1.5">
        <Link
          href="/settings"
          title="Settings"
          className={`relative rounded-xl p-2.5 transition-colors ${
            pathname.startsWith("/settings")
              ? "bg-[var(--selected)] text-[var(--text)] shadow-xs"
              : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          }`}
        >
          {pathname.startsWith("/settings") && (
            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-[var(--accent)]" />
          )}
          <Settings className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>

      {/* Hamburger Menu Popover */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute left-16 top-3 z-50 w-56 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-1.5 shadow-2xl animate-in fade-in duration-100"
        >
          {user && (
            <div className="border-b border-[var(--border)] px-3 py-2.5">
              <p className="truncate text-xs font-semibold text-[var(--text)]">
                {user.display_name}
              </p>
              <p className="truncate text-[11px] text-[var(--muted)]">
                {user.phone ? user.phone : `@${user.username}`}
              </p>
            </div>
          )}

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            onClick={() => {
              const next = theme === "dark" ? "light" : "dark";
              setTheme(next);
              setMenuOpen(false);
            }}
          >
            <span className="flex items-center gap-2">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
            </span>
            <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">
              {theme}
            </span>
          </button>

          <Link
            href="/settings"
            onClick={() => setMenuOpen(false)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
          >
            <Settings className="h-4 w-4 text-[var(--muted)]" />
            <span>Settings</span>
          </Link>

          <hr className="my-1 border-[var(--border)]" />

          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      )}
    </nav>
  );
}
