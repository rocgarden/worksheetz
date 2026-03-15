// app/api/generate-json/pdfTemplates/staarReading/components/readingAnswerKey.js

import { safeArray } from "../../utils/normalizeData.js";
import { renderStandardAnswerKeyItem } from "../../shared/answerKey.js";
import { teksLabel } from "../../shared/teksLabel.js";

export function renderReadingAnswerKey(questions = []) {
  const normalized = safeArray(questions);

  return `
    <section class="worksheet-section">
      <div class="section-title">Answer Key</div>

      ${normalized
        .map((q, idx) => {
          const answerLine = renderStandardAnswerKeyItem(q, idx);
          return `
            <div class="worksheet-section avoid-break">
              ${answerLine}
              ${teksLabel(q.teks)}
              ${
                q.type === "scr" && q?.rubric?.anchors?.length
                  ? `
                    <div class="small-text" style="margin-left: 18px;">
                      <strong>Rubric:</strong>
                      ${q.rubric.anchors
                        .map((a) => `<p>${a.points} points — ${a.description}</p>`)
                        .join("")}
                    </div>
                  `
                  : ""
              }
            </div>
          `;
        })
        .join("")}
    </section>
  `;
}