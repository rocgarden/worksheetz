// /libs/adaptive/getNextAdaptiveQuestion.js
//
// Shared adaptive question provider.
//
// Selection order:
// 1. If the session has a passage_bank_id, try a reviewed banked question.
// 2. If no eligible banked question exists, use adaptiveQuestionGenerator.
// 3. Return one normalized result shape to the start and submit routes.
//
// This file does not:
// - score answers
// - calculate the next DOK level
// - insert question_attempts
// - update adaptive_sessions
// - decide when a session is complete

import { adaptiveQuestionGenerator } from "@/libs/adaptive";
import { selectPassageQuestion } from "@/libs/adaptive/questionBank/selectPassageQuestion";

/**
 * Returns a normalized non-empty string or null.
 *
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
 * Validates and normalizes the target DOK level.
 *
 * @param {unknown} value
 * @returns {number}
 */
function normalizeDokLevel(value) {
  const dokLevel = Number(value);

  if (![1, 2, 3].includes(dokLevel)) {
    throw new Error(
      "getNextAdaptiveQuestion targetDokLevel must be 1, 2, or 3.",
    );
  }

  return dokLevel;
}

/**
 * Extracts the generated question JSON from the current AI generator result.
 *
 * This helper supports a few possible response shapes so the orchestration
 * layer does not depend too tightly on one generator return format.
 *
 * Update this helper if adaptiveQuestionGenerator currently returns a
 * different exact property.
 *
 * @param {unknown} generatedResult
 * @returns {object|null}
 */
function extractGeneratedQuestionJson(generatedResult) {
  if (
    generatedResult &&
    typeof generatedResult === "object" &&
    !Array.isArray(generatedResult)
  ) {
    if (
      generatedResult.question_json &&
      typeof generatedResult.question_json === "object"
    ) {
      return generatedResult.question_json;
    }

    if (
      generatedResult.question &&
      typeof generatedResult.question === "object"
    ) {
      return generatedResult.question;
    }

    if (
      generatedResult.data?.question &&
      typeof generatedResult.data.question === "object"
    ) {
      return generatedResult.data.question;
    }

    // Some generators may return the question object directly.
    if (
      generatedResult.question_type ||
      generatedResult.type ||
      generatedResult.prompt ||
      generatedResult.stem
    ) {
      return generatedResult;
    }
  }

  return null;
}

/**
 * Returns a generated value when present, otherwise the fallback.
 *
 * @param {object|null} generatedResult
 * @param {string} key
 * @param {unknown} fallback
 * @returns {unknown}
 */
function getGeneratedValue(generatedResult, key, fallback) {
  if (
    generatedResult &&
    typeof generatedResult === "object" &&
    generatedResult[key] !== undefined &&
    generatedResult[key] !== null
  ) {
    return generatedResult[key];
  }

  return fallback;
}

/**
 * Gets the next adaptive question from the reviewed bank or AI fallback.
 *
 * @param {{
 *   supabase: object,
 *   passageBankId?: string|null,
 *   previousAttempts?: Array<object>,
 *
 *   subject: string,
 *   gradeLevel: string|number,
 *   teksStandard: string,
 *   questionType: string,
 *   targetDokLevel: number,
 *
 *   testingWindow?: string|null,
 *   contentFocus?: string|null,
 *   contentFocusKey?: string|null,
 *   passageFormat?: string|null,
 *   stimulus?: string|null,
 *
 *   skillFocus?: string|null,
 *   assessmentMove?: string|null,
 *
 *   generatorOptions?: object
 * }} params
 *
 * @returns {Promise<{
 *   source: "bank"|"ai",
 *   passageQuestionBankId: string|null,
 *   questionJson: object,
 *   questionType: string,
 *   dokLevel: number,
 *   skillFocus: string|null,
 *   assessmentMove: string|null,
 *   dramaticFunction: string|null,
 *   targetScene: string|null,
 *   correctTargetText: string|null,
 *   correctTargetKey: string|null,
 *   selection: object|null
 * }>}
 */
export async function getNextAdaptiveQuestion({
  supabase,
  passageBankId = null,
  previousAttempts = [],

  subject,
  gradeLevel,
  teksStandard,
  questionType,
  targetDokLevel,

  testingWindow = null,
  contentFocus = null,
  contentFocusKey = null,
  passageFormat = null,
  stimulus = null,

  skillFocus = null,
  assessmentMove = null,

  generatorOptions = {},
}) {
  if (!supabase) {
    throw new Error(
      "getNextAdaptiveQuestion requires a Supabase service client.",
    );
  }

  if (typeof subject !== "string" || !subject.trim()) {
    throw new Error(
      "getNextAdaptiveQuestion requires subject.",
    );
  }

  if (
    gradeLevel === undefined ||
    gradeLevel === null ||
    String(gradeLevel).trim() === ""
  ) {
    throw new Error(
      "getNextAdaptiveQuestion requires gradeLevel.",
    );
  }

  if (
    typeof teksStandard !== "string" ||
    !teksStandard.trim()
  ) {
    throw new Error(
      "getNextAdaptiveQuestion requires teksStandard.",
    );
  }

  if (
    typeof questionType !== "string" ||
    !questionType.trim()
  ) {
    throw new Error(
      "getNextAdaptiveQuestion requires questionType.",
    );
  }

  if (!Array.isArray(previousAttempts)) {
    throw new Error(
      "getNextAdaptiveQuestion previousAttempts must be an array.",
    );
  }

  const normalizedDokLevel = normalizeDokLevel(
    targetDokLevel,
  );

  const normalizedPassageBankId =
    normalizeOptionalString(passageBankId);

  /*
   * ------------------------------------------------------------
   * 1. Reviewed bank selection
   * ------------------------------------------------------------
   *
   * Only attempt passage-question-bank selection when the session
   * is tied to a reviewed passage_bank row.
   */
  if (normalizedPassageBankId) {
    try {
      const bankResult = await selectPassageQuestion({
        supabase,
        passageBankId: normalizedPassageBankId,
        questionType: questionType.trim(),
        targetDokLevel: normalizedDokLevel,
        previousAttempts,
      });

      if (bankResult.found) {
        const bankQuestion = bankResult.question;

        return {
          source: "bank",

          passageQuestionBankId: bankQuestion.id,

          // Snapshot this full object into question_attempts.question_json.
          questionJson: bankQuestion.question_json,

          questionType: bankQuestion.question_type,
          dokLevel: Number(bankQuestion.dok_level),

          skillFocus:
            normalizeOptionalString(
              bankQuestion.skill_focus,
            ),

          assessmentMove:
            normalizeOptionalString(
              bankQuestion.assessment_move,
            ),

          dramaticFunction:
            normalizeOptionalString(
              bankQuestion.dramatic_function,
            ),

          targetScene:
            normalizeOptionalString(
              bankQuestion.target_scene,
            ),

          correctTargetText:
            normalizeOptionalString(
              bankQuestion.correct_target_text,
            ),

          correctTargetKey:
            normalizeOptionalString(
              bankQuestion.correct_target_key,
            ),

          selection: bankResult.selection || null,
        };
      }

      console.info(
        "[getNextAdaptiveQuestion] No eligible reviewed bank question; using AI fallback",
        {
          passage_bank_id: normalizedPassageBankId,
          subject: subject.trim(),
          grade_level: String(gradeLevel),
          teks_standard: teksStandard.trim(),
          question_type: questionType.trim(),
          target_dok_level: normalizedDokLevel,
          reason: bankResult.reason,
        },
      );
    } catch (bankError) {
      /*
       * A bank query failure should not automatically break the student
       * session while AI fallback is available.
       *
       * The error is logged so database or selector problems are visible.
       */
      console.error(
        "[getNextAdaptiveQuestion] Bank selection failed; using AI fallback",
        {
          passage_bank_id: normalizedPassageBankId,
          question_type: questionType.trim(),
          target_dok_level: normalizedDokLevel,
          error:
            bankError instanceof Error
              ? bankError.message
              : String(bankError),
        },
      );
    }
  }

  /*
   * ------------------------------------------------------------
   * 2. AI fallback
   * ------------------------------------------------------------
   *
   * This preserves the existing adaptive generator for:
   * - incomplete reviewed question banks
   * - teacher-selected content_focus
   * - teacher chips and custom instructional focus
   * - new TEKS before reviewed questions are published
   * - drafting and internal testing
   * - sessions not tied to passage_bank_id
   */
  const generatedResult = await adaptiveQuestionGenerator({
    subject: subject.trim(),
    grade_level: String(gradeLevel),
    teks_standard: teksStandard.trim(),
    question_type: questionType.trim(),
    dok_level: normalizedDokLevel,

    testing_window:
      normalizeOptionalString(testingWindow),

    content_focus:
      normalizeOptionalString(contentFocus),

    content_focus_key:
      normalizeOptionalString(contentFocusKey),

    passage_format:
      normalizeOptionalString(passageFormat),

    stimulus:
      normalizeOptionalString(stimulus),

    skill_focus:
      normalizeOptionalString(skillFocus),

    assessment_move:
      normalizeOptionalString(assessmentMove),

    ...generatorOptions,
  });

  const generatedQuestionJson =
    extractGeneratedQuestionJson(generatedResult);

  if (!generatedQuestionJson) {
    console.error(
      "[getNextAdaptiveQuestion] AI generator returned no usable question JSON",
      {
        subject: subject.trim(),
        grade_level: String(gradeLevel),
        teks_standard: teksStandard.trim(),
        question_type: questionType.trim(),
        target_dok_level: normalizedDokLevel,
      },
    );

    throw new Error(
      "Adaptive AI generator returned no usable question.",
    );
  }

  const generatedQuestionType = String(
    getGeneratedValue(
      generatedResult,
      "question_type",
      questionType,
    ),
  );

  const generatedDokLevel = Number(
    getGeneratedValue(
      generatedResult,
      "dok_level",
      normalizedDokLevel,
    ),
  );

  return {
    source: "ai",

    passageQuestionBankId: null,

    questionJson: generatedQuestionJson,

    questionType: generatedQuestionType,

    dokLevel: [1, 2, 3].includes(generatedDokLevel)
      ? generatedDokLevel
      : normalizedDokLevel,

    skillFocus:
      normalizeOptionalString(
        getGeneratedValue(
          generatedResult,
          "skill_focus",
          skillFocus,
        ),
      ),

    assessmentMove:
      normalizeOptionalString(
        getGeneratedValue(
          generatedResult,
          "assessment_move",
          assessmentMove,
        ),
      ),

    dramaticFunction: null,
    targetScene: null,
    correctTargetText: null,
    correctTargetKey: null,

    selection: null,
  };
}