// app/api/generate-json/pdfTemplates/socialStudies/components/collaborativeActivity.js

import { responseLines } from "../../shared/responseLines.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function capitalizeFirstLetter(string) {
  if (typeof string !== "string") return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function renderCollaborativeActivity(topic = "") {
  const capitalizedTopic = capitalizeFirstLetter(topic);

  return `
    <section class="worksheet-section">
      <div class="social-subsection-title">Collaborative Activity</div>
      <p class="instruction-text">• Discuss with a partner one important concept or theme about the ${escapeHtml(capitalizedTopic)}.</p>
      <p class="instruction-text">• Write a sentence or draw a picture about what your partner discussed.</p>
      ${responseLines(3)}
    </section>
  `;
}