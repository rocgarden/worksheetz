// app/api/generate-json/pdfTemplates/shared/answerKey.js

import { escapeHtml, safeArray, safeStr } from "../utils/normalizeData.js";

export function renderStandardAnswerKeyItem(question, index) {
  const n = index + 1;

  if (question.type === "multiple-choice" || question.type === "multi-select") {
    const ans = safeArray(question.answer);

    const answerText = ans
      .map((ansId) => {
        const match = safeArray(question.choices).find(
          (c) => safeStr(c.id).toLowerCase() === safeStr(ansId).toLowerCase()
        );
        return match
          ? `${escapeHtml(safeStr(match.id).toUpperCase())}) ${escapeHtml(safeStr(match.text))}`
          : escapeHtml(safeStr(ansId).toUpperCase());
      })
      .join(", ");

    return `<p class="body-text">${n}. Answer: ${answerText || "—"}</p>`;
  }

  if (question.type === "choose-a-line") {
    const a = question.answer || {};
    const lineIndex =
      typeof a.lineIndex === "number" ? `Line ${a.lineIndex + 1} ` : "";
    const lineText = safeStr(a.lineText);

    return `<p class="body-text">${n}. Evidence: ${
      escapeHtml(lineIndex || "")
    }${lineIndex && lineText ? " — " : ""}${escapeHtml(
      lineText || "Student should cite a line from the passage."
    )}</p>`;
  }

  if (question.type === "scr") {
    return `<p class="body-text">${n}. SCR: Student response will vary.</p>`;
  }

  return "";
}