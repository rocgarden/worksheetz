// app/api/generate-json/pdfTemplates/socialStudies/components/introActivity.js

import { responseLines } from "../../shared/responseLines.js";

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderIntroActivity(activity = {}) {
  if (!activity || !activity.type) return "";

  let content = "";

  switch (activity.type) {
    case "fill-in-the-blank":
      content = `
        ${
          Array.isArray(activity.word_bank) && activity.word_bank.length
            ? `<p class="body-text"><strong>Word Bank:</strong> ${activity.word_bank.map(escapeHtml).join(", ")}</p>`
            : ""
        }
        ${(activity.sentences || [])
          .map((s, i) => `<p class="body-text">${i + 1}. ${escapeHtml(s)}</p>`)
          .join("")}
      `;
      break;

    case "cloze-paragraph":
      content = `<p class="body-text">${escapeHtml(activity.paragraph || "")}</p>`;
      break;

    case "timeline_ordering":
      content = `
        ${(activity.events || [])
          .map((event) => `<p class="body-text">• ${escapeHtml(event)}</p>`)
          .join("")}
      `;
      break;

    case "question":
      content = `
        <p class="body-text">Question: ${escapeHtml(activity.question || "What do you think?")}</p>
        ${responseLines(3)}
      `;
      break;

    default:
      content = `<p class="body-text">Unsupported activity type.</p>`;
  }

  return `
    <section class="worksheet-section">
      <div class="social-subsection-title">Practice Activity</div>
      ${
        activity.instructions
          ? `<p class="instruction-text">${escapeHtml(activity.instructions)}</p>`
          : ""
      }
      ${content}
    </section>
  `;
}