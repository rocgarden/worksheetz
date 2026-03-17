// app/api/generate-json/pdfTemplates/staarReading/components/passage.js

import { escapeHtml, safeStr, safeArray } from "../../utils/normalizeData.js";

function renderParagraphs(text) {
  const paragraphs = safeStr(text)
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs
    .map((p) => `<p class="staar-passage-paragraph">${escapeHtml(p)}</p>`)
    .join("");
}

function renderLineReference(lines = []) {
  if (!Array.isArray(lines) || lines.length === 0) return "";

  return `
    <div class="staar-line-ref">
      <div class="staar-line-ref-title">Line Reference</div>
      ${lines.map((line) => `<div class="staar-line-ref-item">${escapeHtml(line)}</div>`).join("")}
    </div>
  `;
}

export function renderStaarReadingPassage(passage = {}) {
  const title = safeStr(passage.title) || "Reading Passage";
  const text = safeStr(passage.text);
  const lines = safeArray(passage.lines);

  return `
    <section class="worksheet-section">
      <div class="worksheet-title">STAAR Reading Practice</div>
      <div class="worksheet-subtitle" style="font-style: normal; font-weight: 700;">
        ${escapeHtml(title)}
      </div>

      <div class="staar-passage-text">
        ${renderParagraphs(text)}
      </div>

    </section>
  `;
}