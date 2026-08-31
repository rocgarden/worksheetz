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
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
      value.map((item) => normalizeOptionalString(item)).filter(Boolean),
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
    normalizeOptionalString(generatedResult.generated_stimulus) ||
    normalizeOptionalString(generatedResult.generatedStimulus) ||
    normalizeOptionalString(generatedResult.data?.stimulus) ||
    normalizeOptionalString(generatedResult.data?.passage) ||
    normalizeOptionalString(generatedResult.question?.stimulus) ||
    normalizeOptionalString(generatedResult.question_json?.stimulus) ||
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
    normalizeOptionalString(generatedResult.passage_title) ||
    normalizeOptionalString(generatedResult.passageTitle) ||
    normalizeOptionalString(generatedResult.data?.title) ||
    normalizeOptionalString(generatedResult.data?.passage_title) ||
    normalizeOptionalString(generatedResult.question?.passage_title) ||
    normalizeOptionalString(generatedResult.question_json?.passage_title) ||
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
function extractStringMetadata(generatedResult, questionJson, keys) {
  for (const key of keys) {
    const topLevelValue = normalizeOptionalString(generatedResult?.[key]);

    if (topLevelValue) {
      return topLevelValue;
    }

    const dataValue = normalizeOptionalString(generatedResult?.data?.[key]);

    if (dataValue) {
      return dataValue;
    }

    const questionValue = normalizeOptionalString(questionJson?.[key]);

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
function extractDokLevel(generatedResult, questionJson, fallbackDokLevel) {
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
    normalizeOptionalString(generatedResult?.question_type) ||
    normalizeOptionalString(generatedResult?.data?.question_type) ||
    normalizeOptionalString(questionJson?.question_type) ||
    normalizeOptionalString(questionJson?.type) ||
    fallbackQuestionType
  );
}

function extractHotTextCorrectTarget(questionJson) {
  if (!isPlainObject(questionJson)) {
    return {
      key: null,
      text: null,
    };
  }

  const targets = Array.isArray(questionJson.hot_text_targets)
    ? questionJson.hot_text_targets
    : [];

  const correctAnswerKeys = Array.isArray(questionJson.correct_answer)
    ? questionJson.correct_answer
        .map((value) => normalizeOptionalString(String(value ?? "")))
        .filter(Boolean)
    : [
        normalizeOptionalString(String(questionJson.correct_answer ?? "")),
      ].filter(Boolean);

  const correctTarget = targets.find((target) => {
    if (!isPlainObject(target)) {
      return false;
    }

    const targetId = normalizeOptionalString(target.id);

    return (
      target.is_correct === true ||
      (targetId && correctAnswerKeys.includes(targetId))
    );
  });

  if (!correctTarget) {
    return {
      key: correctAnswerKeys[0] || null,

      text: null,
    };
  }

  return {
    key:
      normalizeOptionalString(correctTarget.id) || correctAnswerKeys[0] || null,

    text: normalizeOptionalString(correctTarget.text),
  };
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
  requestedTeksStandard,
  requestedQuestionType,
  requestedDokLevel,
}) {
  const questionType = extractQuestionType(
    generatedResult,
    questionJson,
    requestedQuestionType,
  );

  const hotTextCorrectTarget =
    questionType === "hot_text"
      ? extractHotTextCorrectTarget(questionJson)
      : {
          key: null,
          text: null,
        };
  return {
    teks_standard: requestedTeksStandard,

    question_type: questionType,

    dok_level: extractDokLevel(
      generatedResult,
      questionJson,
      requestedDokLevel,
    ),

    skill_focus: extractStringMetadata(generatedResult, questionJson, [
      "skill_focus",
      "skillFocus",
    ]),

    assessment_move: extractStringMetadata(generatedResult, questionJson, [
      "assessment_move",
      "assessmentMove",
    ]),

    dramatic_function: extractStringMetadata(generatedResult, questionJson, [
      "dramatic_function",
      "dramaticFunction",
    ]),

    target_scene: extractStringMetadata(generatedResult, questionJson, [
      "target_scene",
      "targetScene",
    ]),

    correct_target_text:
      extractStringMetadata(generatedResult, questionJson, [
        "correct_target_text",
        "correctTargetText",
      ]) || hotTextCorrectTarget.text,

    correct_target_key:
      extractStringMetadata(generatedResult, questionJson, [
        "correct_target_key",
        "correctTargetKey",
      ]) || hotTextCorrectTarget.key,

    question_json: {
      ...questionJson,

      teks_standard: requestedTeksStandard,
    },

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
function buildPriorBankQuestionSummary(generatedQuestions) {
  return generatedQuestions.map((question) => {
    const questionJson = isPlainObject(question?.question_json)
      ? question.question_json
      : {};

    const correctAnswer = questionJson.correct_answer;

    const answerOptions = Array.isArray(questionJson.answer_options)
      ? questionJson.answer_options
      : [];

    const correctAnswerText =
      typeof correctAnswer === "string"
        ? (answerOptions.find((option) => option?.id === correctAnswer)?.text ??
          null)
        : null;

    return {
      question_type: question.question_type,

      dok_level: question.dok_level,

      skill_focus: question.skill_focus ?? questionJson.skill_focus ?? null,

      assessment_move:
        question.assessment_move ?? questionJson.assessment_move ?? null,

      dramatic_function:
        question.dramatic_function ?? questionJson.dramatic_function ?? null,

      target_scene: question.target_scene ?? questionJson.target_scene ?? null,

      stem: normalizeOptionalString(questionJson.stem),

      correct_answer_text: normalizeOptionalString(correctAnswerText),

      explanation: normalizeOptionalString(questionJson.explanation),

      correct_target_key:
        question.correct_target_key ?? questionJson.correct_target_key ?? null,

      correct_target_text:
        question.correct_target_text ??
        questionJson.correct_target_text ??
        null,
    };
  });
}

function normalizePriorBankQuestions(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isPlainObject).map((question) => ({
    question_type:
      normalizeOptionalString(question.question_type) ||
      normalizeOptionalString(question.question_json?.question_type),

    dok_level: [1, 2, 3].includes(
      Number(question.dok_level ?? question.question_json?.dok_level),
    )
      ? Number(question.dok_level ?? question.question_json?.dok_level)
      : null,

    skill_focus: normalizeOptionalString(question.skill_focus),

    assessment_move: normalizeOptionalString(question.assessment_move),

    dramatic_function: normalizeOptionalString(question.dramatic_function),

    target_scene: normalizeOptionalString(question.target_scene),

    correct_target_key: normalizeOptionalString(question.correct_target_key),

    correct_target_text: normalizeOptionalString(question.correct_target_text),

    stem: normalizeOptionalString(question.question_json?.stem),
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
  primaryTeks = null,
  supportedTeks = [],
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

    primary_teks: primaryTeks ?? teksStandard,
    supported_teks: supportedTeks,

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

    generation_mode: "question_bank_passage",

    admin_generation: true,

    ...generatorOptions,
  });
}

async function generateElaQuestion({
  gradeLevel,
  teksStandard,
  primaryTeks = null,
  supportedTeks = [],
  passageFormat,
  contentFocus,
  contentFocusKey,
  testingWindow,
  stimulus,
  instruction,
  priorQuestions,
  generatorOptions,
  title,
}) {
  return adaptiveQuestionGenerator({
    subject: "ELA",

    grade_level: gradeLevel,
    teks_standard: teksStandard,
        // Individual question TEKS
    teks_standard: teksStandard,

    // Whole package TEKS context
    primary_teks: primaryTeks ?? teksStandard,

    supported_teks: supportedTeks,

    question_type: instruction.question_type,

    dok_level: instruction.dok_level,

    passage_format: passageFormat,

    content_focus: contentFocus,

    content_focus_key: contentFocusKey,

    testing_window: testingWindow,

    // stimulus,

    title,
    /*
     * These flags identify internal editorial generation rather than a
     * normal live student-session request.
     *
     * The existing generator may initially ignore them.
     */

    /*
     * This supports future prompt-level repetition prevention.
     */
    ...generatorOptions,

    generation_mode: "question_bank_question",

    admin_generation: true,

    stimulus,

    prior_bank_questions: buildPriorBankQuestionSummary(priorQuestions),
    /*
     * Optional extra values from the dispatcher or future admin UI.
     *
     * Place these last so subject-specific administrative options can be
     * added without changing this file's function signature.
     */
    // ...generatorOptions,
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

  primaryTeks = teksStandard,
  supportedTeks = [],
  passageFamily = null,
  questionTeksPlan = [],

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

  const normalizedPrimaryTeks = String(
    primaryTeks || teksStandard || "",
  ).trim();

  if (!normalizedPrimaryTeks) {
    throw new Error("ELA bank generator requires a primary TEKS.");
  }

  const normalizedSupportedTeks = Array.isArray(supportedTeks)
    ? [
        ...new Set(
          supportedTeks
            .map((value) => String(value ?? "").trim())
            .filter(Boolean),
        ),
      ]
    : [];

  const normalizedPassageFamily = normalizeOptionalString(passageFamily);

  const normalizedQuestionTeksPlan = Array.isArray(questionTeksPlan)
    ? questionTeksPlan
        .map((row) => ({
          teks_standard: String(row?.teks_standard ?? "").trim(),

          count: Number(row?.count ?? 0),
        }))
        .filter(
          (row) =>
            row.teks_standard && Number.isInteger(row.count) && row.count > 0,
        )
    : [];

  const expandedQuestionTeks = normalizedQuestionTeksPlan.flatMap((row) =>
    Array.from(
      {
        length: row.count,
      },
      () => row.teks_standard,
    ),
  );

  if (
    expandedQuestionTeks.length > 0 &&
    expandedQuestionTeks.length !== expandedQuestionPlan.length
  ) {
    throw new Error(
      `ELA questionTeksPlan contains ${expandedQuestionTeks.length} questions, but expandedQuestionPlan contains ${expandedQuestionPlan.length}.`,
    );
  }

  const existingStimulus = normalizeOptionalString(
    generatorOptions?.existing_stimulus,
  );

  const existingPriorQuestions = normalizePriorBankQuestions(
    generatorOptions?.prior_bank_questions,
  );

  const generatedQuestions = [];

  const generationPlan = expandedQuestionPlan.map((instruction, index) => ({
    ...instruction,

    teks_standard: expandedQuestionTeks[index] || normalizedPrimaryTeks,
  }));
  /*
   * ------------------------------------------------------------
   * 1. Generate the reusable passage separately
   * ------------------------------------------------------------
   */

  let generatedPassageResult = null;

  let sharedStimulus = existingStimulus;
  console.log(
  "[ELA BANK GENERATED PASSAGE]\n",
  sharedStimulus,
);

  if (!sharedStimulus) {
    generatedPassageResult = await generateElaPassage({
      gradeLevel,
      primaryTeks: normalizedPrimaryTeks,
      supportedTeks: normalizedSupportedTeks,
      teksStandard: normalizedPrimaryTeks,

      passageFormat,
      contentFocus,
      contentFocusKey,
      title,
      generatorOptions,
    });

    sharedStimulus = extractStimulus(generatedPassageResult);
  }
  console.log(
  "[ELA BANK GENERATED PASSAGE]\n",
  sharedStimulus,
);

  if (!sharedStimulus) {
    throw new Error(
      "ELA bank generator requires either an existing stimulus or a newly generated reusable passage.",
    );
  }

  const generatedPassageTitle =
    normalizeOptionalString(title) ||
    extractGeneratedTitle(generatedPassageResult) ||
    `${normalizedPrimaryTeks} ${passageFormat} draft`;
  /*
   * ------------------------------------------------------------
   * 2. Generate every question from the frozen passage
   * ------------------------------------------------------------
   */

  for (let index = 0; index < generationPlan.length; index += 1) {
    const instruction = generationPlan[index];

    const questionTeksStandard =
      instruction.teks_standard || normalizedPrimaryTeks;

    const generatedResult = await generateElaQuestion({
      gradeLevel,

      // The TEKS assigned to this individual question
      teksStandard: questionTeksStandard,

      // The main TEKS for the full passage package
      primaryTeks: normalizedPrimaryTeks,

      // The other TEKS supported by the shared passage
      supportedTeks: normalizedSupportedTeks,

      passageFormat,
      contentFocus,
      contentFocusKey,
      testingWindow,
      title,

      stimulus: sharedStimulus,

      instruction,

      priorQuestions: [...existingPriorQuestions, ...generatedQuestions],

      generatorOptions,
    });

    const questionJson = extractQuestionJson(generatedResult);

    if (!questionJson) {
      throw new Error(
        `ELA generator did not return usable question_json for question index ${index}.`,
      );
    }

    generatedQuestions.push(
      buildDraftQuestion({
        generatedResult,
        questionJson,

        requestedTeksStandard: questionTeksStandard,

        requestedQuestionType: instruction.question_type,

        requestedDokLevel: instruction.dok_level,
      }),
    );
  }

  const normalizedSkillTags = normalizeStringArray(skillTags);

  return {
    passage: {
      subject: "ELA",
      grade_level: gradeLevel,
      teks_standard: normalizedPrimaryTeks,

      passage_format: passageFormat,

      content_focus_key: normalizeOptionalString(contentFocusKey),

      content_focus: normalizeOptionalString(contentFocus),

      title: generatedPassageTitle,

      passage: sharedStimulus,

      skill_tags: normalizedSkillTags,

      difficulty_level: difficultyLevel,

      // Human review must occur before publishing and activation.
      is_active: false,
    },

    questions: generatedQuestions,

    generation: {
      subject: "ELA",
      grade_level: gradeLevel,
      teks_standard: normalizedPrimaryTeks,
      primary_teks_standard: normalizedPrimaryTeks,

      supported_teks: normalizedSupportedTeks,

      passage_family: normalizedPassageFamily,

      question_teks_plan: normalizedQuestionTeksPlan,

      passage_format: passageFormat,

      content_focus_key: normalizeOptionalString(contentFocusKey),

      content_focus: normalizeOptionalString(contentFocus),

      question_plan: questionPlan,

      total_questions: generatedQuestions.length,

      shared_stimulus_reused: true,

      generated_as: existingStimulus
        ? "question_bank_add_question"
        : "question_bank_draft",

      used_existing_stimulus: Boolean(existingStimulus),

      prior_question_count: existingPriorQuestions.length,
    },
  };
}
