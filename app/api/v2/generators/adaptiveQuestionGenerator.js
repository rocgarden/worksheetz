/**
 * adaptiveQuestionGenerator.js
 * /app/api/v2/generators/adaptiveQuestionGenerator.js
 *
 * Master adaptive question generator for Teks Portfolio v2.
// Scope (initial): ELA, Grades 6-8
// question_types: multiple_choice | hot_text | constructed_response | multi_select | inline_choice 
 *
 * 3-Layer Cache Strategy (always in this order):
 *   1. Redis (getCachedQuestion)         → fastest, 7-day TTL
 *   2. question_bank (Supabase)          → permanent store, backfills Redis
 *   3. OpenAI generation                 → last resort, saves to both layers
 *
 * Never call OpenAI if Redis or Supabase already has the question.
 * Never build a separate caching system — extends redis-cache.js only.
 *
 * Input shape:
 *   { teks_standard, grade_level, dok_level, question_type,
 *     subject, previous_attempt_ids, session_id }
 *
 * Output shape:
 *   { teks_standard, dok_level, question_type, stem, passage?,
 *     answer_options?, correct_answer, explanation,
 *     next_question_logic: { if_correct, if_incorrect },
 *     source }   ← "redis" | "question_bank" | "generated"
 */

// import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import {
  buildTypeInstructions,
  validateQuestionQuality,
  buildNextQuestionLogic,
} from "./shared";
import { getCachedQuestion, setCachedQuestion } from "@/libs/redis-cache";
import OpenAI from "openai";
import { generateScienceQuestion } from "./science";
import { generateELAQuestion } from "./ela";
import { generateSSQuestion } from "./socialStudies";
import { TEKS_SS_LABELS } from "@/libs/constants/teksSocialStudiesMap";
import { TEKS_LABELS } from "@/libs/constants/teksReadingMap";
import {
  getSkillFocusOptions,
  selectSkillFocus,
  selectAssessmentMove,resolvePassageBankQuestionTarget
} from "@/libs/adaptive/maps/selectors";

import { getSubjectAdaptiveConfig } from "@/libs/adaptive/maps";
// ─── Constants ────────────────────────────────────────────────────────────────
const SUPPORTED_SUBJECTS = ["ELA", "Social Studies", "Science"];
const SUPPORTED_GRADES = ["6", "7", "8"];
const SUPPORTED_TYPES = [
  "multiple_choice",
  "hot_text",
  "constructed_response",
  "multi_select",
  "inline_choice",
];

const DOK_LEVELS = [1, 2, 3];

// ─── Passage Token Builder ────────────────────────────────────────────────────
/**
 * Programmatically splits a passage into tokens marking which segments
 * are clickable hot_text targets. Called after GPT generation — GPT never
 * builds this structure. 100% reliable vs GPT's ~70% accuracy.
 *
 * Works for words, phrases, and full sentences.
 * Sorts targets by position in passage so tokens are always in order.
 */
function buildPassageTokens(passage, hotTextTargets) {
  const sorted = hotTextTargets
    .map((t) => ({ ...t, index: passage.indexOf(t.text) }))
    .filter((t) => t.index !== -1)
    .sort((a, b) => a.index - b.index);

  const tokens = [];
  let cursor = 0;

  for (const target of sorted) {
    // Skip overlapping targets — cursor already past this target's start
    if (target.index < cursor) continue;

    if (target.index > cursor) {
      tokens.push({
        text: passage.slice(cursor, target.index),
        is_target: false,
      });
    }
    tokens.push({ text: target.text, is_target: true, target_id: target.id });
    cursor = target.index + target.text.length;
  }

  if (cursor < passage.length) {
    tokens.push({ text: passage.slice(cursor), is_target: false });
  }

  return tokens;
}

/**
 * Performs lightweight deterministic analysis of an existing ELA passage.
 *
 * This does not replace instructional review. Its purpose is to prevent
 * selectors from choosing assessment moves that clearly require features
 * the supplied passage does not contain.
 *
 * @param {{
 *   subject: string,
 *   stimulus: string|null,
 *   passage_format: string|null,
 *   content_focus_key?: string|null,
 * }} params
 *
 * @returns {object|null}
 */
function analyzePassageFeatures({
  subject,
  stimulus,
  passage_format,
  content_focus_key = null,
}) {
  if (subject !== "ELA" || typeof stimulus !== "string" || !stimulus.trim()) {
    return null;
  }

  const text = stimulus.trim();
  const normalized = text.toLowerCase().replace(/[’‘]/g, "'");
  const sceneMatches = text.match(/\bSCENE\s+\d+\b/gi) ?? [];

  const stageDirectionMatches = text.match(/\[[^\]]+\]/g) ?? [];

  const hasDeadlineLanguage =
    /\b(deadline|due|by\s+\d|already\s+\d|minutes?|hours?|tonight|tomorrow|late|time|clock)\b/i.test(
      normalized,
    );

  const hasExplicitMysteryLanguage =
    /\b(mystery|missing|disappeared|unknown person|unknown sender|who took|who moved|who sent|cannot find|can't find|unexplained|hidden identity|secret message)\b/i.test(
      normalized,
    );

  const hasUnresolvedMysteryQuestion =
    /\b(who did|who was|where did .* go|what caused|why did .* disappear)\b/i.test(
      normalized,
    );

  const hasMystery = hasExplicitMysteryLanguage || hasUnresolvedMysteryQuestion;

  const hasProblemLanguage =
    /\b(problem|conflict|mistake|misunderstanding|wrong|worried|trouble|dilemma|what should i do)\b/i.test(
      normalized,
    );

  const hasRevelationLanguage =
    /\b(realize|realizes|realized|discover|discovers|discovered|finds|found|learns|learned|reveals|revealed|understands|understood|heard|tells?|explains?|confirms?|announces?|schedule changed|needed at|has to work|must work)\b/i.test(
      normalized,
    );

  const hasDecisionLanguage =
    /\b(decide|decides|decided|decision|decisive|decisively|choose|chooses|chose|let's|we will|we'll|i will|i'll|our plan is|backup plan|we need to)\b/i.test(
      normalized,
    );

  const hasTension =
    hasDeadlineLanguage ||
    /\b(worried|nervous|urgent|quickly|suddenly|tension|afraid|fear|panic)\b/i.test(
      normalized,
    );

  const hasExplicitChoiceLanguage =
    /\b(either\b.+\bor\b|choose between|choice between|must decide whether|have to choose|what should we do first|which should we|cannot do both|can't do both)\b/i.test(
      normalized,
    );

  const hasCompetingObligations =
    /\b(two responsibilities|competing responsibilities|both need|at the same time|while also|instead of|prioritize|priority|which problem first)\b/i.test(
      normalized,
    );

  const hasCompetingPriorities =
    hasExplicitChoiceLanguage || hasCompetingObligations;

  /*
   * A genuine mystery requires more than momentary confusion.
   *
   * The passage should contain an unresolved unknown, missing object,
   * unexplained action, or withheld information—not merely a mistake,
   * conflict, or newly discovered responsibility.
   */
  // const hasMystery = hasExplicitMysteryLanguage;
  // &&
  // hasQuestionOrUncertainty &&
  // !(
  //   content_focus_key === "misunderstanding_deadline_choice" &&
  //   !/\b(missing|disappeared|unknown|who took|who moved|what happened)\b/i.test(
  //     text,
  //   )
  // );

  /*
   * For the current drama maps, parallel conflict includes two connected
   * responsibilities, problems, or commitments that compete and jointly
   * influence the action.
   */
  const hasTwoProblemLanguage =
    /\b(second problem|another problem|two problems|both problems|meanwhile|at the same time|while .+ threatens|separate issue|also discovered|another complication)\b/i.test(
      normalized,
    );

  const hasParallelConflict = hasTwoProblemLanguage && hasCompetingPriorities;

  const hasInitialProblem = sceneMatches.length >= 1 && hasProblemLanguage;

  const hasLaterComplicationLanguage =
    /\b(failed|failure|new problem|another problem|complication|changed|not finished|not ready|delay|repair|backup plan|if .+ not|might be canceled|might be cancelled)\b/i.test(
      normalized,
    );

  const hasLaterProblem =
    sceneMatches.length >= 2 && hasLaterComplicationLanguage;

  const hasTurningPointLanguage =
    /\b(turning point|decisive|decisively|thinking quickly|at that moment|realizes what to do|changes the plan|backup plan|we're still moving forward|we are still moving forward)\b/i.test(
      normalized,
    );

  const hasClimax =
    sceneMatches.length >= 3 &&
    hasTension &&
    hasDecisionLanguage &&
    hasTurningPointLanguage;

  const hasConfirmedOutcomeLanguage =
    /\b(was repaired|repairs were completed|event began|doors opened|fundraiser continued|problem was solved|issue was resolved|everything was ready|the plan succeeded|in the end)\b/i.test(
      normalized,
    );

  const hasFinalResolution =
    sceneMatches.length >= 2 &&
    hasDecisionLanguage &&
    hasConfirmedOutcomeLanguage;

const hasFlashback =
  /\b(mind drifted back|transported back|flashed back|remembered|recalled|thought back|years earlier|months earlier|weeks earlier|days earlier|the previous year|last year|had once)\b/i.test(
    normalized,
  ) ||
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:days?|weeks?|months?|years?)\s+earlier\b/i.test(
    normalized,
  );
const hasForeshadowing =
  /\b(foreshadow|hinted|warning|warned|uneasy|couldn't shake|would later|didn't know then|had no idea|something felt wrong)\b/i.test(
    normalized,
  );

const hasParallelPlot =
  /\b(meanwhile|at the same time|elsewhere|while .*? was)\b/i.test(
    normalized,
  );

const hasSubplot =
  /\b(meanwhile|elsewhere|another problem|separate issue|at the same time)\b/i.test(
    normalized,
  );

  return {
    has_stage_directions:
      passage_format === "drama" && stageDirectionMatches.length > 0,

    has_multiple_scenes: sceneMatches.length >= 2,

    has_initial_problem: hasInitialProblem,

    has_later_problem: hasLaterProblem,

    has_parallel_conflict: hasParallelConflict,

    has_competing_priorities: hasCompetingPriorities,

    has_deadline_pressure: hasDeadlineLanguage,

    has_tension: hasTension,

    has_revelation: hasRevelationLanguage,

    has_decision: hasDecisionLanguage,

    has_climax: hasClimax,

    has_final_resolution: hasFinalResolution,

    has_mystery: hasMystery,
      // fiction/nonlinear structure
  has_flashback: hasFlashback,
  has_foreshadowing: hasForeshadowing,
  has_subplot: hasSubplot,
  has_parallel_plot: hasParallelPlot,

  };
}
// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validates incoming generator params and throws with a clear message if invalid.
 * Keeps route handlers clean — validate once here.
 */
function validateParams({
  teks_standard,
  grade_level,
  dok_level,
  question_type,
  subject,
  content_focus,
}) {
  if (!SUPPORTED_SUBJECTS.includes(subject)) {
    throw new Error(
      `Subject "${subject}" not yet supported. Supported: ${SUPPORTED_SUBJECTS.join(", ")}`,
    );
  }
  if (!SUPPORTED_GRADES.includes(String(grade_level))) {
    throw new Error(
      `Grade "${grade_level}" not yet supported. Supported: ${SUPPORTED_GRADES.join(", ")}`,
    );
  }
  if (!SUPPORTED_TYPES.includes(question_type)) {
    throw new Error(
      `Question type "${question_type}" not yet supported. Supported: ${SUPPORTED_TYPES.join(", ")}`,
    );
  }
  if (!DOK_LEVELS.includes(Number(dok_level))) {
    throw new Error(`DOK level must be 1, 2, or 3. Received: ${dok_level}`);
  }
  if (!teks_standard || typeof teks_standard !== "string") {
    throw new Error(
      "teks_standard is required and must be a string (e.g. '7.6A').",
    );
  }
  /*
   * content_focus is optional.
   *
   * Teacher assignment may omit it while the backend selects reviewed
   * passage-bank inventory by TEKS. Keep the field available for future
   * teacher controls and admin generation workflows.
   */
  if (
    content_focus !== null &&
    content_focus !== undefined &&
    typeof content_focus !== "string"
  ) {
    throw new Error("content_focus must be a string, null, or undefined.");
  }
}

// ─── Redis Key Builder ─────────────────────────────────────────────────────────

/**
 * Builds the Redis key for individual question lookup.
 * Pattern: question:{teks}:{dok_level}:{grade}:{type}
 * Matches the pattern defined in project instructions.
 *
 * Note: Redis caches one representative question per slot.
 * question_bank is the full pool — Redis is just the speed layer.
 */
function buildRedisKey({
  teks_standard,
  dok_level,
  grade_level,
  question_type,
}) {
  return `question:${teks_standard}:${dok_level}:${grade_level}:${question_type}`;
}

// ─── Layer 1: Redis Lookup ─────────────────────────────────────────────────────

/**
 * Attempts to return a question from Redis.
 * Returns null if not found — never throws on cache miss.
 */

async function getFromRedis({
  teks_standard,
  dok_level,
  grade_level,
  question_type,
  previous_attempt_ids = [],
}) {
  try {
    const cached = await getCachedQuestion(
      teks_standard,
      dok_level,
      grade_level,
      question_type,
    );
    if (!cached) return null;

    // If no question_bank_id on cached question we can't verify
    // if student has seen it — fall through to question_bank to be safe
    if (!cached.question_bank_id) {
      console.log(
        `[adaptiveQuestionGenerator] Redis HIT but no question_bank_id — falling through`,
      );
      return null;
    }

    // Skip if student already saw this question
    if (previous_attempt_ids.includes(cached.question_bank_id)) {
      console.log(
        `[adaptiveQuestionGenerator] Redis HIT but already seen — falling through`,
      );
      return null;
    }

    return { ...cached, source: "redis" };
  } catch (err) {
    console.warn(
      "[adaptiveQuestionGenerator] Redis read failed (non-fatal):",
      err.message,
    );
    return null;
  }
}

// ─── Layer 2: Supabase question_bank Lookup ────────────────────────────────────

/**
 * Queries question_bank for a matching question.
 * Excludes already-seen question IDs (previous_attempt_ids).
 * Orders by times_used ASC so least-used questions surface first.
 * Returns null if no match — never throws on miss.
 *
 * On hit: backfills Redis with the result for next time.
 */
async function getFromQuestionBank({
  teks_standard,
  dok_level,
  grade_level,
  question_type,
  subject,
  previous_attempt_ids = [],
}) {
  try {
    const serviceSupabase = await createV2ServiceClient();

    let query = serviceSupabase //remove this and use regular supabase client once auth is working
      .from("question_bank")
      .select("*")
      .eq("teks_standard", teks_standard)
      .eq("dok_level", Number(dok_level))
      .eq("grade_level", String(grade_level))
      .eq("subject", subject)
      .eq("question_type", question_type)
      .order("times_used", { ascending: true })
      .limit(1);

    // Exclude questions already seen in this session
    if (previous_attempt_ids.length > 0) {
      query = query.not("id", "in", `(${previous_attempt_ids.join(",")})`);
    }

    const { data, error } = await query.single();

    if (error || !data) return null;

    // Increment usage count (fire-and-forget — don't await)
    serviceSupabase //remove this and use regular supabase client once auth is working
      .from("question_bank")
      .update({ times_used: (data.times_used || 0) + 1 })
      .eq("id", data.id)
      .then(() => {})
      .catch(() => {});

    const question = { ...data.question_json, question_bank_id: data.id };

    // Backfill Redis so next request is served from cache
    try {
      //   const key = buildRedisKey({ teks_standard, dok_level, grade_level, question_type });
      //   await setCachedQuestion(key, question);
      await setCachedQuestion(
        teks_standard,
        dok_level,
        grade_level,
        question_type,
        question,
      );
    } catch (cacheErr) {
      console.warn(
        "[adaptiveQuestionGenerator] Redis backfill failed (non-fatal):",
        cacheErr.message,
      );
    }

    return { ...question, source: "question_bank", question_bank_id: data.id };
  } catch (err) {
    console.warn(
      "[adaptiveQuestionGenerator] question_bank read failed (non-fatal):",
      err.message,
    );
    return null;
  }
}

// ─── Layer 3: OpenAI Generation ───────────────────────────────────────────────

/**
 * Calls OpenAI to generate a new question when both cache layers miss.
 * Persists the result to question_bank + Redis before returning.
 *
 * Subject router lives here — as new subjects are added, add a case.
 */

async function generateFromAI(params) {
  console.log("params from generateFromAi: ", params.generation_mode);
  const {
    subject,
    teks_standard,
    previous_attempts = [],
    prior_bank_questions = [],
    dok_level,

    requested_skill_focus = null,
    requested_assessment_move = null,
  } = params;

  const subjectConfig = getSubjectAdaptiveConfig(subject);

  /*
   * Passage-bank generation passes existing questions separately from
   * live student attempts. Preserve both sources so prompt builders can
   * use the bank history without pretending those questions were student
   * attempts.
   */
  const normalizedPriorBankQuestions = Array.isArray(prior_bank_questions)
    ? prior_bank_questions
    : [];

  const isQuestionBankQuestion =
    params.generation_mode === "question_bank_question";

  /*
   * Live sessions rotate from prior student attempts.
   * Passage-bank generation rotates from existing questions in the draft.
   */
  const selectorHistory = isQuestionBankQuestion
    ? normalizedPriorBankQuestions
    : previous_attempts;

  console.log(
    "[adaptiveQuestionGenerator] selector history:",
    selectorHistory.map((item) => ({
      row_skill_focus: item?.skill_focus ?? null,

      json_skill_focus: item?.question_json?.skill_focus ?? null,

      row_assessment_move: item?.assessment_move ?? null,

      json_assessment_move: item?.question_json?.assessment_move ?? null,
    })),
  );

  const passage_features = analyzePassageFeatures({
    subject,
    stimulus: params.stimulus,
    passage_format: params.passage_format,
    content_focus_key: params.content_focus_key,
  });

  console.log(
    "[adaptiveQuestionGenerator] passage features:",
    passage_features,
  );

  const configuredSkillFocuses =
    subjectConfig.skillFocusByTeks?.[teks_standard] ?? [];

  const compatibleSkillFocuses =
    passage_features && subject === "ELA"
      ? configuredSkillFocuses.filter((skillFocus) => {
          if (skillFocus === "parallel_plot_conflict") {
            return (
              passage_features.has_parallel_conflict === true ||
              passage_features.has_competing_priorities === true
            );
          }

          if (skillFocus === "key_detail_revelation") {
            return passage_features.has_revelation === true;
          }

          if (skillFocus === "dramatic_action") {
            return passage_features.has_multiple_scenes === true;
          }

          return true;
        })
      : configuredSkillFocuses;

  if (compatibleSkillFocuses.length === 0) {
    throw new Error(
      [
        "No compatible skill focus was available for the supplied passage.",
        `Subject: ${subject}.`,
        `TEKS: ${teks_standard}.`,
      ].join(" "),
    );
  }

  /*
   * Give the existing selector a temporary subject config containing only
   * skill focuses supported by this passage.
   */
  const selectorSubjectConfig = {
    ...subjectConfig,

    skillFocusByTeks: {
      ...subjectConfig.skillFocusByTeks,

      [teks_standard]: compatibleSkillFocuses,
    },
  };

const requestedDokLevel = Number(dok_level);

let effectiveDokLevel = requestedDokLevel;
let skill_focus = null;
let assessment_move = null;
let usedDokFallback = false;

/*
 * Passage-bank generation may step down DOK when the supplied passage
 * cannot support any valid assessment move at the requested level.
 *
 * TEKS and question type do NOT change.
 */
if (isQuestionBankQuestion) {
  const skillFocusOptions = getSkillFocusOptions({
    subjectConfig: selectorSubjectConfig,
    subject,
    teks_standard,
    grade_level: params.grade_level,
  });

  const resolvedTarget = resolvePassageBankQuestionTarget({
    subjectConfig: selectorSubjectConfig,
    skillFocusOptions,
    requestedDokLevel,
    passage_features,
    previous_attempts: selectorHistory,
  });

  if (!resolvedTarget) {
    throw new Error(
      [
        "No compatible passage-bank question target was available.",
        `Subject: ${subject}.`,
        `TEKS: ${teks_standard}.`,
        `Requested DOK: ${requestedDokLevel}.`,
      ].join(" "),
    );
  }

  skill_focus =
    typeof requested_skill_focus === "string" &&
    requested_skill_focus.trim()
      ? requested_skill_focus.trim()
      : resolvedTarget.skill_focus;

  assessment_move =
    typeof requested_assessment_move === "string" &&
    requested_assessment_move.trim()
      ? requested_assessment_move.trim()
      : resolvedTarget.assessment_move;

  effectiveDokLevel = resolvedTarget.dok_level;
  usedDokFallback = resolvedTarget.used_dok_fallback;

  console.log(
    "[adaptiveQuestionGenerator] passage-bank target:",
    {
      teks_standard,
      requested_dok_level: requestedDokLevel,
      generated_dok_level: effectiveDokLevel,
      used_dok_fallback: usedDokFallback,
      skill_focus,
      assessment_move,
    },
  );

  if (usedDokFallback) {
    console.warn(
      "[adaptiveQuestionGenerator] passage-bank DOK fallback:",
      {
        teks_standard,
        requested_dok_level: requestedDokLevel,
        generated_dok_level: effectiveDokLevel,
        skill_focus,
        assessment_move,
      },
    );
  }
} else {
  /*
   * Existing adaptive/student behavior remains strict.
   */
  const selectedSkillFocus = selectSkillFocus({
    teks_standard,
    subject,
    subjectConfig: selectorSubjectConfig,
    grade_level: params.grade_level,
    previous_attempts: selectorHistory,
    dok_level: requestedDokLevel,
    passage_features,
  });

  console.log(
    "[adaptiveQuestionGenerator] selected skill focus:",
    {
      teks_standard,
      generation_mode: params.generation_mode,
      selectedSkillFocus,
      configuredOptions: configuredSkillFocuses,
      compatibleOptions: compatibleSkillFocuses,
      removedOptions: configuredSkillFocuses.filter(
        (option) =>
          !compatibleSkillFocuses.includes(option),
      ),
    },
  );

  skill_focus =
    typeof requested_skill_focus === "string" &&
    requested_skill_focus.trim()
      ? requested_skill_focus.trim()
      : selectedSkillFocus;

  const selectedAssessmentMove =
    selectAssessmentMove({
      subjectConfig: selectorSubjectConfig,
      skill_focus,
      dok_level: requestedDokLevel,
      previous_attempts: selectorHistory,
      passage_features,
    });

  console.log(
    "[adaptiveQuestionGenerator] selected assessment move:",
    {
      skill_focus,
      dok_level: requestedDokLevel,
      selectedAssessmentMove,

      availableMoves:
        subjectConfig.assessmentMoves?.[
          skill_focus
        ]?.[requestedDokLevel] ?? [],
    },
  );

  assessment_move =
    typeof requested_assessment_move === "string" &&
    requested_assessment_move.trim()
      ? requested_assessment_move.trim()
      : selectedAssessmentMove;

  if (!assessment_move) {
    throw new Error(
      [
        "No compatible assessment move was available.",
        `Subject: ${subject}.`,
        `TEKS: ${teks_standard}.`,
        `Skill focus: ${skill_focus}.`,
        `DOK: ${requestedDokLevel}.`,
      ].join(" "),
    );
  }
}
 const paramsWithMoves = {
  ...params,

  dok_level: effectiveDokLevel,

  skill_focus,
  assessment_move,
  passage_features,

  requested_dok_level: requestedDokLevel,
  used_dok_fallback: usedDokFallback,

  prior_bank_questions: normalizedPriorBankQuestions,
};
  switch (subject) {
    case "ELA":
      return generateELAQuestion(paramsWithMoves);
    case "Social Studies":
      return generateSSQuestion(paramsWithMoves);
    case "Science":
      return generateScienceQuestion(paramsWithMoves);
    default:
      throw new Error(`No AI generator implemented for subject: ${subject}`);
  }
}

function buildAnswerFields(question_type) {
  const answerOptions = (() => {
    switch (question_type) {
      case "multiple_choice":
        return '[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}]';
      case "multi_select":
        return '[{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."},{"id":"E","text":"..."}]';
      case "inline_choice":
        return '["option1","option2","option3","option4"]';
      default:
        return "null";
    }
  })();

  const hotTextTargets =
    question_type === "hot_text"
      ? '[{"id":"ht1","text":"<exact substring from passage>","is_correct":true}, {"id":"ht2","text":"<exact substring>","is_correct":false}, ...]'
      : "null";

  const correctAnswer = (() => {
    switch (question_type) {
      case "multiple_choice":
        return '"<A, B, C, or D>"';
      case "multi_select":
        return '["<id1>","<id2>"] — array of 2 or 3 correct option ids from A-E';
      case "inline_choice":
        return '"<the correct option string from answer_options>"';
      case "hot_text":
        return '["<ht_id>"] — array of correct hot_text target ids e.g. ["ht1"]';
      case "constructed_response":
        return '"<model answer string>"';
      default:
        return '"<correct answer>"';
    }
  })();

  return `  "answer_options": ${answerOptions},
  "hot_text_targets": ${hotTextTargets},
  "correct_answer": ${correctAnswer},`;
}

// ─── Question Shape Validator ──────────────────────────────────────────────────

/**
 * Validates that OpenAI returned a structurally complete question.
 * Throws if any required field is missing or malformed.
 * Prevents bad data from entering question_bank.
 */
function validateQuestionShape(q, question_type) {
  const required = [
    "teks_standard",
    "dok_level",
    "question_type",
    "stem",
    "correct_answer",
    "explanation",
    "next_question_logic",
  ];
  for (const field of required) {
    if (q[field] === undefined || q[field] === null) {
      throw new Error(`Generated question missing required field: "${field}"`);
    }
  }

  if (question_type === "multiple_choice") {
    if (!Array.isArray(q.answer_options) || q.answer_options.length !== 4) {
      throw new Error(
        "multiple_choice question must have exactly 4 answer_options.",
      );
    }
    if (!["A", "B", "C", "D"].includes(q.correct_answer)) {
      throw new Error(
        `multiple_choice correct_answer must be A, B, C, or D. Got: ${q.correct_answer}`,
      );
    }
  }

  if (question_type === "hot_text") {
    if (!q.passage || typeof q.passage !== "string") {
      throw new Error("hot_text question requires a passage.");
    }
    if (!Array.isArray(q.hot_text_targets) || q.hot_text_targets.length < 3) {
      throw new Error(
        "hot_text question requires at least 3 hot_text_targets.",
      );
    }
    // Verify all targets are exact substrings — GPT's only structural responsibility
    for (const target of q.hot_text_targets) {
      if (!q.passage.includes(target.text)) {
        throw new Error(
          `hot_text target "${target.id}" ("${target.text.slice(0, 40)}...") ` +
            `not found in passage. Targets must be exact passage substrings.`,
        );
      }
    }
    // Build passage_tokens server-side — never trust GPT to do this
    q.passage_tokens = buildPassageTokens(q.passage, q.hot_text_targets);
  }

  if (question_type === "multi_select") {
    if (!Array.isArray(q.answer_options) || q.answer_options.length !== 5) {
      throw new Error(
        "multi_select question must have exactly 5 answer_options.",
      );
    }
    if (
      !Array.isArray(q.correct_answer) ||
      q.correct_answer.length < 2 ||
      q.correct_answer.length > 3
    ) {
      throw new Error(
        `multi_select correct_answer must be an array of 2 or 3 option ids. Got: ${JSON.stringify(q.correct_answer)}`,
      );
    }
    const validIds = q.answer_options.map((o) => o.id);
    for (const id of q.correct_answer) {
      if (!validIds.includes(id)) {
        throw new Error(
          `multi_select correct_answer id "${id}" not found in answer_options.`,
        );
      }
    }
  }

  if (question_type === "inline_choice") {
    if (!Array.isArray(q.answer_options) || q.answer_options.length !== 4) {
      throw new Error(
        "inline_choice question must have exactly 4 answer_options.",
      );
    }
    if (!q.stem || !q.stem.includes("{{blank}}")) {
      throw new Error(
        'inline_choice stem must contain "{{blank}}" placeholder.',
      );
    }
    if (typeof q.correct_answer !== "string") {
      throw new Error(
        "inline_choice correct_answer must be a string matching one of the answer_options.",
      );
    }
    if (!q.answer_options.includes(q.correct_answer)) {
      throw new Error(
        `inline_choice correct_answer "${q.correct_answer}" not found in answer_options.`,
      );
    }
  }

  if (question_type === "constructed_response") {
    if (!q.passage || typeof q.passage !== "string") {
      throw new Error("constructed_response question requires a passage.");
    }
    if (!q.correct_answer || typeof q.correct_answer !== "string") {
      throw new Error(
        "constructed_response correct_answer must be a model answer string.",
      );
    }
    if (!q.scoring_rubric || typeof q.scoring_rubric !== "object") {
      throw new Error(
        "constructed_response question requires a scoring_rubric object.",
      );
    }
    if (
      !(
        "0" in q.scoring_rubric &&
        "1" in q.scoring_rubric &&
        "2" in q.scoring_rubric
      )
    ) {
      throw new Error("scoring_rubric must include keys '0', '1', and '2'.");
    }
  }

  if (
    !q.next_question_logic?.if_correct ||
    !q.next_question_logic?.if_incorrect
  ) {
    throw new Error(
      "next_question_logic must include if_correct and if_incorrect branches.",
    );
  }
  if (
    question_type === "constructed_response" &&
    !q.next_question_logic?.if_partial
  ) {
    throw new Error(
      "constructed_response next_question_logic must include an if_partial branch.",
    );
  }
}

// ─── question_bank Writer ──────────────────────────────────────────────────────

/**
 * Persists a newly generated question to question_bank in Supabase.
 * Uses service_role client — question_bank is writable by service_role only.
 * Fire-and-forget is intentional — a failed write should not block the response.
 */
async function saveToQuestionBank({
  question,
  teks_standard,
  grade_level,
  dok_level,
  question_type,
  subject,
}) {
  try {
    // Use service_role for writes — import pattern matches existing libs
    // const { createClient: createServiceClient } = await import("@supabase/supabase-js");
    // const supabase = createServiceClient
    // (
    //   process.env.NEXT_PUBLIC_SUPABASE_URL,
    //   process.env.SUPABASE_SERVICE_ROLE_KEY
    // );
    const serviceSupabase = await createV2ServiceClient();

    const { data, error } = await serviceSupabase //remove this and use regular supabase client once auth is working
      .from("question_bank")
      .insert({
        teks_standard,
        grade_level: String(grade_level),
        dok_level: Number(dok_level),
        question_type,
        subject,
        question_json: question,
        times_used: 0,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.warn(
        "[adaptiveQuestionGenerator] question_bank insert failed:",
        error?.message,
      );
      return null; // ← return null on failure
    }
    return data?.id ?? null; // ← return the new id on success
  } catch (err) {
    console.warn(
      "[adaptiveQuestionGenerator] question_bank write error (non-fatal):",
      err.message,
    );
    return null;
  }
}

/**
 * Shuffles answer_options and remaps correct_answer to match new positions.
 * Applied at serve time — question_bank and Redis store canonical order.
 * This means each student sees options in a different order.
 *
 * Handles: multiple_choice, multi_select, inline_choice
 * Skips:   hot_text, constructed_response (no discrete options to shuffle)
 */
function shuffleAnswerOptions(question) {
  const shuffleableTypes = ["multiple_choice", "multi_select", "inline_choice"];
  if (!shuffleableTypes.includes(question.question_type)) return question;
  if (
    !Array.isArray(question.answer_options) ||
    question.answer_options.length === 0
  )
    return question;

  const q = { ...question };
  const options = [...q.answer_options];

  // Fisher-Yates shuffle
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  if (question.question_type === "multiple_choice") {
    // Options are [{id:"A", text:"..."}, ...]
    // Find correct text before remapping ids
    const correctText = q.answer_options.find(
      (o) => o.id === question.correct_answer,
    )?.text;
    const letters = ["A", "B", "C", "D"];
    q.answer_options = options.map((opt, i) => ({ ...opt, id: letters[i] }));
    q.correct_answer =
      q.answer_options.find((o) => o.text === correctText)?.id ??
      question.correct_answer;
  }

  if (question.question_type === "multi_select") {
    // correct_answer is array of ids ["A","C"]
    const correctTexts = new Set(
      (Array.isArray(question.correct_answer)
        ? question.correct_answer
        : [question.correct_answer]
      )
        .map((id) => q.answer_options.find((o) => o.id === id)?.text)
        .filter(Boolean),
    );
    const letters = ["A", "B", "C", "D", "E"];
    q.answer_options = options.map((opt, i) => ({ ...opt, id: letters[i] }));
    q.correct_answer = q.answer_options
      .filter((o) => correctTexts.has(o.text))
      .map((o) => o.id)
      .sort();
  }

  if (question.question_type === "inline_choice") {
    // Options are plain strings, correct_answer is the string itself — no id remapping needed
    q.answer_options = options;
    // correct_answer stays as-is (it's the text value, not a letter id)
  }

  return q;
}

// ─── Main Export ───────────────────────────────────────────────────────────────

/**
 * generateAdaptiveQuestion — public API for this module.
 *
 * @param {object} params
 * @param {string}   params.teks_standard       e.g. "7.6A"
 * @param {string}   params.grade_level         e.g. "7"
 * @param {number}   params.dok_level           1 | 2 | 3
 * @param {string}   params.question_type       "multiple_choice" | "hot_text"
 * @param {string}   params.subject             "ELA"
 * @param {string[]} params.previous_attempt_ids  question_bank IDs already seen this session
 * @param {object[]} params.previous_attempts     full attempt objects for prompt deduplication
 *
 * @returns {Promise<object>} question object with a `source` field indicating cache layer hit
 */
export async function adaptiveQuestionGenerator(params) {
  const {
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    subject,

    primary_teks = null,
    supported_teks = [],

    previous_attempt_ids = [],
    previous_attempts = [],

    content_focus = null,
    content_focus_key = null,

    stimulus = null,
    testing_window = null,
    title = null,

    generation_mode = null,
    passage_format = null,
    prior_bank_questions = [],
  } = params;

  // Always validate first — fail fast with a clear error
  validateParams({
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    subject,
    content_focus,
  });
  // In main export — skip cache when stimulus exists
  if (generation_mode === "question_bank_passage") {
    console.log(
      "[adaptiveQuestionGenerator] Generating passage-bank passage draft",
    );

    return generateFromAI({
      teks_standard,
      grade_level,
      dok_level,
      question_type,
      subject,

      primary_teks,
      supported_teks,

      previous_attempts,

      content_focus,
      content_focus_key,

      stimulus: null,
      testing_window,
      title,

      generation_mode,
      passage_format,
      prior_bank_questions,
    });
  }

  if (stimulus || content_focus) {
    console.log(
      `[adaptiveQuestionGenerator] Stimulus provided — skipping cache, generating fresh`,
    );
    const generated = await generateFromAI({
      teks_standard,
      grade_level,
      dok_level,
      question_type,
      subject,

      primary_teks,
      supported_teks,

      previous_attempts,

      content_focus,
      content_focus_key,

      stimulus,
      testing_window,
      title,

      generation_mode,
      passage_format,
      prior_bank_questions,
    });

    return shuffleAnswerOptions(generated);
  }

  // ── Layer 1: Redis ─────────────────────────────────────────────────────────
  const redisResult = await getFromRedis({
    teks_standard,
    dok_level,
    grade_level,
    question_type,
    previous_attempt_ids,
  });
  if (redisResult) {
    console.log(
      `[adaptiveQuestionGenerator] Cache HIT (Redis) — ${teks_standard} DOK${dok_level} ${question_type}`,
    );
    return shuffleAnswerOptions(redisResult);
  }

  // ── Layer 2: question_bank (Supabase) ──────────────────────────────────────
  const bankResult = await getFromQuestionBank({
    teks_standard,
    dok_level,
    grade_level,
    question_type,
    subject,
    previous_attempt_ids,
  });
  if (bankResult) {
    console.log(
      `[adaptiveQuestionGenerator] Cache HIT (question_bank) — ${teks_standard} DOK${dok_level} ${question_type}`,
    );
    return shuffleAnswerOptions(bankResult);
  }

  // ── Layer 3: OpenAI Generation ─────────────────────────────────────────────
  console.log(
    `[adaptiveQuestionGenerator] Cache MISS — generating via OpenAI: ${teks_standard} DOK${dok_level} ${question_type}`,
  );

  // Non-stimulus path — generate, save to question_bank, cache in Redis
  const generated = await generateFromAI({
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    subject,
    previous_attempts,
    content_focus,
    stimulus: null,
    title,
  });
  return shuffleAnswerOptions(generated);
}
