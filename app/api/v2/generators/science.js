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
 *
 * Stimulus support:
 *   When stimulus is provided, the generator skips question_bank + Redis and goes
 *   directly to OpenAI, instructing it to reuse the existing passage verbatim.
 *   Stimulus questions are NOT saved to question_bank — they are session-specific.
 */

import OpenAI from "openai";
import { saveToQuestionBank, validateQuestionShape, buildAnswerFields, validateQuestionQuality, buildNextQuestionLogic } from "./shared";
import { setCachedQuestion } from "@/libs/redis-cache";
import {
  SCIENCE_DOK_DESCRIPTORS,
  buildScienceHeader,
  SCIENCE_TASK_MODEL_RULES,
  SCIENCE_BASE_ALIGNMENT_RULES,
  SCIENCE_CONTENT_FOCUS_RULES,
  SCIENCE_STIMULUS_DESIGN_RULES,
  SCIENCE_SAME_STIMULUS_DEPTH_RULES,
  SCIENCE_STIMULUS_USE_RULES,
  SCIENCE_QUESTION_CONSTRUCTION_RULES,
  SCIENCE_VARIETY_RULES,
  SCIENCE_SAME_STIMULUS_VARIETY_RULES,
  SCIENCE_ANSWER_CONSISTENCY_RULES,
  getScienceDOKRules,
  getScienceSkillFocusRules,
  getScienceAssessmentMoveRules,
  getScienceQuestionTypeRules,
  buildScienceAvoidPreviousAttempts,
  buildSciencePassageInstruction,
  buildScienceFocusNote,
  buildScienceOutputSchema,
} from "./sciencePromptParts";

import { TEKS_SCIENCE_LABELS } from "@/libs/constants/teksScienceMap";
// ── Science DOK Descriptors ────────────────────────────────────────────────────

// const SCIENCE_DOK_DESCRIPTORS = {
//   1: "recall and reproduction — identify scientific facts, define vocabulary, name parts of a system, describe basic processes (e.g. photosynthesis steps, states of matter, Newton's first law)",
//   2: "skills and concepts — explain cause-and-effect in scientific systems, apply formulas (d=rt, F=ma, density), compare and contrast organisms or processes, interpret described data tables or graphs",
//   3: "strategic thinking — analyze experimental design and identify variables, evaluate evidence to support or refute a claim, draw conclusions from described data, connect scientific concepts to real-world scenarios",
// };


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
- All passages/stimuli must be original, grade-appropriate, scientifically accurate, and classroom-ready.
- Multiple choice questions must have exactly 4 options. Only one is correct.
- Multi-select questions must have exactly 5 options. Exactly 2 or 3 are correct.
- Hot text questions require exact words, phrases, sentences, data statements, or evidence spans copied from the passage/stimulus.
- Constructed response questions require a scoring rubric.
- Never reuse the same stem or stimulus structure from previous_attempts provided.
- Return ONLY valid JSON. No markdown, no explanation, no preamble.`;
}

// ── User Prompt ────────────────────────────────────────────────────────────────

/**
 * Builds the Science user prompt.
 * When stimulus is provided: instructs GPT to reuse that exact passage verbatim.
 * When content_focus is provided (and no stimulus): anchors the generated passage to that topic.
 */
// function buildScienceUserPrompt({ teks_standard, grade_level, dok_level, question_type, previous_attempts, content_focus = null, stimulus = null, skill_focus = null, assessment_move=null }) {
  
//   // Passage instruction — stimulus takes priority over content_focus
//   const stimulusInstruction = stimulus
//   ? `CRITICAL — Use this exact passage for this question. Do NOT generate a new passage:\n"${stimulus}"\nThe passage field in your JSON must be this exact text verbatim.`
//   : content_focus
//   ? `CRITICAL — A passage IS REQUIRED for this question. Generate an original 120-150 word science passage about: ${content_focus}. Do not write a standalone stem. The passage field must not be empty.`
//   : `Generate an original passage appropriate for the TEKS standard.`;
 
//   const dokDesc = SCIENCE_DOK_DESCRIPTORS[dok_level];

// const avoidNote =
//   previous_attempts.length > 0
//     ? `\n\nIMPORTANT — Avoid repeating these previous attempts in this session:
// ${JSON.stringify(
//   previous_attempts.map((a) => {
//     const q =
//       typeof a.question_json === "string"
//         ? JSON.parse(a.question_json)
//         : a.question_json;

//     return {
//       stem: q?.stem,
//       skill_focus: q?.skill_focus,
//       assessment_move: q?.assessment_move,
//       correct_answer: q?.correct_answer,
//     };
//   }),
//   null,
//   2
// )}`
//     : "";

//   // Suppress content_focus note when stimulus is provided — the passage already anchors the content
//   const focusNote = !stimulus && content_focus
//     ? `\nContent Focus: Anchor all passages and questions in the context of "${content_focus}". Do not use unrelated topics.`
//     : "";

//   const typeInstructions = buildTypeInstructions(question_type);

//   return `Generate one Grade ${grade_level} Science question.

//   TEKS Standard: ${teks_standard}${teksDescription ? `\nTEKS Description: ${teksDescription}` : ""}
//   ${skill_focus ? `Skill Focus: ${skill_focus} — this is the specific thinking move to assess, distinct from the broader TEKS standard.\n` : ""}
//   ${assessment_move ? `ASSESSMENT MOVE: ${assessment_move}\nYou must write a question that matches this assessment move. Do not repeat the same stem pattern used in previous_attempts.\n` : ""}
//   DOK Level: ${dok_level} — ${dokDesc} 
//   DOK RULES:
//     - DOK1 → identify, label, classify, observe
//       For DOK1, vary the task format: identify, classify, match, select the role, or choose the model component. Do not use “Which organism...” more than once in a session.
//     - DOK2 → explain, compare, apply, interpret
//     - DOK3 → justify, evaluate, predict, revise
//     - Hard vocabulary alone does NOT increase DOK.
//   Question Type: ${question_type}
//   SCIENCE TASK MODEL:
//     1. Identify the science phenomenon or system.
//     2. Determine what evidence/data the student must use.
//     3. Apply the assessment_move.
//     4. Match reasoning depth to DOK.
//     5. Write distractors from realistic misconceptions.
//   SCIENCE ALIGNMENT RULE:
//   - The passage/stimulus, stem, correct answer, and explanation must all match the TEKS standard, skill_focus, and assessment_move.
//   - If skill_focus is matter_cycles, focus on matter, nutrients, carbon, water, atoms, substances, or materials moving through or being recycled in a system. Do not make the correct answer mainly about energy source or energy transfer.
//   - If skill_focus is energy_flow, focus on energy source, producers, consumers, food chains, food webs, or energy transfer. Do not make the correct answer mainly about nutrient recycling.
//   - If skill_focus is ecosystem_interactions, focus on relationships among organisms, roles in an ecosystem, or how one organism affects another.
//   - If skill_focus is system_modeling, focus on identifying, interpreting, revising, or evaluating components, relationships, or processes in a system model.
//   - If skill_focus is data_interpretation, the question must require interpreting described data, measurements, patterns, or trends.
//   - If skill_focus is claim_evidence_reasoning, the question must require matching or evaluating a claim, evidence, or reasoning.
// SCIENCE ENERGY FLOW RULE:
// - Producers/plants are the primary biological source of energy entering most food chains because they convert sunlight into stored chemical energy.
// - Consumers such as insects, herbivores, predators, and decomposers are not primary energy sources.
// - Do not mark consumers as correct when the question asks for primary energy sources or producers.
// - If asking about energy transfer, consumers may transfer energy, but they are not producers.
// QUESTION CONSTRUCTION:
//   - The stem must ask ONE clear scientific task.
//   - The answer must depend on reasoning, not memorization.
//   - Do not ask multiple concepts in one item.
//   - Avoid “Which statement is true?” unless DOK1.
//   - Prefer observable evidence over definitions.
// For energy_flow multi_select:
// - If asking for "roles directly involved in energy flow," include producers as one of the correct answers unless the stem narrows the task to consumers.
// - If the intended answers are herbivores and carnivores, the stem must say "consumer roles" or "roles that transfer energy between organisms."
// - Avoid stems where more than 2-3 options could reasonably be correct.
// STIMULUS USE RULE:
//   - The question must require information from the provided stimulus.
//   - Do not generate a question answerable without reading the stimulus.
//   - Do not introduce outside scientific facts unless explicitly required.
//   - For multi_select, every correct answer must be directly supported by the passage/stimulus or clearly required by the TEKS skill.
//   - If the passage does not mention decomposers, nutrients, water movement, carbon, oxygen, or matter cycling, do not make those the correct answers unless the stem clearly asks students to apply outside science knowledge.
//   - Prefer generating a stimulus that includes the needed science evidence before asking a multi-select question.
// SCIENCE HOT_TEXT EXACT TARGET RULE:
// - For hot_text, every hot_text_targets[].text value must be copied exactly from the passage.
// - Use complete sentences from the passage as targets whenever possible.
// - Do not shorten, paraphrase, re-capitalize, or remove introductory words from a target sentence.
// - If the passage sentence is "In a simple grassland ecosystem, energy flows from the Sun to plants, which are the producers.", the target must include that exact full sentence, not "Energy flows from the Sun to plants..."
// - When stimulus is provided, choose targets only from the exact stimulus text.
// - Before finalizing, verify each target text appears in the passage with passage.includes(targetText).  
// For hot_text:
// - Do not invent passage_tokens.
// - Provide hot_text_targets only.
// - Each target text must be an exact substring of the passage.
// - Prefer full sentence targets copied exactly from the passage.
// ${typeInstructions}${avoidNote}${focusNote}
//   PASSAGE INSTRUCTION: ${stimulusInstruction}

//   Return a single JSON object with this exact shape:
//   {
//     "teks_standard": "${teks_standard}",
//     "dok_level": ${dok_level},
//     "question_type": "${question_type}",
//     "passage": "<when content_focus is set: always include a 120-150 word passage about that topic, even at DOK 1. When no content_focus: omit for DOK 1 recall stems, include 100-200 word scenario for DOK 2-3 and all hot_text/constructed_response>",
//     "stem": "<the question prompt shown to the student>",
//     ${buildAnswerFields(question_type)},
//     "explanation": "<why the correct answer is correct, referencing the TEKS standard, scientific reasoning, and DOK level>",
    
//    ${question_type === "constructed_response" ? `"scoring_rubric": { "0": "No response or completely off topic.", "1": "Partial — addresses the prompt but lacks scientific evidence or reasoning.", "2": "Complete — clear response with explicit scientific evidence and accurate terminology." },` : ""}  
//    ${buildNextQuestionLogic(dok_level, question_type)}
  
//   }`;
//   }

// ── Main Generator ─────────────────────────────────────────────────────────────
/**
 * Builds the Science user prompt.
 * When stimulus is provided: instructs GPT to reuse that exact passage verbatim.
 * When content_focus is provided (and no stimulus): anchors the generated passage to that topic.
 */
function buildScienceUserPrompt({
  teks_standard,
  grade_level,
  dok_level,
  question_type,
  previous_attempts = [],
  content_focus = null,
  stimulus = null,
  skill_focus = null,
  assessment_move = null,
}) {
  const teksDescription = TEKS_SCIENCE_LABELS[teks_standard] ?? null;
  const dokDesc = SCIENCE_DOK_DESCRIPTORS[dok_level];

  const passageInstruction = buildSciencePassageInstruction({
    question_type,
    dok_level,
    content_focus,
    stimulus,
  });

  const avoidNote = buildScienceAvoidPreviousAttempts(previous_attempts);

  const focusNote = buildScienceFocusNote({
    content_focus,
    stimulus,
  });

  console.log(`[DEBUG] skill_focus for ${teks_standard}:`, skill_focus);
  console.log(`[DEBUG] assessment_move for ${assessment_move}:`, assessment_move);

  const promptParts = [
    buildScienceHeader({
      teks_standard,
      teksDescription,
      grade_level,
      dok_level,
      dokDesc,
      question_type,
      skill_focus,
      assessment_move,
    }),

    SCIENCE_TASK_MODEL_RULES,

    SCIENCE_BASE_ALIGNMENT_RULES,

    content_focus ? SCIENCE_CONTENT_FOCUS_RULES : "",

    stimulus || content_focus || question_type !== "multiple_choice"
      ? SCIENCE_STIMULUS_DESIGN_RULES
      : "",

    stimulus || content_focus || question_type !== "multiple_choice"
      ? SCIENCE_SAME_STIMULUS_DEPTH_RULES
      : "",

    SCIENCE_STIMULUS_USE_RULES,

    SCIENCE_QUESTION_CONSTRUCTION_RULES,

    getScienceDOKRules(dok_level),

    getScienceSkillFocusRules(skill_focus),

    getScienceAssessmentMoveRules(assessment_move),

    SCIENCE_VARIETY_RULES,

    stimulus || previous_attempts?.length > 0
      ? SCIENCE_SAME_STIMULUS_VARIETY_RULES
      : "",

    SCIENCE_ANSWER_CONSISTENCY_RULES,

    getScienceQuestionTypeRules({
      question_type,
      skill_focus,
    }),

    avoidNote,

    focusNote,

    `PASSAGE INSTRUCTION: ${passageInstruction}`,

    buildScienceOutputSchema({
      teks_standard,
      dok_level,
      question_type,
      buildAnswerFields,
      buildNextQuestionLogic,
    }),
  ];

  return promptParts.filter(Boolean).join("\n\n");
}
/**
 * Generates a single Science question via OpenAI structured JSON output.
 * Handles all supported question types.
 * Science questions use short scenario/experiment passages for hot_text and
 * constructed_response; standalone stems with embedded data for multiple_choice.
 *
 * Stimulus support:
 *   When stimulus is provided, skips question_bank + Redis and generates fresh.
 *   Stimulus questions are NOT saved to question_bank (they are session-specific).
 */
export async function generateScienceQuestion({ teks_standard, grade_level, dok_level, question_type, previous_attempts = [], 
  content_focus = null, stimulus = null,
  skill_focus = null, assessment_move=null }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = buildScienceSystemPrompt(grade_level);
  const userPrompt = buildScienceUserPrompt({
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    previous_attempts,
    content_focus,
    stimulus,
    skill_focus,
    assessment_move,
  });

  const MAX_ATTEMPTS = question_type === "hot_text" ? 4 : 3;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature:
        question_type === "hot_text"
          ? attempt === 1
            ? 0.3
            : 0.1
          : attempt === 1
          ? 0.7
          : attempt === 2
          ? 0.3
          : 0.1,
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

    // Build enrichedQuestion BEFORE branching — both stimulus and 
    // non-stimulus paths need quality validation on the same merged object
    const enrichedQuestion = {
      ...question,
      skill_focus,
      assessment_move,
    };

    const quality = validateQuestionQuality(enrichedQuestion);
    if (!quality.ok) {
      lastError = new Error(quality.errors.join(" "));
      console.warn(`[scienceGenerator] Quality validation failed on attempt ${attempt}/${MAX_ATTEMPTS}:`, quality.errors);
      continue;
    }
    // ── Stimulus questions: session-specific, skip question_bank + Redis ──────
    if (stimulus) {
      if (attempt > 1) {
        console.log(`[scienceGenerator] Stimulus generation succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`);
      }
      return { ...enrichedQuestion, source: "generated" };
    }
 // Non-stimulus: persist to question_bank and backfill Redis
    const questionBankId = await saveToQuestionBank({
      question: enrichedQuestion,
      teks_standard,
      grade_level,
      dok_level,
      question_type,
      subject: "Science",
    });

    const questionWithId = questionBankId
      ? { ...enrichedQuestion, question_bank_id: questionBankId }
      : enrichedQuestion;


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