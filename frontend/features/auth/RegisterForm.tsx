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
    <div
      className={`flex min-h-screen w-full flex-col justify-between transition-colors select-none ${
        theme === "dark"
          ? "bg-[#0e1628] text-[#f3f3f6]"
          : "bg-[#edf2fb] text-[#121216]"
      }`}
    >
      {/* ─── SIMPLIFIED AUTHENTICATION HEADER ─── */}
      <header
        className={`sticky top-0 z-40 flex h-18 w-full items-center justify-between border-b px-6 backdrop-blur-md transition-colors sm:px-10 lg:px-16 ${
          theme === "dark"
            ? "border-[#202c44] bg-[#121214]/95 text-[#f3f3f6]"
            : "border-slate-200/80 bg-white/95 text-[#121216]"
        }`}
      >
        {/* Left: Signal Icon + Wordmark */}
        <Link
          href="/login"
          className="flex items-center gap-3 cursor-pointer group focus-visible:outline-none"
          title="Return to Welcome page"
        >
          <SignalLogo size={38} color={signalBlue} />
          <span
            className={`text-[26px] font-extrabold tracking-tight transition-colors ${
              theme === "dark" ? "text-[#f3f3f6]" : "text-[#121216]"
            }`}
          >
            Signal
          </span>
        </Link>

        {/* Right: Theme Toggle & Back Button */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-2xs transition-colors ${
              theme === "dark"
                ? "border-[#27272c] bg-[#1a1a1e] text-[#a0a0ab] hover:bg-[#24242a] hover:text-[#f3f3f6]"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-black"
            }`}
            title="Toggle light/dark theme"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-500" />
            )}
            <span className="capitalize">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>

          {/* Back button */}
          {step > 0 ? (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2);
                if (step === 1) setOtp(["", "", "", "", "", ""]);
              }}
              className={`group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
                theme === "dark"
                  ? "border-[#27272c] bg-[#1a1a1e] text-[#a0a0ab] hover:bg-[#24242a] hover:text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-black"
              }`}
              title="Back to previous step"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
          ) : (
            <Link
              href="/login"
              className={`group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
                theme === "dark"
                  ? "border-[#27272c] bg-[#1a1a1e] text-[#a0a0ab] hover:bg-[#24242a] hover:text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-black"
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* ─── MAIN REGISTRATION CARD / CONTENT ─── */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12 animate-in fade-in duration-200">
        <div
          className={`w-full ${
            step === 2 ? "max-w-[480px]" : "max-w-[440px]"
          } rounded-3xl border p-7 sm:p-9 transition-all ${
            theme === "dark"
              ? "border-[#22314e] bg-[#141d30] shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
              : "border-[#d2dff4] bg-white shadow-[0_8px_30px_rgba(24,81,180,0.06)]"
          }`}
        >
          {/* Card Header: Title, Subtitle, and Step Progress */}
          <div className="mb-6 text-left">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2c6bed]">
                Step {step + 1} of 3
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s === step
                        ? "w-6 bg-[#2c6bed]"
                        : s < step
                        ? "w-3 bg-[#2c6bed]/50"
                        : "w-3 bg-slate-200 dark:bg-[#23314d]"
                    }`}
                  />
                ))}
              </div>
            </div>

            <h1
              className={`text-[28px] sm:text-[30px] font-extrabold leading-tight tracking-tight ${
                theme === "dark" ? "text-white" : "text-[#111827]"
              }`}
            >
              {titles[step].heading}
            </h1>
            <p
              className={`mt-2 text-[14.5px] leading-relaxed ${
                theme === "dark" ? "text-slate-300" : "text-slate-600"
              }`}
            >
              {titles[step].sub}
            </p>
          </div>

          <form onSubmit={submit} className="w-full" noValidate>
            {/* Step 0: Identifier */}
            {step === 0 && (
              <div className="mb-5">
                <label
                  htmlFor="reg-identifier"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                >
                  Username or phone number
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
                  className="h-13 sm:h-14 w-full rounded-2xl border border-slate-200 dark:border-[#2b3a58] bg-slate-50/80 dark:bg-[#18233a] px-4 text-[16px] text-slate-900 dark:text-white outline-none transition-all placeholder:text-[14.5px] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2c6bed] focus:bg-white dark:focus:bg-[#1c2842] focus:ring-4 focus:ring-[#2c6bed]/15 disabled:opacity-50 shadow-2xs"
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
                      className="h-14 w-11 sm:h-15 sm:w-13 rounded-2xl border border-slate-200 dark:border-[#2b3a58] bg-slate-50/80 dark:bg-[#18233a] text-center font-mono text-2xl font-bold text-slate-900 dark:text-white outline-none transition-all focus:border-[#2c6bed] focus:bg-white dark:focus:bg-[#1c2842] focus:ring-4 focus:ring-[#2c6bed]/15 disabled:opacity-50 shadow-2xs"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>
                <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  Demo code: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">123456</span>
                </p>
              </div>
            )}

            {/* Step 2: Display Name + Avatar */}
            {step === 2 && (
              <div className="mb-5 space-y-4">
                <div>
                  <label
                    htmlFor="reg-displayname"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
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
                    className="h-13 sm:h-14 w-full rounded-2xl border border-slate-200 dark:border-[#2b3a58] bg-slate-50/80 dark:bg-[#18233a] px-4 text-[16px] text-slate-900 dark:text-white outline-none transition-all placeholder:text-[14.5px] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#2c6bed] focus:bg-white dark:focus:bg-[#1c2842] focus:ring-4 focus:ring-[#2c6bed]/15 disabled:opacity-50 shadow-2xs"
                  />
                </div>

                {/* Avatar Picker Container */}
                <div className="rounded-2xl border border-slate-200 dark:border-[#23314d] bg-slate-50/60 dark:bg-[#18233a] p-4 shadow-2xs">
                  <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
              <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm leading-snug text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isDisabled}
              className="flex h-13 sm:h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#2c6bed] text-[16px] font-bold text-white shadow-md shadow-[#2c6bed]/25 transition-all hover:bg-[#1851B4] hover:shadow-lg hover:shadow-[#2c6bed]/30 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6bed]"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {loading
                ? "Verifying…"
                : step === 2
                ? "Finish & Enter Signal"
                : step === 1
                ? "Verify"
                : "Continue"}
            </button>

            {/* Sign in link */}
            <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#2c6bed] hover:text-[#1851B4] dark:hover:text-blue-400 transition-colors hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>

      {/* ─── AUTH FOOTER: GROUNDS THE VIEWPORT ─── */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Signal Messenger • End-to-end encrypted • 501(c)(3) nonprofit
      </footer>
    </div>
  );
}
