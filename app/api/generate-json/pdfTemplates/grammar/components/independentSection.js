// app/api/generate-json/pdfTemplates/grammar/components/independentSection.js

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
        <p class="question-text">${i + 1}. ${escapeHtml(q.question || q.sentence || "")}</p>
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

export function renderIndependentSection({ title, section }) {
  const questions = Array.isArray(section?.questions) ? section.questions : [];

  return `
    <section class="worksheet-section">
      <div class="section-title">${escapeHtml(title || "")}</div>

      ${
        section?.instructions
          ? `<p class="instruction-text">${escapeHtml(section.instructions)}</p>`
          : ""
      }

      ${
        section?.story
          ? `<div class="grammar-box"><div class="grammar-story">${escapeHtml(section.story)}</div></div>`
          : ""
      }

      ${questions.map((q, i) => renderQuestion(q, i)).join("")}
    </section>
  `;
}