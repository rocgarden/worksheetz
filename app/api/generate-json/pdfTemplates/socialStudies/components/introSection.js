// app/api/generate-json/pdfTemplates/socialStudies/components/introSection.js

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

export function renderIntroSection(worksheet = {}) {
  const {
    topic = "",
    concept_introduction = "",
    example = "",
  } = worksheet;

  return `
    <section class="worksheet-section">
      <div class="worksheet-title">${escapeHtml(capitalizeFirstLetter(topic))}</div>

      ${
        concept_introduction
          ? `<p class="instruction-text" style="font-style:italic;">${escapeHtml(concept_introduction)}</p>`
          : ""
      }

      ${
        example
          ? `<p class="body-text"><strong>Example:</strong> ${escapeHtml(example)}</p>`
          : ""
      }
    </section>
  `;
}