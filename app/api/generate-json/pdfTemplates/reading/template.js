// app/api/generate-json/pdfTemplates/reading/template.js

import { baseTemplate } from "../utils/baseTemplate.js";
import { normalizeData } from "../utils/normalizeData.js";
import { renderGuidedPractice } from "./components/guidedPractice.js";
import { renderIndependentPassage } from "./components/independentPassage.js";
import { renderReadingQuestions } from "./components/readingQuestions.js";
import { renderReadingAnswerKey } from "./components/readingAnswerKey.js";

export function readingTemplate({ worksheet }) {
  const normalized = normalizeData(worksheet);

  const {
    concept = "",
    concept_introduction = "",
    example = "",
    guided_practice = {},
    independent_practice = {},
  } = normalized;

  const body = `
    <section class="worksheet-section">
      <div class="worksheet-title">${escapeHtml(concept)}</div>

      ${
        concept_introduction
          ? `<p class="instruction-text">${escapeHtml(concept_introduction)}</p>`
          : ""
      }

      ${
        example
          ? `<p class="body-text"><strong>Example:</strong> ${escapeHtml(example)}</p>`
          : ""
      }
    </section>

    ${renderGuidedPractice(guided_practice)}

    <div class="page-break"></div>

    <section class="worksheet-section">
      <div class="section-title">Independent Practice</div>
      ${
        independent_practice.instructions
          ? `<p class="instruction-text">${escapeHtml(independent_practice.instructions)}</p>`
          : ""
      }
      ${renderIndependentPassage(independent_practice)}
      ${renderReadingQuestions(independent_practice.questions || [])}
    </section>

    <div class="page-break"></div>

    ${renderReadingAnswerKey(guided_practice, independent_practice)}
  `;

  return baseTemplate({
    title: concept || "Reading Worksheet",
    body,
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}