"use client";

// /app/(v2)/classroom/[classroomId]/ClassAssignPanel.jsx
// Branch: v2/student-success-platform
//
// Whole-class assignment panel. Triggered by "Assign to Class" button on
// the classroom detail page. Submits to POST /api/v2/assessments/bulk-start,
// then shows a results table with join codes per student.
//
// Props:
//   classroomId   — string UUID
//   gradeLevel    — string (e.g. "7"), inherited from classrooms.grade_level
//   subject       — string (e.g. "ELA"), inherited from classrooms.subject
//   testingWindow — string | null (BOY, MOY, EOY), pre-filled from classrooms.testing_window
//   onDone        — () => void — closes panel + triggers page refresh

import { useState, useCallback } from "react";
import { buildTeksOptions } from "@/libs/constants/teksSubjectMap";

// ── Constants ─────────────────────────────────────────────────────────────────

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "hot_text", label: "Hot Text" },
  { value: "constructed_response", label: "Constructed Response" },
  { value: "multi_select", label: "Multi-Select" },
  { value: "inline_choice", label: "Inline Choice" },
];

const TESTING_WINDOWS = [
  { value: "BOY", label: "Beginning of Year (BOY)" },
  { value: "MOY", label: "Middle of Year (MOY)" },
  { value: "EOY", label: "End of Year (EOY)" },
];

const EXPIRY_OPTIONS = [
  { value: 24, label: "24 hours" },
  { value: 48, label: "48 hours" },
  { value: 72, label: "72 hours" },
  { value: 168, label: "1 week" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ textToCopy, label = "Copy", copiedLabel = "Copied!" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
        copied
          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
          : "bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200"
      }`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClassAssignPanel({
  classroomId,
  gradeLevel,
  subject,
  testingWindow,
  onDone,
}) {
  // Derived from subject + gradeLevel — reruns automatically if props change.
  // Returns [] for any subject not yet in teksSubjectMap (safe fallback).
  const teksOptions = buildTeksOptions(subject, gradeLevel);
  const subjectNotMapped = teksOptions.length === 0;

  // ── Form state
  const [form, setForm] = useState({
    teks_standard: "",
    question_type: "multiple_choice",
    testing_window: testingWindow ?? "",
    expires_in_hours: 24,
  });

  // ── UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [allCopied, setAllCopied] = useState(false);

  // ── Handlers

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "expires_in_hours" ? Number(value) : value,
    }));
    if (error) setError(null);
  }

  async function handleSubmit() {
    setError(null);

    if (!form.teks_standard) {
      setError("Please select a TEKS standard.");
      return;
    }
    if (!form.testing_window) {
      setError("Please select a testing window.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v2/assessments/bulk-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroom_id: classroomId,
          teks_standard: form.teks_standard,
          question_type: form.question_type,
          testing_window: form.testing_window,
          expires_in_hours: form.expires_in_hours,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start sessions. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleCopyAll = useCallback(async () => {
    if (!result?.sessions) return;

    const text = result.sessions
      .map((s) => `${s.first_name} ${s.last_name} — Code: ${s.join_code}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }

    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 3000);
  }, [result]);

  // ── Render: Results view ──────────────────────────────────────────────────
  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div
          className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {/* Header */}
          <div className="bg-[#0f0a1e] px-6 py-5 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Sessions Started
                </h2>
                <p className="text-purple-300 text-sm mt-0.5">
                  {result.teks_standard} · {result.question_type.replace(/_/g, " ")} ·{" "}
                  {result.testing_window}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-300 text-xs font-bold border border-emerald-700">
                  ✓ {result.success_count} started
                </span>
                {result.failure_count > 0 && (
                  <span className="px-3 py-1 rounded-full bg-red-900/60 text-red-300 text-xs font-bold border border-red-700">
                    ✗ {result.failure_count} failed
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expiry note */}
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2.5 flex-shrink-0">
            <p className="text-yellow-900 text-xs">
              Codes expire in{" "}
              <strong>
                {EXPIRY_OPTIONS.find((e) => e.value === result.expires_in_hours)?.label ??
                  `${result.expires_in_hours} hours`}
              </strong>
              . Students go to{" "}
              <span className="font-bold text-purple-800">teksportfolio.com/join</span> and
              enter their code.
            </p>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-purple-50 border-b border-purple-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-purple-800 text-xs uppercase tracking-wide">
                    Student Name
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-purple-800 text-xs uppercase tracking-wide">
                    Student ID
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-purple-800 text-xs uppercase tracking-wide">
                    Join Code
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {result.sessions.map((s, i) => (
                  <tr
                    key={s.student_id}
                    className={`border-b border-purple-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-purple-50/30"
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {s.student_code}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-[#4c1d95] text-base tracking-widest">
                        {s.join_code}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <CopyButton textToCopy={s.join_code} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Failures */}
            {result.failures && result.failures.length > 0 && (
              <div className="px-5 py-4 bg-red-50 border-t border-red-100">
                <p className="text-red-700 text-xs font-semibold mb-2">
                  Failed to start sessions for:
                </p>
                {result.failures.map((f, i) => (
                  <p key={i} className="text-red-600 text-xs">
                    {f.first_name} {f.last_name} — {f.reason}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3 flex-shrink-0">
            <button
              onClick={handleCopyAll}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                allCopied
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : "bg-[#4c1d95] text-white hover:bg-[#3b1672] shadow-sm"
              }`}
            >
              {allCopied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Copied to Clipboard
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.236 2.036m3.736-2.036a44.066 44.066 0 00-5.1 0m0 0A2.251 2.251 0 006 4.286M8.25 18H5.25A2.25 2.25 0 013 15.75V6.108" />
                  </svg>
                  Copy All Codes for Google Classroom
                </>
              )}
            </button>

            <button
              onClick={onDone}
              className="px-5 py-2.5 rounded-xl bg-[#f5c518] text-[#0f0a1e] text-sm font-bold hover:bg-[#fbbf24] transition active:scale-95 shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Form view ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="bg-[#0f0a1e] px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2
                className="text-xl font-bold text-white"
                style={{ fontFamily: "'Syne', sans-serif" }}
              >
                Assign to Class
              </h2>
              <p className="text-purple-300 text-sm mt-0.5">
                {subject} · Grade {gradeLevel} · One session per student
              </p>
            </div>
            <button
              onClick={onDone}
              className="text-purple-400 hover:text-white transition mt-0.5"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form body */}
        <div className="bg-white px-6 py-6 space-y-5">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Subject not yet mapped warning */}
          {subjectNotMapped && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span>
                TEKS standards for <strong>{subject}</strong> aren&apos;t set yet. More TEKS options will appear here once we add them to our system. For now, you can select any TEKS standard from the dropdown to start sessions for this classroom.
                 {/* Add them to{" "}
                <code className="text-xs bg-amber-100 px-1 rounded">teksSubjectMap.js</code> to
                enable assignment for this classroom. */}
              </span>
            </div>
          )}

          {/* TEKS Standard */}
          <div className="space-y-1.5">
            <label htmlFor="cp-teks" className="block text-sm font-semibold text-purple-900">
              TEKS Standard <span className="text-red-500">*</span>
            </label>
            <select
              id="cp-teks"
              name="teks_standard"
              value={form.teks_standard}
              onChange={handleChange}
              disabled={loading || subjectNotMapped}
              className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">— Select standard —</option>
              {teksOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type */}
          <div className="space-y-1.5">
            <label htmlFor="cp-qtype" className="block text-sm font-semibold text-purple-900">
              Question Type
            </label>
            <select
              id="cp-qtype"
              name="question_type"
              value={form.question_type}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50"
            >
              {QUESTION_TYPES.map((qt) => (
                <option key={qt.value} value={qt.value}>
                  {qt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Testing Window */}
          <div className="space-y-1.5">
            <label htmlFor="cp-window" className="block text-sm font-semibold text-purple-900">
              Testing Window <span className="text-red-500">*</span>
            </label>
            <select
              id="cp-window"
              name="testing_window"
              value={form.testing_window}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50"
            >
              <option value="">— Select window —</option>
              {TESTING_WINDOWS.map((tw) => (
                <option key={tw.value} value={tw.value}>
                  {tw.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry */}
          <div className="space-y-1.5">
            <label htmlFor="cp-expiry" className="block text-sm font-semibold text-purple-900">
              Session Expires In
            </label>
            <select
              id="cp-expiry"
              name="expires_in_hours"
              value={form.expires_in_hours}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50"
            >
              {EXPIRY_OPTIONS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          {/* Info note */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
            <p className="text-purple-800 text-xs leading-relaxed">
              Sessions will be created for <strong>all active students</strong> in this
              classroom. If a student&apos;s session fails, the rest still start — failures are
              listed after submission.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={onDone}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || subjectNotMapped}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#f5c518] text-[#0f0a1e] text-sm font-bold hover:bg-[#fbbf24] transition active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating sessions…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.247 3.199a3.75 3.75 0 01-5.306 0M18 18.72V19.5m-11.25-.78a9.094 9.094 0 01-3.741-.479 3 3 0 014.682-2.72m-.247 3.199a3.75 3.75 0 005.306 0M6.75 19.5v-.78M12 15.75a3 3 0 110-6 3 3 0 010 6z" />
                </svg>
                Start Sessions for All Students
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}