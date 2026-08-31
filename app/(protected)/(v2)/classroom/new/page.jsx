//app/(protected)/(v2)/classroom/new/page.jsx
"use client";

// /app/(v2)/classroom/new/page.jsx
// Create a new classroom form.
// Calls POST /api/v2/classrooms on submit.
// Redirects to /classroom on success.
// Layout handles auth — no auth check here.

import { useState } from "react";
import { useRouter } from "next/navigation";

const GRADE_LEVELS = ["6", "7", "8"];
const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];
const SCHOOL_YEARS = ["2025-26", "2026-27", "2027-28"];
const TESTING_WINDOWS = [
  { value: "BOY", label: "BOY — Beginning of Year" },
  { value: "MOY", label: "MOY — Middle of Year" },
  { value: "EOY", label: "EOY — End of Year" },
];

export default function NewClassroomPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    grade_level: "",
    subject: "",
    school_year: "",
    testing_window: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const { name, grade_level, subject, school_year, testing_window } = form;
    if (!name.trim() || !grade_level || !subject || !school_year || !testing_window) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v2/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade_level,
          subject,
          school_year,
          testing_window: testing_window || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create classroom.");
        if (data.upgrade) {
          setError(
            (data.error || "Upgrade required.") +
              " Please upgrade your plan to add more classrooms."
          );
        }
        return;
      }

      router.push("/classroom");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

 return (
  <div
    className="min-h-screen font-sans"
    style={{
      fontFamily: "'DM Sans', system-ui, sans-serif",
      background: "linear-gradient(to bottom, #faf7ff 0%, #f3ecff 40%, #e8ddff 100%)",
      color: "#2d1b69",
    }}
  >
    {/* Ambient background */}
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Purple glow */}
      <div
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, #c4b5fd 20%, transparent 70%)",
        }}
      />

      {/* Gold glow */}
      <div
        className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #facc15 0%, transparent 70%)",
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(#2d1b69 1px, transparent 1px), linear-gradient(90deg, #2d1b69 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>

    <div className="relative z-10 max-w-xl mx-auto px-6 py-16">
      {/* Back link */}
      <button
        onClick={() => router.push('/classroom')}
        className="flex items-center gap-2 text-[#6b5a99] hover:text-[#2d1b69] transition-colors text-sm mb-10 group"
      >
        <span className="group-hover:-translate-x-1 transition-transform inline-block">←</span>
        Back to Classrooms
      </button>

      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-yellow-600/20 border border-yellow-400/40 rounded-full px-4 py-1.5 text-yellow-700 text-xs font-semibold tracking-widest uppercase mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
          New Classroom
        </div>

        <h1
          className="text-4xl font-black leading-tight tracking-tight"
          style={{ letterSpacing: "-0.02em", color: "#2d1b69" }}
        >
          Create a <span className="text-yellow-600/70">Classroom</span>
        </h1>

        <p className="mt-3 text-base leading-relaxed" style={{ color: "#6b5a99" }}>
          Set up your roster and start tracking student growth across every testing window.
        </p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div
          className="rounded-2xl border p-6 space-y-5 backdrop-blur-sm"
          style={{
            borderColor: "#d8cfff",
            background: "rgba(255,255,255,0.75)",
            boxShadow:
              "0 0 0 1px rgba(124,58,237,0.15), 0 24px 48px -12px rgba(0,0,0,0.08)",
          }}
        >
          {/* Classroom name */}
          <Field label="Classroom Name" required>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Period 3 ELA, 7th Math B"
              className="w-full border rounded-xl px-4 py-3 text-sm transition-all"
              style={{
                background: "rgba(255,255,255,0.95)",
                borderColor: "#c7b6ff",
                color: "#2d1b69",
              }}
              autoComplete="off"
              maxLength={80}
            />
          </Field>

          {/* Grade + Subject */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Grade Level" required>
              <Select
                name="grade_level"
                value={form.grade_level}
                onChange={handleChange}
                placeholder="Select grade"
                options={GRADE_LEVELS.map((g) => ({ value: g, label: `Grade ${g}` }))}
              />
            </Field>

            <Field label="Subject" required>
              <Select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Select subject"
                options={SUBJECTS.map((s) => ({ value: s, label: s }))}
              />
            </Field>
          </div>

          {/* School year */}
          <Field label="School Year" required>
            <Select
              name="school_year"
              value={form.school_year}
              onChange={handleChange}
              placeholder="Select school year"
              options={SCHOOL_YEARS.map((y) => ({ value: y, label: y }))}
            />
          </Field>

          {/* Testing window — REQUIRED. A classroom with no testing_window
              silently breaks portfolio scoring in completeSession.js, since
              boy_score/moy_score/eoy_score never get written for sessions
              without a valid window. */}
          <Field
            label="Testing Window"
            required
            hint="Sets which window this classroom's sessions count toward"
          >
            <Select
              name="testing_window"
              value={form.testing_window}
              onChange={handleChange}
              placeholder="Select testing window"
              options={TESTING_WINDOWS}
            />
          </Field>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-100 border border-red-300 rounded-xl px-4 py-3 text-red-700 text-sm">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full relative group overflow-hidden rounded-xl py-4 px-6 font-bold text-sm tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: loading
              ? "rgba(250,204,21,0.5)"
              : "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
            color: "#2d1b69",
            boxShadow: loading ? "none" : "0 0 32px rgba(250,204,21,0.25)",
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creating Classroom…
              </>
            ) : (
              <>
                Create Classroom
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </>
            )}
          </span>

          {!loading && (
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #fde047 0%, #facc15 100%)",
              }}
            />
          )}
        </button>

        <p className="text-center text-xs" style={{ color: "#6b5a99" }}>
          You&apos;ll be able to upload a roster after setup. Google Classroom connect coming soon!
        </p>
      </form>
    </div>
  </div>
);

}

// ── Sub-components ──────────────────────────────────────────────────────────

function Field({ label, required, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#6b5a99" }}
        >
          {label}
          {required && <span className="text-yellow-600 ml-1">*</span>}
        </label>
        {hint && <span className="text-xs" style={{ color: "#9d8bd6" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Select({ name, value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full appearance-none border rounded-xl px-4 py-3 text-sm transition-all cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.95)",
          borderColor: "#c7b6ff",
          color: value ? "#2d1b69" : "#9d8bd6",
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: "#9d8bd6" }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}