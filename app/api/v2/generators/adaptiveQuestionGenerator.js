/**
 * adaptiveQuestionGenerator.js
 * /app/api/v2/generators/adaptiveQuestionGenerator.js
 *
 * Master adaptive question generator for Teks Portfolio v2.
// Scope (initial): ELA, Grades 6-8
// question_types: multiple_choice | hot_text | constructed_response | multi_select | inline_choice 
 *
 * 3-Layer Cache Strategy (always in this order):
 *   1. Redis (getCachedQuestion)         → fastest, 7-day TTL
 *   2. question_bank (Supabase)          → permanent store, backfills Redis
 *   3. OpenAI generation                 → last resort, saves to both layers
 *
 * Never call OpenAI if Redis or Supabase already has the question.
 * Never build a separate caching system — extends redis-cache.js only.
 *
 * Input shape:
 *   { teks_standard, grade_level, dok_level, question_type,
 *     subject, previous_attempt_ids, session_id }
 *
 * Output shape:
 *   { teks_standard, dok_level, question_type, stem, passage?,
 *     answer_options?, correct_answer, explanation,
 *     next_question_logic: { if_correct, if_incorrect },
 *     source }   ← "redis" | "question_bank" | "generated"
 */

// import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

import { getCachedQuestion, setCachedQuestion } from "@/libs/redis-cache";
import OpenAI from "openai";
import { generateScienceQuestion } from "./science";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORTED_SUBJECTS = ["ELA", "Social Studies", "Science"];
const SUPPORTED_GRADES = ["6","7","8"];
const SUPPORTED_TYPES = ["multiple_choice", "hot_text", "constructed_response", "multi_select", "inline_choice"]; 

const DOK_LEVELS = [1, 2, 3];

// Maps DOK level → human label used in prompt engineering
const DOK_DESCRIPTORS = {
  1: "recall and reproduction — basic fact retrieval, literal comprehension, defining vocabulary in context",
  2: "skills and concepts — inference, author's purpose, text structure, comparing ideas within a text",
  3: "strategic thinking — evaluating author's choices, synthesizing across texts, supporting claims with textual evidence",
};

// Maps DOK level → human label used in Social Studies prompt engineering
const SS_DOK_DESCRIPTORS = {
  1: "recall and reproduction — identify key facts, dates, people, places, and events; define terms from the TEKS standard",
  2: "skills and concepts — explain cause-and-effect relationships, compare and contrast perspectives, describe geographic or economic patterns",
  3: "strategic thinking — evaluate historical significance, analyze multiple perspectives on events, draw conclusions from primary or secondary sources, connect events to broader themes",
};

// ─── Passage Token Builder ────────────────────────────────────────────────────
/**
 * Programmatically splits a passage into tokens marking which segments
 * are clickable hot_text targets. Called after GPT generation — GPT never
 * builds this structure. 100% reliable vs GPT's ~70% accuracy.
 *
 * Works for words, phrases, and full sentences.
 * Sorts targets by position in passage so tokens are always in order.
 */
function buildPassageTokens(passage, hotTextTargets) {
  const sorted = hotTextTargets
    .map((t) => ({ ...t, index: passage.indexOf(t.text) }))
    .filter((t) => t.index !== -1)
    .sort((a, b) => a.index - b.index);

  const tokens = [];
  let cursor = 0;

  for (const target of sorted) {
    // Skip overlapping targets — cursor already past this target's start
    if (target.index < cursor) continue;

    if (target.index > cursor) {
      tokens.push({ text: passage.slice(cursor, target.index), is_target: false });
    }
    tokens.push({ text: target.text, is_target: true, target_id: target.id });
    cursor = target.index + target.text.length;
  }

  if (cursor < passage.length) {
    tokens.push({ text: passage.slice(cursor), is_target: false });
  }

  return tokens;
}
// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates incoming generator params and throws with a clear message if invalid.
 * Keeps route handlers clean — validate once here.
 */
function validateParams({ teks_standard, grade_level, dok_level, question_type, subject }) {
  if (!SUPPORTED_SUBJECTS.includes(subject)) {
    throw new Error(`Subject "${subject}" not yet supported. Supported: ${SUPPORTED_SUBJECTS.join(", ")}`);
  }
  if (!SUPPORTED_GRADES.includes(String(grade_level))) {
    throw new Error(`Grade "${grade_level}" not yet supported. Supported: ${SUPPORTED_GRADES.join(", ")}`);
  }
  if (!SUPPORTED_TYPES.includes(question_type)) {
    throw new Error(`Question type "${question_type}" not yet supported. Supported: ${SUPPORTED_TYPES.join(", ")}`);
  }
  if (!DOK_LEVELS.includes(Number(dok_level))) {
    throw new Error(`DOK level must be 1, 2, or 3. Received: ${dok_level}`);
  }
  if (!teks_standard || typeof teks_standard !== "string") {
    throw new Error("teks_standard is required and must be a string (e.g. '7.6A').");
  }
}

// ─── Redis Key Builder ─────────────────────────────────────────────────────────

/**
 * Builds the Redis key for individual question lookup.
 * Pattern: question:{teks}:{dok_level}:{grade}:{type}
 * Matches the pattern defined in project instructions.
 *
 * Note: Redis caches one representative question per slot.
 * question_bank is the full pool — Redis is just the speed layer.
 */
function buildRedisKey({ teks_standard, dok_level, grade_level, question_type }) {
  return `question:${teks_standard}:${dok_level}:${grade_level}:${question_type}`;
}

// ─── Layer 1: Redis Lookup ─────────────────────────────────────────────────────

/**
 * Attempts to return a question from Redis.
 * Returns null if not found — never throws on cache miss.
 */

async function getFromRedis({ 
  teks_standard, dok_level, grade_level, question_type, 
  previous_attempt_ids = [] 
}) {
  try {
    const cached = await getCachedQuestion(teks_standard, dok_level, grade_level, question_type);
    if (!cached) return null;

    // If no question_bank_id on cached question we can't verify 
    // if student has seen it — fall through to question_bank to be safe
    if (!cached.question_bank_id) {
      console.log(`[adaptiveQuestionGenerator] Redis HIT but no question_bank_id — falling through`);
      return null;
    }

    // Skip if student already saw this question
    if (previous_attempt_ids.includes(cached.question_bank_id)) {
      console.log(`[adaptiveQuestionGenerator] Redis HIT but already seen — falling through`);
      return null;
    }

    return { ...cached, source: "redis" };
  } catch (err) {
    console.warn("[adaptiveQuestionGenerator] Redis read failed (non-fatal):", err.message);
    return null;
  }
}

// ─── Layer 2: Supabase question_bank Lookup ────────────────────────────────────

/**
 * Queries question_bank for a matching question.
 * Excludes already-seen question IDs (previous_attempt_ids).
 * Orders by times_used ASC so least-used questions surface first.
 * Returns null if no match — never throws on miss.
 *
 * On hit: backfills Redis with the result for next time.
 */
async function getFromQuestionBank({ teks_standard, dok_level, grade_level, question_type, subject, previous_attempt_ids = [] }) {
  try {
    const serviceSupabase = await createV2ServiceClient();
    
    let query = serviceSupabase //remove this and use regular supabase client once auth is working
      .from("question_bank")
      .select("*")
      .eq("teks_standard", teks_standard)
      .eq("dok_level", Number(dok_level))
      .eq("grade_level", String(grade_level))
      .eq("subject", subject)
      .eq("question_type", question_type)
      .order("times_used", { ascending: true })
      .limit(1);

    // Exclude questions already seen in this session
    if (previous_attempt_ids.length > 0) {
      query = query.not("id", "in", `(${previous_attempt_ids.join(",")})`);
    }

    const { data, error } = await query.single();

    if (error || !data) return null;

    // Increment usage count (fire-and-forget — don't await)
    serviceSupabase //remove this and use regular supabase client once auth is working
      .from("question_bank")
      .update({ times_used: (data.times_used || 0) + 1 })
      .eq("id", data.id)
      .then(() => {})
      .catch(() => {});

   const question = { ...data.question_json, question_bank_id: data.id };

    // Backfill Redis so next request is served from cache
    try {
    //   const key = buildRedisKey({ teks_standard, dok_level, grade_level, question_type });
    //   await setCachedQuestion(key, question);
    await setCachedQuestion(teks_standard, dok_level, grade_level, question_type, question);
    } catch (cacheErr) {
      console.warn("[adaptiveQuestionGenerator] Redis backfill failed (non-fatal):", cacheErr.message);
    }

    return { ...question, source: "question_bank", question_bank_id: data.id };
  } catch (err) {
    console.warn("[adaptiveQuestionGenerator] question_bank read failed (non-fatal):", err.message);
    return null;
  }
}

// ─── Layer 3: OpenAI Generation ───────────────────────────────────────────────

/**
 * Calls OpenAI to generate a new question when both cache layers miss.
 * Persists the result to question_bank + Redis before returning.
 *
 * Subject router lives here — as new subjects are added, add a case.
 */
async function generateFromAI(params) {
  const { subject } = params;

  switch (subject) {
    case "ELA":
      return generateELAQuestion(params);
    case "Social Studies":
      return generateSSQuestion(params);
    case "Science":
      return generateScienceQuestion(params);
    default:
      throw new Error(`No AI generator implemented for subject: ${subject}`);
  }
}

// ─── ELA Question Generator ────────────────────────────────────────────────────

/**
 * Generates a single ELA question via OpenAI structured JSON output.
 * Handles: multiple_choice | hot_text
 */
async function generateELAQuestion({ teks_standard, grade_level, dok_level, question_type, previous_attempts = [] }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = buildELASystemPrompt();
  const userPrompt = buildELAUserPrompt({
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    previous_attempts,
  });

  const MAX_ATTEMPTS = 3; 
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
     // Drop temperature more aggressively on retries to tighten GPT output
      // hot_text needs very precise passage_tokens so goes lower faster
      temperature: attempt === 1 ? 0.7 : attempt === 2 ? 0.3 : 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0].message.content;

    let question;
    try {
      question = JSON.parse(raw);
    } catch {
      lastError = new Error("OpenAI returned invalid JSON for question generation.");
      console.warn(`[adaptiveQuestionGenerator] JSON parse failed on attempt ${attempt}/${MAX_ATTEMPTS}`);
      continue;
    }

    try {
      validateQuestionShape(question, question_type);
    } catch (validationErr) {
      lastError = validationErr;
      console.warn(`[adaptiveQuestionGenerator] Validation failed on attempt ${attempt}/${MAX_ATTEMPTS}: ${validationErr.message}`);
      continue;
    }

    // Passed validation — persist and return
    const questionBankId = await saveToQuestionBank({ question, teks_standard, grade_level, dok_level, question_type, subject: "ELA" });

    const questionWithId = questionBankId ? { ...question, question_bank_id: questionBankId } : question;

    try {
      await setCachedQuestion(teks_standard, dok_level, grade_level, question_type, questionWithId);
    } catch (cacheErr) {
      console.warn("[adaptiveQuestionGenerator] Redis write after generation failed (non-fatal):", cacheErr.message);
    }

    if (attempt > 1) {
      console.log(`[adaptiveQuestionGenerator] Generation succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`);
    }
    return { ...questionWithId, source: "generated" };
  }

  // All attempts exhausted
  throw new Error(`Question generation failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message}`);
}

// ─── Social Studies Question Generator ────────────────────────────────────────
 
/**
 * Generates a single Social Studies question via OpenAI structured JSON output.
 * Handles all supported question types.
 * SS questions use short informational passages (100-200 words) for hot_text and
 * constructed_response; standalone stems for fact-based multiple_choice questions.
 */
async function generateSSQuestion({ teks_standard, grade_level, dok_level, question_type, previous_attempts = [] }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 
  const systemPrompt = buildSSSystemPrompt(grade_level);
  const userPrompt = buildSSUserPrompt({
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    previous_attempts,
  });
 
  const MAX_ATTEMPTS = 3;
  let lastError;
 
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: attempt === 1 ? 0.7 : attempt === 2 ? 0.3 : 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
 
    const raw = response.choices[0].message.content;
 
    let question;
    try {
      question = JSON.parse(raw);
    } catch {
      lastError = new Error("OpenAI returned invalid JSON for SS question generation.");
      console.warn(`[adaptiveQuestionGenerator] SS JSON parse failed on attempt ${attempt}/${MAX_ATTEMPTS}`);
      continue;
    }
 
    try {
      validateQuestionShape(question, question_type);
    } catch (validationErr) {
      lastError = validationErr;
      console.warn(`[adaptiveQuestionGenerator] SS validation failed on attempt ${attempt}/${MAX_ATTEMPTS}: ${validationErr.message}`);
      continue;
    }
 
    // Passed validation — persist and return
    const questionBankId = await saveToQuestionBank({ question, teks_standard, grade_level, dok_level, question_type, subject: "Social Studies" });
 
    const questionWithId = questionBankId ? { ...question, question_bank_id: questionBankId } : question;
 
    try {
      await setCachedQuestion(teks_standard, dok_level, grade_level, question_type, questionWithId);
    } catch (cacheErr) {
      console.warn("[adaptiveQuestionGenerator] SS Redis write failed (non-fatal):", cacheErr.message);
    }
 
    if (attempt > 1) {
      console.log(`[adaptiveQuestionGenerator] SS generation succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`);
    }
    return { ...questionWithId, source: "generated" };
  }
 
  throw new Error(`SS question generation failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message}`);
}

// ─── Prompt Builders ──────────────────────────────────────────────────────────

function buildELASystemPrompt() {
  return `You are an expert Texas ELA curriculum specialist and assessment writer with deep knowledge of TEKS standards, STAAR format, and the incoming Student Success Tool assessment framework for grades 6-8.

Your role is to generate high-quality, classroom-ready ELA assessment questions aligned to specific TEKS standards and Depth of Knowledge (DOK) levels.

CRITICAL RULES:
- Every question must be directly and explicitly aligned to the given TEKS standard.
- DOK level must be authentically reflected in cognitive demand — not just vocabulary.
- All passages must be original, culturally responsive, and grade-appropriate (Lexile range 970-1120 for Grade 7).
- Multiple choice questions must have exactly 4 options. Only one is correct.
- Hot text questions highlight specific words/phrases/sentences in a passage — student selects the correct one(s).
- Never reuse the same stem or passage structure from previous_attempts provided.
- Return ONLY valid JSON. No markdown, no explanation, no preamble.
- Hot text questions highlight specific words/phrases/sentences in a passage — student selects the correct one(s).
- Multi-select questions have exactly 5 options. Exactly 2 or 3 are correct. Student must select ALL correct answers.
- Inline choice questions embed a dropdown inside the sentence stem using {{blank}}. Provide 4 short options. One is correct.`
}

/**
 * System prompt for Social Studies questions.
 * Grade-aware: maps grade level to the correct course name and content scope.
 */
function buildSSSystemPrompt(grade_level) {
  const courseByGrade = {
    "6": "World Cultures and Geography (Grade 6)",
    "7": "Texas History (Grade 7)",
    "8": "United States History to Reconstruction (Grade 8)",
  };
  const courseName = courseByGrade[String(grade_level)] ?? `Grade ${grade_level} Social Studies`;
 
  return `You are an expert Texas Social Studies curriculum specialist and assessment writer with deep knowledge of TEKS standards, STAAR format, and the incoming Student Success Tool assessment framework for grades 6-8.
 
Your current assignment is writing questions for: ${courseName}
 
Your role is to generate high-quality, classroom-ready Social Studies assessment questions aligned to specific TEKS standards and Depth of Knowledge (DOK) levels.
 
CRITICAL RULES:
- Every question must be directly and explicitly aligned to the given TEKS standard and course content.
- DOK level must be authentically reflected in cognitive demand — not just vocabulary.
- For DOK 1: Test recall of specific facts, dates, key people, or place names.
- For DOK 2: Require the student to explain cause-and-effect, compare perspectives, or interpret a source.
- For DOK 3: Require evaluation of historical significance, analysis of multiple perspectives, or drawing conclusions from evidence.
- Passages (when used) must be original informational text, 100-200 words, historically accurate, and grade-appropriate.
- Standalone stems (no passage) are appropriate for DOK 1 fact-based multiple_choice questions.
- Multiple choice questions must have exactly 4 options. Only one is correct.
- Hot text questions require a passage — student selects the historically significant phrase or sentence.
- Multi-select questions have exactly 5 options. Exactly 2 or 3 are correct. Student must select ALL correct answers.
- Inline choice questions embed a dropdown using {{blank}} — test vocabulary or key concept knowledge.
- Constructed response requires a passage and asks student to write 2-4 sentences supported by historical evidence.
- Never reuse the same stem or passage structure from previous_attempts provided.
- Return ONLY valid JSON. No markdown, no explanation, no preamble.`;
}

function buildAnswerFields(question_type) {
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

  const hotTextTargets = question_type === "hot_text"
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

function buildELAUserPrompt({ teks_standard, grade_level, dok_level, question_type, previous_attempts }) {
  const dokDesc = DOK_DESCRIPTORS[dok_level];

  const avoidNote =
    previous_attempts.length > 0
      ? `\n\nIMPORTANT — Vary from these previous attempts in this session:\n${JSON.stringify(previous_attempts.map((a) => a.stem), null, 2)}`
      : "";

  const typeInstructions = buildTypeInstructions(question_type);


  return `Generate one Grade ${grade_level} ELA question.

TEKS Standard: ${teks_standard}
DOK Level: ${dok_level} — ${dokDesc}
Question Type: ${question_type}
${typeInstructions}${avoidNote}

Return a single JSON object with this exact shape:
{
  "teks_standard": "${teks_standard}",
  "dok_level": ${dok_level},
  "question_type": "${question_type}",
  "passage": "<string — original 150-250 word passage, required for hot_text, optional for multiple_choice>",
  "stem": "<the question prompt shown to the student>",
  ${buildAnswerFields(question_type, dok_level)},
  "explanation": "<why the correct answer is correct, referencing TEKS skill and DOK reasoning>",
    ${question_type === "constructed_response" ? `"scoring_rubric": { "0": "...", "1": "...", "2": "..." },` : ""}  "next_question_logic": {
    "if_correct": { "dok_level": ${Math.min(dok_level + 1, 3)}, "action": "${dok_level < 3 ? "increase_difficulty" : "maintain_mastery"}" },
    "if_incorrect": { "dok_level": ${Math.max(dok_level - 1, 1)}, "action": "${dok_level > 1 ? "decrease_difficulty" : "retry_with_scaffold"}" }
  }
}`;
}

/**
 * User prompt builder for Social Studies questions.
 * Same JSON output shape as ELA — only the subject context and DOK descriptors differ.
 */
function buildSSUserPrompt({ teks_standard, grade_level, dok_level, question_type, previous_attempts }) {
  const dokDesc = SS_DOK_DESCRIPTORS[dok_level];
 
  const avoidNote =
    previous_attempts.length > 0
      ? `\n\nIMPORTANT — Vary from these previous attempts in this session:\n${JSON.stringify(previous_attempts.map((a) => a.stem), null, 2)}`
      : "";
 
  const typeInstructions = buildTypeInstructions(question_type);
 
  return `Generate one Grade ${grade_level} Social Studies question.
 
TEKS Standard: ${teks_standard}
DOK Level: ${dok_level} — ${dokDesc}
Question Type: ${question_type}
${typeInstructions}${avoidNote}
 
Return a single JSON object with this exact shape:
{
  "teks_standard": "${teks_standard}",
  "dok_level": ${dok_level},
  "question_type": "${question_type}",
  "passage": "<string — original 100-200 word informational passage; required for hot_text and constructed_response; optional for multiple_choice at DOK 2-3; omit for standalone fact-recall stems>",
  "stem": "<the question prompt shown to the student>",
  ${buildAnswerFields(question_type, dok_level)},
  "explanation": "<why the correct answer is correct, referencing the TEKS standard and DOK reasoning>",
  ${question_type === "constructed_response" ? `"scoring_rubric": { "0": "...", "1": "...", "2": "..." },` : ""}  "next_question_logic": {
    "if_correct": { "dok_level": ${Math.min(dok_level + 1, 3)}, "action": "${dok_level < 3 ? "increase_difficulty" : "maintain_mastery"}" },
    "if_incorrect": { "dok_level": ${Math.max(dok_level - 1, 1)}, "action": "${dok_level > 1 ? "decrease_difficulty" : "retry_with_scaffold"}" }
  }
}`;
}

function buildTypeInstructions(question_type) {
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
- Each target must have a unique id: ht1, ht2, ht3...`;

case "constructed_response":
      return `
TYPE INSTRUCTIONS (constructed_response):
- A passage IS REQUIRED for constructed_response questions.
- The stem asks the student to write 2-4 complete sentences in response to the passage.
- answer_options must be null — this is an open-ended response.
- correct_answer must be a model answer string (1-3 sentences showing strong evidence use).
- Include a scoring_rubric field in your JSON output with exactly these keys:
  { "0": "No response or completely off topic.",
    "1": "Partial — addresses the prompt but lacks specific textual evidence.",
    "2": "Complete — clear response with explicit textual evidence from the passage." }
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
- Write a short passage (100-120 words) as normal prose — complete sentences, no placeholders.
- Write a stem as a COMPLETE sentence with the correct answer word/phrase included naturally.
  Example: "The author uses imagery to create a sense of urgency in the passage."
  Example: "This principle is known as Newton's First Law."
- The correct_answer must be the exact word or short phrase from the stem that tests the TEKS concept.
- Provide exactly 4 short answer_options as plain strings including the correct_answer plus 3 plausible distractors.
- correct_answer must exactly match one of the answer_options strings.
- Do NOT use any placeholder like {{blank}} — write the stem as a real sentence.`;
    default:
      return "";
  }
}

// ─── Question Shape Validator ──────────────────────────────────────────────────

/**
 * Validates that OpenAI returned a structurally complete question.
 * Throws if any required field is missing or malformed.
 * Prevents bad data from entering question_bank.
 */
function validateQuestionShape(q, question_type) {
  const required = ["teks_standard", "dok_level", "question_type", "stem", "correct_answer", "explanation", "next_question_logic"];
  for (const field of required) {
    if (q[field] === undefined || q[field] === null) {
      throw new Error(`Generated question missing required field: "${field}"`);
    }
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
  // Verify all targets are exact substrings — GPT's only structural responsibility
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

// ─── question_bank Writer ──────────────────────────────────────────────────────

/**
 * Persists a newly generated question to question_bank in Supabase.
 * Uses service_role client — question_bank is writable by service_role only.
 * Fire-and-forget is intentional — a failed write should not block the response.
 */
async function saveToQuestionBank({ question, teks_standard, grade_level, dok_level, question_type, subject }) {
  try {
    // Use service_role for writes — import pattern matches existing libs
    // const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    // const supabase = createServiceClient
    // (
    //   process.env.NEXT_PUBLIC_SUPABASE_URL,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY
    // );
    const serviceSupabase = await createV2ServiceClient();

    const {data, error } = await serviceSupabase //remove this and use regular supabase client once auth is working
    .from("question_bank").insert({
      teks_standard,
      grade_level: String(grade_level),
      dok_level: Number(dok_level),
      question_type,
      subject,
      question_json: question,
      times_used: 0,
    }).select("id").single();

        if (error || !data) {
      console.warn("[adaptiveQuestionGenerator] question_bank insert failed:", error?.message);
      return null;        // ← return null on failure
    }
        return data?.id ?? null;       // ← return the new id on success

  } catch (err) {
    console.warn("[adaptiveQuestionGenerator] question_bank write error (non-fatal):", err.message);
    return null;
  }
}

// ─── Main Export ───────────────────────────────────────────────────────────────

/**
 * generateAdaptiveQuestion — public API for this module.
 *
 * @param {object} params
 * @param {string}   params.teks_standard       e.g. "7.6A"
 * @param {string}   params.grade_level         e.g. "7"
 * @param {number}   params.dok_level           1 | 2 | 3
 * @param {string}   params.question_type       "multiple_choice" | "hot_text"
 * @param {string}   params.subject             "ELA"
 * @param {string[]} params.previous_attempt_ids  question_bank IDs already seen this session
 * @param {object[]} params.previous_attempts     full attempt objects for prompt deduplication
 *
 * @returns {Promise<object>} question object with a `source` field indicating cache layer hit
 */
export async function adaptiveQuestionGenerator(params) {
  const {
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    subject,
    previous_attempt_ids = [],
    previous_attempts = [],
  } = params;

  // Always validate first — fail fast with a clear error
  validateParams({ teks_standard, grade_level, dok_level, question_type, subject });

  // ── Layer 1: Redis ─────────────────────────────────────────────────────────
  const redisResult = await getFromRedis({ teks_standard, dok_level, grade_level, question_type, previous_attempt_ids });
  if (redisResult) {
    console.log(`[adaptiveQuestionGenerator] Cache HIT (Redis) — ${teks_standard} DOK${dok_level} ${question_type}`);
    return redisResult;
  }

  // ── Layer 2: question_bank (Supabase) ──────────────────────────────────────
  const bankResult = await getFromQuestionBank({
    teks_standard,
    dok_level,
    grade_level,
    question_type,
    subject,
    previous_attempt_ids,
  });
  if (bankResult) {
    console.log(`[adaptiveQuestionGenerator] Cache HIT (question_bank) — ${teks_standard} DOK${dok_level} ${question_type}`);
    return bankResult;
  }

  // ── Layer 3: OpenAI Generation ─────────────────────────────────────────────
  console.log(`[adaptiveQuestionGenerator] Cache MISS — generating via OpenAI: ${teks_standard} DOK${dok_level} ${question_type}`);
  const generated = await generateFromAI({
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    subject,
    previous_attempts,
  });

  return generated;
}