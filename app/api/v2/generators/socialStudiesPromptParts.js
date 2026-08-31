// /app/api/v2/generators/socialStudiesPromptParts.js

export const SS_DOK_DESCRIPTORS = {
  1: "recall and reproduction — identify key facts, dates, people, places, and events; define terms from the TEKS standard",
  2: "skills and concepts — explain cause-and-effect relationships, compare and contrast perspectives, describe geographic or economic patterns",
  3: "strategic thinking — evaluate historical significance, analyze multiple perspectives on events, draw conclusions from primary or secondary sources, connect events to broader themes",
};

export function buildSSHeader({
  teks_standard,
  teksDescription,
  grade_level,
  dok_level,
  dokDesc,
  question_type,
  skill_focus,
  assessment_move,
}) {
  return `Generate one Grade ${grade_level} Social Studies question.

TEKS Standard: ${teks_standard}${teksDescription ? `\nTEKS Description: ${teksDescription}` : ""}
${skill_focus ? `Skill Focus: ${skill_focus} — this is the specific thinking move to assess, distinct from the broader TEKS standard.\n` : ""}
${assessment_move ? `Assessment Move: ${assessment_move} — the question must directly perform this task.\n` : ""}DOK Level: ${dok_level} — ${dokDesc}
Question Type: ${question_type}`;
}

export const SS_STIMULUS_DESIGN_RULES = `
SOCIAL STUDIES STIMULUS DESIGN RULE:
- Write the passage/stimulus as a focused classroom reading selection, not as a list of disconnected facts.
- The stimulus must have a clear comparison frame that supports the TEKS, Content Focus, skill_focus, and assessment_move.
- For comparison TEKS, organize the passage around 2-4 comparison dimensions, such as:
  - region or environment
  - food sources
  - shelter or housing
  - mobility or settlement pattern
  - natural resources
  - cultural practices
  - adaptation to geography
  - economic activity
  - government or civic role, when relevant
- Avoid writing a passage where each group has only one obvious sentence and each question simply asks students to find that sentence.
- Include enough context for students to compare, explain, or infer relationships, especially for DOK 2 and DOK 3.
- Do not overload the passage with unrelated facts. Every detail should help answer likely questions.
- For hot_text, write some sentences with one clear evidence purpose each.
- If a comparison question will be asked, include at least one sentence that explicitly compares two groups in the same sentence.
- Example: "Unlike the Puebloan groups, who built adobe homes in arid West Texas, Gulf groups used coastal resources such as fish and canoes."
`;

export const SS_ASSESSMENT_MOVE_RULES = `
SOCIAL STUDIES ASSESSMENT MOVE RULE:
- If assessment_move is match_region_to_group, the correct answer must connect a group to a Texas region or environment.
- If assessment_move is identify_resource, the correct answer must identify a natural resource, food source, or environmental resource.
- If assessment_move is match_group_to_way_of_life, the correct answer must match a group with its lifestyle or cultural practice.
- If assessment_move is identify_difference_between_groups, the correct answer must compare groups, not only describe one group.
- If assessment_move is connect_geography_to_culture, the correct answer must explain how geography shaped culture or lifestyle.
- If assessment_move is justify_cultural_adaptation, the correct answer must show how a group adapted to its environment.
`;

export const SS_ALIGNMENT_RULES = `
SOCIAL STUDIES ALIGNMENT RULE:
- The passage/stimulus, stem, correct answer, and explanation must all match the TEKS standard, skill_focus, and assessment_move.
- If skill_focus is chronology, the question must involve order, sequence, before/after, timeline relationships, or how timing affected an outcome.
- If skill_focus is cause_effect, the question must involve a cause, effect, result, consequence, or cause-effect relationship.
- If skill_focus is historical_significance, the question must involve why a person, group, event, practice, or development was historically important.
- If skill_focus is compare_perspectives, the question must involve point of view, different groups’ perspectives, agreement/disagreement, or historical interpretation.
- If skill_focus is geographic_influence, the question must involve location, region, landforms, resources, environment, settlement, economic activity, or how geography shaped human activity.
- If skill_focus is compare_cultures, the question must involve comparing two or more groups, ways of life, cultural practices, adaptations, food sources, settlement patterns, or relationships to environment.
- Do not use a chronology assessment_move for a question that only identifies a group or cultural feature.
- Do not use a geographic_influence assessment_move unless geography is necessary to answer the question.
`;

export const SS_VARIETY_RULES = `
SOCIAL STUDIES VARIETY RULE:
- Do not repeatedly use the same group, fact, or cultural feature as the correct answer across previous_attempts.
- Do not repeatedly use Caddo farming, Caddo mounds, or permanent villages as the correct answer across previous_attempts.
- Vary correct answers across Caddo, Comanche, Karankawa, Apache, regions, food sources, settlement patterns, cultural practices, and adaptations.
`;

export const SS_HOT_TEXT_EXACT_TARGET_RULES = `
SOCIAL STUDIES HOT_TEXT EXACT TARGET RULE:
- For hot_text, every hot_text_targets[].text value must be copied exactly from the passage.
- Prefer complete sentence targets copied exactly from the passage.
- Do not shorten a sentence.
- Do not paraphrase a sentence.
- Do not change capitalization, punctuation, commas, or introductory words.
- Do not remove transition words such as "Meanwhile," "In contrast," or "For example," from a target.
- If the passage sentence is "Meanwhile, the Karankawa lived along the Gulf Coast and were expert fishermen and hunters, using their dugout canoes to navigate the coastal waters.", the target must include that exact full sentence.
- When stimulus is provided, choose targets only from the exact stimulus text.
- Before finalizing, verify each hot_text_targets[].text appears in the passage exactly.
- Do not invent passage_tokens.
- Provide hot_text_targets only.
`;

export const SS_MULTI_SELECT_RULES = `
SOCIAL STUDIES MULTI_SELECT RULE:
- Multi-select questions must have exactly 5 answer options.
- Exactly 2 or 3 options must be correct.
- If exactly 2 options are correct, the stem must say "Select TWO" or "Select BOTH".
- If exactly 3 options are correct, the stem must say "Select THREE".
- Every correct answer must be clearly supported by the passage or by the TEKS-aligned historical content.
- Do not create answer choices where more than 2 or 3 options could reasonably be correct.
- Distractors should be plausible but clearly incorrect based on the passage, TEKS, or historical context.
- Before finalizing, verify that no unselected option is also supported by the passage as a correct answer.
- If the stem asks for TWO answers, exactly TWO options may be defensible.
- Do not include a plausible-but-true option as a distractor.
- Distractors must be historically inaccurate, unsupported by the passage, or answer a different task than the stem asks.
`;

export const SS_MULTI_SELECT_BROAD_STEM_BAN = `
SOCIAL STUDIES MULTI_SELECT BROAD STEM BAN:
- Do not ask broad multi-select questions where many groups in the passage could qualify.
- Bad: "Which groups adapted to their environment?"
- Bad: "Which answers show causes of different ways of life?"
- Bad: "Which cultures relied on food sources?"
- Better: "Which TWO statements explain how Gulf and Plains cultures used nearby food resources?"
- Better: "Which TWO statements compare Puebloan and Plains adaptations to their environments?"
- Better: "Which THREE details show how geography shaped food sources for Gulf, Plains, and Puebloan cultures?"
`;

export const SS_MULTI_SELECT_PRECISION_RULES = `
SOCIAL STUDIES MULTI_SELECT PRECISION RULE:
- Multi-select stems must be narrow enough that exactly 2 or exactly 3 options are defensible.
- If the passage supports 3 correct answers, the stem must say "Select THREE" and correct_answer must include all 3.
- If the stem says "Select TWO," only two options may be historically and textually defensible.
- Avoid broad multi-select stems such as:
  - "Which answers identify causes of distinct ways of life?"
  - "Which cultures adapted based on food sources?"
  - "Which statements explain how environment influenced culture?"
  unless the options are written so that only the intended 2 or 3 answers fit.
- For "Select TWO" questions, narrow the stem by naming:
  - the exact two groups
  - the exact two regions
  - the exact comparison dimension
  - the exact resource type
  - the exact cultural feature
- Before finalizing, test every unselected option:
  "Could a student defend this answer using the passage?"
  If yes, either include it as correct and change the stem to Select THREE, or replace the option.
`;

export const SS_QUESTION_FOCUS_RULES = `
SOCIAL STUDIES QUESTION FOCUS RULE:
- Each question must assess ONE clear comparison dimension.
- The stem must make the task specific enough that only one answer choice is defensible.
- Before writing answer choices, decide the exact comparison dimension being tested:
  - group to region
  - group to resource
  - group to way of life
  - environment to adaptation
  - cause to effect
  - similarity between groups
  - difference between groups
  - historical significance of one practice
- The stem must clearly name or imply that comparison dimension.
- Avoid broad stems such as "Which adaptation was important?" or "Which group was significant?" unless the answer choices are clearly narrowed.
`;

export const SS_UNIQUE_ANSWER_RULES = `
SOCIAL STUDIES UNIQUE ANSWER RULE:
- For multiple_choice, exactly one answer choice must be clearly correct for the exact stem.
- For multi_select, exactly 2 or 3 choices must be clearly correct for the exact stem.
- Do not include distractors that are also true based on the passage unless they answer a different task than the stem asks.
- A distractor may be historically true, but it must be incorrect for the specific group, region, cause, effect, comparison, or time period asked in the stem.
- Before finalizing, check each distractor:
  1. Is this statement true in the passage?
  2. If yes, does it still fail to answer the exact question?
  3. If it could reasonably answer the question, revise the stem or replace the distractor.
- If more than one answer could be defended, rewrite the question.
`;

export const SS_DISTRACTOR_DESIGN_RULES = `
SOCIAL STUDIES DISTRACTOR DESIGN RULE:
- Good distractors should be plausible but clearly incorrect for the exact stem.
- Prefer mismatch distractors:
  - correct group + wrong region
  - correct group + wrong resource
  - correct group + wrong way of life
  - correct region + wrong cultural practice
  - correct cause + wrong effect
  - correct fact + wrong comparison target
- Avoid distractors that are random, silly, modern, or obviously impossible unless the grade level requires very easy DOK 1 support.
- Avoid answer sets where all choices are true statements from the passage.
- For TEKS 7.2A, strong distractors often mismatch cultural region, group, resource, shelter, food source, or settlement pattern.
`;

export const SS_MULTI_SELECT_DISTRACTOR_RULES = `
MULTI_SELECT DISTRACTOR RULE:
- Every distractor must be clearly incorrect for the exact stem.
- Do not include extra true statements as distractors.
- If more than the intended 2 or 3 options are true, revise the options or change the stem.
`;

export const SS_CONTENT_FOCUS_RULES = `
SOCIAL STUDIES CONTENT FOCUS RULE:
- If Content Focus is provided, treat it as the teacher's lesson objective, not just a topic suggestion.
- The passage/stimulus, stem, correct answer, distractors, and explanation must all stay centered on the Content Focus.
- Do not drift to the most common example if it is narrower than the Content Focus.
- If the Content Focus names multiple groups, regions, events, concepts, or comparison categories, the passage must include enough information to compare them.
- For TEKS 7.2A, if the Content Focus mentions Puebloan, Southeastern, Gulf, and Plains cultures, the passage must include all four cultural regions or clearly comparable examples from those regions.
- The question should assess the Content Focus through the selected skill_focus and assessment_move.
`;

export const SS_DOK_QUALITY_RULES = `
SOCIAL STUDIES DOK QUALITY RULE:
- DOK 1 may ask students to identify, match, or recall a clearly stated fact.
- DOK 1 should still be clean and purposeful, not trivial.
- DOK 2 must require students to connect two pieces of information, such as geography + lifestyle, resource + cultural practice, or group + settlement pattern.
- DOK 2 should not be answerable by copying only one sentence from the passage.
- DOK 3 must require students to evaluate, justify, compare significance, or draw a conclusion from multiple details in the passage.
- DOK 3 answer choices should not simply restate one sentence from the passage.
- For DOK 2 and DOK 3, the explanation must identify the reasoning connection, not only quote the passage.
`;

export const SS_HOT_TEXT_DOK_RULES = `
SOCIAL STUDIES HOT_TEXT DOK RULE:
- Use hot_text mainly for identifying evidence from the stimulus.
- For DOK 1, ask students to identify a sentence that states a fact, region, group, or cultural feature.
- For DOK 2, ask students to select evidence that supports a cause/effect or comparison.
- For DOK 3, only use hot_text when the task asks students to select the strongest evidence for a conclusion.
- Avoid DOK 3 hot_text stems that ask students to perform broad analysis when the task only allows selecting one sentence.
`;

export const SS_HOT_TEXT_BEST_EVIDENCE_RULES = `
SOCIAL STUDIES HOT_TEXT BEST EVIDENCE RULE:
- If the stem asks for the "best" or "strongest" evidence, the correct target must be clearly stronger than every distractor target.
- Do not include another target that could also reasonably support the same claim, conclusion, comparison, cause/effect relationship, or historical explanation.
- If two sentences both support the same answer, revise the stem to make the task more specific.
- Distractor targets may be related, but they must not answer the exact stem as well as the correct target.
- For hot_text, the stem must point to one exact evidence purpose.

SOCIAL STUDIES HOT_TEXT COMPARISON PRECISION RULE:
- Avoid hot_text stems that ask students to select one sentence that "compares" two groups unless that single sentence explicitly contains both groups or both sides of the comparison.
- If the correct target only describes one group, the stem must ask about that one group, not a comparison between two groups.
- Bad: "Select the sentence that highlights a key difference between the Puebloan and Gulf cultures."
- Better: "Select the sentence that describes the Puebloan adaptation to arid West Texas."
- Better: "Select the sentence that describes how Gulf cultures used coastal resources."
- Better: "Select the sentence that identifies the Plains cultures' mobile way of life."
- For comparison hot_text, the selected sentence must either:
  1. explicitly compare both groups in one sentence, or
  2. answer a stem focused on only one side of the comparison.
`;

export const SS_STEM_PRECISION_RULES = `
SOCIAL STUDIES STEM PRECISION RULE:
- The stem must clearly state what the student is comparing, identifying, explaining, or evaluating.
- If answer choices include multiple true statements from the passage, the stem must narrow the task by naming:
  - the group
  - the region
  - the resource
  - the time period
  - the cause/effect relationship
  - the comparison dimension
- Avoid vague stems such as:
  - "Which statement is most important?"
  - "Which adaptation was significant?"
  - "How did the group adapt?"
- Prefer precise stems such as:
  - "Which answer best explains how the Great Plains shaped Comanche mobility?"
  - "Which comparison shows a difference between Gulf and Plains cultures?"
  - "Which resource best explains why Southeastern groups developed permanent villages?"
`;

export const SS_SOURCE_STYLE_RULES = `
SOCIAL STUDIES SOURCE-STYLE RULE:
- Write passages and questions in the style of a teacher-created reading selection.
- The passage should teach a small concept clearly, then the question should check understanding of that concept.
- Prefer clear instructional flow:
  1. introduce the historical/geographic context
  2. compare groups or conditions
  3. connect evidence to the question task
- Questions should feel like they came from a classroom reading resource, not a random fact quiz.
- Avoid repetitive question structures across previous_attempts.
`;

export const SS_ANSWER_CONSISTENCY_RULES = `
SOCIAL STUDIES ANSWER CONSISTENCY RULE:
- The correct_answer id must match the intended correct answer choice.
- The explanation must describe the exact correct answer text.
- Do not identify the correct answer by letter in the explanation.
- Do not write "The correct answer is A/B/C/D."
- Do not write "option A/B/C/D is correct."
- Do not write "choice A/B/C/D is correct."
- Do not write "making option A/B/C/D correct."
- Do not put answer letters in parentheses after answer text, such as "(A)" or "(D)".
- Instead, explain using the answer text only.
- Before finalizing, verify the explanation does not refer to any answer letter.
`;

export const SS_DOK_3_REASONING_RULES = `
SOCIAL STUDIES DOK 3 REASONING RULE:
- DOK 3 questions must require analysis, evaluation, or justification using more than one detail from the passage.
- DOK 3 should not be answerable by matching a single phrase from the passage.
- For comparison TEKS, DOK 3 should usually ask students to compare two groups, evaluate which factor best explains a difference, or choose the best-supported conclusion.
- Prefer DOK 3 stems that begin with:
  - "Which comparison best explains..."
  - "Which conclusion is best supported..."
  - "Which factor most strongly explains..."
  - "Which evidence best supports..."
- Avoid vague "most significant" stems unless the passage gives clear criteria for significance.
`;

export const SS_7_2A_QUALITY_RULES = `
SOCIAL STUDIES 7.2A QUALITY RULE:
- For TEKS 7.2A, questions must compare cultures of American Indians in Texas before European colonization.
- Include or assess groups/cultural regions such as Gulf, Plains, Puebloan, and Southeastern when they match the Content Focus.
- Do not repeatedly assess only Caddo farming, Comanche bison hunting, or Karankawa fishing.
- Questions should compare how geography, resources, food, shelter, mobility, and settlement patterns shaped different cultures.
- When asking about one group, connect that group to a comparison dimension, such as region, resource, food source, shelter, or way of life.
- For DOK 2 and DOK 3, prefer stems that ask students to compare two groups or explain why their ways of life differed.
- Avoid broad "most significant" questions unless the passage provides clear criteria for significance.
- Prefer broad, historically safe shelter terms such as "portable shelters," "temporary shelters," "grass-covered houses," "adobe homes," and "tipis" when appropriate.
- Avoid over-specific shelter labels unless they are clearly supported by the TEKS-aligned source context.
`;

export const SS_MULTIPLE_CHOICE_RULES = `
SOCIAL STUDIES MULTIPLE_CHOICE RULE:
- Multiple-choice questions must have exactly 4 answer options.
- Exactly 1 answer option must be correct.
- The stem must be precise enough that only one answer is defensible.
- Distractors should be plausible but clearly incorrect for the exact group, region, event, comparison, cause/effect relationship, or historical context in the stem.
- Avoid answer choices that are all true statements from the passage.
`;

export const SS_CONSTRUCTED_RESPONSE_RULES = `
SOCIAL STUDIES CONSTRUCTED_RESPONSE RULE:
- A passage/stimulus IS REQUIRED.
- The stem must ask students to answer in 2-4 complete sentences.
- The prompt should require historical evidence or reasoning from the stimulus.
- The correct_answer must be a concise model response, around 1-3 sentences.
- Include a scoring_rubric with keys "0", "1", and "2".
- The 0-point rubric should describe no response, off-topic response, unsupported response, or historically inaccurate response.
- The 1-point rubric should describe a partial response that addresses the prompt but lacks enough evidence, accuracy, or reasoning.
- The 2-point rubric should describe a complete response with clear evidence and accurate historical reasoning.
`;

export const SS_CONSTRUCTED_RESPONSE_DOK_RULES = `
SOCIAL STUDIES CONSTRUCTED_RESPONSE DOK RULE:
- DOK 1 constructed response should ask for a simple identification or explanation using one piece of evidence.
- DOK 2 constructed response should ask students to explain a relationship, cause/effect, comparison, or geographic influence using evidence.
- DOK 3 constructed response should ask students to justify, evaluate, compare significance, or explain using more than one detail from the stimulus.
- DOK 3 should not be answerable by copying one sentence from the stimulus.
`;

export function getSSQuestionTypeRules(question_type) {
  switch (question_type) {
    case "multiple_choice":
      return SS_MULTIPLE_CHOICE_RULES;

    case "multi_select":
      return `${SS_MULTI_SELECT_RULES}
${SS_MULTI_SELECT_BROAD_STEM_BAN}
${SS_MULTI_SELECT_PRECISION_RULES}
${SS_MULTI_SELECT_DISTRACTOR_RULES}`;

    case "hot_text":
      return `${SS_HOT_TEXT_EXACT_TARGET_RULES}
${SS_HOT_TEXT_DOK_RULES}
${SS_HOT_TEXT_BEST_EVIDENCE_RULES}`;

    case "constructed_response":
      return `${SS_CONSTRUCTED_RESPONSE_RULES}
${SS_CONSTRUCTED_RESPONSE_DOK_RULES}`;

    default:
      return "";
  }
}

export function getSSSkillFocusRules(skill_focus) {
  switch (skill_focus) {
    case "chronology":
      return `SOCIAL STUDIES CHRONOLOGY RULE:
- The task must involve order, sequence, before/after, timeline relationships, or how timing affected an outcome.
- Do not use chronology when the question only identifies a group, region, or cultural feature.`;

    case "cause_effect":
      return `SOCIAL STUDIES CAUSE/EFFECT RULE:
- The task must involve a cause, effect, result, consequence, or cause-effect relationship.
- The stem must clearly identify the relationship students should explain or identify.`;

    case "historical_significance":
      return `SOCIAL STUDIES HISTORICAL SIGNIFICANCE RULE:
- The task must involve why a person, group, event, practice, adaptation, or development was historically important.
- The passage must provide criteria or evidence for significance.`;

    case "compare_perspectives":
      return `SOCIAL STUDIES COMPARE PERSPECTIVES RULE:
- The task must involve point of view, different groups’ perspectives, agreement/disagreement, or historical interpretation.
- Do not ask for one isolated fact if the skill_focus is compare_perspectives.`;

    case "geographic_influence":
      return `SOCIAL STUDIES GEOGRAPHIC INFLUENCE RULE:
- The task must involve location, region, landforms, resources, environment, settlement, economic activity, or how geography shaped human activity.
- Geography must be necessary to answer the question.`;

    case "compare_cultures":
      return `SOCIAL STUDIES COMPARE CULTURES RULE:
- The task must involve comparing two or more groups, ways of life, cultural practices, adaptations, food sources, settlement patterns, or relationships to environment.
- For DOK 2 and DOK 3, prefer comparison reasoning over isolated fact recall.`;

    default:
      return "";
  }
}

export function getSSAssessmentMoveRules(assessment_move) {
  if (!assessment_move) return "";

  return `SOCIAL STUDIES SPECIFIC ASSESSMENT MOVE RULE:
- The question must directly match this assessment_move: ${assessment_move}.
- Do not write a generic Social Studies question if the assessment_move requires a specific task.
- If the move asks for region-to-group matching, the correct answer must connect a group to a region or environment.
- If the move asks for resource identification, the correct answer must identify a resource, food source, or environmental factor.
- If the move asks for way of life, the correct answer must connect group, environment, and cultural practice.
- If the move asks for comparison, the correct answer must compare groups, not only describe one group.
- If the move asks for geography-to-culture, the correct answer must explain how geography shaped culture or lifestyle.
- If the move asks for justification, the correct answer must use evidence from the passage or historical context.`;
}

export function buildSSAvoidPreviousAttempts(previous_attempts = []) {
  if (!previous_attempts.length) return "";

  const safeAttempts = previous_attempts
    .map((a) => {
      try {
        const q =
          typeof a.question_json === "string"
            ? JSON.parse(a.question_json)
            : a.question_json;

        return {
          stem: q?.stem,
          skill_focus: q?.skill_focus,
          assessment_move: q?.assessment_move,
          correct_answer: q?.correct_answer,
        };
      } catch {
        return {
          stem: a?.stem ?? null,
        };
      }
    })
    .filter((a) => a.stem || a.skill_focus || a.assessment_move);

  if (!safeAttempts.length) return "";

  return `IMPORTANT — Vary from these previous attempts in this session:
${JSON.stringify(safeAttempts, null, 2)}`;
}

export function buildSSPassageInstruction({
  question_type,
  dok_level,
  content_focus,
  stimulus,
}) {
  const requiresPassage =
    question_type === "hot_text" ||
    question_type === "constructed_response" ||
    question_type === "multi_select";

  if (stimulus) {
    return `CRITICAL — Use this exact passage for this question. Do NOT generate a new passage:
"${stimulus}"
The passage field in your JSON must be this exact text verbatim.`;
  }

  if (content_focus) {
    return `CRITICAL — A passage IS REQUIRED for this question. Generate an original 160-220 word focused classroom reading selection about: ${content_focus}. Do not write a standalone stem. The passage field must not be empty.`;
  }

  if (requiresPassage) {
    return `Generate an original 100-150 word passage appropriate for the TEKS standard, content_focus, skill_focus, and assessment_move.`;
  }

  if (Number(dok_level) === 1) {
    return `Do NOT include a passage for this DOK 1 standalone question. Set "passage": null.`;
  }

  return `A passage is optional. Include one only if it helps the question.`;
}

export function buildSSFocusNote({ content_focus, stimulus }) {
  if (stimulus || !content_focus) return "";

  return `Content Focus: All questions must be grounded specifically in "${content_focus}". Use only historically accurate content within this scope. Do not use unrelated events or topics.`;
}

export function buildSSOutputSchema({
  teks_standard,
  dok_level,
  question_type,
  buildAnswerFields,
  buildNextQuestionLogic,
}) {
  return `Return a single JSON object with this exact shape:
{
  "teks_standard": "${teks_standard}",
  "dok_level": ${dok_level},
  "question_type": "${question_type}",
  "passage": "<when content_focus is set: always include a 160-220 word focused classroom reading selection about that topic. When no content_focus: DOK 1 may omit passage, DOK 2-3 include 100-180 word passage when needed>",
  "stem": "<the question prompt shown to the student>",
  ${buildAnswerFields(question_type, dok_level)},
  "explanation": "<why the correct answer is correct, referencing the TEKS standard, historical evidence/reasoning, and DOK level>",
${question_type === "constructed_response" ? `"scoring_rubric": { "0": "No response or completely off topic.", "1": "Partial — addresses the prompt but lacks historical evidence or reasoning.", "2": "Complete — clear response with explicit historical evidence and accurate reasoning." },` : ""}  ${buildNextQuestionLogic(dok_level, question_type)}
}`;
}