// app/api/generate-json/pdfTemplates/socialStudies/template.js

import { baseTemplate } from "../utils/baseTemplate.js";
import { normalizeData } from "../utils/normalizeData.js";
import { renderIntroSection } from "./components/introSection.js";
import { renderIntroActivity } from "./components/introActivity.js";
import { renderCollaborativeActivity } from "./components/collaborativeActivity.js";
import { renderGuidedPractice } from "./components/guidedPractice.js";
import { renderIndependentPractice } from "./components/independentPractice.js";
import { renderSocialStudiesAnswerKey } from "./components/socialStudiesAnswerKey.js";

export function socialStudiesTemplate(data) {
  const worksheet = normalizeData(data);

  const {
    topic = "",
    guided_practice = {},
    independent_practice = {},
    intro_activity = {},
  } = worksheet;

  const body = `
    ${renderIntroSection(worksheet)}
    ${renderIntroActivity(intro_activity)}
    ${renderCollaborativeActivity(topic)}

    <div class="page-break"></div>
    ${renderGuidedPractice(guided_practice)}

    <div class="page-break"></div>
    ${renderIndependentPractice(independent_practice)}

    <div class="page-break"></div>
    ${renderSocialStudiesAnswerKey({
      guided_practice,
      independent_practice,
      intro_activity,
    })}
  `;

  return baseTemplate({
    title: topic || "Social Studies Worksheet",
    body,
  });
}