// /components/(v2)/questions/MultipleChoice.jsx
"use client";

import { useState } from "react";

/**
 * MultipleChoice
 *
 * Props:
 *  - answer_options: string[]         array of 4 answer strings
 *  - onAnswer: (answer: string) => void
 *  - isSubmitting: boolean
 */
export default function MultipleChoice({ answer_options = [], onAnswer, isSubmitting = false }) {
  const [selected, setSelected] = useState(null);

  const labels = ["A", "B", "C", "D"];

  const handleConfirm = () => {
    if (selected === null || isSubmitting) return;
    onAnswer(selected);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Options */}
      {answer_options.slice(0, 4).map((option, idx) => {
        const isSelected = selected === option;
        return (
          <button
            key={idx}
            onClick={() => !isSubmitting && setSelected(option)}
            disabled={isSubmitting}
            className={`
              w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left
              transition-all duration-150 select-none
              ${isSubmitting ? "cursor-not-allowed opacity-70" : "cursor-pointer active:scale-[0.99]"}
              ${isSelected
                ? "border-yellow-400 bg-yellow-50 shadow-md"
                : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50"
              }
            `}
          >
            {/* Label bubble */}
            <span
              className={`
                flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                text-sm font-bold transition-colors duration-150
                ${isSelected
                  ? "bg-yellow-400 text-slate-900"
                  : "bg-slate-100 text-slate-500"
                }
              `}
            >
              {labels[idx]}
            </span>

            {/* Option text */}
            <span className={`text-base leading-snug ${isSelected ? "font-semibold text-slate-900" : "text-slate-700"}`}>
              {option}
            </span>

            {/* Checkmark when selected */}
            {isSelected && (
              <span className="ml-auto text-yellow-500 text-xl">✓</span>
            )}
          </button>
        );
      })}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={selected === null || isSubmitting}
        className={`
          mt-2 w-full py-4 rounded-2xl text-base font-bold tracking-wide
          transition-all duration-150
          ${selected !== null && !isSubmitting
            ? "bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.99] shadow-lg shadow-violet-200"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }
        `}
      >
        {isSubmitting
          ? <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting…
            </span>
          : "Confirm Answer"
        }
      </button>
    </div>
  );
}
