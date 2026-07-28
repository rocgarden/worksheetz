// /libs/adaptive/questionBank/selectPassageQuestion.js
//
// Shared selector for reviewed passage-based questions.
//
// Works across:
// - all subjects
// - all grade levels
// - all TEKS
// - all passage formats
// - all question types
//
// Drama-specific metadata such as dramatic_function and target_scene is
// optional. When those fields are null, the selector simply ignores them.

const VALID_DOK_LEVELS = new Set([1, 2, 3]);

/**
 * Returns the preferred DOK order for an adaptive target.
 *
 * @param {number} targetDokLevel
 * @returns {number[]}
 */
function getDokPreferenceOrder(targetDokLevel) {
  const preferenceMap = {
    1: [1, 2, 3],
    2: [2, 1, 3],
    3: [3, 2, 1],
  };

  return preferenceMap[targetDokLevel] || [2, 1, 3];
}

/**
 * Normalizes a text value for reliable comparison.
 *
 * This is only used for matching existing metadata. It does not modify
 * anything stored in the database.
 *
 * @param {unknown} value
 * @returns {string|null}
 */
function normalizeText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");

  return normalized || null;
}

/**
 * Adds a normalized value to a Set when the value is usable.
 *
 * @param {Set<string>} targetSet
 * @param {unknown} value
 */
function addNormalizedValue(targetSet, value) {
  const normalized = normalizeText(value);

  if (normalized) {
    targetSet.add(normalized);
  }
}

/**
 * Builds the session history needed for duplicate prevention and diversity.
 *
 * Supported attempt shapes:
 *
 * {
 *   passage_question_bank_id,
 *   passage_question_bank: {
 *     correct_target_key,
 *     correct_target_text,
 *     dramatic_function,
 *     target_scene
 *   }
 * }
 *
 * It also supports flattened metadata on the attempt if that is added later.
 *
 * @param {Array<object>} previousAttempts
 * @returns {{
 *   usedQuestionIds: Set<string>,
 *   usedCorrectTargetKeys: Set<string>,
 *   usedCorrectTargetTexts: Set<string>,
 *   usedDramaticFunctions: Set<string>,
 *   usedTargetScenes: Set<string>
 * }}
 */
function buildQuestionHistory(previousAttempts = []) {
  const history = {
    usedQuestionIds: new Set(),
    usedCorrectTargetKeys: new Set(),
    usedCorrectTargetTexts: new Set(),
    usedDramaticFunctions: new Set(),
    usedTargetScenes: new Set(),
  };

  for (const attempt of previousAttempts) {
    if (!attempt || typeof attempt !== "object") {
      continue;
    }

    if (attempt.passage_question_bank_id) {
      history.usedQuestionIds.add(attempt.passage_question_bank_id);
    }

    // Supabase may return a related row as either an object or an array.
    const relationship = attempt.passage_question_bank;

    const bankQuestion = Array.isArray(relationship)
      ? relationship[0]
      : relationship;

    const metadata =
      bankQuestion && typeof bankQuestion === "object"
        ? bankQuestion
        : attempt;

    addNormalizedValue(
      history.usedCorrectTargetKeys,
      metadata.correct_target_key,
    );

    addNormalizedValue(
      history.usedCorrectTargetTexts,
      metadata.correct_target_text,
    );

    addNormalizedValue(
      history.usedDramaticFunctions,
      metadata.dramatic_function,
    );

    addNormalizedValue(
      history.usedTargetScenes,
      metadata.target_scene,
    );
  }

  return history;
}

/**
 * Determines whether a populated metadata value has already been used.
 *
 * Null and empty values do not count as repeats.
 *
 * @param {unknown} value
 * @param {Set<string>} usedValues
 * @returns {boolean}
 */
function isRepeatedValue(value, usedValues) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return false;
  }

  return usedValues.has(normalized);
}

/**
 * Returns the DOK preference rank.
 *
 * Lower rank is better:
 * - 0 = exact requested DOK
 * - 1 = first fallback
 * - 2 = second fallback
 *
 * @param {number} candidateDokLevel
 * @param {number[]} dokPreferenceOrder
 * @returns {number}
 */
function getDokRank(candidateDokLevel, dokPreferenceOrder) {
  const rank = dokPreferenceOrder.indexOf(candidateDokLevel);

  return rank === -1 ? dokPreferenceOrder.length : rank;
}

/**
 * Creates a ranking record for one eligible question.
 *
 * Ranking priority:
 * 1. DOK preference
 * 2. Unused correct_target_key
 * 3. Unused correct_target_text
 * 4. Unused dramatic_function
 * 5. Unused target_scene
 * 6. Lower global times_used
 *
 * Metadata fields only affect ranking when they contain a value.
 *
 * @param {object} question
 * @param {object} history
 * @param {number[]} dokPreferenceOrder
 * @returns {{
 *   question: object,
 *   dokRank: number,
 *   repeatedTargetKey: number,
 *   repeatedTargetText: number,
 *   repeatedDramaticFunction: number,
 *   repeatedTargetScene: number,
 *   timesUsed: number
 * }}
 */
function buildCandidateRanking(
  question,
  history,
  dokPreferenceOrder,
) {
  return {
    question,

    dokRank: getDokRank(
      Number(question.dok_level),
      dokPreferenceOrder,
    ),

    repeatedTargetKey: isRepeatedValue(
      question.correct_target_key,
      history.usedCorrectTargetKeys,
    )
      ? 1
      : 0,

    repeatedTargetText: isRepeatedValue(
      question.correct_target_text,
      history.usedCorrectTargetTexts,
    )
      ? 1
      : 0,

    repeatedDramaticFunction: isRepeatedValue(
      question.dramatic_function,
      history.usedDramaticFunctions,
    )
      ? 1
      : 0,

    repeatedTargetScene: isRepeatedValue(
      question.target_scene,
      history.usedTargetScenes,
    )
      ? 1
      : 0,

    timesUsed: Number.isFinite(Number(question.times_used))
      ? Number(question.times_used)
      : 0,
  };
}

/**
 * Compares two ranked candidates.
 *
 * Lower values are preferred at every comparison level.
 *
 * @param {object} candidateA
 * @param {object} candidateB
 * @returns {number}
 */
function compareCandidateRankings(candidateA, candidateB) {
  const comparisonFields = [
    "dokRank",
    "repeatedTargetKey",
    "repeatedTargetText",
    "repeatedDramaticFunction",
    "repeatedTargetScene",
    "timesUsed",
  ];

  for (const field of comparisonFields) {
    const difference = candidateA[field] - candidateB[field];

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

/**
 * Determines whether two candidates have the same selection rank.
 *
 * Question IDs and question content are intentionally ignored.
 *
 * @param {object} candidateA
 * @param {object} candidateB
 * @returns {boolean}
 */
function haveEqualRanking(candidateA, candidateB) {
  return (
    candidateA.dokRank === candidateB.dokRank &&
    candidateA.repeatedTargetKey === candidateB.repeatedTargetKey &&
    candidateA.repeatedTargetText ===
      candidateB.repeatedTargetText &&
    candidateA.repeatedDramaticFunction ===
      candidateB.repeatedDramaticFunction &&
    candidateA.repeatedTargetScene ===
      candidateB.repeatedTargetScene &&
    candidateA.timesUsed === candidateB.timesUsed
  );
}

/**
 * Randomly selects one candidate from the candidates sharing the best rank.
 *
 * @param {Array<object>} rankedCandidates
 * @returns {object|null}
 */
function chooseTopRankedCandidate(rankedCandidates) {
  if (!rankedCandidates.length) {
    return null;
  }

  const sortedCandidates = [...rankedCandidates].sort(
    compareCandidateRankings,
  );

  const bestRanking = sortedCandidates[0];

  const tiedCandidates = sortedCandidates.filter((candidate) =>
    haveEqualRanking(candidate, bestRanking),
  );

  const randomIndex = Math.floor(
    Math.random() * tiedCandidates.length,
  );

  return tiedCandidates[randomIndex] || bestRanking;
}

/**
 * Best-effort usage increment.
 *
 * Important:
 * This update is not fully concurrency-safe because a true atomic
 * `times_used = times_used + 1` operation requires a PostgreSQL RPC.
 *
 * The selector does not fail if usage tracking fails because serving the
 * reviewed question is more important than perfect exposure statistics.
 *
 * @param {object} supabase
 * @param {object} selectedQuestion
 * @returns {Promise<void>}
 */
async function incrementQuestionUsage(
  supabase,
  selectedQuestion,
) {
  const currentTimesUsed = Number.isFinite(
    Number(selectedQuestion.times_used),
  )
    ? Number(selectedQuestion.times_used)
    : 0;

  const { error } = await supabase
    .from("passage_question_bank")
    .update({
      times_used: currentTimesUsed + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", selectedQuestion.id)
    .eq("times_used", currentTimesUsed);

  if (error) {
    console.warn(
      "[selectPassageQuestion] Unable to increment question usage",
      {
        question_id: selectedQuestion.id,
        error: error.message,
      },
    );
  }
}

/**
 * Selects the next reviewed question for a passage-based adaptive session.
 *
 * @param {{
 *   supabase: object,
 *   passageBankId: string,
 *   questionType: string,
 *   targetDokLevel: number,
 *   previousAttempts?: Array<object>
 * }} params
 *
 * @returns {Promise<
 *   | {
 *       found: true,
 *       question: object,
 *       selection: {
 *         candidateCount: number,
 *         targetDokLevel: number,
 *         selectedDokLevel: number,
 *         usedQuestionCount: number
 *       }
 *     }
 *   | {
 *       found: false,
 *       question: null,
 *       reason: "no_eligible_banked_question"
 *     }
 * >}
 */
export async function selectPassageQuestion({
  supabase,
  passageBankId,
  questionType,
  targetDokLevel,
  previousAttempts = [],
}) {
  if (!supabase) {
    throw new Error(
      "selectPassageQuestion requires a Supabase client.",
    );
  }

  if (
    typeof passageBankId !== "string" ||
    !passageBankId.trim()
  ) {
    throw new Error(
      "selectPassageQuestion requires passageBankId.",
    );
  }

  if (
    typeof questionType !== "string" ||
    !questionType.trim()
  ) {
    throw new Error(
      "selectPassageQuestion requires questionType.",
    );
  }

  const normalizedTargetDokLevel = Number(targetDokLevel);

  if (!VALID_DOK_LEVELS.has(normalizedTargetDokLevel)) {
    throw new Error(
      "selectPassageQuestion targetDokLevel must be 1, 2, or 3.",
    );
  }

  if (!Array.isArray(previousAttempts)) {
    throw new Error(
      "selectPassageQuestion previousAttempts must be an array.",
    );
  }

  const history = buildQuestionHistory(previousAttempts);

  const { data: candidates, error } = await supabase
    .from("passage_question_bank")
    .select(`
      id,
      passage_bank_id,
      teks_standard,
      subject,
      grade_level,
      question_type,
      dok_level,
      skill_focus,
      assessment_move,
      dramatic_function,
      target_scene,
      correct_target_text,
      correct_target_key,
      question_json,
      review_status,
      is_active,
      times_used
    `)
    .eq("passage_bank_id", passageBankId)
    .eq("question_type", questionType)
    .eq("review_status", "approved")
    .eq("is_active", true);

  if (error) {
    console.error(
      "[selectPassageQuestion] Passage question query failed",
      {
        passage_bank_id: passageBankId,
        question_type: questionType,
        target_dok_level: normalizedTargetDokLevel,
        error: error.message,
      },
    );

    throw new Error(
      `Failed to query passage question bank: ${error.message}`,
    );
  }

  const eligibleCandidates = (candidates || []).filter(
    (candidate) =>
      candidate?.id &&
      !history.usedQuestionIds.has(candidate.id),
  );

  if (!eligibleCandidates.length) {
    console.info(
      "[selectPassageQuestion] No eligible banked question",
      {
        passage_bank_id: passageBankId,
        question_type: questionType,
        target_dok_level: normalizedTargetDokLevel,
        used_question_count: history.usedQuestionIds.size,
      },
    );

    return {
      found: false,
      question: null,
      reason: "no_eligible_banked_question",
    };
  }

  const dokPreferenceOrder = getDokPreferenceOrder(
    normalizedTargetDokLevel,
  );

  const rankedCandidates = eligibleCandidates.map(
    (question) =>
      buildCandidateRanking(
        question,
        history,
        dokPreferenceOrder,
      ),
  );

  const selectedCandidate =
    chooseTopRankedCandidate(rankedCandidates);

  if (!selectedCandidate?.question) {
    return {
      found: false,
      question: null,
      reason: "no_eligible_banked_question",
    };
  }

  const selectedQuestion = selectedCandidate.question;

  console.info(
    "[selectPassageQuestion] Selected bank question",
    {
      question_id: selectedQuestion.id,
      passage_bank_id: passageBankId,
      question_type: selectedQuestion.question_type,
      target_dok_level: normalizedTargetDokLevel,
      selected_dok_level: selectedQuestion.dok_level,
      times_used: selectedQuestion.times_used,
      correct_target_key:
        selectedQuestion.correct_target_key || null,
      dramatic_function:
        selectedQuestion.dramatic_function || null,
      target_scene: selectedQuestion.target_scene || null,
      candidate_count: eligibleCandidates.length,
    },
  );

  await incrementQuestionUsage(
    supabase,
    selectedQuestion,
  );

  return {
    found: true,
    question: selectedQuestion,
    selection: {
      candidateCount: eligibleCandidates.length,
      targetDokLevel: normalizedTargetDokLevel,
      selectedDokLevel: Number(selectedQuestion.dok_level),
      usedQuestionCount: history.usedQuestionIds.size,
    },
  };
}