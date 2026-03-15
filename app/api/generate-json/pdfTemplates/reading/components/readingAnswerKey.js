// app/api/generate-json/pdfTemplates/reading/components/readingAnswerKey.js

function formatAnswer(answer) {
  if (Array.isArray(answer)) return answer.join(", ");
  return answer || "";
}

export function renderReadingAnswerKey(guided_practice = {}, independent_practice = {}) {
  const guidedQuestions = Array.isArray(guided_practice.questions)
    ? guided_practice.questions
    : [];

  const independentQuestions = Array.isArray(independent_practice.questions)
    ? independent_practice.questions
    : [];

  return `
    <section class="worksheet-section">
      <div class="section-title">Answer Key</div>

      <h3 class="body-text" style="font-weight:700;">Guided Practice Answers</h3>
      <ul style="margin-bottom:24px;">
        ${guidedQuestions
          .map((q, i) => {
            if (q.type === "multiple-choice") {
              return `<p>${i + 1}. ${formatAnswer(q.answer)}</p>`;
            }
            return `<p>${i + 1}. Open-ended — student responses will vary.</p>`;
          })
          .join("")}
      </ul>

      <h3 class="body-text" style="font-weight:700;">Independent Practice Answers</h3>
      <ul>
        ${independentQuestions
          .map((q, i) => {
            if (q.type === "multiple-choice") {
              return `<p>${i + 1}. ${formatAnswer(q.answer)}</p>`;
            }
            return `<p>${i + 1}. Open-ended — student responses will vary.</p>`;
          })
          .join("")}
      </ul>
    </section>
  `;
}