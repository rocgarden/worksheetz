// app/api/generate-json/pdfTemplates/socialStudies/components/socialStudiesAnswerKey.js

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderAnswerSection(title, questions = []) {
  return `
    <div class="worksheet-section">
      <div class="social-subsection-title">${escapeHtml(title)}</div>
      ${(questions || [])
        .map((q, i) => {
          if (q.type === "multiple-choice") {
            const answerArray = Array.isArray(q.answer) ? q.answer : [];
            const choiceMap = Object.fromEntries(
              (q.choices || []).map((c) => [String(c.id).toLowerCase(), c.text])
            );

            const answerText = answerArray
              .map((ansId) => {
                const id = String(ansId).toLowerCase();
                return `${id.toUpperCase()}) ${choiceMap[id] || "[missing text]"}`;
              })
              .join(", ");

            return `<p class="body-text">${i + 1}. Answer: ${escapeHtml(answerText)}</p>`;
          }

          if (q.type === "open-ended") {
            return `<p class="body-text">${i + 1}. Open-ended: Student response will vary.</p>`;
          }

          return "";
        })
        .join("")}
    </div>
  `;
}

function renderIntroActivityAnswers(activity = {}) {
  if (!activity || !activity.answers) return "";

  if (Array.isArray(activity.answers)) {
    return activity.answers
      .map((ans, i) => `<p class="body-text">${i + 1}. ${escapeHtml(ans)}</p>`)
      .join("");
  }

  if (typeof activity.answers === "string") {
    return `<p class="body-text">Answer: ${escapeHtml(activity.answers)}</p>`;
  }

  return "";
}

export function renderSocialStudiesAnswerKey({
  guided_practice = {},
  independent_practice = {},
  intro_activity = {},
}) {
  return `
    <section class="worksheet-section">
      <div class="section-title">Answer Key</div>

      ${renderAnswerSection("Guided Practice Answers", guided_practice.questions || [])}
      ${renderAnswerSection("Independent Practice Answers", independent_practice.questions || [])}

      ${
        intro_activity
          ? `
            <div class="worksheet-section">
              <div class="social-subsection-title">Concept Activity Answers</div>
              ${renderIntroActivityAnswers(intro_activity)}
            </div>
          `
          : ""
      }
    </section>
  `;
}