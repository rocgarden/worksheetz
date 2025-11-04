"use client";

import React from "react";

export default function AnswerKeyReview({ worksheet }) {
  if (!worksheet) return null;

  const renderAnswers = (answer, choices = []) => {
    const answers = Array.isArray(answer) ? answer : [answer];
    console.log("Answers received:", answer);

    const filtered = answers.filter(
      (a) => typeof a === "string" && a.trim() !== ""
    );
    if (filtered.length === 0)
      return (
        <div className="text-sm text-gray-500 italic">
          No correct answer selected.
        </div>
      );

    return filtered.map((ansId, idx) => {
      // Find matching choice
      const match = choices.find(
        (c) => c.id?.toLowerCase() === ansId.toLowerCase()
      );
      const label = match ? `${match.id.toUpperCase()}) ${match.text}` : ansId;

      return (
        <div
          key={idx}
          className="text-sm bg-gray-100 p-2 text-black rounded mb-1 border border-gray-300"
        >
          ✅ {label}
        </div>
      );
    });
  };

  return (
    <div className="mb-10">
      {/* Guided Practice */}
      <Section title="🧠 Guided Practice">
        {worksheet.guided_practice?.questions.map((q, idx) => (
          <Question
            key={idx}
            idx={idx}
            q={q}
            renderAnswers={(a) => renderAnswers(a, q.choices)}
          />
        ))}
      </Section>

      {/* Independent Practice 1 */}
      <Section title="🧩 Independent Practice 1">
        {worksheet.independent_practice?.questions.map((q, idx) => (
          <Question
            key={idx}
            idx={idx}
            q={q}
            renderAnswers={(a) => renderAnswers(a, q.choices)}
          />
        ))}
      </Section>

      {/* Independent Practice 2 */}
      {worksheet.independent_practice_2 && (
        <Section title="🧩 Independent Practice 2">
          {worksheet.independent_practice_2.questions.map((q, idx) => (
            <Question
              key={idx}
              idx={idx}
              q={q}
              renderAnswers={(a) => renderAnswers(a, q.choices)}
            />
          ))}
        </Section>
      )}

      {/* Intro Activity Answers */}
      {worksheet.intro_activity?.answers?.length > 0 && (
        <Section title="🧩 Practice Activity">
          {worksheet.intro_activity.answers.map((q, idx) => (
            <div
              key={idx}
              className="bg-gray-50 border border-gray-200 p-4 rounded mb-3"
            >
              <label className="block text-sm text-gray-600 mb-1">
                Answers
              </label>
              {renderAnswers(q.answers, q.choices)}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h4 className="text-lg font-medium text-purple-700 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Question({ idx, q, renderAnswers }) {
  return (
    <div className="bg-gray-50 border border-gray-200 p-4 rounded mb-3">
      <p className="text-sm text-gray-700 font-semibold mb-2">
        Question {idx + 1}: {q.question || q.prompt || q.sentence || ""}
      </p>
      {q.type === "multiple-choice" && (
        <>
          <label className="block text-sm text-gray-600 mb-1">Answers</label>
          {renderAnswers(q.answer, q.choices)}
        </>
      )}
    </div>
  );
}
