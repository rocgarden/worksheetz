// /libs/adaptive/questionBank/validateQuestionAnswerConsistency.js
//
// Deep consistency validation for passage_question_bank question_json.
//
// This validator checks relationships between:
// - row.question_type
// - question_json.question_type
// - answer options
// - correct answers
// - hot-text targets
// - passage tokens
// - constructed-response rubrics
//
// It does not:
// - validate TEKS instructional quality
// - validate passage content quality
// - validate skill_focus or assessment_move quality
// - insert or update database rows
// - support paused/future question types yet

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
function normalizeString(value) {
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
function normalizeComparableString(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

/**
 * @param {Array<object>} issues
 * @param {string} path
 * @param {string} message
 * @param {string} code
 */
function addError(
  issues,
  path,
  message,
  code = "question_answer_inconsistent",
) {
  issues.push({
    severity: "error",
    path,
    message,
    code,
  });
}

/**
 * @param {Array<object>} issues
 * @param {string} path
 * @param {string} message
 * @param {string} code
 */
function addWarning(
  issues,
  path,
  message,
  code = "question_answer_warning",
) {
  issues.push({
    severity: "warning",
    path,
    message,
    code,
  });
}

/**
 * @param {unknown} questionJson
 * @param {Array<object>} issues
 * @returns {questionJson is object}
 */
function validateBaseQuestionJson(
  questionJson,
  issues,
) {
  if (!isPlainObject(questionJson)) {
    addError(
      issues,
      "question_json",
      "question_json must be a JSON object.",
      "invalid_question_json",
    );

    return false;
  }

  if (!normalizeString(questionJson.stem)) {
    addError(
      issues,
      "question_json.stem",
      "question_json.stem must be a non-empty string.",
      "missing_question_stem",
    );
  }

  if (!normalizeString(questionJson.question_type)) {
    addError(
      issues,
      "question_json.question_type",
      "question_json.question_type must be a non-empty string.",
      "missing_question_type",
    );
  }

  if (!normalizeString(questionJson.teks_standard)) {
    addError(
      issues,
      "question_json.teks_standard",
      "question_json.teks_standard must be a non-empty string.",
      "missing_teks_standard",
    );
  }

  if (!normalizeString(questionJson.explanation)) {
    addError(
      issues,
      "question_json.explanation",
      "question_json.explanation must be a non-empty string.",
      "missing_explanation",
    );
  }

  if (
    questionJson.correct_answer === undefined ||
    questionJson.correct_answer === null
  ) {
    addError(
      issues,
      "question_json.correct_answer",
      "question_json.correct_answer is required.",
      "missing_correct_answer",
    );
  }

  return true;
}

/**
 * @param {unknown} options
 * @param {Array<object>} issues
 * @param {number} expectedLength
 * @param {string[]} expectedIds
 * @returns {Array<object>}
 */
function validateObjectAnswerOptions(
  options,
  issues,
  expectedLength,
  expectedIds,
) {
  if (!Array.isArray(options)) {
    addError(
      issues,
      "question_json.answer_options",
      "answer_options must be an array.",
      "invalid_answer_options",
    );

    return [];
  }

  if (options.length !== expectedLength) {
    addError(
      issues,
      "question_json.answer_options",
      `answer_options must contain exactly ${expectedLength} options.`,
      "invalid_answer_option_count",
    );
  }

  const optionIds = [];
  const normalizedTexts = [];

  options.forEach((option, index) => {
    const optionPath =
      `question_json.answer_options[${index}]`;

    if (!isPlainObject(option)) {
      addError(
        issues,
        optionPath,
        "Each answer option must be an object.",
        "invalid_answer_option",
      );

      return;
    }

    const id = normalizeString(option.id);
    const text = normalizeString(option.text);

    if (!id) {
      addError(
        issues,
        `${optionPath}.id`,
        "Each answer option must have a non-empty id.",
        "missing_answer_option_id",
      );
    } else {
      optionIds.push(id);
    }

    if (!text) {
      addError(
        issues,
        `${optionPath}.text`,
        "Each answer option must have non-empty text.",
        "missing_answer_option_text",
      );
    } else {
      normalizedTexts.push(
        normalizeComparableString(text),
      );
    }
  });

  const normalizedIds = optionIds.map((id) =>
    id.toUpperCase(),
  );

  if (
    new Set(normalizedIds).size !==
    normalizedIds.length
  ) {
    addError(
      issues,
      "question_json.answer_options",
      "Answer option ids must be unique.",
      "duplicate_answer_option_ids",
    );
  }

  if (
    new Set(normalizedTexts).size !==
    normalizedTexts.length
  ) {
    addError(
      issues,
      "question_json.answer_options",
      "Answer option text must be unique.",
      "duplicate_answer_option_text",
    );
  }

  if (
    options.length === expectedLength &&
    normalizedIds.length === expectedLength
  ) {
    const actual = [...normalizedIds].sort();
    const expected = [...expectedIds].sort();

    if (
      JSON.stringify(actual) !==
      JSON.stringify(expected)
    ) {
      addError(
        issues,
        "question_json.answer_options",
        `Answer option ids must be exactly ${expectedIds.join(
          ", ",
        )}.`,
        "invalid_answer_option_ids",
      );
    }
  }

  return options;
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateMultipleChoice(
  questionJson,
  issues,
) {
  const options = validateObjectAnswerOptions(
    questionJson.answer_options,
    issues,
    4,
    ["A", "B", "C", "D"],
  );

  if (
    questionJson.hot_text_targets !== null &&
    questionJson.hot_text_targets !== undefined
  ) {
    addError(
      issues,
      "question_json.hot_text_targets",
      "multiple_choice hot_text_targets must be null.",
      "unexpected_hot_text_targets",
    );
  }

  const correctAnswer = normalizeString(
    questionJson.correct_answer,
  );

  if (!correctAnswer) {
    addError(
      issues,
      "question_json.correct_answer",
      "multiple_choice correct_answer must be a string.",
      "invalid_correct_answer",
    );

    return;
  }

  const normalizedCorrect =
    correctAnswer.toUpperCase();

  const validIds = options
    .filter(isPlainObject)
    .map((option) =>
      normalizeString(option.id)?.toUpperCase(),
    )
    .filter(Boolean);

  if (!validIds.includes(normalizedCorrect)) {
    addError(
      issues,
      "question_json.correct_answer",
      `multiple_choice correct_answer "${correctAnswer}" does not match an answer option id.`,
      "correct_answer_not_in_options",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateMultiSelect(
  questionJson,
  issues,
) {
  const options = validateObjectAnswerOptions(
    questionJson.answer_options,
    issues,
    5,
    ["A", "B", "C", "D", "E"],
  );

  if (
    questionJson.hot_text_targets !== null &&
    questionJson.hot_text_targets !== undefined
  ) {
    addError(
      issues,
      "question_json.hot_text_targets",
      "multi_select hot_text_targets must be null.",
      "unexpected_hot_text_targets",
    );
  }

  const correctAnswer =
    questionJson.correct_answer;

  if (!Array.isArray(correctAnswer)) {
    addError(
      issues,
      "question_json.correct_answer",
      "multi_select correct_answer must be an array.",
      "invalid_correct_answer",
    );

    return;
  }

  if (
    correctAnswer.length < 2 ||
    correctAnswer.length > 3
  ) {
    addError(
      issues,
      "question_json.correct_answer",
      "multi_select correct_answer must contain exactly 2 or 3 option ids.",
      "invalid_correct_answer_count",
    );
  }

  const normalizedCorrectIds =
    correctAnswer.map((id) =>
      normalizeString(id)?.toUpperCase(),
    );

  if (
    normalizedCorrectIds.some((id) => !id)
  ) {
    addError(
      issues,
      "question_json.correct_answer",
      "Every multi_select correct_answer entry must be a non-empty string.",
      "invalid_correct_answer_id",
    );
  }

  const validCorrectIds =
    normalizedCorrectIds.filter(Boolean);

  if (
    new Set(validCorrectIds).size !==
    validCorrectIds.length
  ) {
    addError(
      issues,
      "question_json.correct_answer",
      "multi_select correct_answer must not contain duplicate ids.",
      "duplicate_correct_answer_ids",
    );
  }

  const validOptionIds = options
    .filter(isPlainObject)
    .map((option) =>
      normalizeString(option.id)?.toUpperCase(),
    )
    .filter(Boolean);

  const invalidIds =
    validCorrectIds.filter(
      (id) => !validOptionIds.includes(id),
    );

  if (invalidIds.length > 0) {
    addError(
      issues,
      "question_json.correct_answer",
      `multi_select correct_answer contains ids not found in answer_options: ${invalidIds.join(
        ", ",
      )}.`,
      "correct_answer_not_in_options",
    );
  }

  const sortedCorrectIds = [
    ...validCorrectIds,
  ].sort();

  if (
    JSON.stringify(validCorrectIds) !==
    JSON.stringify(sortedCorrectIds)
  ) {
    addWarning(
      issues,
      "question_json.correct_answer",
      "multi_select correct_answer ids should be sorted alphabetically.",
      "correct_answer_not_sorted",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateHotText(
  questionJson,
  issues,
) {
  const passage = normalizeString(
    questionJson.passage,
  );

  if (!passage) {
    addError(
      issues,
      "question_json.passage",
      "hot_text requires a non-empty passage.",
      "missing_hot_text_passage",
    );
  }

  if (
    questionJson.answer_options !== null &&
    questionJson.answer_options !== undefined
  ) {
    addError(
      issues,
      "question_json.answer_options",
      "hot_text answer_options must be null.",
      "unexpected_answer_options",
    );
  }

  const targets =
    questionJson.hot_text_targets;

  if (!Array.isArray(targets)) {
    addError(
      issues,
      "question_json.hot_text_targets",
      "hot_text_targets must be an array.",
      "invalid_hot_text_targets",
    );

    return;
  }

  if (
    targets.length < 3 ||
    targets.length > 5
  ) {
    addError(
      issues,
      "question_json.hot_text_targets",
      "hot_text_targets must contain 3 to 5 targets.",
      "invalid_hot_text_target_count",
    );
  }

  const ids = [];
  const texts = [];
  const correctTargetIds = [];

  targets.forEach((target, index) => {
    const targetPath =
      `question_json.hot_text_targets[${index}]`;

    if (!isPlainObject(target)) {
      addError(
        issues,
        targetPath,
        "Each hot_text target must be an object.",
        "invalid_hot_text_target",
      );

      return;
    }

    const id = normalizeString(target.id);
    const text = normalizeString(target.text);

    const expectedId = `ht${index + 1}`;

    if (!id) {
      addError(
        issues,
        `${targetPath}.id`,
        "Each hot_text target must have a non-empty id.",
        "missing_hot_text_target_id",
      );
    } else {
      ids.push(id);

      if (id !== expectedId) {
        addError(
          issues,
          `${targetPath}.id`,
          `Hot-text targets must be ordered sequentially. Expected "${expectedId}" at index ${index}, but received "${id}".`,
          "hot_text_target_order_mismatch",
        );
      }
    }

    if (!text) {
      addError(
        issues,
        `${targetPath}.text`,
        "Each hot_text target must have non-empty text.",
        "missing_hot_text_target_text",
      );
    } else {
      texts.push(
        normalizeComparableString(text),
      );

      if (
        passage &&
        !passage.includes(text)
      ) {
        addError(
          issues,
          `${targetPath}.text`,
          `Hot-text target "${id || index}" does not appear exactly in the passage.`,
          "hot_text_target_not_in_passage",
        );
      }
    }

    if (
      typeof target.is_correct !==
      "boolean"
    ) {
      addError(
        issues,
        `${targetPath}.is_correct`,
        "Each hot_text target must have a boolean is_correct value.",
        "invalid_hot_text_is_correct",
      );
    } else if (
      target.is_correct === true &&
      id
    ) {
      correctTargetIds.push(id);
    }
  });

  if (
    new Set(ids).size !== ids.length
  ) {
    addError(
      issues,
      "question_json.hot_text_targets",
      "Hot-text target ids must be unique.",
      "duplicate_hot_text_target_ids",
    );
  }

  if (
    new Set(texts).size !== texts.length
  ) {
    addError(
      issues,
      "question_json.hot_text_targets",
      "Hot-text target text must be unique.",
      "duplicate_hot_text_target_text",
    );
  }

  if (correctTargetIds.length !== 1) {
    addError(
      issues,
      "question_json.hot_text_targets",
      `Exactly one hot_text target must have is_correct: true. Found ${correctTargetIds.length}.`,
      "invalid_hot_text_correct_target_count",
    );
  }

  const correctAnswer =
    questionJson.correct_answer;

  if (!Array.isArray(correctAnswer)) {
    addError(
      issues,
      "question_json.correct_answer",
      "hot_text correct_answer must be an array.",
      "invalid_correct_answer",
    );
  } else {
    if (correctAnswer.length !== 1) {
      addError(
        issues,
        "question_json.correct_answer",
        "hot_text correct_answer must contain exactly one target id.",
        "invalid_correct_answer_count",
      );
    }

    const normalizedAnswerIds =
      correctAnswer
        .map(normalizeString)
        .filter(Boolean);

    if (
      new Set(normalizedAnswerIds).size !==
      normalizedAnswerIds.length
    ) {
      addError(
        issues,
        "question_json.correct_answer",
        "hot_text correct_answer must not contain duplicate ids.",
        "duplicate_correct_answer_ids",
      );
    }

    const invalidAnswerIds =
      normalizedAnswerIds.filter(
        (id) => !ids.includes(id),
      );

    if (invalidAnswerIds.length > 0) {
      addError(
        issues,
        "question_json.correct_answer",
        `hot_text correct_answer contains target ids not found in hot_text_targets: ${invalidAnswerIds.join(
          ", ",
        )}.`,
        "correct_answer_not_in_hot_text_targets",
      );
    }

    if (
      correctTargetIds.length === 1 &&
      normalizedAnswerIds.length === 1 &&
      correctTargetIds[0] !==
        normalizedAnswerIds[0]
    ) {
      addError(
        issues,
        "question_json.correct_answer",
        `hot_text correct_answer "${normalizedAnswerIds[0]}" does not match the target marked is_correct: true, "${correctTargetIds[0]}".`,
        "hot_text_correct_answer_mismatch",
      );
    }
  }

  validateHotTextPassageTokens({
    questionJson,
    targetIds: ids,
    issues,
  });
}

/**
 * @param {{
 *   questionJson: object,
 *   targetIds: string[],
 *   issues: Array<object>
 * }} params
 */
function validateHotTextPassageTokens({
  questionJson,
  targetIds,
  issues,
}) {
  const tokens =
    questionJson.passage_tokens;

  if (!Array.isArray(tokens)) {
    addError(
      issues,
      "question_json.passage_tokens",
      "hot_text passage_tokens must be an array.",
      "missing_passage_tokens",
    );

    return;
  }

  if (tokens.length === 0) {
    addError(
      issues,
      "question_json.passage_tokens",
      "hot_text passage_tokens must not be empty.",
      "empty_passage_tokens",
    );

    return;
  }

  const tokenTargetIds = [];

  tokens.forEach((token, index) => {
    const tokenPath =
      `question_json.passage_tokens[${index}]`;

    if (!isPlainObject(token)) {
      addError(
        issues,
        tokenPath,
        "Each passage token must be an object.",
        "invalid_passage_token",
      );

      return;
    }

    if (
      typeof token.text !== "string"
    ) {
      addError(
        issues,
        `${tokenPath}.text`,
        "Each passage token must have a string text value.",
        "invalid_passage_token_text",
      );
    }

    if (
      typeof token.is_target !==
      "boolean"
    ) {
      addError(
        issues,
        `${tokenPath}.is_target`,
        "Each passage token must have a boolean is_target value.",
        "invalid_passage_token_target_flag",
      );

      return;
    }

    if (token.is_target === true) {
      const targetId = normalizeString(
        token.target_id,
      );

      if (!targetId) {
        addError(
          issues,
          `${tokenPath}.target_id`,
          "Target passage tokens must include target_id.",
          "missing_passage_token_target_id",
        );

        return;
      }

      tokenTargetIds.push(targetId);

      if (!targetIds.includes(targetId)) {
        addError(
          issues,
          `${tokenPath}.target_id`,
          `Passage token target_id "${targetId}" does not match any hot_text target.`,
          "passage_token_unknown_target_id",
        );
      }
    } else if (
      token.target_id !== undefined &&
      token.target_id !== null
    ) {
      addWarning(
        issues,
        `${tokenPath}.target_id`,
        "Non-target passage tokens should not include target_id.",
        "unexpected_passage_token_target_id",
      );
    }
  });

  if (
    new Set(tokenTargetIds).size !==
    tokenTargetIds.length
  ) {
    addError(
      issues,
      "question_json.passage_tokens",
      "Each hot-text target must appear in passage_tokens exactly once.",
      "duplicate_passage_token_target_ids",
    );
  }

  const missingTokenTargets =
    targetIds.filter(
      (id) => !tokenTargetIds.includes(id),
    );

  if (missingTokenTargets.length > 0) {
    addError(
      issues,
      "question_json.passage_tokens",
      `The following hot-text targets are missing from passage_tokens: ${missingTokenTargets.join(
        ", ",
      )}.`,
      "hot_text_targets_missing_from_tokens",
    );
  }

  const reconstructedPassage =
    tokens
      .map((token) =>
        typeof token?.text === "string"
          ? token.text
          : "",
      )
      .join("");

  if (
    typeof questionJson.passage ===
      "string" &&
    reconstructedPassage !==
      questionJson.passage
  ) {
    addError(
      issues,
      "question_json.passage_tokens",
      "Concatenating passage_tokens must reproduce question_json.passage exactly.",
      "passage_tokens_do_not_match_passage",
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
  if (!normalizeString(questionJson.passage)) {
    addError(
      issues,
      "question_json.passage",
      "constructed_response requires a non-empty passage.",
      "missing_constructed_response_passage",
    );
  }

  if (
    questionJson.answer_options !== null
  ) {
    addError(
      issues,
      "question_json.answer_options",
      "constructed_response answer_options must be null.",
      "unexpected_answer_options",
    );
  }

  if (
    questionJson.hot_text_targets !== null &&
    questionJson.hot_text_targets !== undefined
  ) {
    addError(
      issues,
      "question_json.hot_text_targets",
      "constructed_response hot_text_targets must be null.",
      "unexpected_hot_text_targets",
    );
  }

  const modelAnswer = normalizeString(
    questionJson.correct_answer,
  );

  if (!modelAnswer) {
    addError(
      issues,
      "question_json.correct_answer",
      "constructed_response correct_answer must be a non-empty model answer string.",
      "invalid_model_answer",
    );
  } else if (
    modelAnswer.length < 40
  ) {
    addWarning(
      issues,
      "question_json.correct_answer",
      "The constructed-response model answer may be too short to support reliable scoring.",
      "model_answer_too_short",
    );
  }

  const rubric =
    questionJson.scoring_rubric;

  if (!isPlainObject(rubric)) {
    addError(
      issues,
      "question_json.scoring_rubric",
      "constructed_response scoring_rubric must be an object.",
      "invalid_scoring_rubric",
    );

    return;
  }

  const requiredKeys = ["0", "1", "2"];
  const actualKeys = Object.keys(rubric);

  requiredKeys.forEach((key) => {
    if (!(key in rubric)) {
      addError(
        issues,
        `question_json.scoring_rubric.${key}`,
        `constructed_response scoring_rubric is missing score "${key}".`,
        "missing_scoring_rubric_level",
      );

      return;
    }

    if (!normalizeString(rubric[key])) {
      addError(
        issues,
        `question_json.scoring_rubric.${key}`,
        `constructed_response scoring_rubric score "${key}" must be a non-empty string.`,
        "invalid_scoring_rubric_level",
      );
    }
  });

  const extraKeys =
    actualKeys.filter(
      (key) => !requiredKeys.includes(key),
    );

  if (extraKeys.length > 0) {
    addError(
      issues,
      "question_json.scoring_rubric",
      `constructed_response scoring_rubric may only contain keys 0, 1, and 2. Extra keys: ${extraKeys.join(
        ", ",
      )}.`,
      "unexpected_scoring_rubric_levels",
    );
  }

  if (
    !questionJson.next_question_logic
      ?.if_partial
  ) {
    addError(
      issues,
      "question_json.next_question_logic.if_partial",
      "constructed_response requires an if_partial next-question branch.",
      "missing_partial_branch",
    );
  }
}

/**
 * @param {object} questionJson
 * @param {Array<object>} issues
 */
function validateNextQuestionLogic(
  questionJson,
  issues,
) {
  const logic =
    questionJson.next_question_logic;

  if (!isPlainObject(logic)) {
    addError(
      issues,
      "question_json.next_question_logic",
      "next_question_logic must be an object.",
      "invalid_next_question_logic",
    );

    return;
  }

  const requiredBranches = [
    "if_correct",
    "if_incorrect",
  ];

  requiredBranches.forEach((branchName) => {
    const branch = logic[branchName];

    if (!isPlainObject(branch)) {
      addError(
        issues,
        `question_json.next_question_logic.${branchName}`,
        `${branchName} must be an object.`,
        "invalid_next_question_branch",
      );

      return;
    }

    const dokLevel = Number(
      branch.dok_level,
    );

    if (![1, 2, 3].includes(dokLevel)) {
      addError(
        issues,
        `question_json.next_question_logic.${branchName}.dok_level`,
        `${branchName}.dok_level must be 1, 2, or 3.`,
        "invalid_next_question_dok",
      );
    }

    if (!normalizeString(branch.action)) {
      addError(
        issues,
        `question_json.next_question_logic.${branchName}.action`,
        `${branchName}.action must be a non-empty string.`,
        "invalid_next_question_action",
      );
    }
  });

  if (
    logic.if_partial !== undefined &&
    logic.if_partial !== null
  ) {
    const branch = logic.if_partial;

    if (!isPlainObject(branch)) {
      addError(
        issues,
        "question_json.next_question_logic.if_partial",
        "if_partial must be an object when provided.",
        "invalid_next_question_branch",
      );

      return;
    }

    if (
      ![1, 2, 3].includes(
        Number(branch.dok_level),
      )
    ) {
      addError(
        issues,
        "question_json.next_question_logic.if_partial.dok_level",
        "if_partial.dok_level must be 1, 2, or 3.",
        "invalid_next_question_dok",
      );
    }

    if (!normalizeString(branch.action)) {
      addError(
        issues,
        "question_json.next_question_logic.if_partial.action",
        "if_partial.action must be a non-empty string.",
        "invalid_next_question_action",
      );
    }
  }
}

/**
 * Validates question/answer consistency for the currently active
 * production question types.
 *
 * Supported:
 * - multiple_choice
 * - multi_select
 * - hot_text
 * - constructed_response
 *
 * Not yet supported:
 * - inline_choice
 * - drag_and_drop
 * - matching
 * - sequence
 * - grid
 * - complete_table
 * - evidence_pair
 *
 * @param {{
 *   rowQuestionType?: string|null,
 *   questionJson: object
 * }} params
 *
 * @returns {{
 *   success: boolean,
 *   issues: Array<{
 *     severity: "error"|"warning",
 *     path: string,
 *     message: string,
 *     code: string
 *   }>,
 *   errors: Array<object>,
 *   warnings: Array<object>
 * }}
 */
export function validateQuestionAnswerConsistency({
  rowQuestionType = null,
  questionJson,
}) {
  const issues = [];

  const isValidObject =
    validateBaseQuestionJson(
      questionJson,
      issues,
    );

  if (!isValidObject) {
    return buildValidationResult(issues);
  }

  const jsonQuestionType =
    normalizeString(
      questionJson.question_type,
    );

  const normalizedRowType =
    normalizeString(rowQuestionType);

  if (
    normalizedRowType &&
    jsonQuestionType &&
    normalizedRowType !==
      jsonQuestionType
  ) {
    addError(
      issues,
      "question_json.question_type",
      `Row question_type "${normalizedRowType}" does not match question_json.question_type "${jsonQuestionType}".`,
      "row_question_type_mismatch",
    );
  }

  validateNextQuestionLogic(
    questionJson,
    issues,
  );

  switch (jsonQuestionType) {
    case "multiple_choice":
      validateMultipleChoice(
        questionJson,
        issues,
      );
      break;

    case "multi_select":
      validateMultiSelect(
        questionJson,
        issues,
      );
      break;

    case "hot_text":
      validateHotText(
        questionJson,
        issues,
      );
      break;

    case "constructed_response":
      validateConstructedResponse(
        questionJson,
        issues,
      );
      break;

    case "inline_choice":
      addError(
        issues,
        "question_json.question_type",
        "inline_choice is currently paused and cannot be published to passage_question_bank.",
        "paused_question_type",
      );
      break;

    default:
      addError(
        issues,
        "question_json.question_type",
        `Question type "${jsonQuestionType}" is not yet supported by the passage-question-bank consistency validator.`,
        "unsupported_question_type",
      );
      break;
  }

  return buildValidationResult(issues);
}

/**
 * @param {Array<object>} issues
 */
function buildValidationResult(issues) {
  const errors = issues.filter(
    (issue) =>
      issue.severity === "error",
  );

  const warnings = issues.filter(
    (issue) =>
      issue.severity === "warning",
  );

  return {
    success: errors.length === 0,
    issues,
    errors,
    warnings,
  };
}

export default validateQuestionAnswerConsistency;