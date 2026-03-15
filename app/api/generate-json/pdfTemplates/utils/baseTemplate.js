// app/api/generate-json/pdfTemplates/utils/baseTemplate.js

import { buildStyles } from "./buildHtml.js";

export function baseTemplate({ title = "Worksheet", body = "" }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
      <style>
        ${buildStyles()}
      </style>
    </head>
    <body>
      <main class="worksheet-shell">
        ${body}
      </main>

      <footer class="worksheet-footer">
        © Worksheetz AI — Generated for classroom use
      </footer>
    </body>
  </html>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}