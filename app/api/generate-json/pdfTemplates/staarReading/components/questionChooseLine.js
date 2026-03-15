// app/api/generate-json/pdfTemplates/staarReading/components/questionChooseLine.js

import { escapeHtml, safeStr } from "../../utils/normalizeData.js";
import { teksLabel } from "../../shared/teksLabel.js";
import { responseLines } from "../../shared/responseLines.js";

export function renderQuestionChooseLine(question, index) {
  const n = index + 1;

  return `
    <div class="worksheet-section avoid-break">
      <div class="question-text">${n}. ${escapeHtml(safeStr(question.question))}</div>
      ${teksLabel(question.teks)}
      <p class="instruction-text">Write the line that best supports your answer:</p>
      ${responseLines(2)}
    </div>
  `;
}