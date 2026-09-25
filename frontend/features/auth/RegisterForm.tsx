"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Moon, Sun } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

export function RegisterForm() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const [step, setStep] = useState(0);
  const [identifier, setIdentifier] = useState("");
  const [pending, setPending] = useState("");
  const [setup, setSetup] = useState("");
  const [otp, setOtp] = useState("123456");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (step === 0) {
        const r = await api.registerStart(identifier);
        setPending(r.pending_token);
        setStep(1);
      } else if (step === 1) {
        const r = await api.registerOtp(pending, otp);
        setSetup(r.setup_token);
        setStep(2);
      } else {
        await api.registerComplete(setup, displayName);
        router.push("/chats");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full max-w-md">
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
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)]">Create Account</h1>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Step {step + 1} of 3 — Register with username or phone number
          </p>
        </div>

        <div className="space-y-3">
          {step === 0 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Username or Phone Number
              </label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. alice or +919812345678"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
                autoFocus
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Verification Code (OTP)
              </label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP (123456)"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors tracking-widest text-center font-mono font-semibold"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-[var(--muted)]">Use simulated code: 123456</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Your Display Name
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alice Smith"
                className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--accent)] transition-colors"
                autoFocus
              />
            </div>
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
          {loading ? "Processing…" : step === 2 ? "Finish & Enter Signal" : "Continue"}
        </button>

        <p className="text-center text-xs text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
