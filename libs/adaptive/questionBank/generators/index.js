// /libs/adaptive/questionBank/generators/index.js
//
// Shared dispatcher for passage/question-bank draft generation.
//
// Responsibilities:
// - Normalize the requested subject.
// - Route generation to the correct subject-specific bank generator.
// - Enforce one shared input/output contract.
// - Keep the admin API route free of subject-specific generation logic.
//
// This file does not:
// - authenticate users
// - insert passage_bank rows
// - insert passage_question_bank rows
// - validate final database rows
// - review or approve generated content
// - call OpenAI directly

import { generateElaPassageQuestionBankDraft } from "./ela";
// import { generateSciencePassageQuestionBankDraft } from "./science";
// import { generateSocialStudiesPassageQuestionBankDraft } from "./socialStudies";
// import { generateMathPassageQuestionBankDraft } from "./math";

const SUBJECT_ALIASES = Object.freeze({
  ela: "ELA",
  english_language_arts: "ELA",
  english: "ELA",
  reading: "ELA",
  ela_reading: "ELA",

  science: "Science",

  social_studies: "Social Studies",
  socialstudies: "Social Studies",
  social: "Social Studies",
  history: "Social Studies",

  math: "Math",
  mathematics: "Math",
});

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
 * @returns {string|null}
 */
function normalizeSubject(value) {
  const subject = normalizeOptionalString(value);

  if (!subject) {
    return null;
  }

  const aliasKey = subject
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return SUBJECT_ALIASES[aliasKey] || subject;
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function normalizeDokLevel(value) {
  const dokLevel = Number(value);

  return [1, 2, 3].includes(dokLevel)
    ? dokLevel
    : null;
}

/**
 * Normalizes one question-plan entry.
 *
 * @param {unknown} item
 * @param {number} index
 * @returns {{
 *   question_type: string,
 *   dok_level: number,
 *   count: number
 * }}
 */
function normalizeQuestionPlanItem(item, index) {
  if (!isPlainObject(item)) {
    throw new Error(
      `questionPlan[${index}] must be an object.`,
    );
  }

  const questionType = normalizeOptionalString(
    item.question_type,
  );

  const dokLevel = normalizeDokLevel(
    item.dok_level,
  );

  const count = Number(item.count ?? 1);

  if (!questionType) {
    throw new Error(
      `questionPlan[${index}].question_type is required.`,
    );
  }

  if (!dokLevel) {
    throw new Error(
      `questionPlan[${index}].dok_level must be 1, 2, or 3.`,
    );
  }

  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 20
  ) {
    throw new Error(
      `questionPlan[${index}].count must be an integer from 1 to 20.`,
    );
  }

  return {
    question_type: questionType,
    dok_level: dokLevel,
    count,
  };
}

/**
 * @param {unknown} questionPlan
 * @returns {Array<{
 *   question_type: string,
 *   dok_level: number,
 *   count: number
 * }>}
 */
function normalizeQuestionPlan(questionPlan) {
  if (
    !Array.isArray(questionPlan) ||
    questionPlan.length === 0
  ) {
    throw new Error(
      "generatePassageQuestionBankDraft requires a non-empty questionPlan.",
    );
  }

  return questionPlan.map(
    normalizeQuestionPlanItem,
  );
}

/**
 * Expands grouped plan entries into one generation instruction per question.
 *
 * Example:
 *
 * [
 *   {
 *     question_type: "hot_text",
 *     dok_level: 2,
 *     count: 3
 *   }
 * ]
 *
 * becomes:
 *
 * [
 *   {
 *     question_type: "hot_text",
 *     dok_level: 2,
 *     sequence: 1
 *   },
 *   {
 *     question_type: "hot_text",
 *     dok_level: 2,
 *     sequence: 2
 *   },
 *   {
 *     question_type: "hot_text",
 *     dok_level: 2,
 *     sequence: 3
 *   }
 * ]
 *
 * @param {Array<object>} questionPlan
 * @returns {Array<{
 *   question_type: string,
 *   dok_level: number,
 *   sequence: number
 * }>}
 */
function expandQuestionPlan(questionPlan) {
  const expanded = [];

  for (const item of questionPlan) {
    for (
      let sequence = 1;
      sequence <= item.count;
      sequence += 1
    ) {
      expanded.push({
        question_type: item.question_type,
        dok_level: item.dok_level,
        sequence,
      });
    }
  }

  return expanded;
}

/**
 * Returns the subject-specific generator.
 *
 * @param {string} normalizedSubject
 * @returns {Function}
 */
function getSubjectGenerator(normalizedSubject) {
  const generators = {
    ELA: generateElaPassageQuestionBankDraft,
    // Science: generateSciencePassageQuestionBankDraft,
    // "Social Studies":
    //   generateSocialStudiesPassageQuestionBankDraft,
    // Math: generateMathPassageQuestionBankDraft,
  };

  const generator =
    generators[normalizedSubject];

  if (!generator) {
    throw new Error(
      `No passage question-bank generator is configured for subject: ${normalizedSubject}.`,
    );
  }

  return generator;
}

/**
 * Ensures every subject-specific generator returns the same package shape.
 *
 * Expected result:
 *
 * {
 *   passage: {
 *     subject,
 *     grade_level,
 *     teks_standard,
 *     passage_format,
 *     content_focus_key,
 *     content_focus,
 *     title,
 *     passage,
 *     skill_tags,
 *     difficulty_level,
 *     is_active
 *   },
 *   questions: [
 *     {
 *       question_type,
 *       dok_level,
 *       skill_focus,
 *       assessment_move,
 *       dramatic_function,
 *       target_scene,
 *       correct_target_text,
 *       correct_target_key,
 *       question_json,
 *       review_status,
 *       is_active,
 *       times_used
 *     }
 *   ],
 *   generation: {
 *     subject,
 *     total_questions
 *   }
 * }
 *
 * @param {unknown} result
 * @returns {object}
 */
function assertValidGeneratedPackage(result) {
  if (!isPlainObject(result)) {
    throw new Error(
      "Subject generator must return an object.",
    );
  }

  if (!isPlainObject(result.passage)) {
    throw new Error(
      "Subject generator must return a passage object.",
    );
  }

  if (
    !Array.isArray(result.questions) ||
    result.questions.length === 0
  ) {
    throw new Error(
      "Subject generator must return at least one question.",
    );
  }

  for (
    let index = 0;
    index < result.questions.length;
    index += 1
  ) {
    const question = result.questions[index];

    if (!isPlainObject(question)) {
      throw new Error(
        `Generated question at index ${index} must be an object.`,
      );
    }

    if (
      !normalizeOptionalString(
        question.question_type,
      )
    ) {
      throw new Error(
        `Generated question at index ${index} is missing question_type.`,
      );
    }

    if (
      !normalizeDokLevel(
        question.dok_level,
      )
    ) {
      throw new Error(
        `Generated question at index ${index} has an invalid dok_level.`,
      );
    }

    if (
      !isPlainObject(
        question.question_json,
      )
    ) {
      throw new Error(
        `Generated question at index ${index} is missing question_json.`,
      );
    }
  }

  return result;
}

/**
 * Shared entry point for generating one draft passage and its connected
 * reviewed-question candidates.
 *
 * Every admin generation route should call this function instead of calling
 * adaptiveQuestionGenerator directly.
 *
 * @param {{
 *   subject: string,
 *   gradeLevel: string|number,
 *   teksStandard: string,
 *   passageFormat: string,
 *
 *   contentFocus?: string|null,
 *   contentFocusKey?: string|null,
 *   title?: string|null,
 *   skillTags?: string[],
 *   difficultyLevel?: number,
 *   testingWindow?: string|null,
 *
 *   questionPlan: Array<{
 *     question_type: string,
 *     dok_level: number,
 *     count?: number
 *   }>,
 *
 *   generatorOptions?: object
 * }} params
 *
 * @returns {Promise<{
 *   passage: object,
 *   questions: Array<object>,
 *   generation: object
 * }>}
 */
export async function generatePassageQuestionBankDraft({
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

  generatorOptions = {},
}) {
  const normalizedSubject =
    normalizeSubject(subject);

  if (!normalizedSubject) {
    throw new Error(
      "generatePassageQuestionBankDraft requires subject.",
    );
  }

  const normalizedGradeLevel =
    normalizeOptionalString(
      String(gradeLevel ?? ""),
    );

  if (!normalizedGradeLevel) {
    throw new Error(
      "generatePassageQuestionBankDraft requires gradeLevel.",
    );
  }

  const normalizedTeksStandard =
    normalizeOptionalString(teksStandard);

  if (!normalizedTeksStandard) {
    throw new Error(
      "generatePassageQuestionBankDraft requires teksStandard.",
    );
  }

  const normalizedPassageFormat =
    normalizeOptionalString(passageFormat);

  if (!normalizedPassageFormat) {
    throw new Error(
      "generatePassageQuestionBankDraft requires passageFormat.",
    );
  }

  const normalizedDifficultyLevel =
    normalizeDokLevel(difficultyLevel);

  if (!normalizedDifficultyLevel) {
    throw new Error(
      "generatePassageQuestionBankDraft difficultyLevel must be 1, 2, or 3.",
    );
  }

  if (!isPlainObject(generatorOptions)) {
    throw new Error(
      "generatePassageQuestionBankDraft generatorOptions must be an object.",
    );
  }

  const normalizedQuestionPlan =
    normalizeQuestionPlan(questionPlan);

  const expandedQuestionPlan =
    expandQuestionPlan(
      normalizedQuestionPlan,
    );

  const subjectGenerator =
    getSubjectGenerator(
      normalizedSubject,
    );

  const generatedPackage =
    await subjectGenerator({
      subject: normalizedSubject,

      gradeLevel:
        normalizedGradeLevel,

      teksStandard:
        normalizedTeksStandard,

      passageFormat:
        normalizedPassageFormat,

      contentFocus:
        normalizeOptionalString(
          contentFocus,
        ),

      contentFocusKey:
        normalizeOptionalString(
          contentFocusKey,
        ),

      title:
        normalizeOptionalString(title),

      skillTags:
        Array.isArray(skillTags)
          ? skillTags
          : [],

      difficultyLevel:
        normalizedDifficultyLevel,

      testingWindow:
        normalizeOptionalString(
          testingWindow,
        ),

      questionPlan:
        normalizedQuestionPlan,

      expandedQuestionPlan,

      generatorOptions,
    });

  const validatedPackage =
    assertValidGeneratedPackage(
      generatedPackage,
    );

  return {
    ...validatedPackage,

    generation: {
      ...(isPlainObject(
        validatedPackage.generation,
      )
        ? validatedPackage.generation
        : {}),

      subject:
        normalizedSubject,

      grade_level:
        normalizedGradeLevel,

      teks_standard:
        normalizedTeksStandard,

      passage_format:
        normalizedPassageFormat,

      question_plan:
        normalizedQuestionPlan,

      total_questions:
        validatedPackage.questions.length,
    },
  };
}