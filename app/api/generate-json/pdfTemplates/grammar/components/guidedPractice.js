// app/api/generate-json/pdfTemplates/grammar/components/guidedPractice.js

import { responseLines } from "../../shared/responseLines.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderQuestion(q, i) {
  if (q.type === "multiple-choice") {
    return `
      <div class="worksheet-section avoid-break">
        <p class="question-text">${i + 1}. ${escapeHtml(q.sentence || q.question || "")}</p>
        <div>
          ${(q.choices || [])
            .map(
              (c) => `
                <p class="choice-text">${escapeHtml(String(c.id || "").toUpperCase())}) ${escapeHtml(c.text || "")}</p>
              `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (q.type === "open-ended") {
    return `
      <div class="worksheet-section avoid-break">
        <p class="question-text">${i + 1}. ${escapeHtml(q.prompt || "")}</p>
        ${responseLines(2)}
      </div>
    `;
  }

  return "";
}

export function renderGuidedPractice(guided_practice = {}) {
  const questions = Array.isArray(guided_practice.questions)
    ? guided_practice.questions
    : [];

  return `
    <section class="worksheet-section">
      <div class="section-title">Guided Practice</div>

      ${
        guided_practice.instructions
          ? `<p class="instruction-text">${escapeHtml(guided_practice.instructions)}</p>`
          : ""
      }

      ${questions.map((q, i) => renderQuestion(q, i)).join("")}
    </section>
  `;
}