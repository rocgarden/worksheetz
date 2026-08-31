// /libs/adaptive/maps/selectors.js
// Branch: v2/student-success-platform
//
// Shared adaptive selectors.
// Subject-specific data lives in:
// /libs/adaptive/maps/{subject}/index.js
//
// This replaces the old selector logic from skillFocusMap.js.

export function safeParseQuestionJson(question_json) {
  if (!question_json) return null;

  if (typeof question_json === "string") {
    try {
      return JSON.parse(question_json);
    } catch {
      return null;
    }
  }

  return question_json;
}

/**
 * Returns true when an assessment move is compatible with the analyzed
 * passage features.
 *
 * Moves without requirements remain available.
 *
 * Supported requirement fields:
 * - requiresAll: every listed feature must be true
 * - requiresAny: at least one listed feature must be true
 * - excludesAny: none of the listed features may be true
 */
export function isAssessmentMoveCompatible({
  assessmentMove,
  assessmentMoveRequirements = {},
  passage_features = null,
}) {
  const requirements = assessmentMoveRequirements?.[assessmentMove];

  /*
   * Most moves are general and have no feature requirements.
   */
  if (!requirements) {
    return true;
  }

  /*
   * Preserve the existing selector behavior until passage analysis has
   * actually been supplied by the caller.
   */
  if (
    !passage_features ||
    typeof passage_features !== "object" ||
    Array.isArray(passage_features)
  ) {
    return true;
  }

  const requiresAll = Array.isArray(requirements.requiresAll)
    ? requirements.requiresAll
    : [];

  const requiresAny = Array.isArray(requirements.requiresAny)
    ? requirements.requiresAny
    : [];

  const excludesAny = Array.isArray(requirements.excludesAny)
    ? requirements.excludesAny
    : [];

  const satisfiesAll = requiresAll.every(
    (feature) => passage_features?.[feature] === true,
  );

  const satisfiesAny =
    requiresAny.length === 0 ||
    requiresAny.some((feature) => passage_features?.[feature] === true);

  const violatesExclusion = excludesAny.some(
    (feature) => passage_features?.[feature] === true,
  );

  return satisfiesAll && satisfiesAny && !violatesExclusion;
}

/**
 * Returns the skill_focus rotation pool for a given TEKS standard.
 * Falls back to the subject config's defaultSkillFocus if the TEKS code
 * has no specific mapping.
 */
export function getSkillFocusOptions({
  subjectConfig,
  subject,
  teks_standard,
  grade_level,
}) {
  const specific = subjectConfig.skillFocusByTeks?.[teks_standard];

  if (specific?.length) return specific;

  const bucket =
    subjectConfig.getTeksBucket?.({
      subject,
      gradeLevel: grade_level,
      teksStandard: teks_standard,
    }) ?? null;

  const bucketOptions = bucket
    ? subjectConfig.skillFocusByBucket?.[bucket]
    : null;

  if (bucketOptions?.length) return bucketOptions;

  return subjectConfig.defaultSkillFocus ?? ["general"];
}

/**
 * Selects the next skill_focus for a question, avoiding recent repeats
 * within the same session.
 */
export function selectSkillFocus({
  subjectConfig,
  subject,
  teks_standard,
  grade_level,
  dok_level = null,
  previous_attempts = [],
  passage_features = null,
}) {
  const options = getSkillFocusOptions({
    subjectConfig,
    subject,
    teks_standard,
    grade_level,
  });
  const assessmentMoveRequirements =
    subjectConfig.assessmentMoveRequirements ?? {};

  const passageCompatibleSkillFocuses =
    dok_level != null && passage_features
      ? options.filter((skillFocus) => {
          const moves =
            subjectConfig.assessmentMoves?.[skillFocus]?.[Number(dok_level)] ??
            [];

          if (!moves.length) {
            return false;
          }

          return moves.some((assessmentMove) =>
            isAssessmentMoveCompatible({
              assessmentMove,
              assessmentMoveRequirements,
              passage_features,
            }),
          );
        })
      : options;
  if (
    dok_level != null &&
    passage_features &&
    passageCompatibleSkillFocuses.length === 0
  ) {
    return null;
  }

  const viableOptions = passageCompatibleSkillFocuses;

  const recentSkillFocuses = previous_attempts
    .slice(-3)
    .map((attempt) => {
      const question = safeParseQuestionJson(attempt.question_json);

      return question?.skill_focus ?? attempt?.skill_focus ?? null;
    })
    .filter(Boolean);

  const filtered = viableOptions.filter(
    (skillFocus) => !recentSkillFocuses.includes(skillFocus),
  );

  const pool = filtered.length > 0 ? filtered : viableOptions;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function getCompatibleAssessmentMoves({
  subjectConfig,
  skill_focus,
  dok_level,
  passage_features = null,
}) {
  const options =
    subjectConfig.assessmentMoves?.[
      skill_focus
    ]?.[Number(dok_level)] ?? [];

  if (!options.length) {
    return [];
  }

  const assessmentMoveRequirements =
    subjectConfig.assessmentMoveRequirements ?? {};

  return options.filter((assessmentMove) =>
    isAssessmentMoveCompatible({
      assessmentMove,
      assessmentMoveRequirements,
      passage_features,
    }),
  );
}

/**
 * Selects an assessment_move within the chosen skill_focus and DOK level.
 *
 * Selection order:
 * 1. Load the mapped moves.
 * 2. Remove moves unsupported by the analyzed passage.
 * 3. Avoid recently used compatible moves.
 * 4. Select randomly from the remaining pool.
 */
export function selectAssessmentMove({
  subjectConfig,
  skill_focus,
  dok_level,
  previous_attempts = [],
  passage_features = null,
}) {
const options =
  subjectConfig.assessmentMoves?.[
    skill_focus
  ]?.[Number(dok_level)] ?? [];

  if (!options.length) {
    console.warn("[selectAssessmentMove] No options found", {
      subject: subjectConfig.subject,
      skill_focus,
      dok_level,
    });

    return null;
  }

  const assessmentMoveRequirements =
    subjectConfig.assessmentMoveRequirements ?? {};

  /*
   * Passage filtering only affects moves with declared requirements.
   * General moves remain compatible automatically.
   */
 const compatibleOptions =
  getCompatibleAssessmentMoves({
    subjectConfig,
    skill_focus,
    dok_level,
    passage_features,
  });

  console.log("[selectAssessmentMove] passage compatibility:", {
    skill_focus,
    dok_level: Number(dok_level),
    passage_features,
    originalOptions: options,
    compatibleOptions,
    removedOptions: options.filter(
      (assessmentMove) => !compatibleOptions.includes(assessmentMove),
    ),
  });

  /*
   * Do not silently select a passage-incompatible move.
   *
   * Returning null allows the generator layer to log the problem or apply
   * an intentional fallback instead of producing a semantically invalid
   * question.
   */
  if (compatibleOptions.length === 0) {
    console.warn("[selectAssessmentMove] No passage-compatible moves found", {
      subject: subjectConfig.subject,
      skill_focus,
      dok_level,
      passage_features,
      availableMoves: options,
    });

    return null;
  }

  const recentMoves = previous_attempts
    .map((attempt) => {
      const question = safeParseQuestionJson(attempt.question_json);

      const priorSkillFocus =
        question?.skill_focus ?? attempt?.skill_focus ?? null;

      const priorAssessmentMove =
        question?.assessment_move ?? attempt?.assessment_move ?? null;

      return priorSkillFocus === skill_focus ? priorAssessmentMove : null;
    })
    .filter(Boolean);

  const unusedCompatibleOptions = compatibleOptions.filter(
    (assessmentMove) => !recentMoves.includes(assessmentMove),
  );

  /*
   * If all compatible moves have already been used, repeat a compatible
   * move rather than falling back to an incompatible one.
   */
  const pool =
    unusedCompatibleOptions.length > 0
      ? unusedCompatibleOptions
      : compatibleOptions;

  return pool[Math.floor(Math.random() * pool.length)];
}

export function resolvePassageBankQuestionTarget({
  subjectConfig,
  skillFocusOptions = [],
  requestedDokLevel,
  passage_features = null,
  previous_attempts = [],
}) {
  const requestedDok = Number(requestedDokLevel);

  const dokCandidates =
    requestedDok === 3
      ? [3, 2, 1]
      : requestedDok === 2
        ? [2, 1]
        : [1];

  for (const dokLevel of dokCandidates) {
    const viableSkillFocuses =
      skillFocusOptions
        .map((skillFocus) => {
          const compatibleMoves =
            getCompatibleAssessmentMoves({
              subjectConfig,
              skill_focus: skillFocus,
              dok_level: dokLevel,
              passage_features,
            });

          return {
            skill_focus: skillFocus,
            compatibleMoves,
          };
        })
        .filter(
          ({ compatibleMoves }) =>
            compatibleMoves.length > 0,
        );

    if (!viableSkillFocuses.length) {
      continue;
    }

    // Prefer a skill focus not recently used.
    const recentSkillFocuses =
      previous_attempts
        .slice(-3)
        .map((attempt) => {
          const question =
            safeParseQuestionJson(
              attempt.question_json,
            );

          return (
            question?.skill_focus ??
            attempt?.skill_focus ??
            null
          );
        })
        .filter(Boolean);

    const unused =
      viableSkillFocuses.filter(
        ({ skill_focus }) =>
          !recentSkillFocuses.includes(
            skill_focus,
          ),
      );

    const skillPool =
      unused.length > 0
        ? unused
        : viableSkillFocuses;

    const selected =
      skillPool[
        Math.floor(
          Math.random() * skillPool.length,
        )
      ];

    const assessmentMove =
      selected.compatibleMoves[
        Math.floor(
          Math.random() *
            selected.compatibleMoves.length,
        )
      ];

    return {
      skill_focus: selected.skill_focus,
      assessment_move: assessmentMove,

      requested_dok_level: requestedDok,
      dok_level: dokLevel,

      used_dok_fallback:
        dokLevel !== requestedDok,
    };
  }

  return null;
}