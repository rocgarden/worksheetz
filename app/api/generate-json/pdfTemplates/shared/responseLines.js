// app/api/generate-json/pdfTemplates/shared/responseLines.js

export function responseLines(count = 4) {
  return `
    <div class="notes-lines">
      ${Array.from({ length: count })
        .map(() => `<hr />`)
        .join("")}
    </div>
  `;
}