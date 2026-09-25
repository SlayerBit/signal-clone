import { LucideIcon } from "lucide-react";

export function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 text-[var(--muted)]">
      <Icon className="h-16 w-16 opacity-40" strokeWidth={1.2} />
      <p className="text-lg font-semibold text-[var(--text)]">{title}</p>
      <p className="max-w-sm text-center text-sm">{description}</p>
      <span className="mt-2 rounded-full border border-[var(--border)] px-4 py-1 text-xs uppercase tracking-wide">
        Coming Soon
      </span>
    </div>
  );
}
