// app/api/generate-json/pdfTemplates/reading/components/independentPassage.js

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderIndependentPassage(independent_practice = {}) {
  const p = independent_practice?.passage;

  const title = p?.title?.trim() || "";
  const subtitle = p?.subtitle?.trim() || "";
  const para1 = p?.paragraph1?.trim() || "";
  const para2 = p?.paragraph2?.trim() || "";

  const fallback = independent_practice?.story?.trim() || "";

  if (!title && !subtitle && !para1 && !para2 && !fallback) return "";

  return `
    <div class="reading-passage-layout">
      <div class="leading-relaxed">

        ${title ? `<div class="worksheet-subtitle" style="font-style:normal; font-weight:700; text-align:left;">${escapeHtml(title)}</div>` : ""}

        ${
          para1
            ? `<div class="reading-paragraph">${escapeHtml(para1)}</div>`
            : fallback
            ? `<div class="reading-paragraph">${escapeHtml(fallback)}</div>`
            : ""
        }

        ${subtitle ? `<div class="reading-subhead">${escapeHtml(subtitle)}</div>` : ""}

        ${para2 ? `<div class="reading-paragraph" style="margin-top:12px;">${escapeHtml(para2)}</div>` : ""}
      </div>

      <div class="notes-column">
        <p class="notes-heading">Notes</p>
        <div class="notes-lines">
          <hr />
          <hr />
          <hr />
          <hr />
          <hr />
        </div>
      </div>
    </div>
  `;
}