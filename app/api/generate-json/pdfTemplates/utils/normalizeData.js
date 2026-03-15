// app/api/generate-json/pdfTemplates/utils/normalizeData.js

export function normalizeData(data) {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

export function safeStr(value) {
  return typeof value === "string" ? value : "";
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}