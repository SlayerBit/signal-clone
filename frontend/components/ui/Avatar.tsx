"use client";

import type { User } from "@/types";
import { getAvatarPreset } from "@/components/ui/AvatarPresets";

export function Avatar({
  user,
  size = 40,
  className = "",
}: {
  user: Pick<User, "display_name" | "avatar_color"> & {
    avatar_id?: string | null;
    avatar_emoji?: string | null;
  };
  size?: number;
  className?: string;
}) {
  const preset = getAvatarPreset(user.avatar_id);
  const initial = user.display_name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-medium text-white shadow-xs ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: user.avatar_color || preset?.defaultColor || "#2c6bed",
        fontSize: size * 0.42,
        lineHeight: 1,
      }}
      aria-label={`${user.display_name}'s avatar`}
    >
      {preset ? (
        preset.renderIcon({ size: Math.round(size * 0.56), className: "text-white drop-shadow-xs" })
      ) : user.avatar_emoji ? (
        <span role="img" aria-label={`${user.display_name}'s avatar`} style={{ fontSize: size * 0.5 }}>
          {user.avatar_emoji}
        </span>
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
