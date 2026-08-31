// /libs/adaptive/questionBank/validatePassageQuestionBankPackage.js
//
// Package-level validation for one passage_bank draft and its related
// passage_question_bank draft rows.
//
// This validator checks relationships that cannot be validated reliably
// by inspecting a single question row alone.
//
// It does not:
// - insert passage_bank rows
// - insert passage_question_bank rows
// - authenticate administrators
// - call OpenAI
// - approve or activate content

import { validatePassageQuestionBankRows } from "./validatePassageQuestionBankRow";
import { calculateStemSimilarity } from "@/libs/questionStemSimilarity";
import {
  getElaPassageBankTeksCluster,
  isAllowedElaPackageQuestionTeks,
} from "@/libs/constants/elaPassageBankTeksClusters";
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

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Validates optional structured stimulus metadata.
 *
 * Current supported top-level shape:
 * {
 *   version: number,
 *   blocks: Array<object>
 * }
 *
 * stimulus_json remains optional so legacy passages continue
 * to validate without structured stimulus data.
 *
 * @param {unknown} stimulusJson
 * @param {Array<object>} issues
 */
function validateStimulusJson(stimulusJson, issues) {
  if (stimulusJson === undefined || stimulusJson === null) {
    return;
  }

  if (!isPlainObject(stimulusJson)) {
    addIssue(
      issues,
      "passage.stimulus_json",
      "passage.stimulus_json must be a JSON object when provided.",
      "invalid_stimulus_json",
    );

    return;
  }

  const version = Number(stimulusJson.version ?? 1);

  if (!Number.isInteger(version) || version < 1) {
    addIssue(
      issues,
      "passage.stimulus_json.version",
      "stimulus_json.version must be a positive integer.",
      "invalid_stimulus_version",
    );
  }

  if (!Array.isArray(stimulusJson.blocks)) {
    addIssue(
      issues,
      "passage.stimulus_json.blocks",
      "stimulus_json.blocks must be an array.",
      "invalid_stimulus_blocks",
    );

    return;
  }

  if (stimulusJson.blocks.length === 0) {
    addIssue(
      issues,
      "passage.stimulus_json.blocks",
      "stimulus_json.blocks should contain at least one stimulus block.",
      "empty_stimulus_blocks",
      "warning",
    );

    return;
  }

  const seenBlockIds = new Set();

  stimulusJson.blocks.forEach((block, index) => {
    const blockPath = `passage.stimulus_json.blocks[${index}]`;

    if (!isPlainObject(block)) {
      addIssue(
        issues,
        blockPath,
        "Each stimulus block must be a JSON object.",
        "invalid_stimulus_block",
      );

      return;
    }

    const id = normalizeOptionalString(block.id);
    const type = normalizeOptionalString(block.type)?.toLowerCase();

    if (!id) {
      addIssue(
        issues,
        `${blockPath}.id`,
        "Each stimulus block must include an id.",
        "required",
      );
    } else if (seenBlockIds.has(id)) {
      addIssue(
        issues,
        `${blockPath}.id`,
        `Duplicate stimulus block id "${id}".`,
        "duplicate_stimulus_block_id",
      );
    } else {
      seenBlockIds.add(id);
    }

    if (!type) {
      addIssue(
        issues,
        `${blockPath}.type`,
        "Each stimulus block must include a type.",
        "required",
      );

      return;
    }

    const supportedTypes = new Set([
      "section",
      "diagram",
      "sidebar",
      "caption",
      "image",
      "table",
      "chart",
      "map",
      "timeline",
      "note",
    ]);

    if (!supportedTypes.has(type)) {
      addIssue(
        issues,
        `${blockPath}.type`,
        `Unsupported stimulus block type "${type}".`,
        "unsupported_stimulus_block_type",
        "warning",
      );
    }

    if (type === "section") {
      if (!normalizeOptionalString(block.heading)) {
        addIssue(
          issues,
          `${blockPath}.heading`,
          "Section blocks should include a heading.",
          "recommended_metadata_missing",
          "warning",
        );
      }

      if (!normalizeOptionalString(block.text)) {
        addIssue(
          issues,
          `${blockPath}.text`,
          "Section blocks must include text.",
          "required",
        );
      }
    }

    if (type === "diagram") {
      if (!normalizeOptionalString(block.title)) {
        addIssue(
          issues,
          `${blockPath}.title`,
          "Diagram blocks should include a title.",
          "recommended_metadata_missing",
          "warning",
        );
      }

      if (
        block.labels !== undefined &&
        !Array.isArray(block.labels)
      ) {
        addIssue(
          issues,
          `${blockPath}.labels`,
          "Diagram labels must be an array when provided.",
          "invalid_diagram_labels",
        );
      }

      if (
        Array.isArray(block.labels) &&
        block.labels.length === 0
      ) {
        addIssue(
          issues,
          `${blockPath}.labels`,
          "Diagram blocks should include at least one label.",
          "recommended_metadata_missing",
          "warning",
        );
      }

      if (!normalizeOptionalString(block.alt_text)) {
        addIssue(
          issues,
          `${blockPath}.alt_text`,
          "Diagram blocks should include alt_text for accessible rendering.",
          "recommended_metadata_missing",
          "warning",
        );
      }
    }

    if (type === "sidebar") {
      if (!normalizeOptionalString(block.title)) {
        addIssue(
          issues,
          `${blockPath}.title`,
          "Sidebar blocks should include a title.",
          "recommended_metadata_missing",
          "warning",
        );
      }

      if (
        block.items !== undefined &&
        !Array.isArray(block.items)
      ) {
        addIssue(
          issues,
          `${blockPath}.items`,
          "Sidebar items must be an array when provided.",
          "invalid_sidebar_items",
        );
      }
    }
  });
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
function normalizeComparableString(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
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
 * @param {Array<object>} issues
 * @param {string} path
 * @param {string} message
 * @param {string} code
 * @param {"error"|"warning"} severity
 */
function addIssue(
  issues,
  path,
  message,
  code = "invalid_value",
  severity = "error",
) {
  issues.push({
    path,
    message,
    code,
    severity,
  });
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function normalizeDokLevel(value) {
  const normalized = Number(value);

  return [1, 2, 3].includes(normalized) ? normalized : null;
}

/**
 * @param {object} passage
 * @returns {string|null}
 */
function getPassageText(passage) {
  return (
    normalizeOptionalString(passage?.passage) ||
    normalizeOptionalString(passage?.stimulus)
  );
}

/**
 * @param {object} question
 * @returns {object|null}
 */
function getQuestionJson(question) {
  return isPlainObject(question?.question_json) ? question.question_json : null;
}

/**
 * @param {object} questionJson
 * @returns {string|null}
 */
function getStem(questionJson) {
  return (
    normalizeOptionalString(questionJson?.stem) ||
    normalizeOptionalString(questionJson?.question) ||
    normalizeOptionalString(questionJson?.prompt)
  );
}

/**
 * @param {object} questionJson
 * @returns {string|null}
 */
function getQuestionPassage(questionJson) {
  return (
    normalizeOptionalString(questionJson?.passage) ||
    normalizeOptionalString(questionJson?.stimulus)
  );
}

/**
 * @param {object} questionJson
 * @returns {unknown}
 */
function getCorrectAnswer(questionJson) {
  return (
    questionJson?.correct_answer ??
    questionJson?.correctAnswer ??
    questionJson?.answer ??
    null
  );
}

/**
 * @param {object} questionJson
 * @returns {Array<object>}
 */
function getHotTextTargets(questionJson) {
  return Array.isArray(questionJson?.hot_text_targets)
    ? questionJson.hot_text_targets
    : [];
}

/**
 * @param {object} questionJson
 * @returns {object|null}
 */
function getCorrectHotTextTarget(questionJson) {
  const targets = getHotTextTargets(questionJson);

  const correctAnswer = getCorrectAnswer(questionJson);

  const answerIds = Array.isArray(correctAnswer)
    ? correctAnswer.map(normalizeOptionalString).filter(Boolean)
    : [normalizeOptionalString(correctAnswer)].filter(Boolean);

  const embeddedCorrect = targets.filter(
    (target) => isPlainObject(target) && target.is_correct === true,
  );

  if (embeddedCorrect.length === 1) {
    return embeddedCorrect[0];
  }

  if (answerIds.length === 1) {
    return (
      targets.find(
        (target) => normalizeOptionalString(target?.id) === answerIds[0],
      ) || null
    );
  }

  return null;
}

/**
 * Converts a target key into a stable comparison value.
 *
 * Current generated hot-text questions commonly use target IDs such as ht1.
 * Future generators may use a semantic key instead.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeTargetKey(value) {
  return normalizeOptionalString(value)?.toLowerCase() ?? null;
}

/**
 * @param {string} targetScene
 * @param {string} passageText
 * @returns {boolean}
 */
function passageContainsScene(targetScene, passageText) {
  const normalizedTarget = targetScene.trim().replace(/^scene\s*/i, "");

  if (!normalizedTarget) {
    return false;
  }

  const escaped = normalizedTarget.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const pattern = new RegExp(`\\bSCENE\\s+${escaped}\\b`, "i");

  return pattern.test(passageText);
}

/**
 * Validates the passage object.
 *
 * @param {object} passage
 * @param {Array<object>} issues
 */
function validatePassageMetadata(passage, issues) {
  if (!isPlainObject(passage)) {
    addIssue(
      issues,
      "passage",
      "The package must include a passage object.",
      "invalid_passage",
    );

    return;
  }

  const requiredStringFields = [
    "subject",
    "grade_level",
    "teks_standard",
    "passage_format",
    "title",
  ];

  for (const field of requiredStringFields) {
    if (!normalizeOptionalString(passage[field])) {
      addIssue(
        issues,
        `passage.${field}`,
        `passage.${field} is required.`,
        "required",
      );
    }
  }

  if (!getPassageText(passage)) {
    addIssue(
      issues,
      "passage.passage",
      "passage.passage must contain the complete shared stimulus.",
      "required",
    );
  }

  if (passage.is_active === true) {
    addIssue(
      issues,
      "passage.is_active",
      "Generated passage drafts must not be active before review and publishing.",
      "draft_cannot_be_active",
    );
  }

  const difficultyLevel = Number(passage.difficulty_level);

  if (
    passage.difficulty_level !== undefined &&
    (!Number.isFinite(difficultyLevel) || difficultyLevel < 1)
  ) {
    addIssue(
      issues,
      "passage.difficulty_level",
      "passage.difficulty_level must be a positive number when provided.",
      "invalid_difficulty_level",
    );
  }

  if (passage.skill_tags !== undefined && !Array.isArray(passage.skill_tags)) {
    addIssue(
      issues,
      "passage.skill_tags",
      "passage.skill_tags must be an array when provided.",
      "invalid_skill_tags",
    );
  }
  validateStimulusJson(
  passage.stimulus_json,
  issues,
);
}

/**
 * Validates one question against the parent passage metadata.
 *
 * @param {{
 *   passage: object,
 *   passageText: string,
 *   question: object,
 *   questionIndex: number,
 *   issues: Array<object>
 * }} params
 */
function validateQuestionAgainstPassage({
  passage,
  passageText,
  question,
  questionIndex,
  issues,
  allowQuestionTeksMismatch = false,
}) {
  const rowPath = `questions[${questionIndex}]`;

  if (!isPlainObject(question)) {
    addIssue(
      issues,
      rowPath,
      "Each package question must be an object.",
      "invalid_question",
    );

    return;
  }

  const questionJson = getQuestionJson(question);

  if (!questionJson) {
    addIssue(
      issues,
      `${rowPath}.question_json`,
      "Each package question must include question_json.",
      "required",
    );

    return;
  }

  const passageSubject = normalizeOptionalString(passage.subject);

  const questionSubject = normalizeOptionalString(question.subject);

  if (questionSubject && passageSubject && questionSubject !== passageSubject) {
    addIssue(
      issues,
      `${rowPath}.subject`,
      `Question subject "${questionSubject}" does not match passage subject "${passageSubject}".`,
      "package_subject_mismatch",
    );
  }

  const passageGrade = normalizeOptionalString(
    String(passage.grade_level ?? ""),
  );

  const questionGrade = normalizeOptionalString(
    String(question.grade_level ?? ""),
  );

  if (questionGrade && passageGrade && questionGrade !== passageGrade) {
    addIssue(
      issues,
      `${rowPath}.grade_level`,
      `Question grade_level "${questionGrade}" does not match passage grade_level "${passageGrade}".`,
      "package_grade_mismatch",
    );
  }

  const passageTeks = normalizeOptionalString(passage.teks_standard);

  const rowTeks = normalizeOptionalString(question.teks_standard);

  const jsonTeks = normalizeOptionalString(questionJson.teks_standard);

  /*
   * The row TEKS and question_json TEKS must always match each other.
   */
  if (rowTeks && jsonTeks && rowTeks !== jsonTeks) {
    addIssue(
      issues,
      `${rowPath}.question_json.teks_standard`,
      `Question row TEKS "${rowTeks}" does not match question_json TEKS "${jsonTeks}".`,
      "question_teks_mismatch",
    );
  }

  /*
   * ELA packages may contain the primary passage TEKS plus approved
   * supporting TEKS from the configured passage-bank cluster.
   */
  if (passageSubject === "ELA" && passageTeks) {
    const cluster = getElaPassageBankTeksCluster(passageTeks);

    if (!cluster) {
      addIssue(
        issues,
        "passage.teks_standard",
        `No ELA passage-bank TEKS cluster is configured for primary TEKS "${passageTeks}".`,
        "unsupported_primary_teks",
      );
    }

    if (
      rowTeks &&
      !isAllowedElaPackageQuestionTeks({
        primaryTeks: passageTeks,

        questionTeks: rowTeks,
      })
    ) {
      addIssue(
        issues,
        `${rowPath}.teks_standard`,
        `Question TEKS "${rowTeks}" is not allowed for primary passage TEKS "${passageTeks}".`,
        "question_teks_not_in_cluster",
      );
    }

    if (
      jsonTeks &&
      !isAllowedElaPackageQuestionTeks({
        primaryTeks: passageTeks,

        questionTeks: jsonTeks,
      })
    ) {
      addIssue(
        issues,
        `${rowPath}.question_json.teks_standard`,
        `question_json TEKS "${jsonTeks}" is not allowed for primary passage TEKS "${passageTeks}".`,
        "question_teks_not_in_cluster",
      );
    }
  } else {
    /*
     * Non-ELA subjects retain the existing exact-match behavior
     * until subject-specific TEKS clusters are added.
     */
   if (!allowQuestionTeksMismatch) {
      if (
        rowTeks &&
        passageTeks &&
        rowTeks !== passageTeks
      ) {
        addIssue(
          issues,
          `${rowPath}.teks_standard`,
          `Question row TEKS "${rowTeks}" does not match passage TEKS "${passageTeks}".`,
          "package_teks_mismatch",
        );
      }

      if (
        jsonTeks &&
        passageTeks &&
        jsonTeks !== passageTeks
      ) {
        addIssue(
          issues,
          `${rowPath}.question_json.teks_standard`,
          `question_json TEKS "${jsonTeks}" does not match passage TEKS "${passageTeks}".`,
          "package_teks_mismatch",
        );
      }
    }
  }

  const rowType = normalizeQuestionType(question.question_type);

  const jsonType = normalizeQuestionType(questionJson.question_type);

  if (rowType && jsonType && rowType !== jsonType) {
    addIssue(
      issues,
      `${rowPath}.question_json.question_type`,
      `Question row type "${rowType}" does not match question_json type "${jsonType}".`,
      "package_question_type_mismatch",
    );
  }

  const rowDok = normalizeDokLevel(question.dok_level);

  const jsonDok = normalizeDokLevel(questionJson.dok_level);

  if (rowDok && jsonDok && rowDok !== jsonDok) {
    addIssue(
      issues,
      `${rowPath}.question_json.dok_level`,
      `Question row DOK ${rowDok} does not match question_json DOK ${jsonDok}.`,
      "package_dok_mismatch",
    );
  }

  const rowSkillFocus = normalizeOptionalString(question.skill_focus);

  const jsonSkillFocus = normalizeOptionalString(questionJson.skill_focus);

  if (rowSkillFocus && jsonSkillFocus && rowSkillFocus !== jsonSkillFocus) {
    addIssue(
      issues,
      `${rowPath}.question_json.skill_focus`,
      `Question row skill_focus "${rowSkillFocus}" does not match question_json skill_focus "${jsonSkillFocus}".`,
      "package_skill_focus_mismatch",
    );
  }

  const rowAssessmentMove = normalizeOptionalString(question.assessment_move);

  const jsonAssessmentMove = normalizeOptionalString(
    questionJson.assessment_move,
  );

  if (
    rowAssessmentMove &&
    jsonAssessmentMove &&
    rowAssessmentMove !== jsonAssessmentMove
  ) {
    addIssue(
      issues,
      `${rowPath}.question_json.assessment_move`,
      `Question row assessment_move "${rowAssessmentMove}" does not match question_json assessment_move "${jsonAssessmentMove}".`,
      "package_assessment_move_mismatch",
    );
  }

  const questionPassage = getQuestionPassage(questionJson);

  if (questionPassage && passageText && questionPassage !== passageText) {
    addIssue(
      issues,
      `${rowPath}.question_json.passage`,
      "question_json.passage must exactly match the package's shared passage.",
      "shared_passage_mismatch",
    );
  }

  if (
    !questionPassage &&
    ["hot_text", "constructed_response"].includes(rowType)
  ) {
    addIssue(
      issues,
      `${rowPath}.question_json.passage`,
      `${rowType} questions must contain the shared passage.`,
      "missing_shared_passage",
    );
  }

  validateQuestionTargetMetadata({
    passage,
    passageText,
    question,
    questionJson,
    questionType: rowType,
    questionIndex,
    issues,
  });
}

/**
 * Validates question-bank targeting metadata.
 *
 * @param {{
 *   passage: object,
 *   passageText: string,
 *   question: object,
 *   questionJson: object,
 *   questionType: string|null,
 *   questionIndex: number,
 *   issues: Array<object>
 * }} params
 */
function validateQuestionTargetMetadata({
  passage,
  passageText,
  question,
  questionJson,
  questionType,
  questionIndex,
  issues,
}) {
  const rowPath = `questions[${questionIndex}]`;

  const passageFormat = normalizeOptionalString(
    passage.passage_format,
  )?.toLowerCase();

  const targetScene = normalizeOptionalString(question.target_scene);

  const dramaticFunction = normalizeOptionalString(question.dramatic_function);

  if (
    targetScene &&
    passageText &&
    !passageContainsScene(targetScene, passageText)
  ) {
    addIssue(
      issues,
      `${rowPath}.target_scene`,
      `target_scene "${targetScene}" was not found in the shared drama passage.`,
      "target_scene_not_in_passage",
    );
  }

  const correctTargetText = normalizeOptionalString(
    question.correct_target_text,
  );

  if (
    correctTargetText &&
    passageText &&
    !passageText.includes(correctTargetText)
  ) {
    addIssue(
      issues,
      `${rowPath}.correct_target_text`,
      "correct_target_text must appear exactly in the shared passage.",
      "correct_target_text_not_in_passage",
    );
  }

  if (questionType !== "hot_text") {
    return;
  }

  const correctTarget = getCorrectHotTextTarget(questionJson);

  if (!correctTarget) {
    return;
  }

  const targetId = normalizeTargetKey(correctTarget.id);

  const targetText = normalizeOptionalString(correctTarget.text);

  const rowTargetKey = normalizeTargetKey(question.correct_target_key);

  if (!rowTargetKey) {
    addIssue(
      issues,
      `${rowPath}.correct_target_key`,
      "Hot-text bank questions must include correct_target_key.",
      "required",
    );
  } else if (targetId && rowTargetKey !== targetId) {
    addIssue(
      issues,
      `${rowPath}.correct_target_key`,
      `correct_target_key "${rowTargetKey}" does not match the correct hot-text target id "${targetId}".`,
      "correct_target_key_mismatch",
    );
  }

  if (!correctTargetText) {
    addIssue(
      issues,
      `${rowPath}.correct_target_text`,
      "Hot-text bank questions must include correct_target_text.",
      "required",
    );
  } else if (targetText && correctTargetText !== targetText) {
    addIssue(
      issues,
      `${rowPath}.correct_target_text`,
      "correct_target_text does not match the correct hot-text target text.",
      "correct_target_text_mismatch",
    );
  }
}

/**
 * Creates a frequency map for normalized non-empty values.
 *
 * @param {Array<object>} questions
 * @param {(question: object) => unknown} selector
 * @returns {Map<string, {
 *   value: string,
 *   indexes: number[]
 * }>}
 */
function buildValueFrequencyMap(questions, selector) {
  const frequencyMap = new Map();

  questions.forEach((question, index) => {
    const originalValue = normalizeOptionalString(selector(question));

    const normalizedValue = normalizeComparableString(originalValue);

    if (!normalizedValue) {
      return;
    }

    const existing = frequencyMap.get(normalizedValue);

    if (existing) {
      existing.indexes.push(index);

      return;
    }

    frequencyMap.set(normalizedValue, {
      value: originalValue,

      indexes: [index],
    });
  });

  return frequencyMap;
}

/**
 * Warns when one metadata value dominates a sufficiently large package.
 *
 * For small packages, repeated metadata may be intentional. Apply this
 * concentration warning only when the package contains at least 4 questions.
 *
 * @param {{
 *   questions: Array<object>,
 *   issues: Array<object>,
 *   field: string,
 *   label: string,
 *   selector: (question: object) => unknown,
 *   code: string
 * }} params
 */
function warnAboutRepeatedMetadata({
  questions,
  issues,
  field,
  label,
  selector,
  code,
}) {
  if (questions.length < 4) {
    return;
  }

  const frequencyMap = buildValueFrequencyMap(questions, selector);

  for (const entry of frequencyMap.values()) {
    const count = entry.indexes.length;

    const concentration = count / questions.length;

    /*
     * Warn when the same value appears in at least 3 questions and
     * represents at least 60% of the package.
     */
    if (count < 3 || concentration < 0.6) {
      continue;
    }

    const firstIndex = entry.indexes[0];

    addIssue(
      issues,

      `questions[${firstIndex}].${field}`,

      `${count} of ${questions.length} questions use ${label} "${entry.value}". Consider increasing question variety.`,

      code,

      "warning",
    );
  }
}

/**
 * Checks duplicate stems, reused targets, metadata concentration,
 * and DOK distribution across the package.
 *
 * @param {object} passage
 * @param {Array<object>} questions
 * @param {Array<object>} issues
 */
function validatePackageVariety(passage, questions, issues) {
  const seenStems = new Map();
  const normalizedStems = [];
  const seenTargetTexts = new Map();

  questions.forEach((question, index) => {
    const questionJson = getQuestionJson(question);

    if (!questionJson) {
      return;
    }

    const stem = getStem(questionJson);
    if (stem) {
      normalizedStems.push({
        index,
        stem,
      });
    }

    const normalizedStem = normalizeComparableString(stem);

    if (normalizedStem) {
      if (seenStems.has(normalizedStem)) {
        addIssue(
          issues,

          `questions[${index}].question_json.stem`,

          `Question stem duplicates questions[${seenStems.get(
            normalizedStem,
          )}].question_json.stem.`,

          "duplicate_question_stem",
        );
      } else {
        seenStems.set(normalizedStem, index);
      }
    }

    const targetText = normalizeComparableString(question.correct_target_text);

    if (targetText) {
      if (seenTargetTexts.has(targetText)) {
        addIssue(
          issues,

          `questions[${index}].correct_target_text`,

          `correct_target_text duplicates questions[${seenTargetTexts.get(
            targetText,
          )}].correct_target_text.`,

          "duplicate_correct_target_text",

          "warning",
        );
      } else {
        seenTargetTexts.set(targetText, index);
      }
    }
  });
  for (
    let firstIndex = 0;
    firstIndex < normalizedStems.length;
    firstIndex += 1
  ) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < normalizedStems.length;
      secondIndex += 1
    ) {
      const first = normalizedStems[firstIndex];

      const second = normalizedStems[secondIndex];

      const firstComparable = normalizeComparableString(first.stem);

      const secondComparable = normalizeComparableString(second.stem);

      /*
       * Exact duplicates are already handled above.
       */
      if (firstComparable === secondComparable) {
        continue;
      }

      const similarity = calculateStemSimilarity(first.stem, second.stem);

      if (similarity >= 0.6) {
        addIssue(
          issues,

          `questions[${second.index}].question_json.stem`,

          `Question stem is highly similar to questions[${first.index}].question_json.stem. Consider varying the question focus or wording.`,

          "near_duplicate_question_stem",

          "warning",
        );
      }
    }
  }

  /*
   * ----------------------------------------------------------
   * Shared genre-neutral variation checks
   * ----------------------------------------------------------
   */

  warnAboutRepeatedMetadata({
    questions,
    issues,

    field: "skill_focus",

    label: "skill_focus",

    selector: (question) =>
      question.skill_focus ?? question.question_json?.skill_focus,

    code: "repeated_skill_focus",
  });

  warnAboutRepeatedMetadata({
    questions,
    issues,

    field: "assessment_move",

    label: "assessment_move",

    selector: (question) =>
      question.assessment_move ?? question.question_json?.assessment_move,

    code: "repeated_assessment_move",
  });

  /*
   * ----------------------------------------------------------
   * Drama-specific variation checks
   * ----------------------------------------------------------
   */

  const passageFormat = normalizeOptionalString(
    passage?.passage_format,
  )?.toLowerCase();

  if (passageFormat === "drama") {
    warnAboutRepeatedMetadata({
      questions,
      issues,

      field: "target_scene",

      label: "target_scene",

      selector: (question) => question.target_scene,

      code: "repeated_target_scene",
    });

    warnAboutRepeatedMetadata({
      questions,
      issues,

      field: "dramatic_function",

      label: "dramatic_function",

      selector: (question) => question.dramatic_function,

      code: "repeated_dramatic_function",
    });
  }

  /*
   * ----------------------------------------------------------
   * DOK coverage
   * ----------------------------------------------------------
   */

  if (questions.length >= 4) {
    const dokCounts = {
      1: 0,
      2: 0,
      3: 0,
    };

    questions.forEach((question) => {
      const dokLevel = normalizeDokLevel(
        question.dok_level ?? question.question_json?.dok_level,
      );

      if (dokLevel) {
        dokCounts[dokLevel] += 1;
      }
    });

    const presentDokLevels = [1, 2, 3].filter((level) => dokCounts[level] > 0);

    if (presentDokLevels.length === 1) {
      const onlyDok = presentDokLevels[0];

      addIssue(
        issues,

        "questions",

        `All ${questions.length} questions use DOK ${onlyDok}. Consider adding questions at other DOK levels.`,

        "single_dok_package",

        "warning",
      );
    }

    /*
     * Only add concentration warnings when the package already
     * contains more than one DOK level. This prevents duplicating
     * the single-DOK warning above.
     */
    if (presentDokLevels.length > 1) {
      for (const level of [1, 2, 3]) {
        const count = dokCounts[level];

        if (count >= 3 && count / questions.length >= 0.75) {
          addIssue(
            issues,

            "questions",

            `${count} of ${questions.length} questions use DOK ${level}. Consider balancing the package across additional DOK levels.`,

            "dok_concentration",

            "warning",
          );
        }
      }
    }

    /*
     * DOK 3 is most meaningful for packages intended to contain
     * several reviewed questions. Avoid warning on very small drafts.
     */
    if (questions.length >= 6 && dokCounts[3] === 0) {
      addIssue(
        issues,

        "questions",

        "This package contains no DOK 3 questions.",

        "missing_dok_3",

        "warning",
      );
    }
  }
}

/**
 * Ensures the package contains at least one question aligned to
 * the passage's primary TEKS.
 *
 * @param {object} passage
 * @param {Array<object>} questions
 * @param {Array<object>} issues
 */
function validatePrimaryTeksCoverage(passage, questions, issues,requirePrimaryTeksQuestion = true) {
    // Attach-question packages may intentionally contain
  // only a secondary TEKS bank for an existing passage.
  if (!requirePrimaryTeksQuestion) {
    return;
  }
  const primaryTeks = normalizeOptionalString(passage?.teks_standard);

  if (!primaryTeks || !Array.isArray(questions)) {
    return;
  }

  const primaryQuestionCount = questions.filter((question) => {
    const rowTeks = normalizeOptionalString(question?.teks_standard);

    const jsonTeks = normalizeOptionalString(
      question?.question_json?.teks_standard,
    );

    return rowTeks === primaryTeks || jsonTeks === primaryTeks;
  }).length;

  if (primaryQuestionCount === 0) {
    addIssue(
      issues,
      "questions",
      `The package must contain at least one question aligned to the primary passage TEKS "${primaryTeks}".`,
      "missing_primary_teks_question",
    );
  }
}

/**
 * Builds temporary passage_question_bank-shaped rows so the existing
 * single-row validators can run before a real passage_bank row exists.
 *
 * passage_bank_id is a placeholder only for validation. It is replaced
 * by the protected publishing route after the passage insert succeeds.
 *
 * @param {object} passage
 * @param {Array<object>} questions
 * @returns {Array<object>}
 */
function buildValidationRows(passage, questions) {
  return questions.map((question) => ({
    passage_bank_id: question.passage_bank_id || "pending-passage-bank-id",

    teks_standard: question.teks_standard ?? passage.teks_standard,

    subject: question.subject ?? passage.subject,

    grade_level: question.grade_level ?? passage.grade_level,

    question_type: question.question_type,

    dok_level: question.dok_level,

    skill_focus: question.skill_focus ?? null,

    assessment_move: question.assessment_move ?? null,

    dramatic_function: question.dramatic_function ?? null,

    target_scene: question.target_scene ?? null,

    correct_target_text: question.correct_target_text ?? null,

    correct_target_key: question.correct_target_key ?? null,

    question_json: question.question_json,

    review_status: question.review_status ?? "draft",

    is_active: question.is_active === true,

    times_used: question.times_used ?? 0,

    created_by: question.created_by ?? null,

    reviewed_by: question.reviewed_by ?? null,

    reviewed_at: question.reviewed_at ?? null,
  }));
}

/**
 * Validates one full passage/question-bank draft package.
 *
 * @param {{
 *   passage: object,
 *   questions: Array<object>
 * }} draft
 *
 * * @param {{
 *   allowUnknownQuestionTypes?: boolean,
 *   treatRecommendationsAsErrors?: boolean,
 *   allowQuestionTeksMismatch?: boolean,
 *   requirePrimaryTeksQuestion?: boolean
 * }} [options]
 *
 * @returns {{
 *   success: boolean,
 *   data: {
 *     passage: object,
 *     questions: Array<object>
 *   }|null,
 *   issues: Array<object>,
 *   errors: Array<object>,
 *   warnings: Array<object>,
 *   rowValidation: object|null
 * }}
 */
export function validatePassageQuestionBankPackage(
  draft,
  {
    allowUnknownQuestionTypes = false,
    treatRecommendationsAsErrors = false,
    allowQuestionTeksMismatch = false,
    requirePrimaryTeksQuestion = true,
  } = {},
) {
  const issues = [];

  if (!isPlainObject(draft)) {
    addIssue(
      issues,
      "",
      "Passage question bank draft must be an object.",
      "invalid_package",
    );

    return buildResult({
      draft: null,
      issues,
      rowValidation: null,
    });
  }

  const passage = draft.passage;
  const questions = draft.questions;

  validatePassageMetadata(passage, issues);

  if (!Array.isArray(questions) || questions.length === 0) {
    addIssue(
      issues,
      "questions",
      "The package must include at least one question.",
      "missing_questions",
    );

    return buildResult({
      draft,
      issues,
      rowValidation: null,
    });
  }

    // IMPORTANT — must remain in this scope.
  const passageText =
    getPassageText(passage);
  
  questions.forEach(
    (question, questionIndex) => {
      validateQuestionAgainstPassage({
        passage,
        passageText,
        question,
        questionIndex,
        issues,
        allowQuestionTeksMismatch,
      });
    },
  );

  validatePrimaryTeksCoverage(passage, questions, issues, requirePrimaryTeksQuestion);

  validatePackageVariety(passage, questions, issues);

  const validationRows = buildValidationRows(passage, questions);

  const rowValidation = validatePassageQuestionBankRows(validationRows, {
    passageFormat: passage?.passage_format ?? null,

    allowUnknownQuestionTypes,

    treatRecommendationsAsErrors,
  });

  for (const issue of rowValidation.issues) {
    issues.push({
      ...issue,
      path: issue.path.replace(/^rows/, "questions"),
      severity:
        issue.severity === "warning" ||
        issue.code === "recommended_metadata_missing"
          ? "warning"
          : "error",
    });
  }

  return buildResult({
    draft,
    issues,
    rowValidation,
  });
}

/**
 * @param {{
 *   draft: object|null,
 *   issues: Array<object>,
 *   rowValidation: object|null
 * }} params
 */
function buildResult({ draft, issues, rowValidation }) {
  const warnings = issues.filter(
    (issue) =>
      issue.severity === "warning" ||
      issue.code === "recommended_metadata_missing",
  );

  const errors = issues.filter(
    (issue) =>
      issue.severity !== "warning" &&
      issue.code !== "recommended_metadata_missing",
  );

  return {
    success: errors.length === 0,

    data:
      errors.length === 0 && draft
        ? {
            passage: draft.passage,
            questions: rowValidation?.data ?? draft.questions,
          }
        : null,

    issues,
    errors,
    warnings,
    rowValidation,
  };
}

/**
 * Throws when a package contains blocking validation errors.
 *
 * @param {object} draft
 * @param {object} [options]
 * @returns {object}
 */
export function assertValidPassageQuestionBankPackage(draft, options = {}) {
  const result = validatePassageQuestionBankPackage(draft, options);

  if (!result.success) {
    const message = result.errors
      .map((issue) => `${issue.path || "draft"}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid passage question bank package: ${message}`);
  }

  return result.data;
}

export default validatePassageQuestionBankPackage;
