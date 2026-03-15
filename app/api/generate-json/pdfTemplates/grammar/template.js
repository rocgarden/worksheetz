// app/api/generate-json/pdfTemplates/grammar/template.js

import { baseTemplate } from "../utils/baseTemplate.js";
import { normalizeData } from "../utils/normalizeData.js";
import { renderIntroSection } from "./components/introSection.js";
import { renderGuidedPractice } from "./components/guidedPractice.js";
import { renderIndependentSection } from "./components/independentSection.js";
import { renderGrammarAnswerKey } from "./components/grammarAnswerKey.js";

export function grammarTemplate(data) {
  const worksheet = normalizeData(data);

  const {
    guided_practice = {},
    independent_practice = {},
    independent_practice_2 = {},
    concept = "",
  } = worksheet;

  const body = `
    ${renderIntroSection(worksheet)}

    ${renderGuidedPractice(guided_practice)}

    <div class="page-break"></div>
    ${renderIndependentSection({
      title: "Independent Practice",
      section: independent_practice,
    })}

    <div class="page-break"></div>
    ${renderIndependentSection({
      title: "Independent Practice 2",
      section: independent_practice_2,
    })}

    <div class="page-break"></div>
    ${renderGrammarAnswerKey({
      guided_practice,
      independent_practice,
      independent_practice_2,
    })}
  `;

  return baseTemplate({
    title: concept || "Grammar Worksheet",
    body,
  });
}