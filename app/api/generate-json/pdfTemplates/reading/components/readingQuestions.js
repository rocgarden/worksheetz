// app/api/generate-json/pdfTemplates/reading/components/readingQuestions.js

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderReadingQuestions(questions = []) {
  return `
    <div class="worksheet-section">
      ${questions
        .map((q, i) => {
          if (q.type === "multiple-choice") {
            return `
              <div class="worksheet-section avoid-break">
                <p class="question-text">${i + 1}. ${escapeHtml(q.question)}</p>
                ${(q.choices || [])
                  .map(
                    (c) => `
                      <p class="choice-text">
                        ${escapeHtml(String(c.id || "").toUpperCase())}) ${escapeHtml(c.text || "")}
                      </p>
                    `
                  )
                  .join("")}
              </div>
            `;
          }

          if (q.type === "open-ended") {
            return `
              <div class="worksheet-section avoid-break">
                <p class="question-text">${i + 1}. ${escapeHtml(q.prompt)}</p>
                <div class="notes-lines">
                  <hr />
                  <hr />
                  <hr />
                </div>
              </div>
            `;
          }

          return "";
        })
        .join("")}
    </div>
  `;
}