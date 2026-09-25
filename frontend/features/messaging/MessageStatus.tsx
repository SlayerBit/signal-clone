import { Check, CheckCheck } from "lucide-react";

export function MessageStatus({ status }: { status: string | null }) {
  if (!status || status === "sending") {
    return <span className="text-[10px] opacity-60">…</span>;
  }
  if (status === "sent") {
    return <Check className="h-3.5 w-3.5 opacity-70" />;
  }
  if (status === "delivered") {
    return <CheckCheck className="h-3.5 w-3.5 opacity-70" />;
  }
  return <CheckCheck className="h-3.5 w-3.5 text-white opacity-100" />;
}
