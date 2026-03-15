// app/api/generate-json/pdfTemplates/grammar/components/introSection.js

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderIntroSection(worksheet = {}) {
  const {
    concept = "",
    concept_introduction = "",
    example = "",
  } = worksheet;

  return `
    <section class="worksheet-section">
      <div class="worksheet-title">${escapeHtml(concept)}</div>

      ${concept_introduction ? `<p class="body-text">${escapeHtml(concept_introduction)}</p>` : ""}

      ${
        example
          ? `
            <div class="grammar-box">
              <strong>Example:</strong> ${escapeHtml(example)}
            </div>
          `
          : ""
      }
    </section>
  `;
}