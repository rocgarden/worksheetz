// app/api/generate-json/pdfTemplates/staarReading/components/questionMultipleChoice.js

import { escapeHtml, safeArray, safeStr } from "../../utils/normalizeData.js";
import { teksLabel } from "../../shared/teksLabel.js";

export function renderQuestionMultipleChoice(question, index) {
  const n = index + 1;

  return `
    <div class="worksheet-section avoid-break">
      <div class="question-text">${n}. ${escapeHtml(safeStr(question.question))}</div>
      ${teksLabel(question.teks)}
      ${safeArray(question.choices)
        .map(
          (choice) => `
          <div class="choice-text">
            ${escapeHtml(safeStr(choice.id).toUpperCase())}) ${escapeHtml(safeStr(choice.text))}
          </div>
        `
        )
        .join("")}
    </div>
  `;
}