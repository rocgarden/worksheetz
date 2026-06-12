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
- Provide exactly 4 answer options (A, B, C, D). One correct, three plausible distractors.
- Distractors must reflect common student misconceptions, not random wrong answers.`;

    case "hot_text":
      return `
TYPE INSTRUCTIONS (hot_text):
- A passage IS REQUIRED. Write an original 150-250 word passage.
- The stem asks the student to click/select a specific word, phrase, or sentence from the passage.
- hot_text_targets: provide EXACTLY 3-5 options. Minimum 3 required — at least 2 distractors plus exactly 1 correct.
- Mark exactly 1 target as is_correct: true. All others is_correct: false.
- Do NOT include passage_tokens — this is built server-side automatically.
- Each target must have a unique id: ht1, ht2, ht3...
- CRITICAL: Each target text must be an exact copy from the passage. 
  Copy the substring first, then paste it into hot_text_targets.text — never retype it from memory.
`;

    case "constructed_response":
      return `
TYPE INSTRUCTIONS (constructed_response):
- A passage IS REQUIRED for constructed_response questions.
- The stem asks the student to write 2-4 complete sentences in response to the passage.
- answer_options must be null — this is an open-ended response.
- correct_answer must be a model answer string (1-3 sentences showing strong evidence use).
- Include a scoring_rubric field in your JSON output with exactly these keys:
  { "0": "No response or completely off topic.",
    "1": "Partial — addresses the prompt but lacks specific evidence.",
    "2": "Complete — clear response with explicit evidence from the passage." }
- The explanation field should describe what a strong response includes.`;

    case "multi_select":
      return `
TYPE INSTRUCTIONS (multi_select):
- Write a passage OR a standalone stem (passage is optional).
- Provide exactly 5 answer options (A, B, C, D, E).
- Exactly 2 or 3 options must be correct — never 1, never 4+.
- The stem must explicitly tell the student to "Select ALL that apply" or "Select the TWO/THREE answers that...".
- Distractors must be plausible, reflecting common misunderstandings of the TEKS skill.
- correct_answer must be a JSON array of the correct option ids, e.g. ["A","C"] or ["B","C","E"].
- Sort the correct_answer array alphabetically.`;

    case "inline_choice":
      return `
TYPE INSTRUCTIONS (inline_choice):
- The stem IS the sentence containing the blank, using {{blank}} as the placeholder.
- Do NOT write a separate stem — the full sentence with {{blank}} is the question.
- Example stem: "The object accelerates because the net force acting on it is {{blank}}."
- Provide exactly 4 short answer_options as plain strings (not objects), e.g. ["unbalanced","balanced","zero","constant"].
- correct_answer is the single correct string from answer_options.
- A short passage (100-150 words) is recommended to give context for the blank.
- The blank must test vocabulary, key concept, or scientific term knowledge tied to the TEKS standard.`;

    default:
      return "";
  }
}