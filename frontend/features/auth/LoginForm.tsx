"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Moon, Shield, Sun } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

export function LoginForm() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const [identifier, setIdentifier] = useState("om");
  const [password, setPassword] = useState("123456");
  const [otpMode, setOtpMode] = useState(false);
  const [pending, setPending] = useState("");
  const [otp, setOtp] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (otpMode && pending) {
        await api.loginOtp(pending, otp);
      } else if (otpMode) {
        const r = await api.loginStart(identifier);
        setPending(r.pending_token);
        setLoading(false);
        return;
      } else {
        await api.loginPassword(identifier, password);
      }
      router.push("/chats");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Theme quick switcher on auth screen */}
      <div className="absolute -top-12 right-0">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors shadow-xs"
        >
          {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span className="capitalize">{theme === "dark" ? "Light" : "Dark"} mode</span>
        </button>
      </div>

      <form
        onSubmit={submit}
        className="w-full space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-8 shadow-xl"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent)] text-white shadow-md">
            <MessageSquare className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Signal</h1>
          <p className="mt-1 text-xs text-[var(--muted)]">
            End-to-end encrypted desktop messaging
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3 text-xs text-[var(--muted)] space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-[var(--text)]">
            <Shield className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Seed accounts ready for testing:</span>
          </div>
          <p>
            User: <code className="text-[var(--text)]">om</code> (password: <code className="text-[var(--text)]">123456</code>)
          </p>
          <p>
            User: <code className="text-[var(--text)]">rahul</code> (password: <code className="text-[var(--text)]">123456</code>)
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              Username or Phone
            </label>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. om or +919876543210"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          {!otpMode ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          ) : (
            pending && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Verification Code (OTP)
                </label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP (123456)"
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors tracking-widest text-center font-mono font-semibold"
                />
              </div>
            )
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 border border-red-500/20">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in…" : otpMode && !pending ? "Send OTP" : "Continue"}
        </button>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            className="text-xs font-medium text-[var(--accent)] hover:underline"
            onClick={() => {
              setOtpMode((v) => !v);
              setError("");
              setPending("");
            }}
          >
            {otpMode ? "Use password instead" : "Use mock OTP instead"}
          </button>

          <Link href="/register" className="text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors">
            Register new account
          </Link>
        </div>
      </form>
    </div>
  );
}
