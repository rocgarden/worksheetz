// /app/(protected)/(v2)/classroom/[classroomId]/sessions/[sessionId]/SessionDetailClient.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEKS_LABELS } from "@/libs/constants/teksReadingMap";
import { TEKS_SS_LABELS } from "@/libs/constants/teksSocialStudiesMap";
import { TEKS_SCIENCE_LABELS } from "@/libs/constants/teksScienceMap";
// ── Subject-aware TEKS label lookup ──────────────────────────────────────────
// Do NOT merge — ELA and SS share codes (e.g. 8.4A) with different descriptions.
const TEKS_LABELS_BY_SUBJECT = {
  ELA:            TEKS_LABELS,
  "Social Studies": TEKS_SS_LABELS,
  Science: TEKS_SCIENCE_LABELS,
};

// ── QUESTION_TYPE_LABELS — kept local, no shared constant exists yet ──────────
// TODO: extract to /libs/constants/questionTypes.js when ProgressClient
// and other consumers are ready to import from there too.
const QUESTION_TYPE_LABELS = {
  multiple_choice:      "Multiple Choice",
  multi_select:         "Multi-Select",
  constructed_response: "Short Constructed Response",
  hot_text:             "Hot Text",
  hotspot:              "Hotspot",
  drag_and_drop:        "Drag & Drop",
  inline_choice:        "Inline Choice",
  match_table:          "Match Table",
  order:                "Ordering",
  griddable:            "Griddable",
  mixed:                "Mixed",
};

const SCR_RUBRIC = {
  0: "No Response / Off-Topic",
  1: "Partial — Needs Development",
  2: "Complete — Meets Expectation",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month:   "short",
    day:     "numeric",
    year:    "numeric",
  });
}

function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
  });
}

function fmtSeconds(sec) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function pct(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

// ── Small UI atoms ────────────────────────────────────────────────────────────

function DokBadge({ level }) {
  const colors = {
    1: { bg: "#fef9c3", text: "#854d0e" },
    2: { bg: "#fed7aa", text: "#9a3412" },
    3: { bg: "#fecaca", text: "#991b1b" },
  };
  const c = colors[level] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <span
      className="inline-block text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.text }}
    >
      DOK {level}
    </span>
  );
}

function TypeBadge({ type }) {
  const label = QUESTION_TYPE_LABELS[type] ?? type;
  return (
    <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
      {label}
    </span>
  );
}

function CorrectIcon({ correct }) {
  if (correct === true)
    return (
      <span className="inline-flex items-center gap-1 text-green-800 font-bold text-sm">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
        Correct
      </span>
    );
  if (correct === false)
    return (
      <span className="inline-flex items-center gap-1 text-red-200 font-bold text-sm">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
        </svg>
        Incorrect
      </span>
    );
  return <span className="text-gray-400 text-sm font-medium">Pending</span>;
}
 
// ── Answer renderers ──────────────────────────────────────────────────────────
 
function MCAnswer({ question, studentAnswer, isCorrect }) {
  const options = question.answer_options ?? [];
  const correct = question.correct_answer;
  // student_answer stored as plain string "A"/"B" from SessionClient
  // but defensively handle object or array shapes too
  const selected = studentAnswer?.selected ?? null;

 
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Student Selected</p>
        {options.map((opt) => {
          const optId = opt.id ?? opt.letter ?? opt;
          const optText = opt.text ?? opt;
          const isSelected = String(optId) === String(selected);
          if (!isSelected) return null;
          return (
            <div
              key={optId}
              className="rounded-lg px-3 py-2 text-sm font-medium border-2"
              style={{
                background: isCorrect ? "#dcfce7" : "#fef2f2",
                borderColor: isCorrect ? "#16a34a" : "#ef4444",
                color: isCorrect ? "#15803d" : "#b91c1c",
              }}
            >
              {optText}
            </div>
          );
        })}
        {!selected && <p className="text-sm text-gray-400 italic">No answer recorded</p>}
      </div>
      {!isCorrect && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Correct Answer</p>
          {options.map((opt) => {
            const optId = opt.id ?? opt.letter ?? opt;
            const optText = opt.text ?? opt;
            if (String(optId) !== String(correct)) return null;
            return (
              <div
                key={optId}
                className="rounded-lg px-3 py-2 text-sm font-medium border-2 border-green-400 bg-green-50 text-green-800"
              >
                {optText}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MultiSelectAnswer({ question, studentAnswer, isCorrect }) {
  const options = question.answer_options ?? [];
  const correctIds = new Set(
    Array.isArray(question.correct_answer)
      ? question.correct_answer.map(String)
      : [String(question.correct_answer)]
  );
  const selectedIds = new Set(
    Array.isArray(studentAnswer?.selected) ? studentAnswer.selected : []
  );

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Answer Comparison</p>
      {options.map((opt) => {
        const optId = String(opt.id ?? opt.letter ?? opt);
        const optText = opt.text ?? opt;
        const wasSelected = selectedIds.has(optId);
        const isCorrectOpt = correctIds.has(optId);

        let bg = "transparent", border = "#e5e7eb", textCol = "#374151", tag = null;
        if (wasSelected && isCorrectOpt) {
          bg = "#dcfce7"; border = "#16a34a"; textCol = "#15803d";
          tag = <span className="text-xs font-bold text-green-600 ml-2">✓ Correct</span>;
        } else if (wasSelected && !isCorrectOpt) {
          bg = "#fef2f2"; border = "#ef4444"; textCol = "#b91c1c";
          tag = <span className="text-xs font-bold text-red-500 ml-2">✗ Wrong pick</span>;
        } else if (!wasSelected && isCorrectOpt) {
          bg = "#fefce8"; border = "#ca8a04"; textCol = "#854d0e";
          tag = <span className="text-xs font-bold text-yellow-600 ml-2">Missed</span>;
        }

        return (
          <div
            key={optId}
            className="rounded-lg px-3 py-2 text-sm border-2 flex items-center"
            style={{ background: bg, borderColor: border, color: textCol }}
          >
            {optText}{tag}
          </div>
        );
      })}
    </div>
  );
}

function HotTextAnswer({ question, studentAnswer, isCorrect }) {
  // Build lookup maps from hot_text_targets (has text + is_correct)
  const targets = question.hot_text_targets ?? [];
  const correctTargetIds = new Set(
    Array.isArray(question.correct_answer)
      ? question.correct_answer.map(String)
      : [String(question.correct_answer)]
  );
   const selectedIds = new Set(
    Array.isArray(studentAnswer?.selected) ? studentAnswer.selected : []
  );
 
  // What the student picked (may be empty)
  const studentPicks = targets.filter((t) => selectedIds.has(String(t.id)));
  // The correct answer(s)
  const correctTargets = targets.filter((t) => correctTargetIds.has(String(t.id)));
 
  return (
    <div className="mt-3 space-y-4">
 
      {/* ── Side-by-side answer cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 
        {/* Student pick */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
            Student Selected
          </p>
          {studentPicks.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No selection recorded</p>
          ) : (
            studentPicks.map((t) => {
              const pickedCorrect = correctTargetIds.has(String(t.id));
              return (
                <div
                  key={t.id}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium border-2 leading-snug"
                  style={{
                    background:   pickedCorrect ? "#dcfce7" : "#fef2f2",
                    borderColor:  pickedCorrect ? "#16a34a" : "#ef4444",
                    color:        pickedCorrect ? "#15803d" : "#b91c1c",
                  }}
                >
                  {t.text}
                </div>
              );
            })
          )}
        </div>
 
        {/* Correct answer — only show when student got it wrong */}
        {!isCorrect && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
              Correct Answer
            </p>
            {correctTargets.map((t) => (
              <div
                key={t.id}
                className="rounded-lg px-3 py-2.5 text-sm font-medium border-2 border-green-400 bg-green-50 text-green-800 leading-snug"
              >
                {t.text}
              </div>
            ))}
          </div>
        )}
      </div>
 
      {/* ── Passage for context — collapsed by default ────────────────── */}
      <CollapsiblePassage passage={question.passage} label="Show passage for context" />
    </div>
  );
}

function SCRAnswer({ studentAnswer, scrScore, responseFeedback }) {
  const text = studentAnswer?.text ?? null;

  const rubricLabel = SCR_RUBRIC[scrScore] ?? null;

  return (
    <div className="mt-3 space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Student Response</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {text || <span className="italic text-gray-400">No response recorded</span>}
        </div>
      </div>
      {scrScore != null && (
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl px-4 py-2 text-center min-w-[72px]"
            style={{
              background: scrScore === 2 ? "#dcfce7" : scrScore === 1 ? "#fef9c3" : "#fee2e2",
              color:      scrScore === 2 ? "#15803d" : scrScore === 1 ? "#854d0e" : "#991b1b",
            }}
          >
            <p className="text-2xl font-black leading-none">{scrScore}/2</p>
            <p className="text-xs font-semibold mt-0.5">Score</p>
          </div>
          {rubricLabel && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rubric Level</p>
              <p className="text-sm font-semibold text-gray-700">{rubricLabel}</p>
            </div>
          )}
        </div>
      )}
      {responseFeedback && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1">AI Feedback</p>
          <p className="text-sm text-purple-900 leading-relaxed">{responseFeedback}</p>
        </div>
      )}
    </div>
  );
}

// ── Collapsible helpers ───────────────────────────────────────────────────────

function CollapsiblePassage({ passage, label }) {
  const [open, setOpen] = useState(false);
  if (!passage) return null;
  const showLabel  = label ?? "Show Passage";
  const hideLabel  = label ? label.replace(/^Show/, "Hide") : "Hide Passage";
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}>
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
        {open ? hideLabel : showLabel}
      </button>
      {open && (
        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed max-h-60 overflow-y-auto">
          {passage}
        </div>
      )}
    </div>
  );
}
 
function CollapsibleExplanation({ explanation }) {
  const [open, setOpen] = useState(false);
  if (!explanation) return null;
  return (
    <div className="mt-3 border-t border-purple-100 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-purple-500 hover:text-purple-700 transition"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}>
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
        {open ? "Hide Explanation" : "Show Explanation"}
      </button>
      {open && (
        <div className="mt-2 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-800 leading-relaxed">
          {explanation}
        </div>
      )}
    </div>
  );
}

// ── Safe JSON parser — handles already-parsed objects and bad strings ────────
function safeParseJson(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); }
    catch { return value};
    //catch { console.warn("[SessionDetail] unparseable value:", String(value).slice(0, 80)); return null; }
  }
  return null;
}

// ── Normalize student_answer per question type ───────────────────────────────
// Single source of truth for every storage format → canonical display shape.
// Add one case here when a new question type lands — renderers stay unchanged.
//
// Returns a normalized object each renderer expects:
//   multiple_choice / inline_choice → { selected: "A" }
//   multi_select                    → { selected: ["A","C"] }
//   hot_text                        → { selected: ["ht1"] }   ← target id(s)
//   constructed_response            → { text: "..." }
//   (future types add their own key)
//
function normalizeStudentAnswer(questionType, raw, question) {
  if (raw === null || raw === undefined) return null;
 
  switch (questionType) {
 
    case "multiple_choice":
    case "inline_choice": {
      // Stored as plain string "A" / "option text", or legacy {answer:"A"}
      const val = typeof raw === "string" ? raw : raw?.answer ?? null;
      return { selected: val };
    }
 
    case "multi_select": {
      // Stored as array ["A","C"] or {answers:["A","C"]}
      const arr = Array.isArray(raw) ? raw
        : Array.isArray(raw?.answers) ? raw.answers
        : [];
      return { selected: arr.map(String) };
    }
 
    case "hot_text": {
      // SessionClient stores { sentence: "...", index: N }
      // index is position into hot_text_targets array → map to target id
      const targets = question?.hot_text_targets ?? [];
      if (typeof raw?.index === "number" && targets[raw.index]) {
        return { selected: [String(targets[raw.index].id)] };
      }
      // Fallback: already normalized array of ids, or selected array
      if (Array.isArray(raw)) return { selected: raw.map(String) };
      if (Array.isArray(raw?.selected)) return { selected: raw.selected.map(String) };
      return { selected: [] };
    }
 
    case "constructed_response": {
      // Stored as plain string or {response:"..."}
      const text = typeof raw === "string" ? raw
        : raw?.response ?? raw?.text ?? null;
      return { text };
    }
 
    // ── Future types — add cases here as they're built ──────────────────
    // case "drag_and_drop": ...
    // case "match_table":   ...
    // case "griddable":     ...
    // case "hotspot":       ...
    // case "order":         ...
 
    default:
      // Unknown type — pass raw through so at least something renders
      return { raw };
  }
}

// ── Question Card ─────────────────────────────────────────────────────────────

function QuestionCard({ attempt, index }) {
  const q = safeParseJson(attempt.question_json) ?? {};
 const rawAnswer = safeParseJson(attempt.student_answer);
  const qtype = attempt.question_type;
  const studentAnswer = normalizeStudentAnswer(qtype, rawAnswer, q);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: attempt.is_correct ? "#bbf7d0" : attempt.is_correct === false ? "#fecaca" : "#e5e7eb" }}
    >
      <div
        className="px-5 py-3 flex flex-wrap items-center gap-3"
        style={{ background: attempt.is_correct ? "#81da9c" : attempt.is_correct === false ? "#ca5555" : "#f9fafb" }}
      >
        <span className="text-sm font-black text-gray-600">Q{index + 1}</span>
        <DokBadge level={attempt.dok_level} />
        <TypeBadge type={qtype} />
        <div className="ml-auto flex items-center gap-4">
          <span className="text-xs text-gray-800">{fmtSeconds(attempt.time_spent_seconds)}</span>
          <CorrectIcon correct={attempt.is_correct} />
        </div>
      </div>

      <div className="px-5 py-4">
        {q.passage && qtype !== "hot_text" && <CollapsiblePassage passage={q.passage} />}
        {q.stem && <p className="text-sm font-medium text-gray-800 leading-relaxed mt-3">{q.stem}</p>}

        {qtype === "multiple_choice" && (
          <MCAnswer question={q} studentAnswer={studentAnswer} isCorrect={attempt.is_correct} />
        )}
        {qtype === "inline_choice" && (
          <MCAnswer question={q} studentAnswer={studentAnswer} isCorrect={attempt.is_correct} />
        )}
        {qtype === "multi_select" && (
          <MultiSelectAnswer question={q} studentAnswer={studentAnswer} isCorrect={attempt.is_correct} />
        )}
        {qtype === "hot_text" && (
          <HotTextAnswer question={q} studentAnswer={studentAnswer} isCorrect={attempt.is_correct} />
        )}
        {qtype === "constructed_response" && (
          <SCRAnswer
            studentAnswer={studentAnswer}
            scrScore={attempt.scr_score}
            responseFeedback={attempt.response_feedback}
          />
        )}

        <CollapsibleExplanation explanation={q.explanation} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SessionDetailClient({
  session,
  student,
  attempts,
  classroomId,
  classroomName,
}) {
  const router = useRouter();

  const totalQuestions = attempts.length;
  const correctCount   = attempts.filter((a) => a.is_correct === true).length;
  const scorePct       = pct(correctCount, totalQuestions);

  // Derive question type from first attempt (session column may not exist in prod yet)
  const derivedQuestionType = attempts[0]?.question_type ?? null;

  // Use ALL_TEKS_LABELS 
  const subjectLabelMap = TEKS_LABELS_BY_SUBJECT[session.subject] ?? {};
  const teksLabel = subjectLabelMap[session.teks_standard] ?? "";

  const scoreColor = scorePct >= 70 ? "#15803d" : scorePct >= 50 ? "#b45309" : "#b91c1c";
  const scoreBg    = scorePct >= 70 ? "#dcfce7" : scorePct >= 50 ? "#fef9c3" : "#fee2e2";

  const studentName = student
    ? `${student.first_name} ${student.last_name}`
    : "Unknown Student";

  return (
    <div className="min-h-screen bg-[#f8f7ff]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── Breadcrumb ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-purple-600 hover:text-purple-800 font-semibold transition"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to Student Progress
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">{classroomName}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 truncate max-w-[160px]">{studentName}</span>
          <span className="text-gray-300">/</span>
          <span className="text-purple-700 font-semibold">{session.teks_standard}</span>
        </div>

        {/* ── Session header ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-purple-200 overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-purple-400 text-xs font-semibold uppercase tracking-widest mb-1">Session Report</p>
                <h1 className="text-[#2d1b69] text-2xl font-black leading-tight">{studentName}</h1>
                <p className="text-purple-400 text-sm font-mono mt-0.5">{student?.student_code ?? ""}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-[#4c1d95] font-black text-lg font-mono">{session.teks_standard}</span>
                  {teksLabel && <span className="text-purple-500 text-sm">— {teksLabel}</span>}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {/* <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    Grade {session.grade_level}
                  </span> */}
                  <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {session.subject}
                  </span>
                  {/* {session.testing_window && (
                    <span className="bg-yellow-400 text-purple-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                      {session.testing_window}
                    </span>
                  )} */}
                  {derivedQuestionType && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {QUESTION_TYPE_LABELS[derivedQuestionType] ?? derivedQuestionType}
                    </span>
                  )}
                </div>
              </div>

              <div
                className="rounded-2xl px-6 py-4 text-center min-w-[110px]"
                style={{ background: scoreBg }}
              >
                <p className="text-xs font-semibold mt-1" style={{ color: scoreColor }}>
RAW SCORE</p>
                <p className="text-5xl font-black leading-none" style={{ color: scoreColor }}>
                  {scorePct}<span className="text-2xl font-medium" style={{ color: scoreColor }}>%</span>
                </p>
                <p className="text-xs font-semibold mt-1" style={{ color: scoreColor }}>
                  {correctCount} / {totalQuestions} correct
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-6 border-t border-purple-100 pt-4">
              <div>
                <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide">Started</p>
                <p className="text-gray-700 text-sm font-medium">
                  {fmtDate(session.started_at)} · {fmtTime(session.started_at)}
                </p>
              </div>
              {session.completed_at && (
                <div>
                  <p className="text-xs text-purple-400 font-semibold uppercase tracking-wide">Completed</p>
                  <p className="text-gray-700 text-sm font-medium">
                    {fmtDate(session.completed_at)} · {fmtTime(session.completed_at)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Question breakdown ────────────────────────────────────────── */}
        <section>
          <h2 className="text-[#2d1b69] font-black text-lg mb-3 flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-yellow-400 inline-block" />
          Question Breakdown
        </h2>
          {attempts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-purple-100 p-10 text-center">
              <p className="text-purple-900 font-semibold">No answered questions found</p>
              <p className="text-sm text-gray-400 mt-1">The session may not have recorded any attempts.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt, i) => (
                <QuestionCard key={attempt.id} attempt={attempt} index={i} />
              ))}
            </div>
          )}
        </section>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div className="flex justify-center pb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 bg-[#4c1d95] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-purple-800 active:scale-95 transition shadow-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to Student Progress
          </button>
        </div>

      </div>
    </div>
  );
}