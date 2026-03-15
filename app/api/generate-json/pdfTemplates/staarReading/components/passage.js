// app/api/generate-json/pdfTemplates/staarReading/components/passage.js

import { escapeHtml, safeStr, safeArray } from "../../utils/normalizeData.js";

function splitToLines(text) {
  const t = safeStr(text).trim();
  if (!t) return [];
  return t.split(/(?<=[.!?])\s+/).filter(Boolean).map((s, i) => `(${i + 1}) ${s}`);
}

export function renderStaarReadingPassage(passage = {}) {
  const title = safeStr(passage.title) || "Reading Passage";
  const text = safeStr(passage.text);
  const lines =
    safeArray(passage.lines).length > 0 ? safeArray(passage.lines) : splitToLines(text);

  return `
    <section class="worksheet-section avoid-break">
      <div class="worksheet-title">STAAR Reading Practice</div>
      <div class="worksheet-subtitle">${escapeHtml(title)}</div>

      <div class="body-text">
        ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
      </div>
    </section>
  `;
}