"use client";

// /app/(v2)/join/JoinClient.jsx
// Branch: v2/student-success-platform
// Public page — no auth required.
// Students enter a 6-digit join code + first name to start their session.
// On success → redirect to /session/[sessionId]

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JoinClient() {
  const router = useRouter();

  const [joinCode, setJoinCode] = useState(["", "", "", "", "", ""]);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refs for each digit input so we can auto-advance focus
  const digitRefs = useRef([]);

  // Auto-focus first digit on mount
  useEffect(() => {
    digitRefs.current[0]?.focus();
  }, []);

  // ── Join code digit input handling ──────────────────────────────────────
  const handleDigitChange = (index, value) => {
    // Only allow single digit 0-9
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...joinCode];
    updated[index] = digit;
    setJoinCode(updated);
    if (error) setError(null);

    // Auto-advance to next input if digit was entered
    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (joinCode[index]) {
        // Clear current digit
        const updated = [...joinCode];
        updated[index] = "";
        setJoinCode(updated);
      } else if (index > 0) {
        // Move to previous if already empty
        digitRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste — let students paste a full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...joinCode];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasted[i] ?? "";
    }
    setJoinCode(updated);
    // Focus the last filled digit or the first empty one
    const nextEmpty = updated.findIndex((d) => !d);
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    digitRefs.current[focusIndex]?.focus();
  };

  // ── Form submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const code = joinCode.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits of your join code.");
      return;
    }

    const name = firstName.trim();
    if (!name) {
      setError("Please enter your first name.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v2/assessments/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ join_code: code, first_name: name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      // Success — navigate to the session page
      router.push(`/session/${data.session_id}`);
    } catch {
      setError("Connection error. Please check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  const codeComplete = joinCode.every((d) => d !== "");

  return (
    <div className="min-h-screen bg-[#1e0a4a] flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decorations */}
      <BgDecor />

      {/* Logo / brand */}
      <div className="relative z-10 mb-10 text-center">
        <span className="inline-block text-yellow-400 font-black text-2xl tracking-tight select-none">
          TEKS<span className="text-white">{"  "}Portfolio</span>
        </span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Purple header band */}
          <div className="bg-[#3b0764] px-8 pt-8 pb-7">
            <h1 className="text-3xl font-black text-white leading-tight tracking-tight">
              Join Your
              <br />
              <span className="text-yellow-400">Practice Session</span>
            </h1>
            <p className="mt-2 text-purple-300 text-sm font-medium">
              Enter the code your teacher gave you
            </p>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-8">
            {/* ── Join Code Input ─────────────────────────────────────── */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-purple-900 uppercase tracking-widest">
                Join Code
              </label>

              {/* 6 individual digit boxes */}
              <div
                className="flex gap-3 justify-between"
                onPaste={handlePaste}
                role="group"
                aria-label="6-digit join code"
              >
                {joinCode.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (digitRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(i, e)}
                    aria-label={`Digit ${i + 1} of join code`}
                    className={`
                      w-full aspect-square text-center text-3xl font-black rounded-2xl border-2
                      text-purple-900 bg-purple-50 focus:outline-none transition-all
                      ${digit
                        ? "border-purple-600 bg-purple-100 shadow-md"
                        : "border-purple-200 focus:border-purple-500 focus:bg-white"
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    disabled={loading}
                  />
                ))}
              </div>

              {/* Visual "filled" indicator */}
              <div className="flex gap-1 justify-center">
                {joinCode.map((d, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                      d ? "bg-yellow-400" : "bg-purple-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* ── First Name Input ────────────────────────────────────── */}
            <div className="space-y-3">
              <label
                htmlFor="first-name"
                className="block text-sm font-bold text-purple-900 uppercase tracking-widest"
              >
                First Name
              </label>
              <input
                id="first-name"
                type="text"
                autoComplete="given-name"
                placeholder="e.g. Alex"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                className="
                  w-full px-5 py-4 rounded-2xl border-2 border-purple-200
                  text-2xl font-bold text-purple-900 placeholder-purple-300
                  bg-purple-50 focus:outline-none focus:border-purple-500
                  focus:bg-white transition-all disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              />
            </div>

            {/* ── Error message ───────────────────────────────────────── */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4"
              >
                <span className="text-red-500 text-xl leading-none mt-0.5" aria-hidden>
                  ✕
                </span>
                <p className="text-red-700 font-semibold text-sm leading-snug">
                  {error}
                </p>
              </div>
            )}

            {/* ── Submit Button ───────────────────────────────────────── */}
            <button
              type="submit"
              disabled={loading || !codeComplete || !firstName.trim()}
              className="
                w-full py-5 rounded-2xl
                bg-yellow-400 hover:bg-yellow-300 active:scale-[0.98]
                text-purple-900 text-2xl font-black tracking-tight
                transition-all shadow-lg shadow-yellow-200
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                disabled:active:scale-100
                flex items-center justify-center gap-3
              "
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Joining…</span>
                </>
              ) : (
                <>
                  <span>Start Practice</span>
                  <span aria-hidden className="text-xl">→</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="px-8 pb-7 text-center">
            <p className="text-xs text-purple-400 leading-relaxed">
              Your teacher assigned this session just for you.
              <br />
              You&apos;ve got this! 💪
            </p>
          </div>
        </div>

        {/* Below-card help text */}
        <p className="mt-6 text-center text-sm text-purple-300 font-medium">
          Need help? Ask your teacher for your 6-digit join code.
        </p>
      </div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="w-6 h-6 animate-spin flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

// ── Background decoration ─────────────────────────────────────────────────────
function BgDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Top-left glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-purple-700 opacity-30 blur-3xl" />
      {/* Bottom-right glow */}
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-yellow-500 opacity-20 blur-3xl" />
      {/* Decorative dots grid */}
      <svg
        className="absolute top-8 right-8 opacity-10 text-yellow-400"
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="currentColor"
      >
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 6 }, (_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={col * 20 + 10}
              cy={row * 20 + 10}
              r="2.5"
            />
          ))
        )}
      </svg>
      {/* Bottom-left dots */}
      <svg
        className="absolute bottom-10 left-8 opacity-10 text-purple-300"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="currentColor"
      >
        {Array.from({ length: 4 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={col * 20 + 10}
              cy={row * 20 + 10}
              r="2"
            />
          ))
        )}
      </svg>
    </div>
  );
}
