/**
 * shared.js
 * /app/api/v2/generators/shared.js
 *
 * Utilities shared across all subject generators (ELA, Social Studies, Science, Math, ...).
 * Extracted from adaptiveQuestionGenerator.js during the Science refactor.
 *
 * Exports:
 *   buildPassageTokens     — server-side hot_text tokenizer
 *   validateQuestionShape  — validates OpenAI output shape per question type
 *   saveToQuestionBank     — persists a generated question to question_bank
 *   buildAnswerFields      — builds answer_options / hot_text_targets prompt fragment
 *   buildTypeInstructions  — builds per-type generation instructions for prompts
 */

import { createV2ServiceClient } from "@/libs/supabase/server-v2";

// ── Passage Token Builder ──────────────────────────────────────────────────────
/**
 * Programmatically splits a passage into tokens marking which segments
 * are clickable hot_text targets. Called after GPT generation — GPT never
 * builds this structure. 100% reliable vs GPT's ~70% accuracy.
 *
 * Works for words, phrases, and full sentences.
 * Sorts targets by position in passage so tokens are always in order.
 */
export function buildPassageTokens(passage, hotTextTargets) {
  const sorted = hotTextTargets
    .map((t) => ({ ...t, index: passage.indexOf(t.text) }))
    .filter((t) => t.index !== -1)
    .sort((a, b) => a.index - b.index);

  const tokens = [];
  let cursor = 0;

  for (const target of sorted) {
    if (target.index < cursor) continue;

    if (target.index > cursor) {
      tokens.push({ text: passage.slice(cursor, target.index), is_target: false });
    }

    tokens.push({
    text: target.text,
    is_target: true,
    target_id: target.id,  // ← matches what HotText expects
    });         

    cursor = target.index + target.text.length;
  }

  if (cursor < passage.length) {
    tokens.push({ text: passage.slice(cursor), is_target: false });
  }

  return tokens;
}

// ── Question Shape Validator ───────────────────────────────────────────────────
/**
 * Validates that OpenAI returned a structurally complete question.
 * Throws if any required field is missing or malformed.
 * Used by every subject generator before persisting.
 */
export function validateQuestionShape(q, question_type) {
  if (!q.stem || typeof q.stem !== "string") {
    throw new Error("Question is missing a stem.");
  }
  if (!q.teks_standard || typeof q.teks_standard !== "string") {
    throw new Error("Question is missing teks_standard.");
  }
  if (!q.explanation || typeof q.explanation !== "string") {
    throw new Error("Question is missing explanation.");
  }

  if (question_type === "multiple_choice") {
    if (!Array.isArray(q.answer_options) || q.answer_options.length !== 4) {
      throw new Error("multiple_choice question must have exactly 4 answer_options.");
    }
    if (!["A", "B", "C", "D"].includes(q.correct_answer)) {
      throw new Error(`multiple_choice correct_answer must be A, B, C, or D. Got: ${q.correct_answer}`);
    }
  }

  if (question_type === "hot_text") {
    if (!q.passage || typeof q.passage !== "string") {
      throw new Error("hot_text question requires a passage.");
    }
    if (!Array.isArray(q.hot_text_targets) || q.hot_text_targets.length < 3) {
      throw new Error("hot_text question requires at least 3 hot_text_targets.");
    }
    for (const target of q.hot_text_targets) {
      if (!q.passage.includes(target.text)) {
        throw new Error(
          `hot_text target "${target.id}" ("${target.text.slice(0, 40)}...") ` +
          `not found in passage. Targets must be exact passage substrings.`
        );
      }
    }
    // Build passage_tokens server-side — never trust GPT to do this
    q.passage_tokens = buildPassageTokens(q.passage, q.hot_text_targets);
  }

  if (question_type === "multi_select") {
    if (!Array.isArray(q.answer_options) || q.answer_options.length !== 5) {
      throw new Error("multi_select question must have exactly 5 answer_options.");
    }
    if (!Array.isArray(q.correct_answer) || q.correct_answer.length < 2 || q.correct_answer.length > 3) {
      throw new Error(`multi_select correct_answer must be an array of 2 or 3 option ids. Got: ${JSON.stringify(q.correct_answer)}`);
    }
    const validIds = q.answer_options.map((o) => o.id);
    for (const id of q.correct_answer) {
      if (!validIds.includes(id)) {
        throw new Error(`multi_select correct_answer id "${id}" not found in answer_options.`);
      }
    }
  }

  if (question_type === "inline_choice") {
    if (!Array.isArray(q.answer_options) || q.answer_options.length !== 4) {
      throw new Error("inline_choice question must have exactly 4 answer_options.");
    }
    if (!q.stem || !q.stem.includes("{{blank}}")) {
      throw new Error('inline_choice stem must contain "{{blank}}" placeholder.');
    }
    if (typeof q.correct_answer !== "string") {
      throw new Error("inline_choice correct_answer must be a string matching one of the answer_options.");
    }
    if (!q.answer_options.includes(q.correct_answer)) {
      throw new Error(`inline_choice correct_answer "${q.correct_answer}" not found in answer_options.`);
    }
  }

  if (question_type === "constructed_response") {
    if (!q.passage || typeof q.passage !== "string") {
      throw new Error("constructed_response question requires a passage.");
    }
    if (!q.correct_answer || typeof q.correct_answer !== "string") {
      throw new Error("constructed_response correct_answer must be a model answer string.");
    }
    if (!q.scoring_rubric || typeof q.scoring_rubric !== "object") {
      throw new Error("constructed_response question requires a scoring_rubric object.");
    }
    if (!("0" in q.scoring_rubric && "1" in q.scoring_rubric && "2" in q.scoring_rubric)) {
      throw new Error("scoring_rubric must include keys '0', '1', and '2'.");
    }
  }

  if (!q.next_question_logic?.if_correct || !q.next_question_logic?.if_incorrect) {
    throw new Error("next_question_logic must include if_correct and if_incorrect branches.");
  }
  if (question_type === "constructed_response" && !q.next_question_logic?.if_partial) {
    throw new Error("constructed_response next_question_logic must include an if_partial branch.");
  }
}

export function validateELADok3MultipleChoiceRigor(question) {
  if (
    question?.question_type !==
      "multiple_choice" ||
    Number(question?.dok_level) !== 3
  ) {
    return;
  }

  const stem =
    typeof question.stem === "string"
      ? question.stem.trim()
      : "";

  const options = Array.isArray(
    question.answer_options,
  )
    ? question.answer_options
    : [];

  const correctOption =
    options.find(
      (option) =>
        option?.id ===
        question.correct_answer,
    );

  const correctText =
    typeof correctOption?.text === "string"
      ? correctOption.text.trim()
      : "";

  const weakStemPattern =
    /^(what|which)\s+(event|detail|decision|line|scene|action)\b/i;

  const analyticalStemPattern =
    /\b(analyzes?|explains?|justifies?|evaluates?|best supports|best shows how|best demonstrates how|shape|develop|contribute|influence|affect|resolve)\b/i;

  const analyticalAnswerPattern =
    /\b(because|causes?|creates?|leads?|results?|reveals?|shows?|develops?|shapes?|forces?|resolves?|demonstrates?|highlights?|therefore|while|by)\b/i;

  if (
    weakStemPattern.test(stem) &&
    !analyticalStemPattern.test(stem)
  ) {
    throw new Error(
      "DOK 3 multiple-choice stem is too focused on identifying a single event or detail.",
    );
  }

  if (
    !analyticalStemPattern.test(stem)
  ) {
    throw new Error(
      "DOK 3 multiple-choice stem must require analysis, justification, or evaluation.",
    );
  }

  if (
    !correctText ||
    correctText.split(/\s+/).length < 10
  ) {
    throw new Error(
      "DOK 3 multiple-choice correct option must contain a complete analytical statement.",
    );
  }

  if (
    !analyticalAnswerPattern.test(
      correctText,
    )
  ) {
    throw new Error(
      "DOK 3 multiple-choice correct option must explain a relationship or effect, not only identify an outcome.",
    );
  }
}

// ── Question Quality Validators ─────────────────────────────────────────────────
/**
 * Validates SEMANTIC quality of a generated question — not just shape.
 * Catches: self-contradicting explanations, answer/option mismatches,
 * duplicate options, missing skill_focus/assessment_move.
 * Used by every subject generator AFTER enrichedQuestion is built
 * (post skill_focus/assessment_move merge), BEFORE the stimulus/
 * non-stimulus branch split — so both paths get checked identically.
 */

function validateBaseQuality(question) {
  const errors = [];

  if (!question.teks_standard) errors.push("Missing teks_standard.");
  if (![1, 2, 3].includes(Number(question.dok_level))) errors.push("Invalid dok_level.");
  if (!question.question_type) errors.push("Missing question_type.");
  if (!question.stem || question.stem.trim().length < 10) errors.push("Stem missing or too short.");
  if (!question.explanation) errors.push("Missing explanation.");
  if (!question.skill_focus) errors.push("Missing skill_focus.");
  if (!question.assessment_move) errors.push("Missing assessment_move.");
  if (
    !question.next_question_logic ||
    !question.next_question_logic.if_correct ||
    !question.next_question_logic.if_incorrect
  ) {
    errors.push("Missing next_question_logic.");
  }

  return errors;
}

function explanationClaimsWrongOptionIsCorrect({ explanation, correct }) {
  const text = String(explanation || "");
  const correctId = String(correct || "").toUpperCase();

  const claims = [
    ...text.matchAll(
      /\b(?:correct answer is|answer is|correct option is|correct choice is|option|choice)\s+([A-E])\s+(?:is\s+)?(?:correct|right|best)\b/gi
    ),
  ].map((m) => m[1].toUpperCase());

  return [...new Set(claims.filter((id) => id !== correctId))];
}

function validateMultipleChoiceQuality(question) {
  const errors = [];
  const options = question.answer_options || [];
  const correct = question.correct_answer;
  const explanation = question.explanation || "";

  if (!correct) errors.push("Missing correct_answer.");

  if (Array.isArray(options) && options.length > 0) {
    const optionIds = options.map((o) => o.id);
    if (!optionIds.includes(correct)) {
      errors.push("correct_answer does not match any answer_options id.");
    }
  }

const wrongClaims = explanationClaimsWrongOptionIsCorrect({
  explanation,
  correct,
});

if (wrongClaims.length > 0) {
  errors.push(
    `Explanation appears to claim wrong option(s) ${wrongClaims.join(
      ", "
    )} are correct, but correct_answer is "${correct}".`
  );
}
  

  const normalized = options.map((o) => String(o.text || "").trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    errors.push("Duplicate answer options detected.");
  }

  return errors;
}

function validateInlineChoiceQuality(question) {
  const errors = [];
  const options = question.answer_options || [];
  const correct = question.correct_answer;

  if (!correct) errors.push("Missing correct_answer.");
  if (Array.isArray(options) && !options.includes(correct)) {
    errors.push("correct_answer does not match any answer_options.");
  }

  const normalized = options.map((o) => String(o || "").trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    errors.push("Duplicate answer options detected.");
  }

  return errors;
}

function validateMultiSelectQuality(question) {
  const errors = [];
  const options = question.answer_options || [];
  const correct = question.correct_answer;

  if (!Array.isArray(correct) || correct.length < 2 || correct.length > 3) {
    errors.push("correct_answer must be an array of 2-3 ids.");
  }

  if (Array.isArray(options) && Array.isArray(correct)) {
    const validIds = options.map((o) => o.id);
    const invalid = correct.filter((id) => !validIds.includes(id));
    if (invalid.length > 0) {
      errors.push(`correct_answer id(s) ${invalid.join(", ")} not found in answer_options.`);
    }
  }

  const normalized = options.map((o) => String(o.text || "").trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) {
    errors.push("Duplicate answer options detected.");
  }

  return errors;
}

function validateHotTextQuality(question) {
  const errors = [];
  const targets = question.hot_text_targets || [];
  const passage = String(question.passage || "");

  if (!passage.trim()) {
    errors.push("hot_text requires a passage/stimulus.");
  }

  if (!Array.isArray(targets)) {
    errors.push("hot_text_targets must be an array.");
    return errors;
  }

  if (targets.length < 3 || targets.length > 5) {
    errors.push(`hot_text must have 3-5 targets. Found ${targets.length}.`);
  }

  const correctTargets = targets.filter((t) => t.is_correct === true);

  if (correctTargets.length !== 1) {
    errors.push(
      `hot_text must have exactly 1 target marked is_correct: true. Found ${correctTargets.length}.`
    );
  }

  const ids = targets.map((t) => String(t.id || "").trim());
  const normalizedIds = ids.map((id) => id.toLowerCase());

  if (ids.some((id) => !id)) {
    errors.push("Each hot_text target must have a non-empty id.");
  }

  if (new Set(normalizedIds).size !== normalizedIds.length) {
    errors.push("Duplicate hot_text target ids detected.");
  }

  for (const target of targets) {
    if (typeof target.is_correct !== "boolean") {
      errors.push(`hot_text target ${target.id || "(missing id)"} must have boolean is_correct.`);
    }
  }

  const targetTexts = targets.map((t) => String(t.text || "").trim());

  if (targetTexts.some((text) => !text)) {
    errors.push("Each hot_text target must have non-empty text.");
  }

  const normalizedTexts = targetTexts.map((text) => text.toLowerCase());

  if (new Set(normalizedTexts).size !== normalizedTexts.length) {
    errors.push("Duplicate hot_text_targets detected.");
  }

  for (const target of targets) {
    const text = String(target.text || "").trim();

    if (text && passage && !passage.includes(text)) {
      errors.push(
        `hot_text target text must appear exactly in passage/stimulus: "${text}"`
      );
    }
  }

  return errors;
}

function validateConstructedResponseQuality(question) {
  const errors = [];

  const passage = String(question.passage || "").trim();
  const stem = String(question.stem || "").trim();
  const correctAnswer = question.correct_answer;
  const rubric = question.scoring_rubric;

  if (!passage) {
    errors.push("constructed_response requires a passage/stimulus.");
  }

  if (!stem) {
    errors.push("constructed_response requires a stem.");
  }

  if (question.answer_options !== null) {
    errors.push("constructed_response answer_options must be null.");
  }

  if (!correctAnswer || typeof correctAnswer !== "string") {
    errors.push("constructed_response correct_answer must be a model answer string.");
  } else {
    const modelAnswer = correctAnswer.trim();

    if (modelAnswer.length < 40) {
      errors.push("constructed_response correct_answer is too short to be a useful model answer.");
    }

    const sentenceCount = modelAnswer
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean).length;

    if (sentenceCount > 4) {
      errors.push("constructed_response correct_answer should be concise, around 1-3 sentences.");
    }
  }

  if (!rubric || typeof rubric !== "object" || Array.isArray(rubric)) {
    errors.push("constructed_response scoring_rubric must be an object.");
  } else {
    const requiredKeys = ["0", "1", "2"];

    for (const key of requiredKeys) {
      if (!(key in rubric)) {
        errors.push(`constructed_response scoring_rubric missing key "${key}".`);
      } else if (typeof rubric[key] !== "string" || !rubric[key].trim()) {
        errors.push(`constructed_response scoring_rubric key "${key}" must be a non-empty string.`);
      }
    }

    const extraKeys = Object.keys(rubric).filter((key) => !requiredKeys.includes(key));
    if (extraKeys.length > 0) {
      errors.push(
        `constructed_response scoring_rubric must only include keys 0, 1, and 2. Extra keys: ${extraKeys.join(", ")}.`
      );
    }
  }

  return errors;
}

function validatePoetryQuality(question) {
  const errors = [];

  const poetryStandards = ["6.8B", "7.8B", "8.8B"];

  if (!poetryStandards.includes(question?.teks_standard)) {
    return errors;
  }

  const passage = question?.passage ?? "";
  const lowerPassage = passage.toLowerCase();

  if (!passage.includes("\n")) {
    errors.push(
      "Poetry TEKS must generate a poem with preserved line breaks, not a prose paragraph."
    );
  }

  const forbiddenPoetryPhrases = [
    "rhyme scheme",
    "meter",
    "punctuation",
    "punctuation pauses",
    "punctuation dances",
    "comma slows",
    "commas",
    "capital letters",
    "capitals",
    "capitalization",
    "line length",
    "long lines",
    "short ones",
    "short lines",
    "line breaks",
    "each line begins",
    "poetry structure",
    "structural elements",
    "graphical elements",
  ];

  for (const phrase of forbiddenPoetryPhrases) {
    if (lowerPassage.includes(phrase)) {
      errors.push(
        `Poem should demonstrate poetic elements naturally, not mention "${phrase}" directly.`
      );
    }
  }

  return errors;
}

function validateDramaQuality(question) {
  const errors = [];
  const dramaStandards = ["4.9C", "5.9C", "6.8C", "7.8C", "8.8C"];

  if (!dramaStandards.includes(question?.teks_standard)) {
    return errors;
  }

  const passage = question?.passage ?? "";

  if (!/Characters/i.test(passage)) {
    errors.push("Drama TEKS must include a Characters list.");
  }

  if (!/SCENE\s+\d+/i.test(passage)) {
    errors.push("Drama TEKS must include a labeled scene, such as SCENE 1.");
  }

 if (question?.teks_standard === "8.8C" && !/SCENE\s+2/i.test(passage)) {
  errors.push(
    "8.8C drama should include at least SCENE 1 and SCENE 2 so students can analyze how scenes develop dramatic action."
  );
}

 const hasNumberedStageDirection =
  /(?:^|\n)\s*\d+\s*(?:[.)-]\s*)?[^\n]*\[[^\]\n]+\]/m.test(
    passage,
  );

if (!hasNumberedStageDirection) {
  errors.push(
    "Drama TEKS must include numbered stage directions in brackets.",
  );
}

  if (!/[A-Z][A-Z\s]+:\s+/.test(passage)) {
    errors.push("Drama TEKS must include character tags in all caps followed by dialogue.");
  }

 if (question?.teks_standard === "8.8C") {
  const contentFocus = question?.content_focus ?? "";
  const passage = question?.passage ?? "";

  const needsThreeScenes =
    /overhear|overheard|secret|mystery|missing|phone call|suspicious|hidden plan|discovered|discovery/i.test(
      contentFocus
    );

  if (needsThreeScenes && !/SCENE\s+3/i.test(passage)) {
    errors.push(
      "8.8C drama with overheard information, mystery, secret, suspicious phone call, hidden plan, or discovery should include SCENE 3."
    );
  }
}

  return errors;
}

// Stub validators for not-yet-built question types — return no errors
// until these types are actually implemented. Remove stubs once real
// validation logic is written for each.
function validateDragDropQuality() { return []; }
function validateCompleteTableQuality() { return []; }
function validateGriddableQuality() { return []; }

/**
 * Main entry point — runs base checks + type-specific checks.
 * Called by every subject generator on the ENRICHED question
 * (after skill_focus/assessment_move merge), before stimulus/
 * non-stimulus branching.
 */
export function validateQuestionQuality(question) {
  const type = question.question_type;

  const baseErrors = validateBaseQuality(question);

  const validatorMap = {
    multiple_choice: validateMultipleChoiceQuality,
    inline_choice: validateInlineChoiceQuality,
    multi_select: validateMultiSelectQuality,
    hot_text: validateHotTextQuality,
    constructed_response: validateConstructedResponseQuality,
    drag_drop: validateDragDropQuality,
    complete_table: validateCompleteTableQuality,
    griddable: validateGriddableQuality,
  };

  const typeErrors = validatorMap[type]?.(question) || [];
  const errors = [...baseErrors, ...typeErrors, ...validatePoetryQuality(question), ...validateDramaQuality(question)];

  return {
    ok: errors.length === 0,
    errors,
  };
}



// ── question_bank Writer ───────────────────────────────────────────────────────
/**
 * Persists a newly generated question to question_bank in Supabase.
 * Uses service_role client — question_bank is writable by service_role only.
 * Must be awaited — returns the inserted id needed for question_bank_id on the question.
 */
export async function saveToQuestionBank({ question, teks_standard, grade_level, dok_level, question_type, subject }) {
  try {
    const serviceSupabase = await createV2ServiceClient();

    const { data, error } = await serviceSupabase
      .from("question_bank")
      .insert({
        teks_standard,
        grade_level: String(grade_level),
        dok_level: Number(dok_level),
        question_type,
        subject,
        question_json: question,
        times_used: 0,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.warn("[shared/saveToQuestionBank] question_bank insert failed:", error?.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.warn("[shared/saveToQuestionBank] question_bank write error (non-fatal):", err.message);
    return null;
  }
}

// ── Answer Fields Prompt Fragment ─────────────────────────────────────────────
/**
 * Builds the answer_options / hot_text_targets / correct_answer section
 * of the user prompt for any question type.
 */
export function buildAnswerFields(question_type) {
  const answerOptions = (() => {
    switch (question_type) {
      case "multiple_choice":
        return '[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}]';
      case "multi_select":
        return '[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."},{"id":"E","text":"..."}]';
      case "inline_choice":
        return '["option1","option2","option3","option4"]';
      default:
        return "null";
    }
  })();

  const hotTextTargets =
    question_type === "hot_text"
      ? '[{"id":"ht1","text":"<exact substring from passage>","is_correct":true}, {"id":"ht2","text":"<exact substring>","is_correct":false}, ...]'
      : "null";

  const correctAnswer = (() => {
    switch (question_type) {
      case "multiple_choice":
        return '"<A, B, C, or D>"';
      case "multi_select":
        return '["<id1>","<id2>"] — array of 2 or 3 correct option ids from A-E';
      case "inline_choice":
        return '"<the correct option string from answer_options>"';
      case "hot_text":
        return '["<ht_id>"] — array of correct hot_text target ids e.g. ["ht1"]';
      case "constructed_response":
        return '"<model answer string>"';
      default:
        return '"<correct answer>"';
    }
  })();

  return `  "answer_options": ${answerOptions},
  "hot_text_targets": ${hotTextTargets},
  "correct_answer": ${correctAnswer},`;
}

// ── Next Question Logic Builder ────────────────────────────────────────────────
/**
 * Builds the next_question_logic JSON fragment for all subject generators.
 * Adds a third "if_partial" branch for constructed_response only — supports
 * 3-way adaptive branching: 2 = mastered, 1 = partial (retry same DOK), 0 = incorrect.
 * Centralized here so ELA/SS/Science/Math all stay in sync when extracted.
 */
export function buildNextQuestionLogic(dok_level, question_type) {
  const ifCorrect = `{ "dok_level": ${Math.min(dok_level + 1, 3)}, "action": "${dok_level < 3 ? "increase_difficulty" : "maintain_mastery"}" }`;
  const ifIncorrect = `{ "dok_level": ${Math.max(dok_level - 1, 1)}, "action": "${dok_level > 1 ? "decrease_difficulty" : "retry_with_scaffold"}" }`;
  const ifPartial = `{ "dok_level": ${dok_level}, "action": "retry_same_dok" }`;

  return `"next_question_logic": {
    "if_correct": ${ifCorrect},
    ${question_type === "constructed_response" ? `"if_partial": ${ifPartial},` : ""}
    "if_incorrect": ${ifIncorrect}
  }`;
}

// ── Type Instructions Prompt Fragment ─────────────────────────────────────────
/**
 * Returns per-type generation instructions injected into every subject's user prompt.
 * Subject-agnostic — only the question type mechanics differ, not the subject content.
 */
export function buildTypeInstructions(question_type) {
  switch (question_type) {
    case "multiple_choice":
      return `
TYPE INSTRUCTIONS (multiple_choice):
- Write a passage OR a standalone stem (passage is optional for MC).
- If a passage is used, the stem must reference it.
- Provide exactly 4 answer options (A, B, C, D).
- Exactly ONE option must be fully correct.
- Distractors must reflect common student misconceptions.
ANSWER QUALITY REQUIRED:
- correct_answer must be the SINGLE BEST answer among all options.
- The correct answer must be directly supported by the passage, stimulus, data, or problem.
- Distractors must be plausible misconceptions a real student might select.
- Avoid filler distractors that are obviously incorrect.
- If two options appear defensible, revise until one is clearly strongest.
- Explanation must explain why the correct answer text is correct.
- Prefer referencing the correct answer by its text, not by option letter.
- Do not write "The correct answer is A/B/C/D" unless that letter exactly matches correct_answer.
- Explanation may explain why distractors are incorrect, but must not identify a distractor as correct.
- Explanation must never contradict the answer key.`;

case "hot_text":
  return `
TYPE INSTRUCTIONS (hot_text):
- A passage/stimulus IS REQUIRED.
- Write an original 150-250 word passage, source excerpt, scenario, model description, or data-based description appropriate to the subject, grade level, TEKS standard, skill_focus, and assessment_move.
- The stem must ask the student to click/select one specific word, phrase, sentence, or evidence span from the passage/stimulus.
- hot_text_targets: provide EXACTLY 3-5 selectable options.
- Exactly 1 target must have is_correct: true.
- All other targets must have is_correct: false.
- Each target must have a unique id: ht1, ht2, ht3, ht4, ht5.
- correct_answer must be an array containing exactly the correct target id, for example ["ht2"].
- Do NOT include passage_tokens. The server builds passage_tokens automatically.

HOT_TEXT EXACT COPY RULE:
- Every hot_text_targets[].text value must be copied EXACTLY from the passage/stimulus.
- The target text must appear in the passage/stimulus character-for-character.
- Do not paraphrase target text.
- Do not shorten target text.
- Do not reword target text.
- Do not change capitalization.
- Do not change punctuation.
- Do not add or remove commas, periods, quotation marks, apostrophes, or hyphens.
- Do not remove transition words such as "Meanwhile," "In contrast," "For example," "Because," "As a result," or "However," if they are part of the passage sentence.
- Do not remove introductory words from the target.
- Copy the exact text directly from the passage/stimulus, then paste it into hot_text_targets[].text.
- Before finalizing, verify that passage.includes(hot_text_targets[i].text) would return true for every target.

TARGET SELECTION RULE:
- Prefer complete sentence targets when the task asks for evidence, support, cause/effect, inference, role, relationship, process, or explanation.
- Use phrase-level or word-level targets only when the stem specifically asks for a word, phrase, term, concept, or vocabulary clue.
- For Social Studies and Science, prefer complete sentence targets because students usually need to identify evidence, relationships, roles, effects, processes, or adaptations.
- For ELA, complete sentence targets are preferred for evidence/inference questions, but phrase-level targets are allowed for vocabulary, figurative language, author's craft, or specific text evidence.
- Distractor targets must also be exact copies from the passage/stimulus.
- Distractors should be plausible but clearly incorrect for the exact stem.

SUBJECT FIT RULE:
- For ELA, targets may be words, phrases, or sentences from a literary/informational passage.
- For Science, targets should usually identify evidence, data, a process, a role, a relationship, a cause/effect, a model component, or a system interaction.
- For Social Studies, targets should usually identify source evidence, geography, culture, cause/effect, historical significance, perspective, civic/economic detail, or a comparison.
- The correct target must directly match the skill_focus and assessment_move.
- Do not make the correct target only loosely related to the question.

OUTPUT REQUIREMENTS:
- Return valid JSON only.
- Include passage as a string.
- Include hot_text_targets as an array.
- Include correct_answer as an array of exactly one id.
- Do not include answer_options for hot_text.

ANSWER QUALITY REQUIRED:
- The correct selection must require comprehension, evidence use, or subject reasoning — not keyword matching.
- Distractor targets must be text the student could realistically confuse with the answer.
- Explanation must explain why the selected text best satisfies the question.
- Explanation must refer to the selected text by meaning, not by target id only.`;

case "constructed_response":
  return `
TYPE INSTRUCTIONS (constructed_response):
- A passage/stimulus IS REQUIRED for constructed_response questions.
- The passage/stimulus may be a reading passage, source excerpt, scenario, data description, or short subject-specific context.
- The stem must ask the student to write 2-4 complete sentences in response to the passage/stimulus.
- answer_options must be null — this is an open-ended response.
- correct_answer must be a model answer string, 1-3 sentences, showing strong evidence use and reasoning.
- Include a scoring_rubric field in your JSON output with exactly these keys:
  { "0": "No response or completely off topic.",
    "1": "Partial — addresses the prompt but lacks specific evidence.",
    "2": "Complete — clear response with explicit evidence from the passage/stimulus." }

ANSWER QUALITY REQUIRED:
- Model answer must demonstrate the target TEKS skill.
- Response must use evidence from the passage/stimulus.
- Explanation must describe characteristics of a strong student response.
- Do not generate multiple equally valid model answers.`;
    case "multi_select":
      return `
TYPE INSTRUCTIONS (multi_select):
- Write a passage OR a standalone stem (passage is optional).
- Provide exactly 5 answer options (A, B, C, D, E).
- Exactly 2 or 3 options must be correct — never 1, never 4+.
- The stem must explicitly tell the student to "Select ALL that apply" or "Select the TWO/THREE answers that...".
- Distractors must be plausible, reflecting common misunderstandings of the TEKS skill.
- correct_answer must be a JSON array of the correct option ids, e.g. ["A","C"] or ["B","C","E"].
- Sort the correct_answer array alphabetically.
ANSWER QUALITY REQUIRED:
- Each correct option must independently satisfy the question.
- Incorrect options must appear plausible but fail under close reading.
- Explanation must explain why each correct answer TEXT is correct.
- Explanation must refer to answer choices by their exact answer text only.
- Do NOT use option letters like A, B, C, D, or E in the explanation.
- Do NOT write "The correct answers are A/B/C/D/E".
- Example: say "Plants are correct because..." instead of "A is correct because..."
- Explanation may explain why distractors are incorrect, but must not identify a distractor as correct.
- Before finalizing, verify that every id in correct_answer matches the intended answer text.`;

    case "inline_choice":
      return `
TYPE INSTRUCTIONS (inline_choice):
- Write a short passage (100-150 words) as normal prose — complete sentences, no placeholders.
- Write a stem as a COMPLETE sentence with the correct answer word/phrase included naturally.
  Example: "The author uses imagery to create a sense of urgency in the passage."
  Example: "This principle is known as Newton's First Law."
- The correct_answer must be the exact word or short phrase from the stem that tests the TEKS concept.
- Provide exactly 4 short answer_options as plain strings including the correct_answer plus 3 plausible distractors.
- correct_answer must exactly match one of the answer_options strings.
- Do NOT use any placeholder like {{blank}} — write the stem as a real sentence.
ANSWER QUALITY REQUIRED:
- Only ONE answer should fit grammatically and conceptually.
- Distractors must appear believable before close analysis.
- Avoid obviously incorrect wording.
- Explanation must explain why the selected option fits the context better than alternatives.`;

    default:
      return "";
  }
}