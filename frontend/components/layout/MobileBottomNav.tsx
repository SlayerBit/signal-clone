"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Settings, Smartphone } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { SignalLogo } from "@/components/ui/SignalLogo";

/**
 * Mobile-only bottom tab bar — replaces the desktop NavRail on ≤768px viewports.
 * Mirrors the same navigation items as NavRail (Chats, Calls, Stories, Settings).
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const conversations = useAppStore((s) => s.conversations);
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  const tabs = [
    {
      href: "/chats",
      label: "Chats",
      icon: (active: boolean) => (
        <SignalLogo size={20} color={active ? "var(--accent)" : "var(--muted)"} />
      ),
      badge: totalUnread > 0 ? (totalUnread > 99 ? "99+" : String(totalUnread)) : null,
    },
    {
      href: "/calls",
      label: "Calls",
      icon: (active: boolean) => (
        <Phone className="h-5 w-5" strokeWidth={active ? 2.2 : 1.75} />
      ),
      badge: null,
    },
    {
      href: "/stories",
      label: "Stories",
      icon: (active: boolean) => (
        <Smartphone className="h-5 w-5" strokeWidth={active ? 2.2 : 1.75} />
      ),
      badge: null,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: (active: boolean) => (
        <Settings className="h-5 w-5" strokeWidth={active ? 2.2 : 1.75} />
      ),
      badge: null,
    },
  ];

  return (
    <nav className="mobile-bottom-nav show-mobile-only">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-col items-center justify-center gap-0.5 px-2 py-1 transition-colors"
            style={{ color: active ? "var(--accent)" : "var(--muted)" }}
          >
            <span className="relative">
              {tab.icon(active)}
              {tab.badge && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white shadow-xs">
                  {tab.badge}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
            {active && (
              <span
                className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[var(--accent)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
