// /libs/adaptive/questionBank/validatePassageQuestionBankRow.js
//
// Shared validation for passage_question_bank rows.
//
// Works across:
// - all subjects
// - all grade levels
// - all TEKS
// - all passage formats
// - all current and future question types
//
// This validator checks:
// 1. Universal passage_question_bank fields.
// 2. Review/activation consistency.
// 3. General question_json requirements.
// 4. Question-type-specific question_json structure.
// 5. Optional drama metadata when the passage is a drama.
//
// It does not:
// - insert or update database rows
// - call OpenAI
// - select questions for student sessions
// - validate whether a TEKS interpretation is instructionally correct
// - review the quality of stems, distractors, or correct answers

import {
  validateQuestionAnswerConsistency,
} from "./validateQuestionAnswerConsistency";

const VALID_DOK_LEVELS = new Set([1, 2, 3]);

const VALID_REVIEW_STATUSES = new Set([
  "draft",
  "in_review",
  "approved",
  "rejected",
  "archived",
]);

/**
 * Canonical question-type names currently understood by this validator.
 *
 * Future types can be added here without changing the database schema.
 */
const QUESTION_TYPE_ALIASES = Object.freeze({
  multiple_choice: "multiple_choice",
  multi_select: "multi_select",
  hot_text: "hot_text",
  constructed_response: "constructed_response",

  drag_and_drop: "drag_and_drop",
  drag_drop: "drag_and_drop",

  matching: "matching",
  match: "matching",

  sequence: "sequence",
  sequencing: "sequence",
  next_place_in_line: "sequence",

  grid: "grid",

  complete_table: "complete_table",
  table_completion: "complete_table",

  inline_choice: "inline_choice",
  evidence_pair: "evidence_pair",
});

const ACTIVE_CONSISTENCY_TYPES = new Set([
  "multiple_choice",
  "multi_select",
  "hot_text",
  "constructed_response",
]);

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
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeQuestionType(value) {
  const normalized = normalizeOptionalString(value)?.toLowerCase();

  if (!normalized) {
    return null;
  }

  return QUESTION_TYPE_ALIASES[normalized] || normalized;
}

/**
 * Adds a validation issue.
 *
 * @param {Array<object>} issues
 * @param {string} path
 * @param {string} message
 * @param {string} [code]
 */
function addIssue(
  issues,
  path,
  message,
  code = "invalid_value",
) {
  issues.push({
    path,
    message,
    code,
  });
}

/**
 * Merges issues returned by validateQuestionAnswerConsistency().
 *
 * That validator includes severity because some consistency findings are
 * warnings. This row validator continues using issue codes to classify
 * recommendations and warnings.
 *
 * @param {Array<object>} targetIssues
 * @param {Array<object>} consistencyIssues
 */
function mergeConsistencyIssues(
  targetIssues,
  consistencyIssues,
) {
  for (const issue of consistencyIssues) {
    targetIssues.push({
      path: issue.path,
      message: issue.message,
      code: issue.code,
      severity:
        issue.severity === "warning"
          ? "warning"
          : "error",
    });
  }
}

/**
 * @param {object} questionJson
 * @returns {string|null}
 */
function getQuestionStem(questionJson) {
  return (
    normalizeOptionalString(questionJson.stem) ||
    normalizeOptionalString(questionJson.question) ||
    normalizeOptionalString(questionJson.prompt)
  );
}

/**
 * Accepts answer options stored as strings or structured objects.
 *
 * Examples:
 *
 * ["A", "B", "C", "D"]
 *
 * [
 *   { id: "a", text: "Answer A" },
 *   { id: "b", text: "Answer B" }
 * ]
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidOptionArray(value) {
  if (!Array.isArray(value) || value.length < 2) {
    return false;
  }

  return value.every((option) => {
    if (typeof option === "string") {
      return option.trim().length > 0;
    }

    if (!isPlainObject(option)) {
      return false;
    }

    return Boolean(
      normalizeOptionalString(option.id) ||
        normalizeOptionalString(option.value) ||
        normalizeOptionalString(option.text) ||
        normalizeOptionalString(option.label),
    );
  });
}

/**
 * @param {object} questionJson
 * @returns {unknown}
 */
function getOptions(questionJson) {
  return (
    questionJson.answer_options ??
    questionJson.options ??
    questionJson.choices ??
    questionJson.answer_choices ??
    null
  );
}

/**
 * @param {object} questionJson
 * @returns {unknown}
 */
function getCorrectAnswer(questionJson) {
  return (
    questionJson.correct_answer ??
    questionJson.correctAnswer ??
    questionJson.answer ??
    questionJson.correct_option ??
    questionJson.correctOption ??
    null
  );
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function hasUsableAnswerValue(value) {
  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return isPlainObject(value) && Object.keys(value).length > 0;
}

/**
 * Validates the general question_json structure shared by every type.
 *
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateUniversalQuestionJson(
  questionJson,
  issues,
) {
  if (!isPlainObject(questionJson)) {
    addIssue(
      issues,
      "question_json",
      "question_json must be a JSON object.",
      "invalid_type",
    );

    return;
  }

  const stem = getQuestionStem(questionJson);

  if (!stem) {
    addIssue(
      issues,
      "question_json.stem",
      "question_json must include a non-empty stem, question, or prompt.",
      "required",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateMultipleChoice(questionJson, issues) {
  const options = getOptions(questionJson);
  const correctAnswer = getCorrectAnswer(questionJson);

  if (!isValidOptionArray(options)) {
    addIssue(
      issues,
      "question_json.options",
      "A multiple-choice question must contain at least two valid answer options.",
      "invalid_options",
    );
  }

  if (!hasUsableAnswerValue(correctAnswer)) {
    addIssue(
      issues,
      "question_json.correct_answer",
      "A multiple-choice question must include a correct answer.",
      "required",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateMultiSelect(questionJson, issues) {
  const options = getOptions(questionJson);

  const correctAnswers =
    questionJson.correct_answers ??
    questionJson.correctAnswers ??
    getCorrectAnswer(questionJson);

  if (!isValidOptionArray(options)) {
    addIssue(
      issues,
      "question_json.options",
      "A multi-select question must contain at least two valid answer options.",
      "invalid_options",
    );
  }

  if (
    !Array.isArray(correctAnswers) ||
    correctAnswers.length < 1
  ) {
    addIssue(
      issues,
      "question_json.correct_answers",
      "A multi-select question must include at least one correct answer.",
      "required",
    );
  }
}

/**
 * Hot-text questions may store selectable text in several ways:
 *
 * selectable_text
 * text_segments
 * segments
 * lines
 *
 * They must also provide a correct target or correct target collection.
 *
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateHotText(questionJson, issues) {
  const selectableContent =
    questionJson.selectable_text ??
    questionJson.text_segments ??
    questionJson.segments ??
    questionJson.lines ??
    null;

  const hotTextTargets = Array.isArray(
    questionJson.hot_text_targets,
  )
    ? questionJson.hot_text_targets
    : [];

  const hasSelectableTargets = hotTextTargets.length > 0;

  const hasSelectableContent =
    hasSelectableTargets ||
    (typeof selectableContent === "string" &&
      selectableContent.trim().length > 0) ||
    (Array.isArray(selectableContent) &&
      selectableContent.length > 0);

  if (!hasSelectableContent) {
    addIssue(
      issues,
      "question_json.selectable_text",
      "A hot-text question must include selectable text, segments, lines, or hot_text_targets.",
      "required",
    );
  }

  const explicitCorrectTargets =
    questionJson.correct_targets ??
    questionJson.correctTargets ??
    questionJson.correct_target ??
    questionJson.correctTarget ??
    getCorrectAnswer(questionJson);

  const embeddedCorrectTargets = hotTextTargets.filter(
    (target) =>
      target &&
      typeof target === "object" &&
      (
        target.is_correct === true ||
        target.correct === true
      ),
  );

  const hasCorrectTarget =
    hasUsableAnswerValue(explicitCorrectTargets) ||
    embeddedCorrectTargets.length > 0;

  if (!hasCorrectTarget) {
    addIssue(
      issues,
      "question_json.correct_targets",
      "A hot-text question must include at least one correct target.",
      "required",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateConstructedResponse(
  questionJson,
  issues,
) {
  const rubric =
    questionJson.rubric ??
    questionJson.scoring_rubric ??
    questionJson.scoringRubric ??
    questionJson.exemplar ??
    questionJson.sample_answer ??
    questionJson.sampleAnswer ??
    null;

  if (!hasUsableAnswerValue(rubric)) {
    addIssue(
      issues,
      "question_json.rubric",
      "A constructed-response question must include a rubric, exemplar, or sample answer.",
      "required",
    );
  }
}

/**
 * Supports future drag-and-drop structures such as:
 *
 * {
 *   items: [...],
 *   drop_zones: [...],
 *   correct_placements: {...}
 * }
 *
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateDragAndDrop(questionJson, issues) {
  const items =
    questionJson.items ??
    questionJson.draggable_items ??
    questionJson.draggableItems ??
    null;

  const dropZones =
    questionJson.drop_zones ??
    questionJson.dropZones ??
    questionJson.targets ??
    null;

  const correctPlacements =
    questionJson.correct_placements ??
    questionJson.correctPlacements ??
    questionJson.correct_answer ??
    questionJson.correctAnswer ??
    null;

  if (!Array.isArray(items) || items.length < 1) {
    addIssue(
      issues,
      "question_json.items",
      "A drag-and-drop question must include at least one draggable item.",
      "required",
    );
  }

  if (!Array.isArray(dropZones) || dropZones.length < 1) {
    addIssue(
      issues,
      "question_json.drop_zones",
      "A drag-and-drop question must include at least one drop zone.",
      "required",
    );
  }

  if (!hasUsableAnswerValue(correctPlacements)) {
    addIssue(
      issues,
      "question_json.correct_placements",
      "A drag-and-drop question must include correct placements.",
      "required",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateMatching(questionJson, issues) {
  const leftItems =
    questionJson.left_items ??
    questionJson.leftItems ??
    questionJson.prompts ??
    null;

  const rightItems =
    questionJson.right_items ??
    questionJson.rightItems ??
    questionJson.matches ??
    questionJson.choices ??
    null;

  const correctMatches =
    questionJson.correct_matches ??
    questionJson.correctMatches ??
    questionJson.correct_answer ??
    questionJson.correctAnswer ??
    null;

  if (!Array.isArray(leftItems) || leftItems.length < 1) {
    addIssue(
      issues,
      "question_json.left_items",
      "A matching question must include left-side items or prompts.",
      "required",
    );
  }

  if (!Array.isArray(rightItems) || rightItems.length < 1) {
    addIssue(
      issues,
      "question_json.right_items",
      "A matching question must include right-side choices.",
      "required",
    );
  }

  if (!hasUsableAnswerValue(correctMatches)) {
    addIssue(
      issues,
      "question_json.correct_matches",
      "A matching question must include correct matches.",
      "required",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateSequence(questionJson, issues) {
  const items =
    questionJson.items ??
    questionJson.events ??
    questionJson.steps ??
    null;

  const correctOrder =
    questionJson.correct_order ??
    questionJson.correctOrder ??
    questionJson.correct_sequence ??
    questionJson.correctSequence ??
    getCorrectAnswer(questionJson);

  if (!Array.isArray(items) || items.length < 2) {
    addIssue(
      issues,
      "question_json.items",
      "A sequence question must include at least two items.",
      "required",
    );
  }

  if (
    !Array.isArray(correctOrder) ||
    correctOrder.length < 2
  ) {
    addIssue(
      issues,
      "question_json.correct_order",
      "A sequence question must include a correct order.",
      "required",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateGrid(questionJson, issues) {
  const rows =
    questionJson.rows ??
    questionJson.grid_rows ??
    questionJson.gridRows ??
    null;

  const columns =
    questionJson.columns ??
    questionJson.grid_columns ??
    questionJson.gridColumns ??
    null;

  const correctAnswers =
    questionJson.correct_answers ??
    questionJson.correctAnswers ??
    questionJson.correct_answer ??
    questionJson.correctAnswer ??
    null;

  if (!Array.isArray(rows) || rows.length < 1) {
    addIssue(
      issues,
      "question_json.rows",
      "A grid question must include at least one row.",
      "required",
    );
  }

  if (!Array.isArray(columns) || columns.length < 1) {
    addIssue(
      issues,
      "question_json.columns",
      "A grid question must include at least one column.",
      "required",
    );
  }

  if (!hasUsableAnswerValue(correctAnswers)) {
    addIssue(
      issues,
      "question_json.correct_answers",
      "A grid question must include correct answers.",
      "required",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateCompleteTable(questionJson, issues) {
  const rows =
    questionJson.rows ??
    questionJson.table_rows ??
    questionJson.tableRows ??
    null;

  const columns =
    questionJson.columns ??
    questionJson.headers ??
    questionJson.table_columns ??
    questionJson.tableColumns ??
    null;

  const blanks =
    questionJson.blanks ??
    questionJson.cells_to_complete ??
    questionJson.cellsToComplete ??
    null;

  const correctAnswers =
    questionJson.correct_answers ??
    questionJson.correctAnswers ??
    questionJson.correct_cells ??
    questionJson.correctCells ??
    getCorrectAnswer(questionJson);

  if (!Array.isArray(rows) || rows.length < 1) {
    addIssue(
      issues,
      "question_json.rows",
      "A complete-table question must include table rows.",
      "required",
    );
  }

  if (!Array.isArray(columns) || columns.length < 1) {
    addIssue(
      issues,
      "question_json.columns",
      "A complete-table question must include table columns or headers.",
      "required",
    );
  }

  if (!Array.isArray(blanks) || blanks.length < 1) {
    addIssue(
      issues,
      "question_json.blanks",
      "A complete-table question must identify at least one cell to complete.",
      "required",
    );
  }

  if (!hasUsableAnswerValue(correctAnswers)) {
    addIssue(
      issues,
      "question_json.correct_answers",
      "A complete-table question must include correct cell answers.",
      "required",
    );
  }
}

/**
 * `inline_choice` is retained for future mixed sessions, not currently as a
 * standalone adaptive question type.
 *
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateInlineChoice(questionJson, issues) {
  const segments =
    questionJson.segments ??
    questionJson.text_segments ??
    questionJson.textSegments ??
    null;

  const choices =
    questionJson.choices ??
    questionJson.inline_choices ??
    questionJson.inlineChoices ??
    null;

  const correctAnswers =
    questionJson.correct_answers ??
    questionJson.correctAnswers ??
    getCorrectAnswer(questionJson);

  if (!Array.isArray(segments) || segments.length < 1) {
    addIssue(
      issues,
      "question_json.segments",
      "An inline-choice question must include text segments.",
      "required",
    );
  }

  if (!Array.isArray(choices) || choices.length < 1) {
    addIssue(
      issues,
      "question_json.choices",
      "An inline-choice question must include inline choices.",
      "required",
    );
  }

  if (!hasUsableAnswerValue(correctAnswers)) {
    addIssue(
      issues,
      "question_json.correct_answers",
      "An inline-choice question must include correct answers.",
      "required",
    );
  }
}

/**
 * Evidence-pair items may contain Part A and Part B in one stored bank row.
 *
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateEvidencePair(questionJson, issues) {
  const partA =
    questionJson.part_a ??
    questionJson.partA ??
    null;

  const partB =
    questionJson.part_b ??
    questionJson.partB ??
    null;

  if (!isPlainObject(partA)) {
    addIssue(
      issues,
      "question_json.part_a",
      "An evidence-pair question must include a Part A object.",
      "required",
    );
  }

  if (!isPlainObject(partB)) {
    addIssue(
      issues,
      "question_json.part_b",
      "An evidence-pair question must include a Part B object.",
      "required",
    );
  }
}

/**
 * Runs the type-specific validator.
 *
 * Unknown future question types are allowed when allowUnknownQuestionTypes
 * is true. They still receive universal validation.
 *
 * @param {string} questionType
 * @param {object} questionJson
 * @param {Array<object>} issues
 * @param {boolean} allowUnknownQuestionTypes
 */
function validateQuestionJsonByType(
  questionType,
  questionJson,
  issues,
  allowUnknownQuestionTypes,
) {
  const validators = {
    multiple_choice: validateMultipleChoice,
    multi_select: validateMultiSelect,
    hot_text: validateHotText,

    constructed_response: validateConstructedResponse,
    short_constructed_response:
      validateConstructedResponse,

    extended_constructed_response:
      validateConstructedResponse,

    drag_and_drop: validateDragAndDrop,
    matching: validateMatching,
    sequence: validateSequence,
    grid: validateGrid,
    complete_table: validateCompleteTable,
    inline_choice: validateInlineChoice,
    evidence_pair: validateEvidencePair,
  };

  const validator = validators[questionType];

  if (validator) {
    validator(questionJson, issues);
    return;
  }

  if (!allowUnknownQuestionTypes) {
    addIssue(
      issues,
      "question_type",
      `Unsupported question_type: ${questionType}.`,
      "unsupported_question_type",
    );
  }
}

/**
 * Checks drama metadata.
 *
 * Drama metadata is conditional. It is not required for Science, Social
 * Studies, informational ELA, literary prose, or other non-drama passages.
 *
 * For drama passages, reviewed hot-text questions should normally include:
 * - dramatic_function
 * - target_scene
 * - correct_target_text
 * - correct_target_key
 *
 * Other question types may use only the metadata relevant to that item.
 *
 * @param {object} row
 * @param {object} options
 * @param {Array<object>} issues
 */
function validateDramaMetadata(row, options, issues) {
  const passageFormat = normalizeOptionalString(
    options.passageFormat ?? row.passage_format,
  )?.toLowerCase();

  if (passageFormat !== "drama") {
    return;
  }

  const questionType = normalizeQuestionType(
    row.question_type,
  );

  if (!normalizeOptionalString(row.dramatic_function)) {
    addIssue(
      issues,
      "dramatic_function",
      "Drama-based bank questions should include dramatic_function.",
      "recommended_metadata_missing",
    );
  }

  if (!normalizeOptionalString(row.target_scene)) {
    addIssue(
      issues,
      "target_scene",
      "Drama-based bank questions should include target_scene.",
      "recommended_metadata_missing",
    );
  }

  if (questionType === "hot_text") {
    if (!normalizeOptionalString(row.correct_target_text)) {
      addIssue(
        issues,
        "correct_target_text",
        "Drama hot-text questions must include correct_target_text.",
        "required",
      );
    }

    if (!normalizeOptionalString(row.correct_target_key)) {
      addIssue(
        issues,
        "correct_target_key",
        "Drama hot-text questions must include correct_target_key.",
        "required",
      );
    }
  }
}

/**
 * Produces a normalized bank row suitable for insertion after validation.
 *
 * Unknown columns are intentionally not copied into the normalized result.
 *
 * @param {object} row
 * @returns {object}
 */
function normalizeBankRow(row) {
  return {
    passage_bank_id: normalizeRequiredString(
      row.passage_bank_id,
    ),

    teks_standard: normalizeRequiredString(
      row.teks_standard,
    ),

    subject: normalizeRequiredString(row.subject),

    grade_level: normalizeRequiredString(
      String(row.grade_level ?? ""),
    ),

    question_type: normalizeQuestionType(
      row.question_type,
    ),

    dok_level: Number(row.dok_level),

    skill_focus: normalizeOptionalString(
      row.skill_focus,
    ),

    assessment_move: normalizeOptionalString(
      row.assessment_move,
    ),

    dramatic_function: normalizeOptionalString(
      row.dramatic_function,
    ),

    target_scene: normalizeOptionalString(
      row.target_scene,
    ),

    correct_target_text: normalizeOptionalString(
      row.correct_target_text,
    ),

    correct_target_key: normalizeOptionalString(
      row.correct_target_key,
    ),

    question_json: row.question_json,

    review_status:
      normalizeOptionalString(row.review_status) ||
      "draft",

    is_active: row.is_active === true,

    times_used:
      Number.isInteger(Number(row.times_used)) &&
      Number(row.times_used) >= 0
        ? Number(row.times_used)
        : 0,

    created_by:
      normalizeOptionalString(row.created_by),

    reviewed_by:
      normalizeOptionalString(row.reviewed_by),

    reviewed_at: row.reviewed_at ?? null,
  };
}

/**
 * Validates a passage_question_bank row.
 *
 * @param {object} row
 * @param {{
 *   passageFormat?: string|null,
 *   allowUnknownQuestionTypes?: boolean,
 *   treatRecommendationsAsErrors?: boolean
 * }} [options]
 *
 * @returns {{
 *   success: boolean,
 *   data: object|null,
 *   issues: Array<{
 *     path: string,
 *     message: string,
 *     code: string
 *   }>,
 *   errors: Array<object>,
 *   warnings: Array<object>
 * }}
 */
export function validatePassageQuestionBankRow(
  row,
  {
    passageFormat = null,
    allowUnknownQuestionTypes = false,
    treatRecommendationsAsErrors = false,
  } = {},
) {
  const issues = [];

  if (!isPlainObject(row)) {
    const issue = {
      path: "",
      message:
        "Passage question bank row must be an object.",
      code: "invalid_type",
    };

    return {
      success: false,
      data: null,
      issues: [issue],
      errors: [issue],
      warnings: [],
    };
  }

  const normalized = normalizeBankRow(row);

  if (!normalized.passage_bank_id) {
    addIssue(
      issues,
      "passage_bank_id",
      "passage_bank_id is required.",
      "required",
    );
  }

  if (!normalized.teks_standard) {
    addIssue(
      issues,
      "teks_standard",
      "teks_standard is required.",
      "required",
    );
  }

  if (!normalized.subject) {
    addIssue(
      issues,
      "subject",
      "subject is required.",
      "required",
    );
  }

  if (!normalized.grade_level) {
    addIssue(
      issues,
      "grade_level",
      "grade_level is required.",
      "required",
    );
  }

  if (!normalized.question_type) {
    addIssue(
      issues,
      "question_type",
      "question_type is required.",
      "required",
    );
  }

  if (!VALID_DOK_LEVELS.has(normalized.dok_level)) {
    addIssue(
      issues,
      "dok_level",
      "dok_level must be 1, 2, or 3.",
      "invalid_dok_level",
    );
  }

  if (
    !VALID_REVIEW_STATUSES.has(
      normalized.review_status,
    )
  ) {
    addIssue(
      issues,
      "review_status",
      "review_status must be draft, in_review, approved, rejected, or archived.",
      "invalid_review_status",
    );
  }

  if (
    normalized.is_active &&
    normalized.review_status !== "approved"
  ) {
    addIssue(
      issues,
      "is_active",
      "is_active can only be true when review_status is approved.",
      "active_requires_approved",
    );
  }

  if (
    normalized.review_status === "approved" &&
    !normalizeOptionalString(normalized.reviewed_by)
  ) {
    addIssue(
      issues,
      "reviewed_by",
      "Approved questions should include reviewed_by.",
      "recommended_metadata_missing",
    );
  }

  if (
    normalized.review_status === "approved" &&
    !normalized.reviewed_at
  ) {
    addIssue(
      issues,
      "reviewed_at",
      "Approved questions should include reviewed_at.",
      "recommended_metadata_missing",
    );
  }

validateUniversalQuestionJson(
  normalized.question_json,
  issues,
);

if (
  normalized.question_type &&
  isPlainObject(normalized.question_json)
) {
  if (
    ACTIVE_CONSISTENCY_TYPES.has(
      normalized.question_type,
    )
  ) {
    /*
     * Active production question types receive strict validation against
     * the confirmed renderer, scorer, and generator contracts.
     *
     * This replaces the older loose type-specific validation for these
     * types so that duplicate or conflicting errors are not returned.
     */
    const consistencyResult =
      validateQuestionAnswerConsistency({
        rowQuestionType:
          normalized.question_type,

        questionJson:
          normalized.question_json,
      });

    mergeConsistencyIssues(
      issues,
      consistencyResult.issues,
    );
  } else {
    /*
     * Future question types retain their existing provisional structural
     * validation until their renderer, submission shape, and scorer are
     * finalized.
     */
    validateQuestionJsonByType(
      normalized.question_type,
      normalized.question_json,
      issues,
      allowUnknownQuestionTypes,
    );
  }
}

  validateDramaMetadata(
    normalized,
    { passageFormat },
    issues,
  );

const warnings = issues.filter(
  (issue) =>
    issue.code ===
      "recommended_metadata_missing" ||
    issue.severity === "warning",
);

const errors = issues.filter((issue) => {
  const isRecommendation =
    issue.code ===
    "recommended_metadata_missing";

  const isConsistencyWarning =
    issue.severity === "warning";

  if (
    treatRecommendationsAsErrors &&
    isRecommendation
  ) {
    return true;
  }

  return (
    !isRecommendation &&
    !isConsistencyWarning
  );
});

  return {
    success: errors.length === 0,
    data: errors.length === 0 ? normalized : null,
    issues,
    errors,
    warnings,
  };
}

/**
 * Validates multiple bank rows and keeps row indexes in error paths.
 *
 * @param {Array<object>} rows
 * @param {{
 *   passageFormat?: string|null,
 *   allowUnknownQuestionTypes?: boolean,
 *   treatRecommendationsAsErrors?: boolean
 * }} [options]
 *
 * @returns {{
 *   success: boolean,
 *   data: Array<object>,
 *   issues: Array<object>,
 *   rowResults: Array<object>
 * }}
 */
export function validatePassageQuestionBankRows(
  rows,
  options = {},
) {
  if (!Array.isArray(rows)) {
    return {
      success: false,
      data: [],
      issues: [
        {
          path: "rows",
          message: "Question bank rows must be an array.",
          code: "invalid_type",
        },
      ],
      rowResults: [],
    };
  }

  const data = [];
  const issues = [];

  const rowResults = rows.map((row, index) => {
    const result =
      validatePassageQuestionBankRow(row, options);

    for (const issue of result.issues) {
      issues.push({
        ...issue,
        path: `rows[${index}]${
          issue.path ? `.${issue.path}` : ""
        }`,
        rowIndex: index,
      });
    }

    if (result.success && result.data) {
      data.push(result.data);
    }

    return {
      rowIndex: index,
      ...result,
    };
  });

  return {
    success: rowResults.every(
      (result) => result.success,
    ),
    data,
    issues,
    rowResults,
  };
}

/**
 * Throws a readable error when a single bank row is invalid.
 *
 * Useful for seed scripts and protected admin routes.
 *
 * @param {object} row
 * @param {object} [options]
 * @returns {object}
 */
export function assertValidPassageQuestionBankRow(
  row,
  options = {},
) {
  const result = validatePassageQuestionBankRow(
    row,
    options,
  );

  if (!result.success) {
    const message = result.errors
      .map(
        (issue) =>
          `${issue.path || "row"}: ${issue.message}`,
      )
      .join("; ");

    throw new Error(
      `Invalid passage question bank row: ${message}`,
    );
  }

  return result.data;
}

/**
 * Throws a readable error when any row in a collection is invalid.
 *
 * @param {Array<object>} rows
 * @param {object} [options]
 * @returns {Array<object>}
 */
export function assertValidPassageQuestionBankRows(
  rows,
  options = {},
) {
  const result = validatePassageQuestionBankRows(
    rows,
    options,
  );

  if (!result.success) {
    const message = result.issues
.filter(
  (issue) =>
    issue.code !==
      "recommended_metadata_missing" &&
    issue.severity !== "warning",
)      .map(
        (issue) =>
          `${issue.path || "rows"}: ${issue.message}`,
      )
      .join("; ");

    throw new Error(
      `Invalid passage question bank rows: ${message}`,
    );
  }

  return result.data;
}