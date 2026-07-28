// /libs/adaptive/questionBank/generators/ela.js
//
// ELA-specific passage/question-bank draft generator.
//
// Called by:
// /libs/adaptive/questionBank/generators/index.js
//
// Reuses the existing:
// /libs/adaptive.js
//   → /app/api/v2/generators/adaptiveQuestionGenerator.js
//
// Responsibilities:
// - Generate the first ELA question and shared passage.
// - Reuse that same passage for all remaining questions.
// - Normalize generated questions into passage_question_bank draft rows.
// - Return one normalized passage/questions package.
//
// This file does not:
// - authenticate admins
// - validate final database rows
// - insert into passage_bank
// - insert into passage_question_bank
// - approve or activate generated content

import { adaptiveQuestionGenerator } from "@/libs/adaptive";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((item) => normalizeOptionalString(item))
        .filter(Boolean),
    ),
  ];
}

/**
 * Extracts question_json from the possible shapes returned by the existing
 * adaptiveQuestionGenerator.
 *
 * Adjust this helper later only if the existing generator returns a different
 * confirmed response shape.
 *
 * @param {unknown} generatedResult
 * @returns {object|null}
 */
function extractQuestionJson(generatedResult) {
  if (!isPlainObject(generatedResult)) {
    return null;
  }

  if (isPlainObject(generatedResult.question_json)) {
    return generatedResult.question_json;
  }

  if (isPlainObject(generatedResult.question)) {
    return generatedResult.question;
  }

  if (isPlainObject(generatedResult.data?.question_json)) {
    return generatedResult.data.question_json;
  }

  if (isPlainObject(generatedResult.data?.question)) {
    return generatedResult.data.question;
  }

  const appearsToBeQuestion =
    generatedResult.question_type ||
    generatedResult.type ||
    generatedResult.stem ||
    generatedResult.prompt ||
    generatedResult.options ||
    generatedResult.hot_text_targets;

  return appearsToBeQuestion ? generatedResult : null;
}

/**
 * Extracts the generated passage/stimulus.
 *
 * @param {unknown} generatedResult
 * @returns {string|null}
 */
function extractStimulus(generatedResult) {
  if (!isPlainObject(generatedResult)) {
    return null;
  }

  return (
    normalizeOptionalString(generatedResult.stimulus) ||
    normalizeOptionalString(generatedResult.passage) ||
    normalizeOptionalString(
      generatedResult.generated_stimulus,
    ) ||
    normalizeOptionalString(
      generatedResult.generatedStimulus,
    ) ||
    normalizeOptionalString(
      generatedResult.data?.stimulus,
    ) ||
    normalizeOptionalString(
      generatedResult.data?.passage,
    ) ||
    normalizeOptionalString(
      generatedResult.question?.stimulus,
    ) ||
    normalizeOptionalString(
      generatedResult.question_json?.stimulus,
    ) ||
    null
  );
}

/**
 * Extracts a passage title from the generator result when available.
 *
 * @param {unknown} generatedResult
 * @returns {string|null}
 */
function extractGeneratedTitle(generatedResult) {
  if (!isPlainObject(generatedResult)) {
    return null;
  }

  return (
    normalizeOptionalString(generatedResult.title) ||
    normalizeOptionalString(
      generatedResult.passage_title,
    ) ||
    normalizeOptionalString(
      generatedResult.passageTitle,
    ) ||
    normalizeOptionalString(
      generatedResult.data?.title,
    ) ||
    normalizeOptionalString(
      generatedResult.data?.passage_title,
    ) ||
    normalizeOptionalString(
      generatedResult.question?.passage_title,
    ) ||
    normalizeOptionalString(
      generatedResult.question_json?.passage_title,
    ) ||
    null
  );
}

/**
 * Reads metadata from the top-level result, nested data, or question_json.
 *
 * @param {object} generatedResult
 * @param {object} questionJson
 * @param {string[]} keys
 * @returns {string|null}
 */
function extractStringMetadata(
  generatedResult,
  questionJson,
  keys,
) {
  for (const key of keys) {
    const topLevelValue = normalizeOptionalString(
      generatedResult?.[key],
    );

    if (topLevelValue) {
      return topLevelValue;
    }

    const dataValue = normalizeOptionalString(
      generatedResult?.data?.[key],
    );

    if (dataValue) {
      return dataValue;
    }

    const questionValue = normalizeOptionalString(
      questionJson?.[key],
    );

    if (questionValue) {
      return questionValue;
    }
  }

  return null;
}

/**
 * Returns a valid generated DOK value or the requested fallback.
 *
 * @param {object} generatedResult
 * @param {object} questionJson
 * @param {number} fallbackDokLevel
 * @returns {number}
 */
function extractDokLevel(
  generatedResult,
  questionJson,
  fallbackDokLevel,
) {
  const possibleDokLevel = Number(
    generatedResult?.dok_level ??
      generatedResult?.data?.dok_level ??
      questionJson?.dok_level ??
      fallbackDokLevel,
  );

  return [1, 2, 3].includes(possibleDokLevel)
    ? possibleDokLevel
    : fallbackDokLevel;
}

/**
 * Returns the generated canonical question type when provided.
 *
 * @param {object} generatedResult
 * @param {object} questionJson
 * @param {string} fallbackQuestionType
 * @returns {string}
 */
function extractQuestionType(
  generatedResult,
  questionJson,
  fallbackQuestionType,
) {
  return (
    normalizeOptionalString(
      generatedResult?.question_type,
    ) ||
    normalizeOptionalString(
      generatedResult?.data?.question_type,
    ) ||
    normalizeOptionalString(
      questionJson?.question_type,
    ) ||
    normalizeOptionalString(questionJson?.type) ||
    fallbackQuestionType
  );
}

/**
 * Creates one draft passage_question_bank-shaped question object.
 *
 * The real passage_bank_id is assigned later by the protected publishing
 * route after the passage row is inserted.
 *
 * @param {object} params
 * @returns {object}
 */
function buildDraftQuestion({
  generatedResult,
  questionJson,
  requestedQuestionType,
  requestedDokLevel,
}) {
  return {
    question_type: extractQuestionType(
      generatedResult,
      questionJson,
      requestedQuestionType,
    ),

    dok_level: extractDokLevel(
      generatedResult,
      questionJson,
      requestedDokLevel,
    ),

    skill_focus: extractStringMetadata(
      generatedResult,
      questionJson,
      ["skill_focus", "skillFocus"],
    ),

    assessment_move: extractStringMetadata(
      generatedResult,
      questionJson,
      ["assessment_move", "assessmentMove"],
    ),

    dramatic_function: extractStringMetadata(
      generatedResult,
      questionJson,
      ["dramatic_function", "dramaticFunction"],
    ),

    target_scene: extractStringMetadata(
      generatedResult,
      questionJson,
      ["target_scene", "targetScene"],
    ),

    correct_target_text: extractStringMetadata(
      generatedResult,
      questionJson,
      ["correct_target_text", "correctTargetText"],
    ),

    correct_target_key: extractStringMetadata(
      generatedResult,
      questionJson,
      ["correct_target_key", "correctTargetKey"],
    ),

    question_json: questionJson,

    // AI-generated content always begins as an inactive draft.
    review_status: "draft",
    is_active: false,
    times_used: 0,
  };
}

/**
 * Builds a concise history of already-generated questions.
 *
 * Subject prompt builders may use this metadata to avoid repeating:
 * - evidence targets
 * - dramatic functions
 * - scenes
 * - question purposes
 *
 * The existing adaptiveQuestionGenerator may ignore this value until its
 * prompt builders are updated to consume it.
 *
 * @param {Array<object>} generatedQuestions
 * @returns {Array<object>}
 */
function buildPriorBankQuestionSummary(
  generatedQuestions,
) {
  return generatedQuestions.map((question) => ({
    question_type: question.question_type,
    dok_level: question.dok_level,
    skill_focus: question.skill_focus,
    assessment_move: question.assessment_move,
    dramatic_function:
      question.dramatic_function,
    target_scene: question.target_scene,
    correct_target_key:
      question.correct_target_key,
    correct_target_text:
      question.correct_target_text,
  }));
}

/**
 * Calls the existing adaptive generator for one ELA question.
 *
 * @param {object} params
 * @returns {Promise<object>}
 * 
 */

async function generateElaPassage({
  gradeLevel,
  teksStandard,
  passageFormat,
  contentFocus,
  contentFocusKey,
  title,
  generatorOptions,
}) {
  return adaptiveQuestionGenerator({
    subject: "ELA",

    grade_level: gradeLevel,
    teks_standard: teksStandard,

    /*
     * These values satisfy the existing adaptive dispatcher contract.
     * Passage-only mode does not use them in its focused prompt.
     */
    question_type: "multiple_choice",
    dok_level: 1,

    passage_format: passageFormat,

    content_focus: contentFocus,
    content_focus_key: contentFocusKey,

    title,

    stimulus: null,

    generation_mode:
      "question_bank_passage",

    admin_generation: true,

    ...generatorOptions,
  });
}

async function generateElaQuestion({
  gradeLevel,
  teksStandard,
  passageFormat,
  contentFocus,
  contentFocusKey,
  testingWindow,
  stimulus,
  instruction,
  priorQuestions,
  generatorOptions,
  title
}) {
  return adaptiveQuestionGenerator({
    subject: "ELA",

    grade_level: gradeLevel,
    teks_standard: teksStandard,

    question_type:
      instruction.question_type,

    dok_level:
      instruction.dok_level,

    passage_format:
      passageFormat,

    content_focus:
      contentFocus,

    content_focus_key:
      contentFocusKey,

    testing_window:
      testingWindow,

    stimulus,

    title,
    /*
     * These flags identify internal editorial generation rather than a
     * normal live student-session request.
     *
     * The existing generator may initially ignore them.
     */
generation_mode: "question_bank_question",
    admin_generation: true,

    /*
     * This supports future prompt-level repetition prevention.
     */
    prior_bank_questions:
      buildPriorBankQuestionSummary(priorQuestions),

    /*
     * Optional extra values from the dispatcher or future admin UI.
     *
     * Place these last so subject-specific administrative options can be
     * added without changing this file's function signature.
     */
    ...generatorOptions,
  });
}

/**
 * ELA subject generator used by the shared question-bank dispatcher.
 *
 * @param {{
 *   subject: "ELA",
 *   gradeLevel: string,
 *   teksStandard: string,
 *   passageFormat: string,
 *   contentFocus?: string|null,
 *   contentFocusKey?: string|null,
 *   title?: string|null,
 *   skillTags?: string[],
 *   difficultyLevel: number,
 *   testingWindow?: string|null,
 *   questionPlan: Array<object>,
 *   expandedQuestionPlan: Array<{
 *     question_type: string,
 *     dok_level: number,
 *     sequence: number
 *   }>,
 *   generatorOptions?: object
 * }} params
 *
 * @returns {Promise<{
 *   passage: {
 *     subject: string,
 *     grade_level: string,
 *     teks_standard: string,
 *     passage_format: string,
 *     content_focus_key: string|null,
 *     content_focus: string|null,
 *     title: string,
 *     passage: string,
 *     skill_tags: string[],
 *     difficulty_level: number,
 *     is_active: boolean
 *   },
 *   questions: Array<object>,
 *   generation: object
 * }>}
 */
export async function generateElaPassageQuestionBankDraft({
  subject,
  gradeLevel,
  teksStandard,
  passageFormat,

  contentFocus = null,
  contentFocusKey = null,

  title = null,
  skillTags = [],
  difficultyLevel = 2,
  testingWindow = null,

  questionPlan,
  expandedQuestionPlan,

  generatorOptions = {},
}) {
  if (subject !== "ELA") {
    throw new Error(
      `ELA bank generator received an invalid subject: ${subject}.`,
    );
  }

  if (
    !Array.isArray(expandedQuestionPlan) ||
    expandedQuestionPlan.length === 0
  ) {
    throw new Error(
      "ELA bank generator requires at least one expanded question instruction.",
    );
  }

  const generatedQuestions = [];
  /*
   * ------------------------------------------------------------
   * 1. Generate the reusable passage separately
   * ------------------------------------------------------------
   */

  const generatedPassageResult =
    await generateElaPassage({
      gradeLevel,
      teksStandard,
      passageFormat,
      contentFocus,
      contentFocusKey,
      title,
      generatorOptions,
    });

  const sharedStimulus =
    extractStimulus(
      generatedPassageResult,
    );

  if (!sharedStimulus) {
    throw new Error(
      "ELA bank passage generator did not return a reusable passage.",
    );
  }

  const generatedPassageTitle =
    normalizeOptionalString(title) ||
    extractGeneratedTitle(
      generatedPassageResult,
    ) ||
    `${teksStandard} ${passageFormat} draft`;

  /*
   * ------------------------------------------------------------
   * 2. Generate every question from the frozen passage
   * ------------------------------------------------------------
   */

  for (
    let index = 0;
    index < expandedQuestionPlan.length;
    index += 1
  ) {
    const instruction =
      expandedQuestionPlan[index];

    const generatedResult =
      await generateElaQuestion({
        gradeLevel,
        teksStandard,
        passageFormat,
        contentFocus,
        contentFocusKey,
        testingWindow,
        title,

        stimulus: sharedStimulus,

        instruction,

        priorQuestions:
          generatedQuestions,

        generatorOptions,
      });

    const questionJson =
      extractQuestionJson(
        generatedResult,
      );

    if (!questionJson) {
      throw new Error(
        `ELA generator did not return usable question_json for question index ${index}.`,
      );
    }

    generatedQuestions.push(
      buildDraftQuestion({
        generatedResult,
        questionJson,

        requestedQuestionType:
          instruction.question_type,

        requestedDokLevel:
          instruction.dok_level,
      }),
    );
  }

  const normalizedSkillTags =
    normalizeStringArray(skillTags);

  return {
    passage: {
      subject: "ELA",
      grade_level: gradeLevel,
      teks_standard: teksStandard,

      passage_format:
        passageFormat,

      content_focus_key:
        normalizeOptionalString(
          contentFocusKey,
        ),

      content_focus:
        normalizeOptionalString(
          contentFocus,
        ),

      title:
        generatedPassageTitle,

      passage:
        sharedStimulus,

      skill_tags:
        normalizedSkillTags,

      difficulty_level:
        difficultyLevel,

      // Human review must occur before publishing and activation.
      is_active: false,
    },

    questions:
      generatedQuestions,

    generation: {
      subject: "ELA",
      grade_level: gradeLevel,
      teks_standard: teksStandard,
      passage_format: passageFormat,

      question_plan:
        questionPlan,

      total_questions:
        generatedQuestions.length,

      shared_stimulus_reused:
        true,

      generated_as:
        "question_bank_draft",
    },
  };
}