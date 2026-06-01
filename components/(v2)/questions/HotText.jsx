// /components/(v2)/questions/HotText.jsx
"use client";

import { useState, useMemo } from "react";

/**
 * HotText
 *
 * Props:
 *  - passage: string                    full passage text
 *  - hot_text_targets: string[]         array of selectable sentence strings
 *  - onAnswer: (answer: { sentence: string, index: number }) => void
 *  - isSubmitting: boolean
 *
 * Behavior:
 *  - Splits passage into sentence tokens
 *  - Sentences that appear in hot_text_targets become clickable
 *  - One selection at a time (clicking another deselects previous)
 *  - Confirm submits { sentence, index } where index is position in hot_text_targets
 */
export default function HotText({ passage = "", hot_text_targets = [], onAnswer, isSubmitting = false }) {
  const [selectedIdx, setSelectedIdx] = useState(null); // index into hot_text_targets

  // Split passage into tokens: sentences and non-sentence whitespace/punctuation runs
  const tokens = useMemo(() => {
    if (!passage) return [];

    // Simple sentence splitter — split on sentence-ending punctuation followed by space or end
    // We preserve the delimiter by using a lookahead
    const rawSentences = passage.split(/(?<=[.!?])\s+/);
    return rawSentences.map((sentence, i) => {
      const targetIdx = hot_text_targets.findIndex(
        (t) => t.trim() === sentence.trim()
      );
      return {
        id: i,
        text: sentence,
        targetIdx,                        // -1 if not a clickable target
        isTarget: targetIdx !== -1,
      };
    });
  }, [passage, hot_text_targets]);

  const handleSelect = (targetIdx) => {
    if (isSubmitting) return;
    setSelectedIdx((prev) => (prev === targetIdx ? null : targetIdx));
  };

  const handleConfirm = () => {
    if (selectedIdx === null || isSubmitting) return;
    onAnswer({
      sentence: hot_text_targets[selectedIdx],
      index: selectedIdx,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Instruction chip */}
      <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest">
        Tap a sentence to select it
      </p>

      {/* Passage with clickable sentences */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 leading-loose text-base text-slate-700 font-serif">
        {tokens.map((token) => {
          const isSelected = token.isTarget && token.targetIdx === selectedIdx;

          if (!token.isTarget) {
            return (
              <span key={token.id} className="text-slate-700">
                {token.text}{" "}
              </span>
            );
          }

          return (
            <span
              key={token.id}
              onClick={() => handleSelect(token.targetIdx)}
              className={`
                inline cursor-pointer rounded-md px-0.5 transition-all duration-150
                ${isSelected
                  ? "bg-yellow-300 text-slate-900 font-semibold shadow-sm"
                  : "bg-transparent hover:bg-yellow-100 underline decoration-dotted decoration-violet-400"
                }
                ${isSubmitting ? "cursor-not-allowed" : ""}
              `}
            >
              {token.text}
            </span>
          );
        })}
        {/* Trailing space normalisation */}
        <span> </span>
      </div>

      {/* Selection feedback */}
      <div className="min-h-[2rem]">
        {selectedIdx !== null && (
          <p className="text-sm text-slate-500 italic truncate">
            Selected: <span className="text-slate-700 not-italic font-medium">&ldquo;{hot_text_targets[selectedIdx]}&rdquo;</span>
          </p>
        )}
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={selectedIdx === null || isSubmitting}
        className={`
          w-full py-4 rounded-2xl text-base font-bold tracking-wide
          transition-all duration-150
          ${selectedIdx !== null && !isSubmitting
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
