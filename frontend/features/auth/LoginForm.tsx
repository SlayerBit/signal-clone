"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Globe,
  Heart,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  Moon,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Users,
  X,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SignalLogo } from "@/components/ui/SignalLogo";
import { useToast } from "@/components/ui/Toast";

/* ─────────────────────────────────────────────────────────
   Auth stages:
     "welcome"   → Signal.org-style Landing / Welcome page
     "identify"  → Sign in (username/phone)
     "otp"       → Enter 6-digit verification code
   ───────────────────────────────────────────────────────── */

export function LoginForm() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const { success, error: toastError } = useToast();

  const [stage, setStage] = useState<"welcome" | "identify" | "otp">("welcome");
  const [identifier, setIdentifier] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // OTP digit refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP box on stage change
  useEffect(() => {
    if (stage === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 80);
    }
  }, [stage]);

  /* ── Handlers ──────────────────────────────────── */

  const handleIdentifySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = identifier.trim();
      if (!trimmed) {
        setError("Please enter a username or phone number.");
        return;
      }
      setError("");
      setLoading(true);
      try {
        const r = await api.loginStart(trimmed);
        setPendingToken(r.pending_token);
        setOtp(["1", "2", "3", "4", "5", "6"]); // prefill demo OTP
        setStage("otp");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not verify identity.";
        setError(msg);
        toastError(msg);
      } finally {
        setLoading(false);
      }
    },
    [identifier, toastError]
  );

  const handleOtpSubmit = useCallback(
    async (code?: string) => {
      const otpCode = code || otp.join("");
      if (otpCode.length !== 6) {
        setError("Please enter the full 6-digit code.");
        return;
      }
      setError("");
      setLoading(true);
      try {
        await api.loginOtp(pendingToken, otpCode);
        success("Signed in successfully");
        router.push("/chats");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid code. Please try again.";
        setError(msg);
        toastError(msg);
        setLoading(false);
      }
    },
    [otp, pendingToken, router, success, toastError]
  );

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);
      setError("");

      if (digit && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }

      if (digit && index === 5) {
        const full = next.join("");
        if (full.length === 6) {
          handleOtpSubmit(full);
        }
      }
    },
    [otp, handleOtpSubmit]
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
        for (let i = 0; i < 6; i++) {
          next[i] = pasted[i] || "";
        }
        setOtp(next);
        const focusIdx = Math.min(pasted.length, 5);
        otpRefs.current[focusIdx]?.focus();
        if (pasted.length === 6) {
          handleOtpSubmit(pasted);
        }
      }
    },
    [otp, handleOtpSubmit]
  );

  const fillDemoUser = useCallback((username: string) => {
    setIdentifier(username);
    setError("");
  }, []);

  const goBackFromAuth = useCallback(() => {
    setError("");
    if (stage === "otp") {
      setStage("identify");
      setOtp(["", "", "", "", "", ""]);
      setPendingToken("");
    } else {
      setStage("welcome");
      setIdentifier("");
    }
  }, [stage]);

  const signalBlue = "#2c6bed";

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[var(--bg)] text-[var(--text)] select-none">
      {/* ═══════════════════════════════════════════════════
          STAGE 1: SIGNAL.ORG-STYLE WELCOME LANDING PAGE
          ═══════════════════════════════════════════════════ */}
      {stage === "welcome" ? (
        <div className="flex w-full flex-col animate-in fade-in duration-300">
          {/* ─── 1. CLEAN NAVIGATION / HEADER ─── */}
          <header className="sticky top-0 z-40 flex h-18 w-full items-center justify-between border-b border-[var(--border)] bg-white/95 px-6 backdrop-blur-md dark:bg-[#121214]/95 sm:px-10 lg:px-16">
            {/* Left: Signal Icon + Wordmark */}
            <div className="flex items-center gap-3">
              <SignalLogo size={36} color={signalBlue} />
              <span className="text-[26px] font-extrabold tracking-tight text-[#121216] dark:text-[#f3f3f6]">
                Signal
              </span>
            </div>

            {/* Right Navigation links */}
            <nav className="flex items-center gap-2 sm:gap-4 lg:gap-7 text-sm font-medium text-[var(--text-secondary)]">
              <button
                type="button"
                onClick={() => setStage("identify")}
                className="hidden font-semibold text-[#2c6bed] hover:underline md:inline-block"
              >
                Get Signal
              </button>
              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="hidden hover:text-[var(--text)] md:inline-block transition-colors"
              >
                Help
              </button>
              <a
                href="https://signal.org/blog"
                target="_blank"
                rel="noreferrer"
                className="hidden hover:text-[var(--text)] lg:inline-block transition-colors"
              >
                Blog
              </a>
              <a
                href="https://signal.org/docs"
                target="_blank"
                rel="noreferrer"
                className="hidden hover:text-[var(--text)] lg:inline-block transition-colors"
              >
                Developers
              </a>
              <a
                href="https://signal.org/work-at-signal"
                target="_blank"
                rel="noreferrer"
                className="hidden hover:text-[var(--text)] xl:inline-block transition-colors"
              >
                Careers
              </a>
              <button
                type="button"
                onClick={() => setDonateModalOpen(true)}
                className="hidden hover:text-[var(--text)] sm:inline-block transition-colors"
              >
                Donate
              </button>
              <div className="hidden items-center gap-1 text-xs text-[var(--muted)] sm:flex">
                <Globe className="h-3.5 w-3.5" />
                <span>English</span>
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--text-secondary)] shadow-xs transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
                title="Toggle light/dark theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Moon className="h-3.5 w-3.5 text-indigo-500" />
                )}
                <span className="capitalize">{theme === "dark" ? "Light" : "Dark"}</span>
              </button>

              {/* Primary Mobile/Desktop CTA in Header */}
              <button
                type="button"
                onClick={() => setStage("identify")}
                className="rounded-full bg-[#2c6bed] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#1851B4] active:scale-95 sm:text-sm"
              >
                Sign in
              </button>
            </nav>
          </header>

          {/* ─── 2. LARGE LIGHT-BLUE HERO SECTION ─── */}
          <section
            className="relative w-full overflow-hidden transition-colors"
            style={{
              background:
                theme === "dark"
                  ? "linear-gradient(175deg, #15233c 0%, #111a2d 60%, #0d1423 100%)"
                  : "#9dbbf9",
            }}
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between px-6 pt-12 pb-0 sm:px-10 sm:pt-16 lg:flex-row lg:items-end lg:px-16 lg:pt-20">
              {/* Left Column: Speak Freely & CTAs */}
              <div className="z-10 flex w-full flex-col items-start text-left lg:max-w-xl pb-12 sm:pb-16 lg:pb-24">
                <h1 className="text-5xl font-extrabold tracking-tight text-[#111827] dark:text-white sm:text-6xl lg:text-7xl leading-[1.06]">
                  Speak Freely
                </h1>
                <p className="mt-6 text-lg font-normal leading-relaxed text-[#1f2937]/90 dark:text-slate-200 sm:text-xl max-w-lg">
                  Say &quot;hello&quot; to a different messaging experience. An unexpected focus on privacy,
                  combined with all of the features you expect.
                </p>

                {/* Primary CTA Button */}
                <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
                  <button
                    type="button"
                    onClick={() => setStage("identify")}
                    className="flex h-14 items-center justify-center rounded-full bg-white px-8 text-[16px] font-bold text-[#2c6bed] shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl hover:scale-102 active:scale-98 dark:bg-white dark:text-[#2c6bed]"
                  >
                    Get Signal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreModalOpen(true)}
                    className="text-sm font-semibold text-[#111827] underline decoration-slate-400 underline-offset-4 transition-colors hover:text-[#2c6bed] dark:text-slate-200"
                  >
                    Restore or transfer
                  </button>
                </div>

                <div className="mt-6 flex items-center gap-2 text-xs font-medium text-[#1f2937]/75 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-[#2c6bed] dark:text-blue-400" />
                  <span>Free, open source, and nonprofit. No ads, no trackers.</span>
                </div>
              </div>

              {/* Right Column: Floating Two-Phone Artwork */}
              <div className="relative mt-8 flex w-full items-end justify-center lg:mt-0 lg:w-1/2 lg:justify-end">
                <img
                  src="/signal-hero-phones.png"
                  alt="Signal encrypted messenger phone screens"
                  className="max-h-[460px] w-auto max-w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)] sm:max-h-[560px] lg:max-h-[640px] object-contain transition-transform duration-300 hover:scale-101 select-none"
                />
              </div>
            </div>
          </section>

          {/* ─── 3. WHITE "WHY USE SIGNAL?" SECTION ─── */}
          <section className="w-full bg-white py-20 px-6 dark:bg-[var(--bg)] sm:py-28 sm:px-10 lg:px-16">
            <div className="mx-auto max-w-6xl">
              {/* Section Headline */}
              <div className="mb-16 text-center sm:mb-20">
                <h2 className="text-4xl font-extrabold tracking-tight text-[var(--text)] sm:text-5xl">
                  Why use Signal?
                </h2>
                <p className="mt-3 text-base text-[var(--muted)] sm:text-lg">
                  Explore below to see why Signal is a simple, powerful, and secure messenger
                </p>
              </div>

              {/* Feature 1: Share Without Insecurity (Reference Card Asset) */}
              <div className="mb-20 grid grid-cols-1 items-center gap-10 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-8 shadow-sm lg:grid-cols-12 lg:gap-14 lg:p-14">
                <div className="flex flex-col lg:col-span-6">
                  <h3 className="text-3xl font-extrabold tracking-tight text-[var(--text)] sm:text-4xl">
                    Share Without Insecurity
                  </h3>
                  <p className="mt-5 text-base leading-relaxed text-[var(--muted)] sm:text-lg">
                    State-of-the-art end-to-end encryption (powered by the open source Signal Protocol)
                    keeps your conversations secure. We can&apos;t read your messages or listen to your
                    calls, and no one else can either. Privacy isn&apos;t an optional mode — it&apos;s
                    just the way that Signal works. Every message, every call, every time.
                  </p>
                  <div className="mt-6 flex items-center gap-3 text-sm font-semibold text-[#2c6bed]">
                    <Lock className="h-4 w-4" />
                    <span>Always encrypted by default</span>
                  </div>
                </div>
                <div className="flex justify-center lg:col-span-6">
                  <img
                    src="/signal-encryption-card.png"
                    alt="End-to-end encrypted messaging interface"
                    className="max-h-[380px] w-auto max-w-full rounded-2xl drop-shadow-md object-contain"
                  />
                </div>
              </div>

              {/* Feature Grid: 3 Pillars */}
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-xs">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2c6bed]/10 text-[#2c6bed]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--text)]">Say Anything</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Share text, voice messages, photos, videos, GIFs and files for free. Signal uses your
                    device&apos;s data connection so you avoid SMS and MMS fees.
                  </p>
                </div>

                <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-xs">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2c6bed]/10 text-[#2c6bed]">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--text)]">No Ads. No Trackers.</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    There are no ads, no affiliate marketers, and no creepy tracking in Signal. Focus on
                    sharing the moments that matter with the people who matter to you.
                  </p>
                </div>

                <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-xs">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#2c6bed]/10 text-[#2c6bed]">
                    <Heart className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-bold text-[var(--text)]">Free for Everyone</h4>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    Signal is an independent 501(c)(3) nonprofit. We aren&apos;t tied to any major tech
                    companies, and we can never be acquired by one either.
                  </p>
                </div>
              </div>

              {/* Bottom CTA Banner */}
              <div className="mt-20 flex flex-col items-center justify-between gap-6 rounded-3xl bg-gradient-to-r from-[#2c6bed] to-[#1851B4] p-8 text-center text-white sm:flex-row sm:p-12 sm:text-left">
                <div>
                  <h3 className="text-2xl font-bold sm:text-3xl">Get Signal today</h3>
                  <p className="mt-1 text-sm text-blue-100 sm:text-base">
                    Take privacy with you and be yourself in every message.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStage("identify")}
                  className="rounded-full bg-white px-8 py-3.5 text-base font-bold text-[#2c6bed] shadow-md transition-all hover:bg-slate-50 hover:shadow-lg active:scale-95"
                >
                  Enter Signal
                </button>
              </div>
            </div>
          </section>

          {/* ─── 4. FOOTER ─── */}
          <footer className="border-t border-[var(--border)] bg-[var(--panel)] py-10 px-6 sm:px-10 lg:px-16">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-[var(--muted)] sm:flex-row">
              <div className="flex items-center gap-2">
                <SignalLogo size={20} color={signalBlue} />
                <span className="font-semibold text-[var(--text)]">Signal Clone</span>
                <span>• 501(c)(3) nonprofit</span>
              </div>
              <div className="flex items-center gap-5">
                <button
                  type="button"
                  onClick={() => setTermsModalOpen(true)}
                  className="hover:text-[var(--text)] hover:underline transition-colors"
                >
                  Terms & Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => setDonateModalOpen(true)}
                  className="hover:text-[var(--text)] hover:underline transition-colors"
                >
                  Donate
                </button>
                <Link
                  href="/register"
                  className="font-medium text-[#2c6bed] hover:underline"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════
           STAGE 2 & 3: AUTHENTICATION (IDENTIFY + OTP)
           ═══════════════════════════════════════════════════ */
        <div className="flex min-h-screen w-full flex-col items-center justify-center px-6 py-12 animate-in fade-in duration-200">
          <div className="relative flex w-full max-w-[420px] flex-col">
            {/* Back button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={goBackFromAuth}
                className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13.5px] font-medium text-[var(--muted)] transition-colors hover:bg-[var(--hover)] hover:text-[var(--text)]"
                title={stage === "otp" ? "Back to sign in" : "Back to welcome page"}
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Back</span>
              </button>
            </div>

            {/* Branding */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex items-center gap-2.5">
                <SignalLogo size={36} color={signalBlue} />
                <span className="text-[26px] font-extrabold tracking-tight text-[var(--text)]">
                  Signal
                </span>
              </div>

              {stage === "identify" ? (
                <>
                  <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[var(--text)]">
                    Sign in to Signal
                  </h2>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">
                    Enter your username or phone number to continue.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[var(--text)]">
                    Enter verification code
                  </h2>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--muted)]">
                    Enter the 6-digit code to continue as{" "}
                    <span className="font-semibold text-[var(--text)]">{identifier}</span>
                  </p>
                </>
              )}
            </div>

            {stage === "identify" ? (
              /* ── IDENTIFY FORM ── */
              <form onSubmit={handleIdentifySubmit} className="w-full" noValidate>
                <div className="mb-4">
                  <label
                    htmlFor="auth-identifier"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]"
                  >
                    Username or phone
                  </label>
                  <input
                    id="auth-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="e.g. om or +919842946728"
                    autoComplete="username"
                    autoFocus
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 text-[15px] text-[var(--text)] outline-none transition-all placeholder:text-[13.5px] placeholder:text-[var(--muted)] focus:border-[#2c6bed] focus:ring-2 focus:ring-[#2c6bed]/20 disabled:opacity-50"
                  />
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-[13px] leading-snug text-red-500">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !identifier.trim()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2c6bed] text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[#1851B4] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6bed]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Verifying…" : "Continue"}
                </button>

                <div className="mt-4 text-center">
                  <Link
                    href="/register"
                    className="text-[13px] font-medium text-[#2c6bed] transition-colors hover:underline hover:opacity-90"
                  >
                    Don&apos;t have an account? Create one
                  </Link>
                </div>

                {/* Demo Accounts Pill Accordion */}
                <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                      <KeyRound className="h-3 w-3 text-[#2c6bed]" />
                      Quick Test Accounts
                    </span>
                    <span className="font-mono text-[10.5px]">OTP: 123456</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[
                      { key: "om", label: "Om" },
                      { key: "rahul", label: "Rahul" },
                    ].map((user) => (
                      <button
                        key={user.key}
                        type="button"
                        onClick={() => fillDemoUser(user.key)}
                        className={`flex-1 rounded-lg border py-1.5 text-[12px] font-medium transition-all ${
                          identifier === user.key
                            ? "border-[#2c6bed] bg-[#2c6bed]/10 text-[#2c6bed]"
                            : "border-[var(--border)] bg-transparent text-[var(--text-secondary)] hover:bg-[var(--hover)] hover:text-[var(--text)]"
                        }`}
                      >
                        {user.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              /* ── OTP FORM ── */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleOtpSubmit();
                }}
                className="w-full"
                noValidate
              >
                <div className="mb-6 flex items-center justify-center gap-2.5 sm:gap-3">
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

                {error && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-center text-[13px] leading-snug text-red-500">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.join("").length !== 6}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2c6bed] text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-[#1851B4] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6bed]"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? "Verifying…" : "Verify & Sign In"}
                </button>

                <p className="mt-5 text-center text-[12px] text-[var(--muted)]">
                  Demo verification code: <span className="font-mono font-medium text-[var(--text)]">123456</span>
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Restore or Transfer Modal */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text)]">
                Restore or transfer
              </h3>
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
              To transfer an existing account from your phone or restore an encrypted backup, connect to Signal Desktop and verify your identity using your phone number or credentials.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setRestoreModalOpen(false);
                  setStage("identify");
                }}
                className="rounded-xl bg-[#2c6bed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1851B4] transition-colors"
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text)]">Signal Support & Help</h3>
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
              Need help getting started? You can sign in using one of the quick test accounts (Om or Rahul) with verification code <span className="font-mono font-medium text-[var(--text)]">123456</span>, or register a new account.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setHelpModalOpen(false)}
                className="rounded-xl bg-[#2c6bed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1851B4] transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {donateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text)]">Donate to Signal</h3>
              <button
                type="button"
                onClick={() => setDonateModalOpen(false)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[13.5px] leading-relaxed text-[var(--muted)]">
              Signal is a non-profit 501(c)(3) organization. We rely on donations from people like you to fund open-source, private communication technology with no ads and no tracking.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDonateModalOpen(false)}
                className="rounded-xl bg-[#2c6bed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1851B4] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Privacy Policy Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text)]">
                Terms & Privacy Policy
              </h3>
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--text)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-60 space-y-3 overflow-y-auto pr-1 text-[13px] leading-relaxed text-[var(--muted)]">
              <p>
                Signal is designed never to collect or store any sensitive information. Signal messages and calls cannot be accessed by us or other third parties because they are end-to-end encrypted.
              </p>
              <p>
                Signal is a non-profit 501(c)(3) organization committed to open technology and private communication for everyone.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="rounded-xl bg-[#2c6bed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1851B4] transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
