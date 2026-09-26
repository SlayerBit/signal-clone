"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  Database,
  Eye,
  Globe,
  Heart,
  Lock,
  MessageSquare,
  Moon,
  Monitor,
  Palette,
  Phone,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Sun,
  Tablet,
  User,
  Copy,
  Loader2,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import type { User as UserType } from "@/types";

const nav = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/donate", label: "Donate to Signal", icon: Heart },
  { divider: true },
  { href: "/settings/general", label: "General", icon: SettingsIcon },
  { href: "/settings/appearance", label: "Appearance", icon: Eye },
  { href: "/settings/chats", label: "Chats", icon: MessageSquare },
  { href: "/settings/calls", label: "Calls", icon: Phone },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/privacy", label: "Privacy", icon: Lock },
  { href: "/settings/linked-devices", label: "Linked Devices", icon: Smartphone },
  { href: "/settings/data-usage", label: "Data usage", icon: Globe },
  { href: "/settings/backups", label: "Backups", icon: Database },
];

const CHAT_COLORS = [
  { name: "Signal Blue", value: "#2c6bed" },
  { name: "Emerald", value: "#10b981" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Crimson", value: "#ef4444" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Graphite", value: "#64748b" },
];

export function SettingsView({ user }: { user: UserType }) {
  const pathname = usePathname();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const chatColor = useAppStore((s) => s.chatColor);
  const setChatColor = useAppStore((s) => s.setChatColor);

  const appUser = useAppStore((s) => s.user) || user;
  const setUser = useAppStore((s) => s.setUser);
  const { success, error: toastError } = useToast();

  const [displayName, setDisplayName] = useState(appUser.display_name);
  const [avatarId, setAvatarId] = useState<string | null>(appUser.avatar_id ?? null);
  const [avatarColor, setAvatarColor] = useState(appUser.avatar_color || "#2c6bed");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedSafetyNumber, setCopiedSafetyNumber] = useState(false);

  // Avatar Modal State
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [tempAvatarId, setTempAvatarId] = useState<string | null>(avatarId);
  const [tempAvatarColor, setTempAvatarColor] = useState(avatarColor);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && avatarModalOpen) {
        setAvatarModalOpen(false);
      }
    };
    if (avatarModalOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [avatarModalOpen]);

  const handleOpenAvatarModal = () => {
    setTempAvatarId(avatarId);
    setTempAvatarColor(avatarColor);
    setAvatarModalOpen(true);
  };

  const handleApplyAvatar = () => {
    setAvatarId(tempAvatarId);
    setAvatarColor(tempAvatarColor);
    setAvatarModalOpen(false);
  };

  // Local settings toggles state for realistic interactive feel
  const [enterToSend, setEnterToSend] = useState(true);
  const [spellCheck, setSpellCheck] = useState(true);
  const [linkPreviews, setLinkPreviews] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationSounds, setNotificationSounds] = useState(true);
  const [reactionNotifs, setReactionNotifs] = useState(true);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toastError("Display name cannot be empty");
      return;
    }
    setIsSavingProfile(true);
    try {
      const updated = await api.updateProfile({
        display_name: displayName.trim(),
        avatar_id: avatarId,
        avatar_color: avatarColor,
      });
      setUser(updated);
      success("Profile updated successfully");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCopySafetyNumber = () => {
    navigator.clipboard.writeText("34091 88301 29402 77192 38401 92831");
    setCopiedSafetyNumber(true);
    success("Safety number copied to clipboard");
    setTimeout(() => setCopiedSafetyNumber(false), 2000);
  };

  const isRootSettings = pathname === "/settings" || pathname === "/settings/";
  const rawSection = pathname.replace(/^\/settings\/?/, "").split("/")[0];
  const section =
    !rawSection || rawSection === "settings" || rawSection === "profile" || rawSection === "account"
      ? "profile"
      : rawSection;

  const isItemActive = (href?: string) => {
    if (!href) return false;
    if (href === "/settings/profile" || href === "/settings/account") {
      return (
        pathname === "/settings" ||
        pathname === "/settings/" ||
        pathname === "/settings/profile" ||
        pathname === "/settings/account"
      );
    }
    if (href === "/settings/data-usage" || href === "/settings/data") {
      return pathname === "/settings/data-usage" || pathname === "/settings/data";
    }
    return pathname === href;
  };

  return (
    <div className="flex h-full flex-1 overflow-hidden bg-[var(--bg)]">
      {/* Settings Navigation Sidebar */}
      <aside
        className={`${
          isRootSettings ? "sidebar-responsive" : "hide-mobile"
        } w-[280px] shrink-0 border-r border-[var(--border)] bg-[var(--panel)] p-4 overflow-y-auto`}
      >
        <h1 className="mb-4 text-xl font-bold text-[var(--text)]">Settings</h1>

        {/* Profile Card in sidebar */}
        <Link
          href="/settings/profile"
          className="mb-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 hover:border-[var(--accent)] transition-colors group"
        >
          <Avatar user={user} size={44} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate text-[var(--text)]">{user.display_name}</p>
            <p className="text-xs text-[var(--muted)] truncate">
              {user.phone ? user.phone : `@${user.username || "user"}`}
            </p>
          </div>
        </Link>

        {/* Navigation list */}
        <nav className="space-y-0.5">
          {nav.map((item, i) =>
            "divider" in item ? (
              <hr key={i} className="my-2 border-[var(--border)]" />
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isItemActive(item.href)
                    ? "bg-[var(--selected)] text-[var(--text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                }`}
              >
                {item.icon && (
                  <item.icon
                    className={`h-4 w-4 ${
                      isItemActive(item.href) ? "text-[var(--accent)]" : "text-[var(--muted)]"
                    }`}
                  />
                )}
                {item.label}
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* Main Settings Content Area */}
      <main
        className={`${
          isRootSettings ? "hide-mobile" : "flex"
        } flex-1 flex-col overflow-y-auto p-4 sm:p-8`}
      >
        <div className="mx-auto w-full max-w-2xl space-y-6">
          {!isRootSettings && (
            <Link
              href="/settings"
              className="show-mobile-only inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Settings</span>
            </Link>
          )}
          <h2 className="text-xl font-bold capitalize text-[var(--text)]">
            {section.replace("-", " ")}
          </h2>

          {/* PROFILE SECTION */}
          {section === "profile" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 space-y-6 shadow-xs">
                {/* Main Profile Card Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <Avatar
                        user={{
                          ...appUser,
                          display_name: displayName,
                          avatar_id: avatarId,
                          avatar_color: avatarColor,
                        }}
                        size={72}
                      />
                      <button
                        type="button"
                        onClick={handleOpenAvatarModal}
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-md hover:scale-110 active:scale-95 transition-all"
                        title="Change avatar"
                        aria-label="Change avatar"
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[var(--text)] leading-tight">
                        {displayName || appUser.display_name}
                      </h3>
                      <p className="text-xs text-[var(--muted)] mt-0.5">
                        {appUser.phone ? `Phone: ${appUser.phone}` : `@${appUser.username || "user"}`}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                        Active Account
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAvatarModal}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-xs font-semibold text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--hover)] transition-all shadow-xs"
                  >
                    <Palette className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>Change avatar</span>
                  </button>
                </div>

                {/* Profile Fields */}
                <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Display Name
                    </label>
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Phone Number
                    </label>
                    <input
                      defaultValue={appUser.phone ?? "Not configured"}
                      readOnly
                      className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-sm text-[var(--muted)] outline-none opacity-80 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                      Username
                    </label>
                    <input
                      defaultValue={appUser.username ? `@${appUser.username}` : "None"}
                      readOnly
                      className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3.5 py-2.5 text-sm text-[var(--muted)] outline-none opacity-80 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all shadow-xs"
                    >
                      {isSavingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save Profile
                    </button>
                  </div>
                </div>
              </div>

              {/* Change Avatar Modal Dialog */}
              {avatarModalOpen && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150"
                  onClick={() => setAvatarModalOpen(false)}
                >
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="change-avatar-title"
                    className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 id="change-avatar-title" className="text-lg font-bold text-[var(--text)]">Change avatar</h3>
                      <button
                        type="button"
                        onClick={() => setAvatarModalOpen(false)}
                        aria-label="Close dialog"
                        className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="py-2">
                      <AvatarPicker
                        selectedPresetId={tempAvatarId}
                        selectedColor={tempAvatarColor}
                        onPresetChange={setTempAvatarId}
                        onColorChange={setTempAvatarColor}
                        displayName={displayName || appUser.display_name}
                      />
                    </div>

                    <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setAvatarModalOpen(false)}
                        className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyAvatar}
                        className="rounded-xl bg-[var(--accent)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* End-to-End Encryption Verification card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-[var(--text)]">
                      End-to-End Encryption
                    </h4>
                    <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
                      Messages and calls are secured with simulated Double Ratchet encryption in this demo. Your safety number is verified across active sessions.
                    </p>
                    <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--input-bg)] border border-[var(--border)] px-3 py-2">
                      <span className="font-mono text-xs text-[var(--muted)] tracking-wider">
                        34091 88301 29402 77192 38401 92831
                      </span>
                      <button
                        type="button"
                        onClick={handleCopySafetyNumber}
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
                        aria-label="Copy safety number"
                      >
                        {copiedSafetyNumber ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-[var(--muted)]" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SECTION (THEME SWITCHING & CHAT COLOR) */}
          {section === "appearance" && (
            <div className="space-y-6">
              {/* Theme Selector */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-xs">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-4">
                  Theme
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Dark Theme Card */}
                  <div
                    onClick={() => setTheme("dark")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      theme === "dark"
                        ? "border-[var(--accent)] bg-[var(--selected)] shadow-xs ring-1 ring-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-100">
                          <Moon className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm text-[var(--text)]">Signal Dark</span>
                      </div>
                      {theme === "dark" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-full rounded-lg bg-zinc-950 p-2 flex flex-col justify-end">
                      <div className="h-3 w-16 rounded-full bg-[#2c6bed] self-end mb-1" />
                      <div className="h-3 w-20 rounded-full bg-zinc-800" />
                    </div>
                  </div>

                  {/* Light Theme Card */}
                  <div
                    onClick={() => setTheme("light")}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      theme === "light"
                        ? "border-[var(--accent)] bg-[var(--selected)] shadow-xs ring-1 ring-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                          <Sun className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm text-[var(--text)]">Signal Light</span>
                      </div>
                      {theme === "light" && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-full rounded-lg bg-zinc-100 p-2 flex flex-col justify-end border border-zinc-200">
                      <div className="h-3 w-16 rounded-full bg-[#2c6bed] self-end mb-1" />
                      <div className="h-3 w-20 rounded-full bg-zinc-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Color Selector */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-xs">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">
                  Chat Color
                </h3>
                <p className="text-xs text-[var(--muted)] mb-4">
                  Select your preferred accent color for outgoing message bubbles and key controls.
                </p>
                <div className="flex flex-wrap gap-3">
                  {CHAT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setChatColor(c.value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                        chatColor === c.value
                          ? "border-[var(--text)] bg-[var(--selected)] shadow-xs font-semibold"
                          : "border-[var(--border)] hover:bg-[var(--hover)]"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full shadow-xs"
                        style={{ backgroundColor: c.value }}
                      />
                      <span>{c.name}</span>
                      {chatColor === c.value && <Check className="h-3 w-3 ml-1" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zoom & Text scale */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">Message Text Size</h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Adjust text scaling for comfortable reading on desktop.
                  </p>
                </div>
                <span className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text)]">
                  100% (Default)
                </span>
              </div>
            </div>
          )}

          {/* CHATS SETTINGS */}
          {section === "chats" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 space-y-4 shadow-xs">
              <label className="flex cursor-pointer items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Press Enter to send</p>
                  <p className="text-xs text-[var(--muted)]">Send messages immediately on Enter; use Shift+Enter for newlines.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enterToSend}
                  onChange={(e) => setEnterToSend(e.target.checked)}
                  className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer"
                />
              </label>

              <hr className="border-[var(--border)]" />

              <label className="flex cursor-pointer items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Spell check</p>
                  <p className="text-xs text-[var(--muted)]">Check spelling of text entered in message fields.</p>
                </div>
                <input
                  type="checkbox"
                  checked={spellCheck}
                  onChange={(e) => setSpellCheck(e.target.checked)}
                  className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer"
                />
              </label>

              <hr className="border-[var(--border)]" />

              <label className="flex cursor-pointer items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Generate link previews</p>
                  <p className="text-xs text-[var(--muted)]">Retrieve previews for links sent in messages.</p>
                </div>
                <input
                  type="checkbox"
                  checked={linkPreviews}
                  onChange={(e) => setLinkPreviews(e.target.checked)}
                  className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* NOTIFICATIONS SETTINGS */}
          {section === "notifications" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 space-y-4 shadow-xs">
              <label className="flex cursor-pointer items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Show notifications</p>
                  <p className="text-xs text-[var(--muted)]">Display desktop alerts for incoming messages.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer"
                />
              </label>

              <hr className="border-[var(--border)]" />

              <label className="flex cursor-pointer items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Notification sounds</p>
                  <p className="text-xs text-[var(--muted)]">Play audio tone when messages arrive.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSounds}
                  onChange={(e) => setNotificationSounds(e.target.checked)}
                  className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer"
                />
              </label>

              <hr className="border-[var(--border)]" />

              <label className="flex cursor-pointer items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Reaction notifications</p>
                  <p className="text-xs text-[var(--muted)]">Notify when someone reacts to your messages.</p>
                </div>
                <input
                  type="checkbox"
                  checked={reactionNotifs}
                  onChange={(e) => setReactionNotifs(e.target.checked)}
                  className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* PRIVACY SETTINGS */}
          {section === "privacy" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 space-y-4 shadow-xs">
              <label className="flex cursor-pointer items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Read receipts</p>
                  <p className="text-xs text-[var(--muted)]">If disabled, you won&apos;t be able to see read receipts from other people.</p>
                </div>
                <input
                  type="checkbox"
                  checked={readReceipts}
                  onChange={(e) => setReadReceipts(e.target.checked)}
                  className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer"
                />
              </label>

              <hr className="border-[var(--border)]" />

              <label className="flex cursor-pointer items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Typing indicators</p>
                  <p className="text-xs text-[var(--muted)]">If disabled, you won&apos;t be able to see typing indicators from other people.</p>
                </div>
                <input
                  type="checkbox"
                  checked={typingIndicators}
                  onChange={(e) => setTypingIndicators(e.target.checked)}
                  className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer"
                />
              </label>

              <hr className="border-[var(--border)]" />

              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Blocked users</p>
                  <p className="text-xs text-[var(--muted)]">No users currently blocked.</p>
                </div>
                <span className="text-xs text-[var(--muted)] font-medium">0 contacts</span>
              </div>
            </div>
          )}

          {/* LINKED DEVICES (PLACEHOLDER) */}
          {section === "linked-devices" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)]">This Device</h3>
                    <p className="text-xs text-[var(--muted)]">Signal Desktop — Active Session</p>
                  </div>
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                </div>
              </div>

              {/* Informational placeholder state */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 space-y-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--hover)] text-[var(--muted)]">
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[var(--text)]">
                        Secondary Device Linking
                      </h4>
                      <span className="rounded-full bg-[var(--hover)] border border-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">
                        Coming Soon
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed">
                      Linked devices aren&apos;t available in this demo yet. In the full Signal client, you can pair mobile phones and secondary computers by scanning a secure cryptographic QR code. All linked sessions synchronize message history and encryption ratchets securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DATA USAGE */}
          {section === "data-usage" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 space-y-4 shadow-xs">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                Media Auto-Download
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text)]">Photos</span>
                  <span className="text-xs text-[var(--muted)] font-medium">Always</span>
                </div>
                <hr className="border-[var(--border)]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text)]">Voice Notes</span>
                  <span className="text-xs text-[var(--muted)] font-medium">Always</span>
                </div>
                <hr className="border-[var(--border)]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text)]">Documents & Files</span>
                  <span className="text-xs text-[var(--muted)] font-medium">Manual</span>
                </div>
              </div>
            </div>
          )}

          {/* BACKUPS */}
          {section === "backups" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)]">Encrypted Local Backups</h3>
                  <p className="text-xs text-[var(--muted)]">Backups are secured with a 30-digit passphrase.</p>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 text-xs text-[var(--muted)] space-y-1">
                <p>Status: <span className="text-emerald-500 font-medium">Enabled</span></p>
                <p>Location: ~/Signal/Backups</p>
                <p>Last backup: Today at 03:00 AM</p>
              </div>
            </div>
          )}

          {/* DONATE */}
          {section === "donate" && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 text-center space-y-4 shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
                <Heart className="h-7 w-7 fill-rose-500/20" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text)]">Donate to Signal</h3>
              <p className="mx-auto max-w-md text-xs text-[var(--muted)] leading-relaxed">
                Signal is an independent, non-profit organization. We are not backed by any major tech companies, and we can never be acquired by one either. Development is supported by donations from people like you.
              </p>
            </div>
          )}

          {/* GENERAL & CALLS */}
          {(section === "general" || section === "calls") && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">
                    {section === "general" ? "Launch at system startup" : "Incoming call ringing"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {section === "general"
                      ? "Automatically open Signal when logging in to your desktop."
                      : "Play standard Signal chime on incoming voice or video calls."}
                  </p>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded-sm accent-[var(--accent)] cursor-pointer" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
