// /app/api/v2/generators/ela.js

import {
  saveToQuestionBank,
  validateQuestionShape,
  validateELADok3MultipleChoiceRigor,
  buildAnswerFields,
  validateQuestionQuality,
  buildNextQuestionLogic,
} from "./shared";

import { setCachedQuestion } from "@/libs/redis-cache";
import OpenAI from "openai";
import { TEKS_LABELS } from "@/libs/constants/teksReadingMap";
import {
  buildELAAvoidPriorBankQuestions,
  buildELAQuestionBankMetadataInstructions,
} from "./elaQuestionBankPromptParts";
import {
  buildElaTeksClusterPassageRules,
  ELA_DOK_DESCRIPTORS,
  buildELAHeader,
  ELA_BASE_ALIGNMENT_RULES,
  ELA_STIMULUS_DESIGN_RULES,
  ELA_CONTENT_FOCUS_RULES,
  ELA_STORY_PLANNING_RULES,
  ELA_VARIETY_RULES,
  getELADOKRules,
  getELAQuestionTypeRules,
  getELASkillFocusRules,
  getELAAssessmentMoveRules,
  buildELAAvoidPreviousAttempts,
  buildELAOutputSchema,
  buildELAPassageInstruction,
  buildELAFocusNote,
  ELA_ANSWER_CONSISTENCY_RULES,
  ELA_SAME_PASSAGE_VARIETY_RULES,
  ELA_PLOT_ELEMENTS_RULES,
  ELA_GRADE_7_PLOT_RULES,
  ELA_GRADE_8_PLOT_RULES,
  ELA_POETRY_RULES,
  ELA_GRADE_6_POETRY_RULES,
  ELA_GRADE_7_POETRY_RULES,
  ELA_GRADE_8_POETRY_RULES,
  ELA_DRAMA_RULES,
  ELA_GRADE_4_5_DRAMA_RULES,
  ELA_GRADE_6_7_DRAMA_RULES,
  ELA_GRADE_8_DRAMA_RULES,
  ELA_GRADE_4_5_DRAMA_EXCERPT_MODEL,
  ELA_GRADE_8_DRAMA_EXCERPT_MODEL,
  ELA_INFORMATIONAL_TEXT_RULES,
  ELA_LANGUAGE_GRAMMAR_BOUNDARY_RULES,
} from "./elaPromptParts";

// ─────────────────────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────────────────────

function buildELASystemPrompt() {
  return `You are an expert Texas ELA curriculum specialist and assessment writer with deep knowledge of TEKS standards, STAAR format, and the incoming Student Success Tool assessment framework.

Your role is to generate high-quality, classroom-ready ELA assessment questions aligned to specific TEKS standards and Depth of Knowledge (DOK) levels.

CRITICAL RULES:
- Every question must be directly and explicitly aligned to the given TEKS standard.
- DOK level must be authentically reflected in cognitive demand — not just vocabulary.
- If a passage/stimulus is provided, use that exact passage and do not generate a new passage.
- If no passage/stimulus is provided and a passage is required, generate an original grade-appropriate passage.
- Multiple choice questions must have exactly 4 options. Only one is correct.
- Multi-select questions must have exactly 5 options. Exactly 2 or 3 are correct.
- Hot text questions require exact words, phrases, lines, stage directions, or sentences copied from the passage.
- Constructed response questions require a scoring rubric.
- Never reuse the same stem, target, or passage detail from previous_attempts provided.
- Return ONLY valid JSON. No markdown, no explanation, no preamble.`;
}

function buildELABankPassageSystemPrompt() {
  return `You are an expert Texas ELA curriculum specialist and passage writer.

Create one original, classroom-ready ELA reading stimulus aligned to the supplied TEKS, grade level, genre, and Content Focus.

CRITICAL RULES:
- Generate the passage only. Do not generate a question.
- Follow every separate component named in Content Focus.
- Return only valid JSON.
- Do not include markdown outside the passage string.`;
}
function buildELABankPassagePrompt({
  teks_standard,
  primary_teks = null,
  supported_teks = [],
  grade_level,
  content_focus,
  passage_format,
  title = null,
}) {
    const normalizedPrimaryTeks =
    typeof primary_teks === "string" && primary_teks.trim()
      ? primary_teks.trim()
      : teks_standard;

  const normalizedSupportedTeks = [
    ...new Set(
      (Array.isArray(supported_teks) ? supported_teks : [])
        .map((teks) => String(teks ?? "").trim())
        .filter((teks) => teks && teks !== normalizedPrimaryTeks),
    ),
  ];

  const teksClusterRules = buildElaTeksClusterPassageRules({
    primaryTeks: normalizedPrimaryTeks,
    supportedTeks: normalizedSupportedTeks,
  });

  const teksDescription = TEKS_LABELS[normalizedPrimaryTeks] ?? null;

  const isPlotElementsStandard = ["6.7C", "7.7C", "8.7C"].includes(
    normalizedPrimaryTeks,
  );

  const isGrade7PlotStandard = teks_standard === "7.7C";
  const isGrade8PlotStandard = teks_standard === "8.7C";

  const isPoetryStandard = ["6.8B", "7.8B", "8.8B"].includes(
    normalizedPrimaryTeks,
  );

  const isGrade6PoetryStandard = teks_standard === "6.8B";
  const isGrade7PoetryStandard = teks_standard === "7.8B";
  const isGrade8PoetryStandard = teks_standard === "8.8B";

  const isDramaStandard = ["4.9C", "5.9C", "6.8C", "7.8C", "8.8C"].includes(
    normalizedPrimaryTeks,
  );

  const isGrade45DramaStandard = ["4.9C", "5.9C"].includes(
    normalizedPrimaryTeks,
  );

  const isGrade67DramaStandard = ["6.8C", "7.8C"].includes(
    normalizedPrimaryTeks,
  );

  const isGrade8DramaStandard = teks_standard === "8.8C";

  const promptParts = [
    `ELA PASSAGE-BANK DRAFT
    
    Primary TEKS: ${normalizedPrimaryTeks}
    Supporting TEKS: ${
      normalizedSupportedTeks.length > 0
        ? normalizedSupportedTeks.join(", ")
        : "none"
    }
    Grade Level: ${grade_level}
    Passage Format: ${passage_format || "appropriate ELA stimulus"}
    ${title ? `Required Title: "${title}"` : ""}
    Content Focus: ${content_focus || "Create a focused passage aligned to the primary TEKS."},
      teksClusterRules,
      ELA_BASE_ALIGNMENT_RULES,

    TEKS: ${teks_standard}
    ${teksDescription ? `TEKS Description: ${teksDescription}` : ""}
    Grade Level: ${grade_level}
    Passage Format: ${passage_format || "appropriate ELA stimulus"}
    ${title ? `Required Title: "${title}"` : ""}
    Content Focus: ${content_focus || "Create a focused passage aligned to the TEKS."}`,
    teksClusterRules,

    ELA_BASE_ALIGNMENT_RULES,

    content_focus ? ELA_CONTENT_FOCUS_RULES : "",
    content_focus ? ELA_STORY_PLANNING_RULES : "",

    ELA_STIMULUS_DESIGN_RULES,

    isPlotElementsStandard ? ELA_PLOT_ELEMENTS_RULES : "",
    isGrade7PlotStandard ? ELA_GRADE_7_PLOT_RULES : "",
    isGrade8PlotStandard ? ELA_GRADE_8_PLOT_RULES : "",

    isPoetryStandard ? ELA_POETRY_RULES : "",
    isGrade6PoetryStandard ? ELA_GRADE_6_POETRY_RULES : "",
    isGrade7PoetryStandard ? ELA_GRADE_7_POETRY_RULES : "",
    isGrade8PoetryStandard ? ELA_GRADE_8_POETRY_RULES : "",

    isDramaStandard ? ELA_DRAMA_RULES : "",
    isGrade45DramaStandard ? ELA_GRADE_4_5_DRAMA_RULES : "",
    isGrade67DramaStandard ? ELA_GRADE_6_7_DRAMA_RULES : "",
    isGrade8DramaStandard ? ELA_GRADE_8_DRAMA_RULES : "",

    /*
     * Do not include the long excerpt models here initially.
     * tests suggests the focused rules work better without them.
     */

    `Before returning the passage, verify that every separate component named in Content Focus appears as a distinct story or text element.`,

    `Return exactly this JSON shape:
{
  "title": "<exact passage title>",
  "passage": "<complete passage text with all required formatting preserved>"
}`,
  ];


  return promptParts.filter(Boolean).join("\n\n");
}

/**
 * Adds question-type-specific rigor rules that are not captured by the
 * general DOK or multiple-choice instructions.
 *
 * DOK 3 multiple-choice questions must require analysis or evaluation.
 * They must not become literal event-identification questions simply
 * because the answer is presented through four options.
 */
function buildELAMultipleChoiceDokRules({
  question_type,
  dok_level,
  assessment_move,
}) {
  if (question_type !== "multiple_choice" || Number(dok_level) !== 3) {
    return "";
  }

  return `DOK 3 MULTIPLE-CHOICE REQUIREMENTS:

- The student must analyze, justify, or evaluate—not merely identify an event, detail, decision, or outcome.
- The question must require reasoning across at least two relevant passage details, scenes, events, structural elements, or interpretations.
- Do not write a stem that supplies the complete analysis and then asks the student to locate the matching event.
- Do not ask only what happened, what decision was made, which event occurred, or how the story ended.
- The correct option must state a complete analytical relationship that directly performs the required assessment move: ${assessment_move || "the selected assessment move"}.
- The correct option must explain both WHAT happens and HOW or WHY it develops the dramatic action, conflict, tension, revelation, character understanding, or resolution.
- Each distractor must also be a complete analytical statement, not a short literal detail placed beside one obviously more developed correct answer.
- Distractors should represent plausible but incorrect interpretations, such as:
  - using the wrong cause-and-effect relationship;
  - connecting the correct scenes for the wrong reason;
  - accurately describing one event but misinterpreting its dramatic function;
  - overstating or understating how a detail affects later action.
- Keep all four answer choices reasonably parallel in length, detail, grammar, and complexity.
- The correct answer must not be identifiable merely because it is longer, more specific, or the only option containing reasoning.
- A student who reads only the final scene or one obvious line should not be able to answer correctly.
- Before returning JSON, verify that the correct option could not be reduced to a DOK 1 or DOK 2 response without losing the reasoning required by the stem.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────────────────────────────────────

function buildELAUserPrompt({
  teks_standard,
  grade_level,
  dok_level,
  question_type,
  previous_attempts = [],
  prior_bank_questions = [],
  content_focus = null,
  stimulus = null,
  skill_focus = null,
  assessment_move = null,
  title = null,
  passage_format = null,
  generation_mode = null,
}) {
  const teksDescription = TEKS_LABELS[teks_standard] ?? null;
  const dokDesc =
    ELA_DOK_DESCRIPTORS[Number(dok_level)] ?? ELA_DOK_DESCRIPTORS[1];

  const hasStimulus = typeof stimulus === "string" && stimulus.length > 0;
  const hasContentFocus =
    typeof content_focus === "string" && content_focus.trim().length > 0;
  const isQuestionBankQuestion = generation_mode === "question_bank_question";

  const passageInstruction = buildELAPassageInstruction({
    question_type,
    dok_level,
    content_focus,
    stimulus,
    title,
  });

  console.log(`[DEBUG] skill_focus for ${teks_standard}:`, skill_focus);
  console.log(
    `[DEBUG] assessment_move for ${assessment_move}:`,
    assessment_move,
  );

  const isPlotElementsStandard = ["6.7C", "7.7C", "8.7C"].includes(
    teks_standard,
  );
  const isGrade7PlotStandard = teks_standard === "7.7C";
  const isGrade8PlotStandard = teks_standard === "8.7C";

  const isPoetryStandard = ["6.8B", "7.8B", "8.8B"].includes(
    teks_standard,
  );
  const isGrade6PoetryStandard = teks_standard === "6.8B";
  const isGrade7PoetryStandard = teks_standard === "7.8B";
  const isGrade8PoetryStandard = teks_standard === "8.8B";

  const isDramaStandard = ["4.9C", "5.9C", "6.8C", "7.8C", "8.8C"].includes(
    teks_standard,
  );
  const isGrade45DramaStandard = ["4.9C", "5.9C"].includes(
    teks_standard,
  );
  const isGrade67DramaStandard = ["6.8C", "7.8C"].includes(
    teks_standard,
  );
  const isGrade8DramaStandard = teks_standard === "8.8C";

  const isInformationalSkill =
    [
      "central_idea",
      "supporting_details",
      "text_structure",
      "informational_structure",
      "author_purpose",
      "craft_analysis",
      "compare_perspectives",
      "compare_contrast",
      "argument_claim",
      "claim_evidence",
      "argument_evidence",
      "inquiry_reasoning",
    ].includes(skill_focus) &&
    !isPoetryStandard &&
    !isDramaStandard;

  const isGrammarOrLanguageSkill = [
    "language_conventions",
    "grammar_usage",
    "sentence_structure",
    "revision_editing",
  ].includes(skill_focus);

  const shouldIncludeGeneratedPassageRules =
    !hasStimulus &&
    (hasContentFocus ||
      question_type === "hot_text" ||
      question_type === "constructed_response" ||
      question_type === "multi_select" ||
      isPlotElementsStandard ||
      isPoetryStandard ||
      isDramaStandard ||
      isInformationalSkill);

  const promptParts = [
    buildELAHeader({
      teks_standard,
      teksDescription,
      grade_level,
      dok_level,
      dokDesc,
      question_type,
      skill_focus,
      assessment_move,
    }),

    ELA_BASE_ALIGNMENT_RULES,

    hasContentFocus ? ELA_CONTENT_FOCUS_RULES : "",
    !hasStimulus && hasContentFocus ? ELA_STORY_PLANNING_RULES : "",

    // Only use passage-generation/design rules when the model is expected to
    // create a passage. If stimulus exists, the model should generate question only.
    shouldIncludeGeneratedPassageRules ? ELA_STIMULUS_DESIGN_RULES : "",

    // Passage-generation genre rules. These are intentionally suppressed when
    // stimulus is provided from passage_bank.
    !hasStimulus && isPlotElementsStandard ? ELA_PLOT_ELEMENTS_RULES : "",
    !hasStimulus && isGrade7PlotStandard ? ELA_GRADE_7_PLOT_RULES : "",
    !hasStimulus && isGrade8PlotStandard ? ELA_GRADE_8_PLOT_RULES : "",

    !hasStimulus && isPoetryStandard ? ELA_POETRY_RULES : "",
    !hasStimulus && isGrade6PoetryStandard ? ELA_GRADE_6_POETRY_RULES : "",
    !hasStimulus && isGrade7PoetryStandard ? ELA_GRADE_7_POETRY_RULES : "",
    !hasStimulus && isGrade8PoetryStandard ? ELA_GRADE_8_POETRY_RULES : "",

    !hasStimulus && isDramaStandard ? ELA_DRAMA_RULES : "",
    !hasStimulus && isGrade45DramaStandard ? ELA_GRADE_4_5_DRAMA_RULES : "",
    !hasStimulus && isGrade67DramaStandard ? ELA_GRADE_6_7_DRAMA_RULES : "",
    !hasStimulus && isGrade8DramaStandard ? ELA_GRADE_8_DRAMA_RULES : "",
    !hasStimulus && isGrade45DramaStandard
      ? ELA_GRADE_4_5_DRAMA_EXCERPT_MODEL
      : "",
    !hasStimulus && isGrade8DramaStandard
      ? ELA_GRADE_8_DRAMA_EXCERPT_MODEL
      : "",

    !hasStimulus && isInformationalSkill ? ELA_INFORMATIONAL_TEXT_RULES : "",

    isGrammarOrLanguageSkill ? ELA_LANGUAGE_GRAMMAR_BOUNDARY_RULES : "",

    getELADOKRules(dok_level),

    buildELAMultipleChoiceDokRules({
      question_type,
      dok_level,
      assessment_move,
    }),

    getELASkillFocusRules({
      skill_focus,
      teks_standard,
    }),

    getELAAssessmentMoveRules(assessment_move),

    ELA_VARIETY_RULES,

    hasStimulus ||
    previous_attempts?.length > 0 ||
    prior_bank_questions?.length > 0
      ? ELA_SAME_PASSAGE_VARIETY_RULES
      : "",

    ELA_ANSWER_CONSISTENCY_RULES,

    getELAQuestionTypeRules({
      question_type,
      teks_standard,
      skill_focus,
      assessment_move,
    }),

    isQuestionBankQuestion
      ? buildELAAvoidPriorBankQuestions(prior_bank_questions)
      : buildELAAvoidPreviousAttempts(previous_attempts),

    buildELAQuestionBankMetadataInstructions({
      generationMode: generation_mode,
      passageFormat: passage_format,
    }),

    buildELAAvoidPriorBankQuestions(prior_bank_questions),

    buildELAQuestionBankMetadataInstructions({
      generationMode: generation_mode,

      passageFormat: passage_format,
    }),

    buildELAFocusNote({
      content_focus,
      stimulus,
    }),

    `PASSAGE INSTRUCTION: ${passageInstruction}`,

    buildELAOutputSchema({
      teks_standard,
      dok_level,
      question_type,
      buildAnswerFields,
      buildNextQuestionLogic,
    }),
  ];

  return promptParts.filter(Boolean).join("\n\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// ELA Question Generator
// ─────────────────────────────────────────────────────────────────────────────

export async function generateELAQuestion({
  teks_standard,
  primary_teks = null,
  supported_teks = [],
  grade_level,
  dok_level,
  question_type,
  previous_attempts = [],
  content_focus = null,
  content_focus_key = null,
  stimulus = null,
  skill_focus = null,
  assessment_move = null,
  title = null,

  passage_format = null,
  generation_mode = null,
  prior_bank_questions = [],
}) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (generation_mode === "question_bank_passage") {
    const systemPrompt = buildELABankPassageSystemPrompt();

    const userPrompt = buildELABankPassagePrompt({
      teks_standard,
      primary_teks,
      supported_teks,
      grade_level,
      content_focus,
      passage_format,
      title,
    });

    const MAX_PASSAGE_ATTEMPTS = 3;
    let lastPassageError;

    for (let attempt = 1; attempt <= MAX_PASSAGE_ATTEMPTS; attempt += 1) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: attempt === 1 ? 0.7 : attempt === 2 ? 0.35 : 0.15,

        response_format: {
          type: "json_object",
        },

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      });

      const raw = response.choices[0]?.message?.content;

      let generatedPassage;

      try {
        generatedPassage = JSON.parse(raw);
      } catch {
        lastPassageError = new Error(
          "OpenAI returned invalid JSON for ELA passage generation.",
        );

        console.warn(
          `[elaGenerator] Bank passage JSON parse failed on attempt ${attempt}/${MAX_PASSAGE_ATTEMPTS}`,
        );

        continue;
      }

      const generatedTitle =
        typeof generatedPassage?.title === "string"
          ? generatedPassage.title.trim()
          : "";

      const passage =
        typeof generatedPassage?.passage === "string"
          ? generatedPassage.passage.trim()
          : "";

      if (!generatedTitle || !passage) {
        lastPassageError = new Error(
          "ELA bank passage generation returned an empty title or passage.",
        );

        console.warn(
          `[elaGenerator] Bank passage validation failed on attempt ${attempt}/${MAX_PASSAGE_ATTEMPTS}`,
        );

        continue;
      }

      return {
        title: generatedTitle,
        passage,
        stimulus: passage,
        source: "generated",
        generation_mode: "question_bank_passage",
      };
    }

    throw new Error(
      `ELA passage-bank draft generation failed after ${MAX_PASSAGE_ATTEMPTS} attempts. Last error: ${lastPassageError?.message}`,
    );
  }

  const normalizedDok = Math.max(1, Math.min(3, Number(dok_level) || 1));
  const hasStimulus = typeof stimulus === "string" && stimulus.length > 0;
  const hasContentFocus =
    typeof content_focus === "string" && content_focus.trim().length > 0;

  const systemPrompt = buildELASystemPrompt();

  const userPrompt = buildELAUserPrompt({
    teks_standard,
    grade_level,
    dok_level: normalizedDok,
    question_type,

    previous_attempts: Array.isArray(previous_attempts)
      ? previous_attempts
      : [],

    prior_bank_questions:
      generation_mode === "question_bank_question" &&
      Array.isArray(prior_bank_questions)
        ? prior_bank_questions
        : [],

    content_focus,
    stimulus,
    skill_focus,
    assessment_move,
    title,
    passage_format,
    generation_mode,
  });
  const isPoetryStandard = ["6.8B", "7.8B", "8.8B"].includes(teks_standard);

  const MAX_ATTEMPTS =
    question_type === "hot_text" ? 4 : isPoetryStandard ? 5 : 3;

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
      lastError = new Error(
        "OpenAI returned invalid JSON for question generation.",
      );
      console.warn(
        `[elaGenerator] JSON parse failed on attempt ${attempt}/${MAX_ATTEMPTS}`,
      );
      continue;
    }

    // If a reviewed/cached stimulus was provided, freeze the passage to the
    // exact session stimulus before shape/quality validation.
    if (hasStimulus) {
      question = {
        ...question,
        passage: stimulus,
      };
    }

    try {
      validateQuestionShape(question, question_type);
      validateELADok3MultipleChoiceRigor(question);
    } catch (validationErr) {
      lastError = validationErr;
      console.warn(
        `[elaGenerator] Validation failed on attempt ${attempt}/${MAX_ATTEMPTS}: ${validationErr.message}`,
      );
      continue;
    }

    const normalizedDramaticFunction =
      generation_mode === "question_bank_question" &&
      passage_format === "drama" &&
      typeof question.dramatic_function === "string"
        ? question.dramatic_function.trim() || null
        : null;

    const normalizedTargetScene =
      generation_mode === "question_bank_question" &&
      passage_format === "drama" &&
      typeof question.target_scene === "string"
        ? question.target_scene.trim() || null
        : null;

    const requiresDramaBankMetadata =
      generation_mode === "question_bank_question" &&
      passage_format === "drama";

    if (
      requiresDramaBankMetadata &&
      (!normalizedDramaticFunction || !normalizedTargetScene)
    ) {
      lastError = new Error(
        "Drama passage-bank questions require dramatic_function and target_scene.",
      );

      console.warn(
        `[elaGenerator] Missing drama bank metadata on attempt ${attempt}/${MAX_ATTEMPTS}`,
        {
          dramatic_function: normalizedDramaticFunction,

          target_scene: normalizedTargetScene,
        },
      );

      continue;
    }

    const enrichedQuestion = {
      ...question,

      teks_standard,

      dok_level: question.dok_level ?? normalizedDok,

      question_type: question.question_type ?? question_type,

      passage: hasStimulus ? stimulus : question.passage,

      skill_focus,
      assessment_move,

      ...(requiresDramaBankMetadata
        ? {
            dramatic_function: normalizedDramaticFunction,

            target_scene: normalizedTargetScene,
          }
        : {}),

      ...(content_focus_key
        ? {
            content_focus_key,
          }
        : {}),

      generation_mode,
    };

    const quality = validateQuestionQuality(enrichedQuestion);

    if (!quality.ok) {
      lastError = new Error(quality.errors.join(" "));
      console.warn(
        `[elaGenerator] Quality validation failed on attempt ${attempt}/${MAX_ATTEMPTS}:`,
        quality.errors,
      );
      continue;
    }

    // Provided stimulus path:
    // - Do not save to generic question_bank.
    // - Do not write to Redis.
    // - The question is generated from the reviewed cached passage.
    if (hasStimulus) {
      if (attempt > 1) {
        console.log(
          `[elaGenerator] ELA question from provided stimulus succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`,
        );
      }

      return {
        ...enrichedQuestion,
        source: "generated",
      };
    }

    // Content-focus path:
    // - This may be a free textarea content_focus later.
    // - Do not save content-focused generated questions into the generic bank/cache,
    //   because they are tied to a teacher-specific topic/context.
    if (hasContentFocus) {
      if (attempt > 1) {
        console.log(
          `[elaGenerator] ELA content-focus generation succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`,
        );
      }

      return {
        ...enrichedQuestion,
        source: "generated",
      };
    }

    // Generic no-stimulus/no-content-focus path:
    // - Safe to persist to question_bank and Redis.
    const questionBankId = await saveToQuestionBank({
      question: enrichedQuestion,
      teks_standard,
      grade_level,
      dok_level: normalizedDok,
      question_type,
      subject: "ELA",
    });

    const questionWithId = questionBankId
      ? { ...enrichedQuestion, question_bank_id: questionBankId }
      : enrichedQuestion;

    try {
      await setCachedQuestion(
        teks_standard,
        normalizedDok,
        grade_level,
        question_type,
        questionWithId,
      );
    } catch (cacheErr) {
      console.warn(
        "[elaGenerator] Redis write after generation failed (non-fatal):",
        cacheErr.message,
      );
    }

    if (attempt > 1) {
      console.log(
        `[elaGenerator] ELA generation succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`,
      );
    }

    return {
      ...questionWithId,
      source: "generated",
    };
  }

  throw new Error(
    `Question generation failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message}`,
  );
}
