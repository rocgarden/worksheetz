"use client";

// /app/(v2)/classroom/[classroomId]/assign/AssignClient.jsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEKS_READING_MAP, TEKS_LABELS,  } from "@/libs/constants/teksReadingMap";
import { buildTeksOptions } from "@/libs/constants/teksSubjectMap";



// // Build a flat list of { code, label, bucket } for every grade
// function buildAllTeksOptions() {
//   const options = [];
//   const seen = new Set();

//   for (const [gradeKey, buckets] of Object.entries(TEKS_READING_MAP)) {
//     const gradeNum = gradeKey.replace("grade", "");
//     for (const [bucket, codes] of Object.entries(buckets)) {
//       const bucketLabel = TEKS_BUCKET_LABELS[bucket] ?? bucket;
//       for (const code of codes) {
//         if (!seen.has(code)) {
//           seen.add(code);
//           options.push({
//             code,
//             label: `${code} — ${bucketLabel}`,
//             bucket: bucketLabel,
//             grade: gradeNum,
//           });
//         }
//       }
//     }
//   }

//   // Sort by grade then code
//   options.sort((a, b) =>
//     Number(a.grade) !== Number(b.grade)
//       ? Number(a.grade) - Number(b.grade)
//       : a.code.localeCompare(b.code)
//   );

//   return options;
// }

// const ALL_TEKS_OPTIONS = buildAllTeksOptions();

// // Group options by grade for <optgroup> rendering
// function groupByGrade(options) {
//   const map = {};
//   for (const opt of options) {
//     if (!map[opt.grade]) map[opt.grade] = [];
//     map[opt.grade].push(opt);
//   }
//   return map;
// }

// const TEKS_BY_GRADE = groupByGrade(ALL_TEKS_OPTIONS);
// Build a flat list of { code, label } for a specific grade level.
// gradeLevel should be a string like "7" — matches TEKS_READING_MAP key "grade7".
// Returns [] if the grade isn't in the map (safe fallback).

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "hot_text", label: "Hot Text" },
  { value: "constructed_response", label: "Constructed Response" },
  { value: "multi_select",    label: "Multi-Select" },
  { value: "inline_choice",   label: "Inline Choice" },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function AssignClient({
  classroomId,
  students,
  fetchError,
  preSelectedStudentId,
  gradeLevel,
  testingWindow,
  subject
}) {
    // Derived at render time — reruns automatically if gradeLevel prop changes
 // const teksCodes = buildTeksAllowed(gradeLevel); // flat array of codes for this grade
  // const teksOptions = teksCodes.map((code) => ({
  // code,
  // label: TEKS_LABELS[code] ?? code, // fallback to raw code if label missing
  // }));  
  const teksOptions = buildTeksOptions(subject, gradeLevel);
  const subjectNotMapped = teksOptions.length === 0;

  const router = useRouter();

  const [form, setForm] = useState({
    student_id: preSelectedStudentId ?? "",
    teks_standard: "",
    question_type: "multiple_choice",
    dok_level: 1,
    testing_window: testingWindow ?? "",
  });
  console.log("Grade level in AssignClient:", gradeLevel);
  console.log("Subject in AssignClient:", subject);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(fetchError ?? null);
  const [success, setSuccess] = useState(null); // { session_id, join_code }
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "dok_level" ? Number(value) : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.student_id) {
      setError("Please select a student.");
      return;
    }
    if (!form.teks_standard) {
      setError("Please select a TEKS standard.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v2/assessments/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: form.student_id,
          classroom_id: classroomId,
          teks_standard: form.teks_standard,
          question_type: form.question_type,
          dok_level: form.dok_level,
          testing_window: form.testing_window,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to start session. Please try again.");
        return;
      }

      setSuccess({ session_id: data.session_id, join_code: data.join_code });
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccess(null);
    setError(null);
    setCopied(false);
    setForm({
      student_id: "",
      teks_standard: "",
      question_type: "multiple_choice",
      dok_level: 1,
      testing_window: testingWindow ?? "",
    });
  };

  const handleCopy = async () => {
    if (!success?.join_code) return;
    try {
      await navigator.clipboard.writeText(success.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / http
      const el = document.createElement("textarea");
      el.value = success.join_code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center px-4 py-12">
        <BackgroundAccent />

        <div className="relative w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
            {/* Header */}
            <div className="bg-[#4c1d95] px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4 text-purple-900"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Session Ready!
                </h1>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-7 space-y-6">
              {/* Join code block */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-semibold text-purple-700 tracking-wide uppercase">
                  Student Join Code
                </p>

                <div className="flex items-center gap-3">
                  {/* Big code box */}
                  <div className="bg-[#4c1d95] rounded-2xl px-8 py-5 shadow-lg">
                    <span className="text-yellow-400 font-mono font-extrabold text-5xl tracking-[0.18em] leading-none select-all">
                      {success.join_code ?? "——"}
                    </span>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={handleCopy}
                    title="Copy code"
                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 transition text-xs font-semibold ${
                      copied
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-purple-200 bg-purple-50 text-purple-700 hover:border-purple-400 hover:bg-purple-100"
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5"
                        >
                          <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                          <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Instruction text */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-center w-full">
                  <p className="text-yellow-900 text-sm leading-relaxed">
                    Share this code with your student. They go to{" "}
                    <span className="font-bold text-purple-800">
                      teksportfolio.com/join
                    </span>{" "}
                    and enter this code to start practicing.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-400 text-purple-900 text-sm font-bold hover:bg-yellow-300 active:scale-95 transition shadow-sm"
                >
                  Start Another Session
                </button>
                <button
                  onClick={() => router.push(`/classroom/${classroomId}`)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition"
                >
                  Back to Classroom
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center px-4 py-12">
      <BackgroundAccent />

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
          {/* Header */}
          <div className="bg-[#4c1d95] px-8 py-6">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Assign Practice Session
            </h1>
            <p className="text-purple-300 text-sm mt-1">
              Select a student, standard, and question type to generate an
              adaptive session.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* ── 1. Student selector ────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="student_id"
                className="block text-sm font-semibold text-purple-900"
              >
                Student <span className="text-red-500">*</span>
              </label>
              {students.length === 0 ? (
                <p className="text-sm text-purple-400 italic">
                  No students found in this classroom.{" "}
                  <a
                    href={`/classroom/${classroomId}/students/new`}
                    className="underline text-purple-600 hover:text-purple-800"
                  >
                    Add a student
                  </a>
                </p>
              ) : (
                <select
                  id="student_id"
                  name="student_id"
                  required
                  value={form.student_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                >
                  <option value="">— Select student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.student_code} — {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ── 2. TEKS standard selector ──────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="teks_standard"
                className="block text-sm font-semibold text-purple-900"
              >
                TEKS Standard <span className="text-red-500">*</span>
              </label>
             {/* Subject not yet mapped warning */}
{subjectNotMapped && (
  <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
    <span>
      TEKS standards for <strong>{subject}</strong> aren&apos;t mapped yet.
      Add them to <code className="text-xs bg-amber-100 px-1 rounded">teksSubjectMap.js</code> to
      enable assignment for this classroom.
    </span>
  </div>
)}

{/* TEKS dropdown — disable when subject not mapped */}
<select
  id="teks_standard"
  name="teks_standard"
  required
  value={form.teks_standard}
  onChange={handleChange}
  disabled={subjectNotMapped}
  className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
>
              <option value="">
                {subjectNotMapped ? "— No standards mapped for this subject —" : "— Select standard —"}
              </option>
              {teksOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            </div>

            {/* ── 3. Question type ───────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="question_type"
                className="block text-sm font-semibold text-purple-900"
              >
                Question Type
              </label>
              <select
                id="question_type"
                name="question_type"
                value={form.question_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                {QUESTION_TYPES.map((qt) => (
                  <option key={qt.value} value={qt.value}>
                    {qt.label}
                  </option>
                ))}
              </select>
            </div>

                        {/* ── 4. Testing Window ──────────────────────────────────────── */}
            <div className="space-y-1.5">
              <label
                htmlFor="testing_window"
                className="block text-sm font-semibold text-purple-900"
              >
                Testing Window
              </label>
              <select
                id="testing_window"
                name="testing_window"
                value={form.testing_window}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              >
                <option value="">— None / Not specified —</option>
                <option value="BOY">BOY — Beginning of Year</option>
                <option value="MOY">MOY — Middle of Year</option>
                <option value="EOY">EOY — End of Year</option>
              </select>
              {testingWindow && form.testing_window === testingWindow && (
                <p className="text-xs text-purple-400 pl-1">
                  Prefilled from classroom settings. You can override it.
                </p>
              )}
            </div>


            {/* ── 5. Starting DOK level ──────────────────────────────────── */}
            <div className="space-y-2">
              <span className="block text-sm font-semibold text-purple-900">
                Starting DOK Level
              </span>
              <div className="flex gap-3">
                {[1, 2, 3].map((dok) => (
                  <label
                    key={dok}
                    className={`flex-1 flex flex-col items-center gap-1 cursor-pointer rounded-xl border-2 px-3 py-3 transition ${
                      form.dok_level === dok
                        ? "border-purple-600 bg-purple-50"
                        : "border-purple-100 bg-white hover:border-purple-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dok_level"
                      value={dok}
                      checked={form.dok_level === dok}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span
                      className={`text-lg font-bold ${
                        form.dok_level === dok
                          ? "text-purple-700"
                          : "text-purple-400"
                      }`}
                    >
                      {dok}
                    </span>
                    <span className="text-xs text-center text-purple-500 leading-tight">
                      {dok === 1 && "Recall"}
                      {dok === 2 && "Skill / Concept"}
                      {dok === 3 && "Strategic Thinking"}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-purple-400 pl-1">
                Sessions always start at DOK 1 by default. Adjust only if you
                have prior data on this student.
              </p>
            </div>

            {/* ── Actions ────────────────────────────────────────────────── */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/classroom/${classroomId}`)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || students.length === 0 || subjectNotMapped}
                className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-400 text-purple-900 text-sm font-bold hover:bg-yellow-300 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
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
                    Starting…
                  </>
                ) : (
                  "Start Session"
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-purple-400 mt-4">
          Sessions are adaptive — DOK level adjusts automatically based on
          student responses.
        </p>
      </div>
    </div>
  );
}

// ── Shared background decoration ─────────────────────────────────────────────
function BackgroundAccent() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-200 opacity-30 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-yellow-200 opacity-25 blur-3xl" />
    </div>
  );
}










// function buildTeksOptionsForGrade(gradeLevel) {
//   if (!gradeLevel) return [];
//   const buckets = TEKS_READING_MAP[`grade${gradeLevel}`];
//   if (!buckets) return [];
 
//   const options = [];
//   const seen = new Set();
 
//   for (const [bucket, codes] of Object.entries(buckets)) {
//     const bucketLabel = TEKS_BUCKET_LABELS[bucket] ?? bucket;
//     for (const code of codes) {
//       if (!seen.has(code)) {
//         seen.add(code);
//         options.push({ code, label: `${code} — ${bucketLabel}` });
//       }
//     }
//   }
 
//   return options.sort((a, b) => a.code.localeCompare(b.code));
// }