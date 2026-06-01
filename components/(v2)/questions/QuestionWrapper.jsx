// /components/(v2)/questions/QuestionWrapper.jsx
"use client";

import MultipleChoice from "./MultipleChoice";
import HotText from "./HotText";

/**
 * QuestionWrapper
 *
 * Props:
 *  - question: object from /api/v2/assessments/start or submit
 *      {
 *        teks_standard: string,
 *        dok_level: number,
 *        question_type: string,
 *        stem: string,
 *        passage: string | null,
 *        answer_options: string[] | null,
 *        hot_text_targets: string[] | null,   // for hot_text only
 *      }
 *  - onAnswer: (answer: any) => void   called when student confirms
 *  - isSubmitting: boolean             disables confirm while in-flight
 */
export default function QuestionWrapper({ question, onAnswer, isSubmitting = false }) {
  if (!question) return null;

  const { teks_standard, dok_level, question_type, stem, passage, answer_options, hot_text_targets } = question;

  const dokColors = {
    1: { bg: "bg-emerald-100", text: "text-emerald-700", label: "DOK 1 · Recall" },
    2: { bg: "bg-amber-100",   text: "text-amber-700",   label: "DOK 2 · Skill" },
    3: { bg: "bg-rose-100",    text: "text-rose-700",    label: "DOK 3 · Think" },
  };
  const dok = dokColors[dok_level] || dokColors[1];

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 tracking-wide">
          {teks_standard}
        </span>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${dok.bg} ${dok.text} tracking-wide`}>
          {dok.label}
        </span>
      </div>

      {/* Passage */}
      {passage && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Read the passage
          </p>
          <p className="text-base leading-relaxed text-slate-700 font-serif">
            {passage}
          </p>
        </div>
      )}

      {/* Stem */}
      <p className="text-lg font-semibold text-slate-800 leading-snug">
        {stem}
      </p>

      {/* Question type renderer */}
      {question_type === "multiple_choice" && (
        <MultipleChoice
          answer_options={answer_options}
          onAnswer={onAnswer}
          isSubmitting={isSubmitting}
        />
      )}

      {question_type === "hot_text" && (
        <HotText
          passage={passage}
          hot_text_targets={hot_text_targets}
          onAnswer={onAnswer}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Fallback for unsupported types */}
      {question_type !== "multiple_choice" && question_type !== "hot_text" && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-400 text-sm">
          Question type <span className="font-mono text-slate-500">{question_type}</span> is not yet supported in this view.
        </div>
      )}
    </div>
  );
}
