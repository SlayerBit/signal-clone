"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Moon, Sun, X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";
import { SignalLogo } from "@/components/ui/SignalLogo";
import { useToast } from "@/components/ui/Toast";

/* ─────────────────────────────────────────────────────────
   Auth stages:
     "welcome"   → approved onboarding screen (DO NOT MODIFY)
     "identify"  → enter username/phone
     "otp"       → enter 6-digit verification code
   ───────────────────────────────────────────────────────── */

export function LoginForm() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const { success, error: toastError } = useToast();

  const [stage, setStage] = useState<"welcome" | "identify" | "otp">(
    "welcome"
  );
  const [identifier, setIdentifier] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

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
      // Accept only digits
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);
      setError("");

      if (digit && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all 6 digits entered
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

  /* ── Shared Styles ──────────────────────────────── */
  const signalBlue = "#2c6bed";
  const signalBlueHover = "#1851B4";

  const btnPrimary = {
    backgroundColor: signalBlue,
  };
  const btnHandlers = {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading) e.currentTarget.style.backgroundColor = signalBlueHover;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.backgroundColor = signalBlue;
    },
    onMouseDown: (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading) e.currentTarget.style.transform = "scale(0.985)";
    },
    onMouseUp: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.transform = "scale(1)";
    },
  };

  /* ── Render ──────────────────────────────────────── */

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Theme toggle — subtle, top-right corner */}
      <div className="absolute top-4 right-5 z-20">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors"
          style={{
            color: "var(--text-secondary)",
            background: "var(--panel)",
            border: "1px solid var(--border)",
          }}
          title="Toggle light/dark theme"
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
          <span className="capitalize">
            {theme === "dark" ? "Light" : "Dark"} mode
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          STAGE 1: APPROVED WELCOME / ONBOARDING
          DO NOT MODIFY THIS SECTION
          ═══════════════════════════════════════════════════ */}
      {stage === "welcome" ? (
        <div
          className="flex h-full flex-col items-center px-6 animate-in fade-in duration-300"
          style={{ background: "var(--bg)" }}
        >
          {/* Hero banner — full-bleed visual at the top */}
          <div
            className="w-full shrink-0"
            style={{
              background:
                theme === "dark"
                  ? "linear-gradient(160deg, #1d2d4d 0%, #182440 50%, #121a30 100%)"
                  : "#9DBBF8",
              marginLeft: "-1.5rem",
              marginRight: "-1.5rem",
              width: "calc(100% + 3rem)",
              maxHeight: "42vh",
              overflow: "hidden",
            }}
          >
            <img
              src="/onboarding-hero.jpg"
              alt="Signal messaging — encrypted calls and conversations"
              className="mx-auto block w-full object-cover"
              style={{
                maxWidth: "680px",
                height: "42vh",
                minHeight: "240px",
                objectPosition: "center 40%",
                opacity: theme === "dark" ? 0.82 : 1,
                mixBlendMode: theme === "dark" ? "luminosity" : "normal",
              }}
            />
          </div>

          {/* Content below hero */}
          <div
            className="flex flex-1 flex-col items-center justify-center pb-8 pt-6"
            style={{ maxWidth: "480px" }}
          >
            {/* Logo + Wordmark */}
            <div className="mb-5 flex items-center gap-2.5">
              <SignalLogo size={32} color={signalBlue} />
              <span
                className="text-[26px] font-extrabold tracking-tight"
                style={{ color: "var(--text)" }}
              >
                Signal
              </span>
            </div>

            {/* Onboarding Headline */}
            <div className="mb-7 text-center">
              <h1
                className="text-[30px] font-extrabold leading-[1.15] tracking-tight sm:text-[36px]"
                style={{ color: "var(--text)" }}
              >
                Take privacy with you.
              </h1>
              <p
                className="mt-2 text-[15px] font-normal sm:text-base"
                style={{ color: "var(--muted)" }}
              >
                Be yourself in every message.
              </p>
            </div>

            {/* Primary Action */}
            <button
              type="button"
              onClick={() => setStage("identify")}
              className="w-full max-w-[340px] rounded-lg py-3 text-[15px] font-semibold text-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c6bed]"
              style={btnPrimary}
              {...btnHandlers}
            >
              Continue
            </button>

            {/* Secondary Action */}
            <button
              type="button"
              onClick={() => setRestoreModalOpen(true)}
              className="mt-3 text-[13px] font-medium transition-colors hover:underline"
              style={{ color: signalBlue }}
            >
              Restore or transfer
            </button>

            {/* Nonprofit / Terms */}
            <div
              className="mt-7 flex flex-col items-center gap-0.5 text-center text-[12px] leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              <span>Signal is a 501c3 nonprofit</span>
              <button
                type="button"
                onClick={() => setTermsModalOpen(true)}
                className="font-medium transition-colors hover:underline"
                style={{ color: "var(--text-secondary)" }}
              >
                Terms & Privacy Policy
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════
           STAGE 2 & 3: SIGN IN — Username/Phone → OTP
           ═══════════════════════════════════════════════════ */
        <div
          className="flex h-full flex-col items-center px-6 animate-in fade-in duration-200"
          style={{ background: "var(--bg)" }}
        >
          {/* Vertical centering container */}
          <div className="flex w-full max-w-[420px] flex-1 flex-col justify-center" style={{ marginTop: "-3vh" }}>
            {/* Back navigation — fixed to left, above content */}
            <div className="mb-8">
              <button
                type="button"
                onClick={goBackFromAuth}
                className="group flex items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] transition-colors"
                style={{ color: "var(--muted)" }}
                title={stage === "otp" ? "Back to sign in" : "Back to welcome"}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--muted)")
                }
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            </div>

            {/* Auth surface */}
            <div className="flex flex-col items-center">
              {/* Logo + Wordmark — centered */}
              <div className="mb-6 flex items-center gap-2.5">
                <SignalLogo size={28} color={signalBlue} />
                <span
                  className="text-[22px] font-extrabold tracking-tight"
                  style={{ color: "var(--text)" }}
                >
                  Signal
                </span>
              </div>

              {stage === "identify" ? (
                /* ── IDENTIFY STAGE ─────────────────────── */
                <form
                  onSubmit={handleIdentifySubmit}
                  className="w-full"
                  noValidate
                >
                  {/* Title */}
                  <div className="mb-6 text-center">
                    <h2
                      className="text-[24px] font-extrabold leading-tight tracking-tight"
                      style={{ color: "var(--text)" }}
                    >
                      Sign in to Signal
                    </h2>
                    <p
                      className="mt-1.5 text-[14px] leading-relaxed"
                      style={{ color: "var(--muted)" }}
                    >
                      Enter your username or phone number to continue.
                    </p>
                  </div>

                  {/* Input */}
                  <div className="mb-4">
                    <label
                      htmlFor="auth-identifier"
                      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
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
                      className="w-full rounded-lg border px-4 py-3 text-[15px] outline-none transition-all duration-150 placeholder:text-[13px]"
                      style={{
                        borderColor: error
                          ? theme === "dark"
                            ? "#f87171"
                            : "#dc2626"
                          : "var(--border)",
                        background: "var(--input-bg)",
                        color: "var(--text)",
                      }}
                      onFocus={(e) => {
                        if (!error) e.target.style.borderColor = signalBlue;
                        e.target.style.boxShadow = `0 0 0 3px ${
                          error
                            ? "rgba(239,68,68,0.1)"
                            : "rgba(44,107,237,0.12)"
                        }`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = error
                          ? theme === "dark"
                            ? "#f87171"
                            : "#dc2626"
                          : "var(--border)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="mb-4 rounded-lg px-3 py-2.5 text-[13px] leading-snug"
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(239,68,68,0.08)"
                            : "rgba(239,68,68,0.05)",
                        color: theme === "dark" ? "#f87171" : "#dc2626",
                        border: `1px solid ${
                          theme === "dark"
                            ? "rgba(239,68,68,0.15)"
                            : "rgba(239,68,68,0.12)"
                        }`,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* Continue button */}
                  <button
                    type="submit"
                    disabled={loading || !identifier.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c6bed]"
                    style={btnPrimary}
                    {...btnHandlers}
                  >
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {loading ? "Verifying…" : "Continue"}
                  </button>

                  {/* Register link */}
                  <div className="mt-4 text-center">
                    <Link
                      href="/register"
                      className="text-[13px] font-medium transition-colors hover:underline"
                      style={{ color: signalBlue }}
                    >
                      Register new account
                    </Link>
                  </div>

                  {/* Demo helper — subtle, below the form */}
                  <div
                    className="mt-8 rounded-lg px-4 py-3"
                    style={{
                      background:
                        theme === "dark"
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(0,0,0,0.02)",
                      border: `1px solid ${
                        theme === "dark"
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.05)"
                      }`,
                    }}
                  >
                    <p
                      className="mb-2 text-[11px] font-medium uppercase tracking-wider"
                      style={{ color: "var(--muted)", opacity: 0.7 }}
                    >
                      Demo accounts
                    </p>
                    <div className="flex items-center gap-2">
                      {[
                        { key: "om", label: "Om" },
                        { key: "rahul", label: "Rahul" },
                      ].map((user) => (
                        <button
                          key={user.key}
                          type="button"
                          onClick={() => fillDemoUser(user.key)}
                          className="rounded-md px-3.5 py-1.5 text-[12px] font-medium transition-all"
                          style={{
                            border: `1px solid ${
                              identifier === user.key
                                ? signalBlue
                                : "var(--border)"
                            }`,
                            background:
                              identifier === user.key
                                ? theme === "dark"
                                  ? "rgba(44,107,237,0.12)"
                                  : "rgba(44,107,237,0.06)"
                                : "transparent",
                            color:
                              identifier === user.key
                                ? signalBlue
                                : "var(--text-secondary)",
                          }}
                        >
                          {user.label}
                        </button>
                      ))}
                      <span
                        className="ml-auto text-[11px] font-mono"
                        style={{ color: "var(--muted)", opacity: 0.6 }}
                      >
                        OTP: 123456
                      </span>
                    </div>
                  </div>
                </form>
              ) : (
                /* ── OTP STAGE ─────────────────────────── */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleOtpSubmit();
                  }}
                  className="w-full"
                  noValidate
                >
                  {/* Title */}
                  <div className="mb-8 text-center">
                    <h2
                      className="text-[24px] font-extrabold leading-tight tracking-tight"
                      style={{ color: "var(--text)" }}
                    >
                      Enter verification code
                    </h2>
                    <p
                      className="mt-1.5 text-[14px] leading-relaxed"
                      style={{ color: "var(--muted)" }}
                    >
                      Enter the 6-digit code to continue as{" "}
                      <span
                        className="font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {identifier}
                      </span>
                    </p>
                  </div>

                  {/* OTP digit boxes */}
                  <div className="mb-5 flex items-center justify-center gap-2.5">
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
                        className="h-[52px] w-[46px] rounded-lg border text-center font-mono text-xl font-bold outline-none transition-all duration-150"
                        style={{
                          borderColor: error
                            ? theme === "dark"
                              ? "#f87171"
                              : "#dc2626"
                            : digit
                            ? signalBlue
                            : "var(--border)",
                          background: "var(--input-bg)",
                          color: "var(--text)",
                          boxShadow: digit
                            ? `0 0 0 2px rgba(44,107,237,0.1)`
                            : "none",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = signalBlue;
                          e.target.style.boxShadow =
                            "0 0 0 3px rgba(44,107,237,0.12)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = digit
                            ? signalBlue
                            : "var(--border)";
                          e.target.style.boxShadow = digit
                            ? "0 0 0 2px rgba(44,107,237,0.1)"
                            : "none";
                        }}
                        aria-label={`Digit ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Error */}
                  {error && (
                    <div
                      className="mb-4 rounded-lg px-3 py-2.5 text-center text-[13px] leading-snug"
                      style={{
                        background:
                          theme === "dark"
                            ? "rgba(239,68,68,0.08)"
                            : "rgba(239,68,68,0.05)",
                        color: theme === "dark" ? "#f87171" : "#dc2626",
                        border: `1px solid ${
                          theme === "dark"
                            ? "rgba(239,68,68,0.15)"
                            : "rgba(239,68,68,0.12)"
                        }`,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {/* Verify button */}
                  <button
                    type="submit"
                    disabled={loading || otp.join("").length !== 6}
                    className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c6bed]"
                    style={btnPrimary}
                    {...btnHandlers}
                  >
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {loading ? "Verifying…" : "Verify"}
                  </button>

                  {/* Demo code hint */}
                  <p
                    className="mt-5 text-center text-[12px]"
                    style={{ color: "var(--muted)", opacity: 0.6 }}
                  >
                    Demo code:{" "}
                    <span className="font-mono font-medium">123456</span>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Restore or Transfer Modal */}
      {restoreModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{
            background: "var(--dialog-overlay)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--text)" }}
              >
                Restore or transfer
              </h3>
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="rounded-lg p-1 transition-colors"
                style={{ color: "var(--muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              To transfer an existing account from your phone or restore an
              encrypted backup, connect to Signal Desktop and verify your
              identity using your phone number or credentials.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border)",
                  background: "var(--panel)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setRestoreModalOpen(false);
                  setStage("identify");
                }}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: signalBlue }}
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Privacy Policy Modal */}
      {termsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          style={{
            background: "var(--dialog-overlay)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-md rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--text)" }}
              >
                Terms & Privacy Policy
              </h3>
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="rounded-lg p-1 transition-colors"
                style={{ color: "var(--muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div
              className="max-h-60 space-y-3 overflow-y-auto pr-1 text-[13px] leading-relaxed"
              style={{ color: "var(--muted)" }}
            >
              <p>
                Signal is designed never to collect or store any sensitive
                information. Signal messages and calls cannot be accessed by us
                or other third parties because they are end-to-end encrypted.
              </p>
              <p>
                Signal is a non-profit 501(c)(3) organization committed to open
                technology and private communication for everyone.
              </p>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                style={{ backgroundColor: signalBlue }}
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
