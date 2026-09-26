"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LogOut,
  Menu,
  Moon,
  Phone,
  Settings,
  ShieldCheck,
  Smartphone,
  Sun,
  User,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SignalLogo } from "@/components/ui/SignalLogo";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";

export function NavRail() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const setUser = useAppStore((s) => s.setUser);
  const conversations = useAppStore((s) => s.conversations);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerBtnRef = useRef<HTMLButtonElement>(null);
  const { info } = useToast();

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        drawerRef.current &&
        !drawerRef.current.contains(target) &&
        hamburgerBtnRef.current &&
        !hamburgerBtnRef.current.contains(target)
      ) {
        setDrawerOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
      }
    }
    if (drawerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [drawerOpen]);

  async function handleLogout() {
    setDrawerOpen(false);
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    info("Signed out successfully");
    router.push("/login");
  }

  return (
    <>
      <nav className="relative flex w-[60px] shrink-0 flex-col items-center border-r border-[var(--border)] bg-[var(--rail)] py-3 select-none z-30">
        {/* Menu / App Hamburger */}
        <button
          ref={hamburgerBtnRef}
          type="button"
          className={`mb-4 rounded-xl p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
            drawerOpen
              ? "bg-[var(--selected)] text-[var(--text)]"
              : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
          }`}
          aria-label="Signal Menu"
          title="Signal Menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((o) => !o)}
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
      </nav>

      {/* Compact Left-Side Account Drawer / Panel */}
      {drawerOpen && (
        <aside
          ref={drawerRef}
          aria-label="Account Menu Panel"
          className="fixed left-[60px] top-0 bottom-0 z-40 flex h-full w-[290px] max-w-[calc(100vw-60px)] flex-col border-r border-[var(--border)] bg-[var(--panel)] shadow-[6px_0_24px_rgba(0,0,0,0.06)] dark:shadow-[6px_0_24px_rgba(0,0,0,0.35)] animate-in slide-in-from-left-2 duration-150 select-none"
        >
          {/* Top Account Section */}
          {user && (
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4 pb-3.5 bg-[var(--card-bg)]">
              <Link
                href="/settings/profile"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 group flex-1 min-w-0"
                title="View Profile"
              >
                <Avatar user={user} size={46} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    {user.display_name}
                  </p>
                  <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                    {user.phone ? user.phone : `@${user.username || "user"}`}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation Actions Section */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            {/* Profile Link */}
            <Link
              href="/settings/profile"
              onClick={() => setDrawerOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            >
              <User className="h-4 w-4 text-[var(--muted)]" />
              <span>Profile</span>
            </Link>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
              onClick={() => {
                const next = theme === "dark" ? "light" : "dark";
                setTheme(next);
              }}
            >
              <span className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 text-[var(--muted)]" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--muted)]" />
                )}
                <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
              </span>
              <span className="rounded-md bg-[var(--input-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)] uppercase border border-[var(--border)]">
                {theme}
              </span>
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setDrawerOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            >
              <Settings className="h-4 w-4 text-[var(--muted)]" />
              <span>Settings</span>
            </Link>

            {/* Privacy & Security */}
            <Link
              href="/settings/privacy"
              onClick={() => setDrawerOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            >
              <ShieldCheck className="h-4 w-4 text-[var(--muted)]" />
              <span>Privacy & Security</span>
            </Link>

            {/* Donate to Signal */}
            <Link
              href="/settings/donate"
              onClick={() => setDrawerOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
            >
              <Heart className="h-4 w-4 text-[var(--muted)]" />
              <span>Donate to Signal</span>
            </Link>
          </div>

          {/* Bottom Logout Section */}
          <div className="border-t border-[var(--border)] p-3 mt-auto bg-[var(--card-bg)]">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
