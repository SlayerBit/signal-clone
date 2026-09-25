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

  const [step, setStep] = useState(0);
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
  const signalBlueHover = "#1851B4";

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

  /* ── Submit ── */
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

  /* ── Step titles ── */
  const titles = [
    { heading: "Create your account", sub: "Enter your username or phone number to get started." },
    { heading: "Enter verification code", sub: `Enter the 6-digit code to verify ${identifier || "your identity"}.` },
    { heading: "Set up your profile", sub: "Choose a name and avatar for your Signal profile." },
  ];

  const isDisabled =
    loading ||
    (step === 0 && !identifier.trim()) ||
    (step === 1 && otp.join("").length !== 6) ||
    (step === 2 && !displayName.trim());

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Theme toggle */}
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

      <div
        className="flex h-full flex-col items-center px-6 animate-in fade-in duration-200 overflow-y-auto"
        style={{ background: "var(--bg)" }}
      >
        <div
          className="flex w-full max-w-[420px] flex-1 flex-col justify-center"
          style={{ marginTop: "-3vh" }}
        >
          {/* Back navigation */}
          <div className="mb-8">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2);
                  if (step === 1) setOtp(["", "", "", "", "", ""]);
                }}
                className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] transition-colors"
                style={{ color: "var(--muted)" }}
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
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-lg px-1 py-1 text-[13px] transition-colors"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--text)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--muted)")
                }
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Sign In</span>
              </Link>
            )}
          </div>

          {/* Auth surface */}
          <div className="flex flex-col items-center">
            {/* Logo + Wordmark */}
            <div className="mb-6 flex items-center gap-2.5">
              <SignalLogo size={28} color={signalBlue} />
              <span
                className="text-[22px] font-extrabold tracking-tight"
                style={{ color: "var(--text)" }}
              >
                Signal
              </span>
            </div>

            <form onSubmit={submit} className="w-full" noValidate>
              {/* Title */}
              <div className="mb-6 text-center">
                <h1
                  className="text-[24px] font-extrabold leading-tight tracking-tight"
                  style={{ color: "var(--text)" }}
                >
                  {titles[step].heading}
                </h1>
                <p
                  className="mt-1.5 text-[14px] leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {titles[step].sub}
                </p>
                {/* Step indicator */}
                <div className="mt-4 flex items-center justify-center gap-2">
                  {[0, 1, 2].map((s) => (
                    <div
                      key={s}
                      className="h-1 rounded-full transition-all duration-300"
                      style={{
                        width: s === step ? "24px" : "8px",
                        background:
                          s <= step
                            ? signalBlue
                            : theme === "dark"
                            ? "rgba(255,255,255,0.12)"
                            : "rgba(0,0,0,0.1)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* ── Step 0: Identifier ── */}
              {step === 0 && (
                <div className="mb-4">
                  <label
                    htmlFor="reg-identifier"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
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
              )}

              {/* ── Step 1: OTP ── */}
              {step === 1 && (
                <div className="mb-5">
                  <div className="flex items-center justify-center gap-2.5">
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
                            ? "0 0 0 2px rgba(44,107,237,0.1)"
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
                  <p
                    className="mt-3 text-center text-[12px]"
                    style={{ color: "var(--muted)", opacity: 0.6 }}
                  >
                    Demo code:{" "}
                    <span className="font-mono font-medium">123456</span>
                  </p>
                </div>
              )}

              {/* ── Step 2: Display Name + Avatar ── */}
              {step === 2 && (
                <div className="mb-4 space-y-5">
                  <div>
                    <label
                      htmlFor="reg-displayname"
                      className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
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

                  {/* Avatar Picker */}
                  <div
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--input-bg)",
                    }}
                  >
                    <p
                      className="mb-3 text-center text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--text-secondary)" }}
                    >
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

              {/* Submit button */}
              <button
                type="submit"
                disabled={isDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2c6bed]"
                style={{ backgroundColor: signalBlue }}
                {...btnHandlers}
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
              <p
                className="mt-4 text-center text-[13px]"
                style={{ color: "var(--muted)" }}
              >
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold hover:underline"
                  style={{ color: signalBlue }}
                >
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
