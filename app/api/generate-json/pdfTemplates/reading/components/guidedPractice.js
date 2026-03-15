// app/api/generate-json/pdfTemplates/reading/components/guidedPractice.js

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderGuidedPractice(guided_practice = {}) {
  const questions = Array.isArray(guided_practice.questions)
    ? guided_practice.questions
    : [];

  const mcQuestions = questions.filter((q) => q.type === "multiple-choice").slice(0, 4);
  const open = questions.find((q) => q.type === "open-ended");

  return `
    <section class="worksheet-section">
      <div class="section-title">Guided Practice</div>

      ${
        guided_practice.instructions
          ? `<p class="instruction-text">${escapeHtml(guided_practice.instructions)}</p>`
          : ""
      }

      <section>
        <div class="gp-grid border">
          ${mcQuestions
            .map(
              (q, i) => `
              <div class="gp-question">
                ${
                  q.paragraph
                    ? `<p class="small-text" style="margin-bottom:8px;"><strong>Paragraph:</strong> ${escapeHtml(q.paragraph)}</p>`
                    : ""
                }

                <p class="question-text">${i + 1}. ${escapeHtml(q.question)}</p>

                <div>
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
              </div>
            `
            )
            .join("")}
        </div>

        ${
          open
            ? `
              <div class="gp-open" style="margin-top:10px;">
                <p class="body-text"><strong>${escapeHtml(open.prompt)}</strong></p>
                <div class="notes-lines">
                  <hr /><hr />
                </div>
              </div>
            `
            : ""
        }
      </section>
    </section>
  `;
}