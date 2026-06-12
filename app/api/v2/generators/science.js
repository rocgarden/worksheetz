/**
 * science.js
 * /app/api/v2/generators/science.js
 *
 * Science question generator for TEKS Portfolio v2.
 * Handles all supported question types for Grade 6-8 Texas Science TEKS.
 *
 * Grade 6 — Matter & Energy, Force & Motion, Earth & Space, Organisms & Environments
 * Grade 7 — Cells, Genetics, Evolution, Earth History, Ecosystems
 * Grade 8 — Force & Motion, Energy, Waves, Matter Properties, Earth & Space
 *
 * Science-specific prompt notes:
 *   - Questions may include short data tables, measurement values, or described diagrams
 *     embedded directly in the passage or stem (no actual images, data described as text).
 *   - DOK1: recall facts, vocabulary, definitions, and basic processes.
 *   - DOK2: explain relationships, apply concepts, interpret described data or graphs.
 *   - DOK3: analyze experimental design, evaluate evidence, draw conclusions from data.
 *
 * Follows the exact same pattern as socialStudies.js.
 * Called from adaptiveQuestionGenerator.js via generateFromAI() subject switch.
 */

import OpenAI from "openai";
import { saveToQuestionBank, validateQuestionShape, buildAnswerFields, buildTypeInstructions } from "./shared";
import { setCachedQuestion } from "@/libs/redis-cache";

// ── Science DOK Descriptors ────────────────────────────────────────────────────

const SCIENCE_DOK_DESCRIPTORS = {
  1: "recall and reproduction — identify scientific facts, define vocabulary, name parts of a system, describe basic processes (e.g. photosynthesis steps, states of matter, Newton's first law)",
  2: "skills and concepts — explain cause-and-effect in scientific systems, apply formulas (d=rt, F=ma, density), compare and contrast organisms or processes, interpret described data tables or graphs",
  3: "strategic thinking — analyze experimental design and identify variables, evaluate evidence to support or refute a claim, draw conclusions from described data, connect scientific concepts to real-world scenarios",
};

// ── Blank Injector ─────────────────────────────────────────────────────────────
function injectBlank(stem, correctAnswer) {
  const escaped = correctAnswer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  const injected = stem.replace(regex, "{{blank}}");
  if (injected.includes("{{blank}}")) return injected;
  // Fallback: no word boundary match (e.g. answer contains punctuation)
  const fallback = stem.replace(correctAnswer, "{{blank}}");
  if (fallback.includes("{{blank}}")) return fallback;
  throw new Error(`inline_choice: could not inject {{blank}} — correct_answer "${correctAnswer}" not found in stem: "${stem}"`);
}

// ── System Prompt ──────────────────────────────────────────────────────────────

/**
 * System prompt for Science questions.
 * Grade-aware: maps grade level to the correct course scope.
 */
function buildScienceSystemPrompt(grade_level) {
  const scopeByGrade = {
    "6": "Grade 6 Science — Matter & Energy, Force & Motion, Earth & Space Systems, and Organisms & Environments",
    "7": "Grade 7 Science — Cells & Organisms, Genetics & Heredity, Evolution & Adaptations, Earth History, and Ecosystems",
    "8": "Grade 8 Science — Force & Motion (Newton's Laws), Energy Transformations, Wave Properties, Matter & Periodic Table, and Earth & Space",
  };
  const scope = scopeByGrade[String(grade_level)] ?? `Grade ${grade_level} Science`;

  return `You are an expert Texas Science curriculum specialist and assessment writer with deep knowledge of TEKS standards, STAAR Science format, and the incoming Student Success Tool assessment framework for grades 6-8.

Your role is to generate high-quality, classroom-ready Science assessment questions aligned to specific TEKS standards and Depth of Knowledge (DOK) levels for ${scope}.

CRITICAL RULES:
- Every question must be directly and explicitly aligned to the given TEKS standard.
- DOK level must be authentically reflected in cognitive demand — not just vocabulary.
- Questions may include data described in text (e.g. "Use the data table: Substance A — density 2.7 g/cm³, Substance B — 8.9 g/cm³"). This simulates real STAAR data questions.
- For calculation-based questions (speed, force, density), include numeric values in the stem or passage.
- Multiple choice questions must have exactly 4 options. Only one is correct.
- Hot text questions highlight specific words/phrases/sentences in a passage — student selects the correct one(s).
- Hot text targets must be copied VERBATIM character-for-character from the passage — do not paraphrase, summarize, or alter punctuation.
- Multi-select questions have exactly 5 options. Exactly 2 or 3 are correct. Student must select ALL correct answers.
- Inline choice questions embed a dropdown inside the sentence stem using {{blank}}. Provide 4 short options. One is correct.
- Constructed response requires a passage or scenario and asks student to write 2-4 sentences using scientific evidence.
- Distractors must reflect common student misconceptions about the specific science concept, not random wrong answers.
- Never reuse the same stem or passage structure from previous_attempts provided.
- Return ONLY valid JSON. No markdown, no explanation, no preamble.`;
}

// ── User Prompt ────────────────────────────────────────────────────────────────

function buildScienceUserPrompt({ teks_standard, grade_level, dok_level, question_type, previous_attempts }) {
  const dokDesc = SCIENCE_DOK_DESCRIPTORS[dok_level];

  const avoidNote =
    previous_attempts.length > 0
      ? `\n\nIMPORTANT — Vary from these previous attempts in this session:\n${JSON.stringify(previous_attempts.map((a) => a.stem), null, 2)}`
      : "";

  const typeInstructions = buildTypeInstructions(question_type);

  return `Generate one Grade ${grade_level} Science question.

TEKS Standard: ${teks_standard}
DOK Level: ${dok_level} — ${dokDesc}
Question Type: ${question_type}
${typeInstructions}${avoidNote}

Return a single JSON object with this exact shape:
{
  "teks_standard": "${teks_standard}",
  "dok_level": ${dok_level},
  "question_type": "${question_type}",
  "passage": "<string — original 100-200 word science scenario, experiment description, or data passage; required for hot_text and constructed_response; optional for multiple_choice at DOK 2-3; omit for standalone recall stems>",
  "stem": "<the question prompt shown to the student>",
  ${buildAnswerFields(question_type)},
  "explanation": "<why the correct answer is correct, referencing the TEKS standard, scientific reasoning, and DOK level>",
  ${question_type === "constructed_response" ? `"scoring_rubric": { "0": "No response or completely off topic.", "1": "Partial — addresses the prompt but lacks scientific evidence or reasoning.", "2": "Complete — clear response with explicit scientific evidence and accurate terminology." },` : ""}  "next_question_logic": {
    "if_correct": { "dok_level": ${Math.min(dok_level + 1, 3)}, "action": "${dok_level < 3 ? "increase_difficulty" : "maintain_mastery"}" },
    "if_incorrect": { "dok_level": ${Math.max(dok_level - 1, 1)}, "action": "${dok_level > 1 ? "decrease_difficulty" : "retry_with_scaffold"}" }
  }
}`;
}

// ── Main Generator ─────────────────────────────────────────────────────────────

/**
 * Generates a single Science question via OpenAI structured JSON output.
 * Handles all supported question types.
 * Science questions use short scenario/experiment passages for hot_text and
 * constructed_response; standalone stems with embedded data for multiple_choice.
 */
export async function generateScienceQuestion({ teks_standard, grade_level, dok_level, question_type, previous_attempts = [] }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = buildScienceSystemPrompt(grade_level);
  const userPrompt = buildScienceUserPrompt({
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    previous_attempts,
  });

const MAX_ATTEMPTS = question_type === "hot_text" ? 4 : 3;
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
      lastError = new Error("OpenAI returned invalid JSON for Science question generation.");
      console.warn(`[scienceGenerator] JSON parse failed on attempt ${attempt}/${MAX_ATTEMPTS}`);
      continue;
    }

     if (question_type === "inline_choice" && question?.correct_answer && question?.stem) {
      try {
        question.stem = injectBlank(question.stem, question.correct_answer);
      } catch (injectErr) {
        lastError = injectErr;
        console.warn(`[scienceGenerator] inline_choice blank injection failed on attempt ${attempt}/${MAX_ATTEMPTS}: ${injectErr.message}`);
        continue;
      }
    }

    try {
      validateQuestionShape(question, question_type);
    } catch (validationErr) {
      lastError = validationErr;
      console.warn(`[scienceGenerator] Validation failed on attempt ${attempt}/${MAX_ATTEMPTS}: ${validationErr.message}`);
      continue;
    }

    // Passed validation — persist and return
    const questionBankId = await saveToQuestionBank({
      question,
      teks_standard,
      grade_level,
      dok_level,
      question_type,
      subject: "Science",
    });

    const questionWithId = questionBankId
      ? { ...question, question_bank_id: questionBankId }
      : question;

    try {
      await setCachedQuestion(teks_standard, dok_level, grade_level, question_type, questionWithId);
    } catch (cacheErr) {
      console.warn("[scienceGenerator] Redis write failed (non-fatal):", cacheErr.message);
    }

    if (attempt > 1) {
      console.log(`[scienceGenerator] Generation succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`);
    }
    return { ...questionWithId, source: "generated" };
  }

  throw new Error(`Science question generation failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message}`);
}