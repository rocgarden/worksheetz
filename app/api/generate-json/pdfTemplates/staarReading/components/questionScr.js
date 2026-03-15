// app/api/generate-json/pdfTemplates/staarReading/components/questionSCR.js

import { escapeHtml, safeStr } from "../../utils/normalizeData.js";
import { teksLabel } from "../../shared/teksLabel.js";
import { responseLines } from "../../shared/responseLines.js";

export function renderQuestionSCR(question, index) {
  const n = index + 1;

  return `
    <div class="worksheet-section avoid-break">
      <div class="question-text">${n}. ${escapeHtml(safeStr(question.prompt))}</div>
      ${teksLabel(question.teks)}
      ${responseLines(6)}
    </div>
  `;
}