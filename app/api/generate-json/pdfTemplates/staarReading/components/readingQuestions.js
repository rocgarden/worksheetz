// app/api/generate-json/pdfTemplates/staarReading/components/readingQuestions.js

import { safeArray } from "../../utils/normalizeData.js";
import { renderQuestionMultipleChoice } from "./questionMultipleChoice.js";
import { renderQuestionMultiSelect } from "./questionMultiSelect.js";
import { renderQuestionChooseLine } from "./questionChooseLine.js";
import { renderQuestionSCR } from "./questionScr.js";
export function renderReadingQuestions(questions = []) {
  const normalized = safeArray(questions);

  return `
    <section class="worksheet-section">
      <div class="section-title">Questions</div>
      <p class="instruction-text">Read the passage. Answer each question.</p>

      ${normalized
        .map((q, idx) => {
          if (q.type === "multiple-choice") return renderQuestionMultipleChoice(q, idx);
          if (q.type === "multi-select") return renderQuestionMultiSelect(q, idx);
          if (q.type === "choose-a-line") return renderQuestionChooseLine(q, idx);
          if (q.type === "scr") return renderQuestionSCR(q, idx);
          return "";
        })
        .join("")}
    </section>
  `;
}