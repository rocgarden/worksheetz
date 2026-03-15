// app/api/generate-json/pdfTemplates/shared/teksLabel.js

import { escapeHtml } from "../utils/normalizeData.js";

export function teksLabel(teks) {
  if (!Array.isArray(teks) || teks.length === 0) return "";
  return `<div class="teks-label">TEKS: ${escapeHtml(teks.filter(Boolean).join(", "))}</div>`;
}