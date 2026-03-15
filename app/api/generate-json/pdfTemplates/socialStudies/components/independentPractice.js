// app/api/generate-json/pdfTemplates/socialStudies/components/independentPractice.js

import { responseLines } from "../../shared/responseLines.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderIndependentPractice(practice = {}) {
  const questions = Array.isArray(practice.questions) ? practice.questions : [];

  return `
    <section class="worksheet-section">
      <div class="section-title">Independent Practice</div>

      ${
        practice.instructions
          ? `<p class="instruction-text">${escapeHtml(practice.instructions)}</p>`
          : ""
      }

      ${
        practice.story
          ? `<div class="social-box"><div class="social-story">${escapeHtml(practice.story)}</div></div>`
          : ""
      }

      ${questions
        .map((q, i) => {
          if (q.type === "multiple-choice") {
            return `
              <div class="worksheet-section avoid-break">
                <p class="question-text">${i + 1}. ${escapeHtml(q.question)}</p>
                ${(q.choices || [])
                  .map(
                    (choice) => `
                      <p class="choice-text">${escapeHtml(String(choice.id || "").toUpperCase())}) ${escapeHtml(choice.text || "")}</p>
                    `
                  )
                  .join("")}
              </div>
            `;
          }

          if (q.type === "open-ended") {
            return `
              <div class="worksheet-section avoid-break">
                <p class="question-text">${i + 1}. ${escapeHtml(q.prompt)}</p>
                ${responseLines(3)}
              </div>
            `;
          }

          return "";
        })
        .join("")}
    </section>
  `;
}