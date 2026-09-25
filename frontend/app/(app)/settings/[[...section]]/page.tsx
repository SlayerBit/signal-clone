"use client";

import { SettingsView } from "@/features/settings/SettingsView";
import { useAppStore } from "@/store/app-store";

export default function SettingsPage() {
  const user = useAppStore((s) => s.user);
  if (!user) return null;
  return <SettingsView user={user} />;
}
