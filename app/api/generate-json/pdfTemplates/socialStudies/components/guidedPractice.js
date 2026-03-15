// app/api/generate-json/pdfTemplates/socialStudies/components/guidedPractice.js

import { responseLines } from "../../shared/responseLines.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderGuidedPractice(practice = {}) {
  const questions = Array.isArray(practice.questions) ? practice.questions : [];
  const mcQuestions = questions.filter((q) => q.type === "multiple-choice");
  const openEnded = questions.find((q) => q.type === "open-ended");

  return `
    <section class="worksheet-section">
      <div class="section-title">Guided Practice</div>

      ${
        practice.instructions
          ? `<p class="instruction-text">${escapeHtml(practice.instructions)}</p>`
          : ""
      }

      ${mcQuestions
        .map(
          (q, i) => `
            <div class="worksheet-section avoid-break">
              ${
                q.source || q.paragraph
                  ? `<p class="body-text"><strong>${q.source ? "Source" : "Paragraph"}:</strong> ${escapeHtml(q.source || q.paragraph)}</p>`
                  : ""
              }

              <p class="question-text">${i + 1}. ${escapeHtml(q.question)}</p>

              ${(q.choices || [])
                .map(
                  (choice) => `
                    <p class="choice-text">${escapeHtml(String(choice.id || "").toUpperCase())}) ${escapeHtml(choice.text || "")}</p>
                  `
                )
                .join("")}
            </div>
          `
        )
        .join("")}

      ${
        openEnded
          ? `
            <div class="worksheet-section avoid-break">
              <p class="question-text">${mcQuestions.length + 1}. ${escapeHtml(openEnded.prompt)}</p>
              ${responseLines(3)}
            </div>
          `
          : ""
      }
    </section>
  `;
}