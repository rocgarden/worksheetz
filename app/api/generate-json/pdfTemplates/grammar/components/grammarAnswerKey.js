// app/api/generate-json/pdfTemplates/grammar/components/grammarAnswerKey.js

function formatAnswer(q) {
  if (q.type === "open-ended") return "Open-ended — student responses will vary.";
  if (Array.isArray(q.answer)) return q.answer.map((a) => String(a).toUpperCase()).join(", ");
  return q.answer || "";
}

function renderSection(title, questions = []) {
  return `
    <div class="worksheet-section">
      <h3 class="body-text" style="font-weight:700;">${title}</h3>
      ${questions
        .map((q, i) => `<p class="body-text"><strong>${i + 1}.</strong> ${formatAnswer(q)}</p>`)
        .join("")}
    </div>
  `;
}

export function renderGrammarAnswerKey({
  guided_practice = {},
  independent_practice = {},
  independent_practice_2 = {},
}) {
  return `
    <section class="worksheet-section">
      <div class="section-title">Answer Key</div>
      ${renderSection("Guided Practice", guided_practice.questions || [])}
      ${renderSection("Independent Practice", independent_practice.questions || [])}
      ${renderSection("Independent Practice 2", independent_practice_2.questions || [])}
    </section>
  `;
}