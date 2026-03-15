// app/api/generate-json/pdfTemplates/staarReading/template.js

import { normalizeData } from "../utils/normalizeData.js";
import { baseTemplate } from "../utils/baseTemplate.js";
import { renderStaarReadingPassage } from "./components/passage.js";
import { renderReadingQuestions } from "./components/readingQuestions.js";
import { renderReadingAnswerKey } from "./components/readingAnswerKey.js";

export function staarReadingTemplate(data) {
  const normalized = normalizeData(data);

  const {
    passage = {},
    questions = [],
  } = normalized;

  const body = `
    ${renderStaarReadingPassage(passage)}

    <div class="page-break"></div>
    ${renderReadingQuestions(questions)}

    <div class="page-break"></div>
    ${renderReadingAnswerKey(questions)}
  `;

  return baseTemplate({
    title: "STAAR Reading Practice",
    body,
  });
}