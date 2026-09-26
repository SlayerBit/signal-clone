"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Moon, Sun, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SignalLogo } from "@/components/ui/SignalLogo";
import { AvatarPicker } from "@/components/ui/AvatarPicker";
import { useToast } from "@/components/ui/Toast";

/* ─────────────────────────────────────────────────────────
   Registration steps:
     0 → enter username/phone
     1 → enter 6-digit OTP
     2 → set display name + choose avatar
   ───────────────────────────────────────────────────────── */

export function RegisterForm() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [identifier, setIdentifier] = useState("");
  const [pending, setPending] = useState("");
  const [setup, setSetup] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [displayName, setDisplayName] = useState("");
  const [avatarId, setAvatarId] = useState<string | null>("shield");
  const [avatarColor, setAvatarColor] = useState("#2c6bed");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP digit refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 1) {
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }
  }, [step]);

  const signalBlue = "#2c6bed";

  /* ── OTP handlers ── */
  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);
      setError("");
      if (digit && index < 5) otpRefs.current[index + 1]?.focus();
    },
    [otp]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);
      if (pasted.length > 0) {
        const next = [...otp];
        for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
        setOtp(next);
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
      }
    },
    [otp]
  );

  /* ── Submit handler ── */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (step === 0) {
        const trimmed = identifier.trim();
        if (!trimmed) {
          setError("Please enter a username or phone number.");
          setLoading(false);
          return;
        }
        const r = await api.registerStart(trimmed);
        setPending(r.pending_token);
        setOtp(["1", "2", "3", "4", "5", "6"]); // prefill demo OTP
        setStep(1);
      } else if (step === 1) {
        const otpCode = otp.join("");
        if (otpCode.length !== 6) {
          setError("Please enter the full 6-digit code.");
          setLoading(false);
          return;
        }
        const r = await api.registerOtp(pending, otpCode);
        setSetup(r.setup_token);
        setStep(2);
      } else {
        if (!displayName.trim()) {
          setError("Please enter a display name.");
          setLoading(false);
          return;
        }
        await api.registerComplete(
          setup,
          displayName.trim(),
          avatarColor,
          avatarId ?? undefined
        );
        success("Profile setup complete! Welcome to Signal.");
        router.push("/chats");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  }

  const titles = [
    { heading: "Create your account", sub: "Enter your username or phone number to get started." },
    { heading: "Enter verification code", sub: `Enter the 6-digit code to verify ${identifier || "your identity"}.` },
    { heading: "Set up your profile", sub: "Choose your name and avatar for your Signal profile." },
  ];

  const isDisabled =
    loading ||
    (step === 0 && !identifier.trim()) ||
    (step === 1 && otp.join("").length !== 6) ||
    (step === 2 && !displayName.trim());

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[var(--bg)] select-none">
      {/* Theme toggle */}
      <div className="absolute top-4 right-5 z-30">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-xs transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
          title="Toggle light/dark theme"
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5 text-amber-400" />
          ) : (
            <Moon className="h-3.5 w-3.5 text-indigo-500" />
          )}
          <span className="capitalize">{theme === "dark" ? "Light" : "Dark"} mode</span>
        </button>
      </div>

      <div className="flex min-h-screen w-full flex-col items-center justify-center px-6 py-12 animate-in fade-in duration-200">
        <div className="relative flex w-full max-w-[420px] flex-col">
          {/* Back navigation */}
          <div className="mb-6">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2);
                  if (step === 1) setOtp(["", "", "", "", "", ""]);
                }}
                className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13.5px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Back</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13.5px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Sign In</span>
              </Link>
            )}
          </div>

          {/* Branding */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex items-center gap-2.5">
              <SignalLogo size={36} color={signalBlue} />
              <span className="text-[26px] font-extrabold tracking-tight text-[var(--text)]">
                Signal
              </span>
            </div>

            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-[var(--text)]">
              {titles[step].heading}
            </h1>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">
              {titles[step].sub}
            </p>

            {/* Stepper Indicator */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {[0, 1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-8 bg-[#2c6bed]"
                      : s < step
                      ? "w-4 bg-[#2c6bed]/50"
                      : "w-4 bg-[var(--border)]"
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="w-full" noValidate>
            {/* Step 0: Identifier */}
            {step === 0 && (
              <div className="mb-4">
                <label
                  htmlFor="reg-identifier"
                  className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                >
                  Username or phone
                </label>
                <input
                  id="reg-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. alice or +919812345678"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 text-[15px] text-[var(--text)] outline-none transition-all placeholder:text-[13.5px] placeholder:text-[var(--muted)] focus:border-[#2c6bed] focus:ring-2 focus:ring-[#2c6bed]/20 disabled:opacity-50"
                />
              </div>
            )}

            {/* Step 1: OTP */}
            {step === 1 && (
              <div className="mb-5">
                <div className="flex items-center justify-center gap-2.5 sm:gap-3">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      disabled={loading}
                      className="h-13 w-11 sm:h-14 sm:w-12 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-center font-mono text-xl font-bold text-[var(--text)] outline-none transition-all focus:border-[#2c6bed] focus:ring-2 focus:ring-[#2c6bed]/20 disabled:opacity-50"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                <p className="mt-4 text-center text-[12px] text-[var(--muted)]">
                  Demo code: <span className="font-mono font-medium text-[var(--text)]">123456</span>
                </p>
              </div>
            )}

            {/* Step 2: Display Name + Avatar */}
            {step === 2 && (
              <div className="mb-4 space-y-4">
                <div>
                  <label
                    htmlFor="reg-displayname"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Display name
                  </label>
                  <input
                    id="reg-displayname"
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="e.g. Alice Smith"
                    autoFocus
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 text-[15px] text-[var(--text)] outline-none transition-all placeholder:text-[13.5px] placeholder:text-[var(--muted)] focus:border-[#2c6bed] focus:ring-2 focus:ring-[#2c6bed]/20 disabled:opacity-50"
                  />
                </div>

                {/* Avatar Picker Container */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4">
                  <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Choose your avatar
                  </p>
                  <AvatarPicker
                    selectedPresetId={avatarId}
                    selectedColor={avatarColor}
                    onPresetChange={setAvatarId}
                    onColorChange={setAvatarColor}
                    displayName={displayName || "?"}
                  />
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-center text-[13px] leading-snug text-red-500">
                {error}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isDisabled}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2c6bed] text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[#1851B4] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6bed]"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading
                ? "Verifying…"
                : step === 2
                ? "Finish & Enter Signal"
                : step === 1
                ? "Verify"
                : "Continue"}
            </button>

            {/* Sign in link */}
            <p className="mt-4 text-center text-[13px] text-[var(--muted)]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#2c6bed] transition-colors hover:underline hover:opacity-90"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
