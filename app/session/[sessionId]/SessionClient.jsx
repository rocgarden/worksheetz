"use client";
//app/session/[sessionId]/SessionClient.jsx
// Branch: v2/student-success-platform

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── MultipleChoice ───────────────────────────────────────────────────────────

function MultipleChoice({ options, selected, onSelect, disabled }) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {options.map((opt, i) => {
        const val = typeof opt === "object" ? opt.id ?? opt.text ?? opt : opt;
        const label = typeof opt === "object" ? opt.text ?? opt.value ?? opt : opt;
        const isSelected = selected === val;
        return (
          <button
            key={i}
            onClick={() => !disabled && onSelect(val)}
            disabled={disabled}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "16px 20px",
              borderRadius: "14px",
              border: isSelected
                ? "2.5px solid #7c3aed"
                : "2px solid #e9d5ff",
              background: isSelected
                ? "#f5f3ff"
                : "#ffffff",
              color: "#1e1b4b",
              cursor: disabled ? "default" : "pointer",
              textAlign: "left",
              fontSize: "16px",
              lineHeight: "1.5",
              transition: "all 0.18s ease",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: isSelected ? "0 0 0 3px rgba(124,58,237,0.1)" : "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <span
              style={{
                minWidth: "32px",
                height: "32px",
                borderRadius: "50%",
                background: isSelected ? "#7c3aed" : "#ede9fe",
                color: isSelected ? "#fff" : "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "14px",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              {letters[i]}
            </span>
            <span style={{ paddingTop: "5px" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
// ─── MultiSelect ──────────────────────────────────────────────────────────────

function MultiSelect({ options, selected, onSelect, disabled }) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const toggle = (val) => {
    if (disabled) return;
    const next = selected.includes(val)
      ? selected.filter((s) => s !== val)
      : [...selected, val];
    onSelect(next);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "13px", color: "#a78bfa", margin: "0 0 4px 0", fontFamily: "'Nunito', sans-serif", fontWeight: "600" }}>
        Select all that apply
      </p>
      {options.map((opt, i) => {
      const val = typeof opt === "object" ? opt.id ?? opt.value ?? opt.text ?? opt : opt;
      const label = typeof opt === "object" ? opt.text ?? opt.value ?? opt : opt;
        const isSelected = selected.includes(val);
        return (
          <button
            key={i}
            onClick={() => toggle(val)}
            disabled={disabled}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "16px 20px",
              borderRadius: "14px",
              border: isSelected
                ? "2.5px solid #7c3aed"
                : "2px solid #e9d5ff",
              background: isSelected ? "#f5f3ff" : "#ffffff",
              color: "#1e1b4b",
              cursor: disabled ? "default" : "pointer",
              textAlign: "left",
              fontSize: "16px",
              lineHeight: "1.5",
              transition: "all 0.18s ease",
              fontFamily: "'Nunito', sans-serif",
              boxShadow: isSelected ? "0 0 0 3px rgba(124,58,237,0.1)" : "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <span
              style={{
                minWidth: "32px",
                height: "32px",
                borderRadius: "6px",
                background: isSelected ? "#7c3aed" : "#ede9fe",
                color: isSelected ? "#fff" : "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "14px",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              {isSelected ? "✓" : letters[i]}
            </span>
            <span style={{ paddingTop: "5px" }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
 
// ─── InlineChoice ─────────────────────────────────────────────────────────────

function InlineChoice({ stem, options, selected, onSelect, disabled }) {
  const parts = (stem || "").split("{{blank}}");
  return (
    <div style={{ fontSize: "17px", lineHeight: "1.8", color: "#1e1b4b", fontFamily: "'Nunito', sans-serif" }}>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <select
              value={selected ?? ""}
              onChange={(e) => !disabled && onSelect(e.target.value)}
              disabled={disabled}
              style={{
                display: "inline-block",
                margin: "0 6px",
                padding: "4px 10px",
                borderRadius: "8px",
                border: "2px solid #7c3aed",
                background: "#f5f3ff",
                color: "#4c1d95",
                fontSize: "15px",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: "700",
                cursor: disabled ? "default" : "pointer",
              }}
            >
              <option value="">— choose —</option>
              {(options || []).map((opt, j) => (
                <option key={j} value={opt}>{opt}</option>
              ))}
            </select>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── HotText ──────────────────────────────────────────────────────────────────
// hot_text_targets from the generator are objects: { id, text, is_correct }
// We receive them already mapped to plain strings by QuestionWrapper below.
// selectedIdx is the index into the targets string array.

// Renders passage_tokens directly — no string matching, no mode detection.
// Falls back to old behavior if passage_tokens is absent (backwards compat).
 
function HotText({ passage, targets, passageTokens, selectedIdx, onSelect, disabled }) {
  // Build id→idx map from hot_text_targets array e.g. {ht1:0, ht2:1, ...}
  const idToIdx = useMemo(() => {
    const map = {};
    (targets ?? []).forEach((t, i) => {
      // targets is already mapped to plain strings by QuestionWrapper
      // We need the original id — derive from position: targets[0] = ht1, etc.
      map[`ht${i + 1}`] = i;
    });
    return map;
  }, [targets]);
 
  const useTokens = Array.isArray(passageTokens) && passageTokens.length > 0;
 
  // Legacy fallback: word-split for cached questions without passage_tokens
  const legacyTokens = useMemo(() => {
    if (useTokens || !passage || !targets?.length) return [];
     // Detect if targets are sentences (contain periods or are long)
  const isSentenceMode = targets.some((t) => t.length > 30 || t.includes("."));
  
if (isSentenceMode) {
  const sentences = passage.split(/(?<=[.!?])\s+/);
  return sentences.map((sentence, i) => {
    const targetIdx = targets.findIndex((t) => {
      const cleanTarget = t.trim().replace(/[.!?]$/, "").toLowerCase();
      const cleanSentence = sentence.trim().replace(/[.!?]$/, "").toLowerCase();
      return cleanTarget === cleanSentence || 
             cleanSentence.includes(cleanTarget) || 
             cleanTarget.includes(cleanSentence);
    });
    return { id: i, text: sentence, targetIdx, isTarget: targetIdx !== -1, isSpace: false, isSentence: true };
  });
}
 
    
    const parts = passage.split(/(\s+)/);
    return parts.map((part, i) => {
      const clean = part.replace(/[^a-zA-Z0-9'-]/g, "").toLowerCase();
      const targetIdx = targets.findIndex(
        (t) => t.replace(/[^a-zA-Z0-9'-]/g, "").toLowerCase() === clean
      );
      return { id: i, text: part, targetIdx, isTarget: targetIdx !== -1, isSpace: /^\s+$/.test(part) };
    });
  }, [passage, targets, useTokens]);
 
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Instruction */}
      <p style={{
        fontSize: "13px",
        fontWeight: "800",
        color: "#7c3aed",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        margin: 0,
        fontFamily: "'Nunito', sans-serif",
      }}>
        {useTokens ? "Tap to select the correct part" : "Tap a word to select it"}
      </p>
 
      {/* Passage */}
      <div style={{
        background: "#faf5ff",
        borderRadius: "12px",
        padding: "18px 20px",
        fontSize: "15px",
        lineHeight: "1.9",
        color: "#1e1b4b",
        fontFamily: "'Georgia', serif",
        border: "1px solid #e9d5ff",
        borderLeft: "4px solid #7c3aed",
      }}>
        {useTokens
          ? passageTokens.map((token, i) => {
              if (!token.is_target) {
                return <span key={i} style={{ color: "#374151" }}>{token.text}</span>;
              }
              const idx = idToIdx[token.target_id] ?? -1;
              if (idx === -1) {
                return <span key={i} style={{ color: "#374151" }}>{token.text}</span>;
              }
              const isSelected = idx === selectedIdx;
              return (
                <span
                  key={i}
                  onClick={() => !disabled && onSelect(idx)}
                  style={{
                    display: "inline",
                    cursor: disabled ? "default" : "pointer",
                    borderRadius: "3px",
                    padding: "1px 2px",
                    background: isSelected ? "#7c3aed" : "transparent",
                    color: isSelected ? "#ffffff" : "#4c1d95",
                    fontWeight: isSelected ? "700" : "600",
                    textDecorationLine: isSelected ? "none" : "underline",
                    textDecorationStyle: "solid",
                    textDecorationColor: isSelected ? "transparent" : "#7c3aed",
                    textDecorationThickness: "2px",
                    textUnderlineOffset: "3px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {token.text}
                </span>
              );
            })
          : legacyTokens.map((token) => {
              if (token.isSpace) return <span key={token.id}>{token.text}</span>;
              if (!token.isTarget) {
                return <span key={token.id} style={{ color: "#374151" }}>{token.text}{token.isSentence ? " " : ""}</span>;
              }
              const isSelected = token.targetIdx === selectedIdx;
              return (
                <span
                  key={token.id}
                  onClick={() => !disabled && onSelect(token.targetIdx)}
                  style={{
                    display: "inline",
                    cursor: disabled ? "default" : "pointer",
                    borderRadius: "3px",
                    padding: "1px 2px",
                    background: isSelected ? "#7c3aed" : "transparent",
                    color: isSelected ? "#ffffff" : "#4c1d95",
                    fontWeight: isSelected ? "700" : "600",
                    textDecorationLine: isSelected ? "none" : "underline",
                    textDecorationStyle: "solid",
                    textDecorationColor: isSelected ? "transparent" : "#7c3aed",
                    textDecorationThickness: "2px",
                    textUnderlineOffset: "3px",
                    transition: "all 0.15s ease",
                  }}
                >
                  {token.text}{token.isSentence ? " " : ""}
                </span>
              );
            })
        }
      </div>
 
      {/* Selection preview */}
      <div style={{ minHeight: "22px" }}>
        {selectedIdx !== null && targets[selectedIdx] && (
          <p style={{
            fontSize: "18px",
            color: "#7c3aed",
            margin: 0,
            fontFamily: "'Nunito', sans-serif",
            fontStyle: "italic",
          }}>
            Selected: <span style={{ color: "#4c1d95", fontStyle: "normal", fontWeight: "700" }}>
              &ldquo;{targets[selectedIdx]}&rdquo;
            </span>
          </p>
        )}
      </div>
    </div>
  );
}


// ─── QuestionWrapper ──────────────────────────────────────────────────────────

function QuestionWrapper({ question, onSubmit, disabled }) {
  const { question_type, stem, passage, answer_options, hot_text_targets } = question;
 
  // hot_text_targets from API are objects { id, text, is_correct } — map to strings
  // for the HotText renderer. Falls back gracefully if already strings.
  const targetStrings = useMemo(() => {
    if (!hot_text_targets?.length) return [];
    return hot_text_targets.map((t) =>
      typeof t === "object" ? t.text ?? "" : t
    );
  }, [hot_text_targets]);
 
  // Answer state — hot_text uses selectedIdx (number|null), others use string/array
  const [answer, setAnswer] = useState(
    question_type === "multi_select" ? [] :
    question_type === "hot_text" ? null :
    ""
  );
 
  // Reset when question changes
  useEffect(() => {
    setAnswer(
      question_type === "multi_select" ? [] :
      question_type === "hot_text" ? null :
      ""
    );
  }, [question.attempt_id, question_type]);
 
  const isEmpty =
    answer === "" ||
    answer === null ||
    (Array.isArray(answer) && answer.length === 0);
 
  const handleSubmit = () => {
    if (isEmpty || disabled) return;
 
    if (question_type === "hot_text") {
      // Submit as { sentence, index } to match scoring expectations
      onSubmit({ sentence: targetStrings[answer], index: answer });
    } else {
      onSubmit(answer);
    }
  };
 
  const renderInput = () => {
    switch (question_type) {
      case "multiple_choice":
        return (
          <MultipleChoice
            options={answer_options || []}
            selected={answer}
            onSelect={setAnswer}
            disabled={disabled}
          />
        );
      case "multi_select":
        return (
          <MultiSelect
            options={answer_options || []}
            selected={answer}
            onSelect={setAnswer}
            disabled={disabled}
          />
        );
      case "hot_text":
        return (
          <HotText
            passage={passage}
            targets={targetStrings}
            passageTokens={question.passage_tokens ?? null} 
            selectedIdx={answer}
            onSelect={setAnswer}
            disabled={disabled}
          />
        );
      case "constructed_response":
        return (
          <ConstructedResponse
            value={answer}
            onChange={setAnswer}
            disabled={disabled}
          />
        );
      case "inline_choice":
        return (
          <InlineChoice
            stem={stem}
            options={answer_options || []}
            selected={answer}
            onSelect={setAnswer}
            disabled={disabled}
          />
        );
      default:
        return (
          <ConstructedResponse
            value={answer}
            onChange={setAnswer}
            disabled={disabled}
          />
        );
    }
  };
 
  return (
    <div>
      {/* Passage block — skipped for hot_text since HotText renders its own passage */}
      {passage && question_type !== "hot_text" && (
        <div style={{
          background: "#faf5ff",
          borderLeft: "4px solid #7c3aed",
          borderRadius: "12px",
          padding: "18px 20px",
          marginBottom: "24px",
          fontSize: "16px",
          lineHeight: "1.85",
          color: "#374151",
          fontFamily: "'Georgia', serif",
          maxHeight: "220px",
          overflowY: "auto",
          border: "1px solid #e9d5ff",
          borderLeftWidth: "4px",
          borderLeftColor: "#7c3aed",
        }}>
          <p style={{ fontSize: "14px", fontWeight: "800", letterSpacing: "0.1em", color: "#7c3aed", margin: "0 0 10px 0", textTransform: "uppercase", fontFamily: "'Nunito', sans-serif" }}>
            Read this passage
          </p>
          {passage}
        </div>
      )}
 
      {/* Stem */}
      {question_type !== "inline_choice" && (
        <p style={{
          fontSize: "18px",
          fontWeight: "700",
          color: "#1e1b4b",
          marginBottom: "22px",
          lineHeight: "1.55",
          fontFamily: "'Nunito', sans-serif",
        }}>
          {stem}
        </p>
      )}
 
      {renderInput()}
 
      <button
        onClick={handleSubmit}
        disabled={isEmpty || disabled}
        style={{
          marginTop: "28px",
          width: "100%",
          padding: "18px",
          borderRadius: "16px",
          border: "none",
          background: isEmpty || disabled ? "#e9d5ff" : "#facc15",
          color: isEmpty || disabled ? "#a78bfa" : "#1e1b4b",
          fontSize: "17px",
          fontWeight: "800",
          cursor: isEmpty || disabled ? "not-allowed" : "pointer",
          transition: "all 0.18s ease",
          fontFamily: "'Nunito', sans-serif",
          letterSpacing: "0.01em",
          boxShadow: isEmpty || disabled ? "none" : "0 2px 8px rgba(250,204,21,0.4)",
        }}
      >
        Submit Answer →
      </button>
    </div>
  );
}

// ─── DokBadge ─────────────────────────────────────────────────────────────────

function DokBadge({ level }) {
  const labels = { 1: "Recall", 2: "Skills", 3: "Strategic" };
  const colors = { 1: "#3b82f6", 2: "#7c3aed", 3: "#db2777" };
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "4px 10px",
      borderRadius: "99px",
      background: `${colors[level] ?? "#60a5fa"}22`,
      border: `1.5px solid ${colors[level] ?? "#60a5fa"}`,
      color: colors[level] ?? "#60a5fa",
      fontSize: "12px",
      fontWeight: "700",
      fontFamily: "'Nunito', sans-serif",
      letterSpacing: "0.03em",
    }}>
      DOK {level} · {labels[level] ?? ""}
    </span>
  );
}

// ─── ConstructedResponse ──────────────────────────────────────────────────────
 
function ConstructedResponse({ value, onChange, disabled }) {
  return (
    <div>
      <p style={{ fontSize: "13px", color: "#7c3aed", margin: "0 0 10px 0", fontFamily: "'Nunito', sans-serif", fontWeight: "600" }}>
        Write your answer in the box below.
      </p>
      <textarea
        value={value}
        onChange={(e) => !disabled && onChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer here..."
        rows={5}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "14px",
          border: "2px solid #e9d5ff",
          background: "#faf5ff",
          color: "#1e1b4b",
          fontSize: "16px",
          lineHeight: "1.6",
          resize: "vertical",
          outline: "none",
          fontFamily: "'Nunito', sans-serif",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ─── FeedbackBanner ───────────────────────────────────────────────────────────

function FeedbackBanner({ isCorrect, explanation, onContinue }) {
  return (
    <div style={{
      borderRadius: "16px",
      padding: "20px 22px",
      background: isCorrect ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
      border: `2px solid ${isCorrect ? "#22c55e" : "#ef4444"}`,
      marginBottom: "20px",
      animation: "fadeSlideIn 0.3s ease",
    }}>
      <p style={{
        fontSize: "20px",
        fontWeight: "800",
        color: isCorrect ? "#4ade80" : "#f87171",
        margin: "0 0 6px 0",
        fontFamily: "'Nunito', sans-serif",
      }}>
        {isCorrect ? "✓ Correct! Great job!" : "✗ Not quite — keep going!"}
      </p>
      {explanation && (
        <p style={{
          fontSize: "15px",
          color: "rgba(28, 12, 12, 0.75)",
          margin: 0,
          lineHeight: "1.55",
          fontFamily: "'Nunito', sans-serif",
        }}>
          {explanation}
        </p>
      )}
 <div style={{
  display: "flex",
  justifyContent: "center",
  marginTop: "18px",
  animation: "fadeSlideIn 0.45s ease",
}}>
  <button
    onClick={onContinue}
    style={{
      background: isCorrect ? "#16a34a" : "#ea580c",
      color: "#ffffff",
      border: "none",
      borderRadius: "14px",
      padding: "12px 24px",
      fontSize: "15px",
      fontWeight: "800",
      cursor: "pointer",
      fontFamily: "'Nunito', sans-serif",
      boxShadow: isCorrect
        ? "0 6px 18px rgba(22,163,74,0.28)"
        : "0 6px 18px rgba(234,88,12,0.25)",
      transition: "all 0.18s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-1px) scale(1.03)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0) scale(1)";
    }}
  >
    Continue →
  </button>
</div>
    </div>
  );
}

// ─── CompletionScreen ─────────────────────────────────────────────────────────

function CompletionScreen({ correctCount, totalAnswered }) {
  const pct = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const emoji = pct >= 80 ? "🌟" : pct >= 60 ? "✔️" : "📚";
  const message =
    pct >= 80 ? "Amazing work! You're crushing it!" :
    pct >= 60 ? "Solid effort! Keep practicing!" :
    "Great job finishing! Every question makes you stronger!";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      padding: "40px 20px",
      animation: "fadeSlideIn 0.5s ease",
    }}>
      <div style={{ fontSize: "72px", marginBottom: "16px" }}>{emoji}</div>
      <h2 style={{ fontSize: "28px", fontWeight: "900", color: "#F5C518", margin: "0 0 12px 0", fontFamily: "'Nunito', sans-serif" }}>
        Session Complete!
      </h2>
      <p style={{ fontSize: "18px", color: "#7c3aed", margin: "0 0 32px 0", fontFamily: "'Nunito', sans-serif", lineHeight: "1.5" }}>
        {message}
      </p>

      {/* <div style={{ display: "flex", gap: "16px", marginBottom: "36px", flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { label: "Questions", value: totalAnswered },
          { label: "Correct", value: correctCount },
          { label: "Score", value: correctCount / totalAnswered ? `${pct}%` : "0%" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "rgba(255,255,255,0.07)",
            borderRadius: "16px",
            padding: "20px 28px",
            border: "1.5px solid rgba(255,255,255,0.12)",
            minWidth: "90px",
          }}>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "#F5C518", fontFamily: "'Nunito', sans-serif" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "13px", color: "#7c3aed", fontFamily: "'Nunito', sans-serif", marginTop: "4px" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div> */}
      <p style={{ fontSize: "15px", color: "#7c3aed", fontFamily: "'Nunito', sans-serif" }}>
        You can close this window. Your teacher will see your results.
      </p>
    </div>
  );
}

// ─── Main SessionClient ───────────────────────────────────────────────────────

export default function SessionClient({ sessionId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [teksStandard, setTeksStandard] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [scoring, setScoring] = useState(false); // true while awaiting AI scoring response
  const [feedback, setFeedback] = useState(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [nextQuestion, setNextQuestion] = useState(null); // for preloading the next question after feedback is shown
  const [pendingComplete, setPendingComplete] = useState(false); // store final data to show on completion screen after feedback

  const startTimeRef = useRef(null);
 
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);
 
  const getElapsedSeconds = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Math.round((Date.now() - startTimeRef.current) / 1000);
  }, []);


  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/v2/assessments/${sessionId}/current`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Could not load session.");
        }
        const data = await res.json();
        console.log("Loaded session data:", data);
        if (data.session_complete) {
          setSessionComplete(true);
          setLoading(false);
          return;
        }
        setStudentName(data.joined_name ?? "");
        setTeksStandard(data.question.teks_standard ?? "");
        setQuestion(data.question);
        setQuestionNumber(data.question_number ?? 1);
        setCorrectCount(data.correct_count ?? 0);
        setTotalAnswered(data.total_answered ?? 0);
        startTimer();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId, startTimer]);

  const handleSubmit = async (studentAnswer) => {
    if (submitting || !question) return;
    setSubmitting(true);
    setScoring(true); // show "checking answer" immediately — before AI responds

    const timeSpent = getElapsedSeconds();
    console.log("Submitting:", {
      attempt_id: question.attempt_id,
      student_answer: studentAnswer,
      time_spent_seconds: timeSpent,
    });

    try {
      const res = await fetch(`/api/v2/assessments/${sessionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attempt_id: question.attempt_id,
          student_answer: studentAnswer,
          time_spent_seconds: timeSpent,
        }),
      });

      const data = await res.json();
      setScoring(false); // response is back — hand off to feedback banner
      if (!res.ok) throw new Error(data.error || "Submit failed.");

      setTotalAnswered((n) => n + 1);
      setCorrectCount((n) => n + (data.is_correct ? 1 : 0));
      setFeedback({ 
        isCorrect: data.is_correct, 
        explanation: data.feedback ?? data.explanation ?? null 
      });

      setNextQuestion(data.question ?? null); // store next question for preloading while feedback is shown
      setPendingComplete(data.session_complete || false);

      if (data.session_complete) {
        setTimeout(() => {
          setFeedback(null);
          setSessionComplete(true);
        }, 2200);
        return;
      }

      // setTimeout(() => {
      //   setFeedback(null);
      //   setSubmitting(false);
      //   setQuestion(data.question);
      //   setQuestionNumber((n) => n + 1);
      //   startTimer();
      // }, 2000);
    } catch (err) {
      setScoring(false);
      setSubmitting(false);
      setError(err.message);
    }
  };

 const handleContinue = () => {
  setFeedback(null);

  if (pendingComplete) {
    setSessionComplete(true);
    return;
  }

  setSubmitting(false);
  setQuestion(nextQuestion);
  setQuestionNumber((n) => n + 1);
  startTimer();
};

      // background: #0e0622; //temp remove hardcoded background in favor of CSS gradient for better performance and aesthetics

 const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Bebas+Neue&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #f5f3ff; }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
  .session-card { animation: fadeSlideIn 0.4s ease; }
  .progress-bar-fill { transition: width 0.5s ease; }
`;

  //const MAX_Q = 10;
  const MAX_Q = question?.question_type === "constructed_response" ? 5 : 10;
  const progressPct = Math.min(((questionNumber - 1) / MAX_Q) * 100, 100);

  return (
    <>
      <style>{styles}</style>
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #f5f3ff 0%, #ede9fe 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "24px 16px 60px",
      fontFamily: "'Nunito', sans-serif",
    }}>
        {/* Header */}
        <div style={{
          width: "100%",
          maxWidth: "680px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}>
         <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", letterSpacing: "0.06em", color: "#4c1d95" }}>
          WorksheetzAI
        </span>
        {studentName && (
          <span style={{ fontSize: "14px", color: "#7c3aed", fontWeight: "700" }}>
            👋 {studentName}
          </span>
        )}
        </div>

        {/* Main card */}
       <div className="session-card" style={{
            width: "100%",
            maxWidth: "680px",
            background: "#ffffff",
            border: "1.5px solid #e9d5ff",
            borderRadius: "24px",
            boxShadow: "0 25px 25px rgba(124,58,237,0.08)",
            overflow: "hidden",
          }}>
          {/* Top bar */}
          {!sessionComplete && !loading && !error && (
           <div style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f3e8ff",
            background: "#cab3e1",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
          }}>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: "800", color: "#714be1", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Question {questionNumber} of {MAX_Q}
            </span>
              {teksStandard && (
              <span style={{
                fontSize: "12px", padding: "3px 10px", borderRadius: "99px",
                background: "#fef9c3", color: "#854d0e", fontWeight: "700",
                border: "1px solid #fde68a",
              }}>
               TEKS {teksStandard}
              </span>
            )}
          </div>
          {question?.dok_level && <DokBadge level={question.dok_level} />}
        </div>
          )}

          {/* Progress bar */}
          {!sessionComplete && !loading && !error && (
            <div style={{ height: "4px", background: "rgba(255,255,255,0.07)" }}>
              <div className="progress-bar-fill" style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #7c3aed, #F5C518)",
                borderRadius: "0 2px 2px 0",
              }} />
            </div>
          )}

          {/* Card body and loading state */}
          <div style={{ padding: "28px 24px" }}>
            {loading && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#a78bfa", animation: "pulse 1.5s ease infinite" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
              <p style={{ fontSize: "17px", fontWeight: "700", margin: 0, fontFamily: "'Nunito', sans-serif", color: "#7c3aed" }}>
                Loading your question...
              </p>
            </div>
            )}

            {error && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#f87171" }}>
                <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
                <p style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 8px 0", fontFamily: "'Nunito', sans-serif" }}>
                  Something went wrong
                </p>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", margin: 0, fontFamily: "'Nunito', sans-serif" }}>
                  {error}
                </p>
              </div>
            )}

            {sessionComplete && (
              <CompletionScreen totalAnswered={totalAnswered} correctCount={correctCount} />
            )}

           {!loading && !error && !sessionComplete && question && (
              <div key={question.attempt_id}>
                {/* Step 2: AI is scoring — show neutral indicator */}
                {scoring && !feedback && (
                     <div style={{
                      borderRadius: "16px", padding: "24px 22px",
                      background: "#f5f3ff", border: "2px solid #c4b5fd",
                      marginBottom: "20px", display: "flex", alignItems: "center", gap: "14px",
                      animation: "fadeSlideIn 0.3s ease",
                    }}>
                    <div style={{ fontSize: "28px", animation: "pulse 1s ease infinite" }}>🤔</div>
                    <div>
                       <p style={{ fontSize: "16px", fontWeight: "800", color: "#4c1d95", margin: "0 0 3px 0", fontFamily: "'Nunito', sans-serif" }}>
                        Checking your answer...
                      </p>
                                          <p style={{ fontSize: "13px", color: "#a78bfa", margin: 0, fontFamily: "'Nunito', sans-serif" }}>
                        This might take a moment
                      </p>
                    </div>
                  </div>
                )}
                {/* Step 3: Score is back — show correct/incorrect */}
                {feedback && (
                  <FeedbackBanner isCorrect={feedback.isCorrect} explanation={feedback.explanation} onContinue={handleContinue} />
                )}
                {/* Question input — hidden while scoring or showing feedback */}
                {!scoring && !feedback && (
                  <QuestionWrapper
                    question={question}
                    onSubmit={handleSubmit}
                    disabled={false}
                  />
                )}
                {/* Step 5: Feedback shown, next question generating */}
                {feedback && submitting && question?.question_type !== "constructed_response" && (
                  <div style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#a78bfa",
                    fontSize: "14px",
                    fontFamily: "'Nunito', sans-serif",
                    animation: "pulse 1s ease infinite",
                  }}>
                    Loading next question...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
 
        {/* Footer score strip */}
        {!loading && !error && !sessionComplete && totalAnswered > 0 && (
          <div style={{
            marginTop: "18px",
            display: "flex",
            gap: "20px",
            fontSize: "13px",
            color: "#a78bfa",
            fontFamily: "'Nunito', sans-serif",
            fontWeight: "700",
          }}>
            <span>✓ {correctCount} correct</span>
            <span>· {totalAnswered} answered</span>
            <span>· {totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0}%</span>
          </div>
        )}
      </div>
    </>
  );
}
 