//app/(v2)/classroom/[classroomId]/progress/[studentId]/ProgressClient.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const QUESTION_TYPE_LABELS = {
  multiple_choice:      "Multiple Choice",
  multi_select:         "Multi-Select",
  constructed_response: "SCR",
  hot_text:             "Hot Text",
  hotspot:              "Hotspot",
  drag_and_drop:        "Drag & Drop",
  inline_choice:        "Inline Choice",
  match_table:          "Match Table",
  order:                "Ordering",
  griddable:            "Griddable",
  mixed:                "Mixed",
};

function questionTypeLabel(raw) {
  if (!raw) return null;
  return QUESTION_TYPE_LABELS[raw] ?? raw;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ScoreCard({ label, score }) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-2"
      style={{
        borderColor: score != null ? "#4c1d95" : "#e5e7eb",
        background: score != null ? "#faf5ff" : "#f9fafb",
      }}
    >
      <span className="text-xs font-semibold tracking-widest uppercase text-purple-400">
        {label}
      </span>
      {score != null ? (
        <span className="text-4xl font-black text-purple-900 leading-none">
          {score}
          <span className="text-lg font-medium text-purple-400 ml-1">/ 100</span>
        </span>
      ) : (
        <span className="text-2xl font-bold text-gray-300">—</span>
      )}
    </div>
  );
}

function ProgressBar({ value, danger }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden w-full">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${clamped}%`,
          background: danger ? "#ef4444" : clamped >= 60 ? "#22c55e" : "#f59e0b",
        }}
      />
    </div>
  );
}

function StatusBadge({ status, join_code, expires_at }) {
  const [show, setShow] = useState(false);
  const isExpired =
    status === "in_progress" &&
    expires_at &&
    new Date(expires_at) < new Date();

  const map = {
    completed:   { label: "Completed",   bg: "#dcfce7", text: "#15803d" },
    in_progress: { label: "In Progress", bg: "#fef9c3", text: "#854d0e" },
    abandoned:   { label: "Abandoned",   bg: "#fee2e2", text: "#991b1b" },
  };

  const s = isExpired
    ? { label: "Expired", bg: "#f3f4f6", text: "#6b7280" }
    : (map[status] ?? { label: status, bg: "#f3f4f6", text: "#374151" });  
  return (
    <>
    <span
      className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
     <div className="relative inline-flex items-center gap-1">
      <button
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          onFocus={() => setShow(true)}
          onBlur={() => setShow(false)}
          className="text-purple-300 hover:text-purple-500 transition"
          aria-label="About DOK levels"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
          </svg>
        </button>
      {show && isExpired && (
          <div
            className="absolute z-80 top-full left-1/2 -translate-x-1/2 mt-2 w-64 text-gray-500 rounded-xl shadow-lg border border-purple-100 bg-yellow-200 p-3 text-left"
            style={{ filter: "drop-shadow(0 4px 12px rgba(76,29,149,0.15))" }}
          >
            {/* Arrow pointing up */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid white" }} />
            <p className="text-xs text-purple-400 leading-relaxed">
              Code expired — session still completable by joined students
            </p>
          </div>
        )}
        </div>
    {
      status === "in_progress"  && !isExpired &&  join_code && (
        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
          Code: {join_code}
        </span>
      )
          

    }
    </>
  );
}

function QuestionTypeBadge({ type }) {
  const label = questionTypeLabel(type);
  if (!label) return null;
  return (
    <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
      {label}
    </span>
  );
}

// ── Collapsible scoring callout ───────────────────────────────────────────────

function ScoringCallout({ sessionCount }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5 rounded-xl border border-purple-200 overflow-hidden">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 hover:bg-purple-100 transition text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-purple-800">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-purple-500 flex-shrink-0">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          How are scores calculated?
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4 text-purple-400 transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Expandable content */}
      {open && (
        <div className="px-4 py-4 bg-purple-50 border-t border-purple-100 text-sm text-purple-800 space-y-2">
          <p>
            Each score uses <span className="font-semibold">DOK-weighted points</span> — harder
            thinking skills count for more:{" "}
            <span className="font-mono font-semibold">DOK 1 = 1 pt</span>,{" "}
            <span className="font-mono font-semibold">DOK 2 = 2 pts</span>,{" "}
            <span className="font-mono font-semibold">DOK 3 = 3 pts</span> per correct answer.
            A student who answers 8/10 raw may score below 80% if they missed higher-DOK questions.
          </p>
          {sessionCount > 1 ? (
            <p>
              This student has completed{" "}
              <span className="font-semibold">{sessionCount} sessions</span> in this window.
              The score shown is the{" "}
              <span className="font-semibold">weighted average across all of them</span> — so a
              classroom-wide assignment with multiple TEKS standards won&apos;t overwrite earlier results.
            </p>
          ) : (
            <p>
              Score is based on <span className="font-semibold">1 completed session</span>. As more
              sessions are completed in this window, the score will automatically update to reflect
              all of them.
            </p>
          )}
       {/* SCR note */}
          <div className="pt-2 mt-2 border-t border-purple-200">
            <p className="font-semibold text-purple-900 mb-1">Short Constructed Response (SCR)</p>
            <p>SCR responses are scored on a <span className="font-semibold">0–2 point rubric</span>:</p>
            <ul className="mt-1.5 space-y-1 pl-1">
              <li className="flex items-start gap-2">
                <span className="inline-block mt-0.5 font-mono font-black text-red-500 w-4 flex-shrink-0">0</span>
                <span>Off topic or no response</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block mt-0.5 font-mono font-black text-yellow-600 w-4 flex-shrink-0">1</span>
                <span>Related to the topic but lacks textual evidence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block mt-0.5 font-mono font-black text-green-600 w-4 flex-shrink-0">2</span>
                <span>On topic and supported with textual evidence</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
// ── DOK column header with tooltip ───────────────────────────────────────────
// Shows what "Struggling at DOK" means and clarifies it's performance-derived,
// not the DOK level the teacher assigned for the session.

function DokColumnHeader() {
  const [show, setShow] = useState(false);

  return (
    <th className="text-center py-2 px-3 text-xs font-bold text-purple-400 uppercase tracking-wide overflow-visible">
      <div className="relative inline-flex items-center gap-1">
        <span>Struggling at</span>
        {/* Info icon */}
        <button
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          onFocus={() => setShow(true)}
          onBlur={() => setShow(false)}
          className="text-purple-300 hover:text-purple-500 transition"
          aria-label="About DOK levels"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Tooltip — renders below the header to avoid being clipped by the table */}
        {show && (
          <div
            className="absolute z-80 top-full left-1/2 -translate-x-1/2 mt-2 w-64 text-gray-500 rounded-xl shadow-lg border border-purple-100 bg-yellow-200 p-3 text-left"
            style={{ filter: "drop-shadow(0 4px 12px rgba(76,29,149,0.15))" }}
          >
            {/* Arrow pointing up */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid white" }} />
            {/* <p className="text-xs font-semibold text-purple-900 mb-1">What is "Struggling at"?</p> */}
            {/* <p className="text-xs text-gray-500 leading-relaxed">
              This is the <span className="font-semibold">lowest DOK level</span> where the student scored below 60% — not the DOK level assigned for the session. A ✓ means the student passed all DOK levels for this standard.
            </p> */}
            <p className="text-xs text-gray-400 leading-relaxed">
              This is the <span className="font-semibold">lowest DOK level</span> where the student scored below 60% — not the DOK level assigned for the session. A ✓ means the student passed all DOK levels for this standard.
            </p>
          </div>
        )}
      </div>
    </th>
  );
}

// ── Question Type column header with tooltip ─────────────────────────────────
 
function QuestionTypeColumnHeader() {
  const [show, setShow] = useState(false);
 
  return (
    <th className="text-center py-2 px-3 text-xs font-bold text-purple-400 uppercase tracking-wide overflow-visible">
      <div className="relative inline-flex items-center gap-1">
        <span>Question Type</span>
        <button
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          onFocus={() => setShow(true)}
          onBlur={() => setShow(false)}
          className="text-purple-300 hover:text-purple-500 transition"
          aria-label="About question type"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
          </svg>
        </button>
 
        {show && (
          <div
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl shadow-lg border border-purple-100 bg-yellow-200 p-3 text-left"
            style={{ filter: "drop-shadow(0 4px 12px rgba(76,29,149,0.15))" }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid white" }} />
            {/* <p className="text-xs font-semibold text-purple-900 mb-1">Question Type</p> */}
            <p className="text-xs text-gray-400 leading-relaxed">
              Question type based on the last session the student took for this standard.
            </p>
          </div>
        )}
      </div>
    </th>
  );
}

function AccuracyColumnHeader() {
  const [show, setShow] = useState(false);
 
  return (
    <th className="text-center py-2 px-3 text-xs font-bold text-purple-400 uppercase tracking-wide overflow-visible">
      <div className="relative inline-flex items-center gap-1">
        <span>Accuracy</span>
        <button
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          onFocus={() => setShow(true)}
          onBlur={() => setShow(false)}
          className="text-purple-300 hover:text-purple-500 transition"
          aria-label="About accuracy"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
          </svg>
        </button>
 
        {show && (
          <div
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl shadow-lg border border-purple-100 bg-yellow-200 p-3 text-left"
            style={{ filter: "drop-shadow(0 4px 12px rgba(76,29,149,0.15))" }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid white" }} />
            {/* <p className="text-xs font-semibold text-purple-900 mb-1">Question Type</p> */}
            <p className="text-xs text-gray-400 leading-relaxed">
             Overall performance on this standard unweighted.
            </p>
          </div>
        )}
      </div>
    </th>
  );
}
 

// ── Main Component ───────────────────────────────────────────────────────────

export default function ProgressClient({
  classroomId,
  studentId,
  student,
  portfolio,
  skillGaps,
  sessions,
  attempts,
}) {
  const router = useRouter();

  const studentName = student
    ? `${student.first_name} ${student.last_name}`
    : "Student";

  const growth = portfolio?.growth_percentage;
  const teksMastered = portfolio?.teks_mastered?.length ?? 0;
  const teksStruggling = portfolio?.teks_struggling?.length ?? 0;

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const completedSessionCount = completedSessions.length;
  const totalSessionCount = sessions.length;

  return (
    <div className="min-h-screen bg-[#f5f3ff]">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-purple-200 opacity-25 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-yellow-200 opacity-20 blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <button
              onClick={() => router.push(`/classroom/${classroomId}`)}
              className="inline-flex items-center gap-1.5 text-sm text-purple-500 hover:text-purple-700 font-medium mb-3 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to Classroom
            </button>
            <h1 className="text-3xl font-black text-purple-900 tracking-tight">{studentName}</h1>
            {student && (
              <p className="text-sm text-purple-400 mt-0.5 font-medium">
                Grade {student.grade_level} · ID: <span className="font-mono">{student.student_code}</span>
              </p>
            )}
          </div>

          <div className="flex items-start gap-3 flex-wrap">
            <div className="rounded-2xl border-2 border-purple-200 bg-white px-5 py-3 text-center min-w-[90px]">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-0.5">Sessions</p>
              <p className="text-3xl font-black text-purple-900 leading-none">{completedSessionCount}</p>
              <p className="text-xs text-gray-400 mt-0.5">completed</p>
            </div>

            {growth != null && (
              <div
                className="rounded-2xl px-5 py-3 text-center border-2 min-w-[90px]"
                style={{
                  borderColor: growth >= 0 ? "#22c55e" : "#ef4444",
                  background:  growth >= 0 ? "#f0fdf4" : "#fef2f2",
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-0.5">Growth</p>
                <p className="text-3xl font-black leading-none" style={{ color: growth >= 0 ? "#15803d" : "#991b1b" }}>
                  {growth >= 0 ? "+" : ""}{growth}%
                </p>
                <p className="text-xs text-gray-400 mt-0.5">BOY → EOY</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 1: Portfolio Summary ────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="bg-[#4c1d95] px-6 py-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <h2 className="text-white font-bold text-lg">Portfolio Summary- All TEKS</h2>
          </div>
          <div className="p-6">
            {portfolio ? (
              <>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <ScoreCard label="Beginning of Year" score={portfolio.boy_score} />
                  <ScoreCard label="Middle of Year"    score={portfolio.moy_score} />
                  <ScoreCard label="End of Year"       score={portfolio.eoy_score} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-green-700">{teksMastered}</p>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Standards Mastered</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-400 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-red-600">{teksStruggling}</p>
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Standards Struggling</p>
                    </div>
                  </div>
                </div>

                {/* Collapsible scoring explanation */}
                <ScoringCallout sessionCount={completedSessionCount} />

                {portfolio.last_updated && (
                  <p className="text-xs text-gray-400 mt-4 text-right">
                    Last updated {fmtDateTime(portfolio.last_updated)}
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7 text-purple-400">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-purple-900 font-semibold">No portfolio data yet</p>
                <p className="text-sm text-gray-400 mt-1">Scores will appear after the student completes an assessment session.</p>
              </div>
            )}
          </div>
        </section>

        {/* ── Section 2: Skill Gaps ───────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="bg-[#4c1d95] px-6 py-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd" />
            </svg>
            <h2 className="text-white font-bold text-lg">Skill Gaps</h2>
            {skillGaps.length > 0 && (
              <span className="ml-auto bg-yellow-400 text-purple-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                {skillGaps.length} tracked
              </span>
            )}
          </div>
          <div className="p-6">
            {skillGaps.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-purple-900 font-semibold">No skill gaps tracked yet</p>
                <p className="text-sm text-gray-400 mt-1">Start an adaptive session to begin tracking standards.</p>
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-sm overflow-visible">
                  <thead className="overflow-visible">
                    <tr className="border-b border-purple-100 overflow-visible">
                      <th className="text-left py-2 px-3 text-xs font-bold text-purple-400 uppercase tracking-wide">Standard</th>
                      {/* DOK column with hover tooltip explaining what "Struggling at" means */}
                      <DokColumnHeader />
                      <QuestionTypeColumnHeader />
                      <th className="text-center py-2 px-3 text-xs font-bold text-purple-400 uppercase tracking-wide">Correct / Total</th>
                      <AccuracyColumnHeader />                      
                      <th className="text-right py-2 px-3 text-xs font-bold text-purple-400 uppercase tracking-wide">Last Assessed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...skillGaps]
                    .sort((a, b) => new Date(b.last_assessed) - new Date(a.last_assessed))
                    .map((gap) => {
                      const accuracy = pct(gap.correct_count, gap.attempts_count);
                      const isDanger = gap.correct_count < gap.attempts_count / 2;
                      const isMastered = gap.dok_level_struggling === null && accuracy >= 60;

                      return (
                        <tr key={gap.id} style={{ background: isDanger ? "#fff5f5" : "transparent" }}>
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-purple-900">{gap.teks_standard}</span>
                            {isMastered && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">Mastered</span>
                            )}
                            {isDanger && (
                              <span className="ml-2 text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">Needs help</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {gap.dok_level_struggling != null ? (
                              <span
                                className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{
                                  background: gap.dok_level_struggling === 1 ? "#fef9c3" : gap.dok_level_struggling === 2 ? "#fed7aa" : "#fecaca",
                                  color:      gap.dok_level_struggling === 1 ? "#854d0e" : gap.dok_level_struggling === 2 ? "#9a3412" : "#991b1b",
                                }}
                              >
                                DOK {gap.dok_level_struggling}
                              </span>
                            ) : (
                              <span className="text-green-600 font-semibold">✓</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <QuestionTypeBadge type={gap.question_type} />
                            {!gap.question_type && <span className="text-gray-300 text-xs">—</span>}
                          </td>
                          <td className="py-3 px-3 text-center tabular-nums">
                            <span style={{ color: isDanger ? "#dc2626" : "#15803d" }} className="font-bold">
                              {gap.correct_count}
                            </span>
                            <span className="text-gray-400"> / {gap.attempts_count}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1"><ProgressBar value={accuracy} danger={isDanger} /></div>
                              <span
                                className="text-xs font-bold tabular-nums w-8 text-right"
                                style={{ color: isDanger ? "#dc2626" : accuracy >= 60 ? "#15803d" : "#b45309" }}
                              >
                                {accuracy}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right text-xs text-gray-400">
                            {fmtDate(gap.last_assessed)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      {/* ── Section 3: Session History ──────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden">
          <div className="bg-[#4c1d95] px-6 py-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-yellow-400">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
            </svg>
            <h2 className="text-white font-bold text-lg">Session History</h2>
            {sessions.length > 0 && (
              <span className="ml-auto bg-yellow-400 text-purple-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                {completedSessionCount} of {totalSessionCount} completed
              </span>
            )}
          </div>
          <div className="p-6">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-purple-900 font-semibold">No sessions yet</p>
                <p className="text-sm text-gray-400 mt-1">Assign an adaptive session to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-purple-100 p-4 flex flex-wrap items-center gap-4"
                    style={{
                      background:
                        session.status === "completed" ? "#f0fdf4"
                        : session.status === "in_progress" &&
                          session.expires_at &&
                          new Date(session.expires_at) < new Date() ? "#f9fafb"
                        : session.status === "in_progress" ? "#fefce8"
                        : "#fef2f2",
                    }}

                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-purple-900 text-sm">{session.teks_standard}</span>
                        {session.testing_window && (
                          <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {session.testing_window}
                          </span>
                        )}
                        <StatusBadge status={session.status} join_code={session.join_code} expires_at={session.expires_at} />
                        <QuestionTypeBadge type={session.question_type} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Grade {session.grade_level} · {session.subject}</p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      {session.session_correct != null && session.session_total != null ? (
                        <>
                          <p className="text-xl font-black text-purple-900 leading-none">
                            {session.session_correct}
                            <span className="text-sm font-medium text-gray-400"> / {session.session_total}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Weighted
                            {session.session_score != null && (
                              <span className="ml-1 font-semibold text-purple-600">· {session.session_score}%</span>
                            )}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xl font-black text-purple-900 leading-none">{session.question_count}</p>
                          <p className="text-xs text-gray-400 mt-0.5">questions</p>
                        </>
                      )}
                    </div>
                    <div className="text-right text-xs text-gray-400 space-y-0.5">
                      <p><span className="font-medium text-gray-500">Started:</span> {fmtDateTime(session.started_at)}</p>
                      {session.completed_at && (
                        <p><span className="font-medium text-gray-500">Completed:</span> {fmtDateTime(session.completed_at)}</p>
                      )}
                
                     {/* View Session */}
                      {session.status === "completed" && (
                        <div className="mt-2">
                          <button
                            onClick={() =>
                              router.push(`/classroom/${classroomId}/sessions/${session.id}`)
                            }
                            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-lg border border-purple-300 text-purple-600 bg-white hover:bg-purple-50 hover:border-purple-500 active:scale-95 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                              <path fillRule="evenodd" d="M1.38 8a6.5 6.5 0 1 1 13.24 0A6.5 6.5 0 0 1 1.38 8ZM8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3Z" clipRule="evenodd" />
                            </svg>
                            View Session
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex justify-center pb-6">
          <button
            onClick={() => router.push(`/classroom/${classroomId}`)}
            className="inline-flex items-center gap-2 bg-[#4c1d95] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-800 active:scale-95 transition shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to Classroom
          </button>
        </div>

      </div>
    </div>
  );
}