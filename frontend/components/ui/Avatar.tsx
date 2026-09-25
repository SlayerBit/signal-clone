"use client";

import type { User } from "@/types";

export function Avatar({
  user,
  size = 40,
  className = "",
}: {
  user: Pick<User, "display_name" | "avatar_color">;
  size?: number;
  className?: string;
}) {
  const initial = user.display_name?.charAt(0)?.toUpperCase() ?? "?";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-medium text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: user.avatar_color, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
