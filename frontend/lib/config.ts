export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function wsUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;
  const base = API_URL.replace(/^http/, "ws");
  return `${base}/ws`;
}
