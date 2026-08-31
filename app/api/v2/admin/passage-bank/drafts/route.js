// /app/api/v2/admin/passage-bank/drafts/route.js
//
// Admin-only route for listing saved passage-bank draft packages.
//
// GET /api/v2/admin/passage-bank/drafts
//
// Supported query parameters:
// - status
// - subject
// - grade_level
// - teks_standard
// - passage_format
// - search
// - page
// - page_size
//
// This endpoint returns draft summaries only.
// It does not return the full draft_json package.

import { NextResponse } from "next/server";

import { requirePassageBankAdmin } from "@/libs/v2/passageBank/requirePassageBankAdmin";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const VALID_STATUSES = new Set([
  "draft",
  "in_review",
  "approved",
  "rejected",
  "published",
  "archived",
]);

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
 * @param {string|null} value
 * @param {number} fallback
 * @returns {number}
 */
function normalizePositiveInteger(value, fallback) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

/**
 * GET /api/v2/admin/passage-bank/drafts
 */
export async function GET(request) {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Authenticate and authorize admin
     * ----------------------------------------------------------
     */

const adminAuth =
  await requirePassageBankAdmin();

if (!adminAuth.success) {
  return adminAuth.response;
}
const { user } = adminAuth;
    /*
     * ----------------------------------------------------------
     * 2. Parse query parameters
     * ----------------------------------------------------------
     */

    const { searchParams } = new URL(request.url);

    const status = normalizeOptionalString(searchParams.get("status"));

    const subject = normalizeOptionalString(searchParams.get("subject"));

    const gradeLevel = normalizeOptionalString(searchParams.get("grade_level"));

    const teksStandard = normalizeOptionalString(
      searchParams.get("teks_standard"),
    );

    const passageFormat = normalizeOptionalString(
      searchParams.get("passage_format"),
    );

    const search = normalizeOptionalString(searchParams.get("search"));

    const page = normalizePositiveInteger(searchParams.get("page"), 1);

    const requestedPageSize = normalizePositiveInteger(
      searchParams.get("page_size"),
      DEFAULT_PAGE_SIZE,
    );

    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        {
          error: `Invalid status: ${status}.`,
        },
        {
          status: 400,
        },
      );
    }

    const from = (page - 1) * pageSize;

    const to = from + pageSize - 1;

    /*
     * ----------------------------------------------------------
     * 3. Build service-role query
     * ----------------------------------------------------------
     */

    const serviceSupabase = await createV2ServiceClient();

    let query = serviceSupabase
      .from("passage_bank_draft_packages")
      .select(
        `
            id,
            status,
            subject,
            grade_level,
            teks_standard,
            passage_format,
            content_focus_key,
            title,
            draft_json,
            validation_json,
            generation_json,
            created_by,
            updated_by,
            reviewed_by,
            published_passage_bank_id,
            created_at,
            updated_at,
            reviewed_at,
            published_at
          `,
        {
          count: "exact",
        },
      )
      .order("updated_at", {
        ascending: false,
      })
      .range(from, to);

    /*
     * ----------------------------------------------------------
     * 4. Apply optional filters
     * ----------------------------------------------------------
     */

    if (status) {
      query = query.eq("status", status);
    }

    if (subject) {
      query = query.eq("subject", subject);
    }

    if (gradeLevel) {
      query = query.eq("grade_level", gradeLevel);
    }

    if (teksStandard) {
      query = query.eq("teks_standard", teksStandard);
    }

    if (passageFormat) {
      query = query.eq("passage_format", passageFormat);
    }

    if (search) {
      /*
       * Supabase .or() requires a comma-separated PostgREST expression.
       *
       * Search is intentionally limited to top-level searchable columns.
       * Full passage/question search can be added later.
       */
      const escapedSearch = search.replace(/[%_]/g, "\\$&").replace(/,/g, "");

      query = query.or(
        [
          `title.ilike.%${escapedSearch}%`,
          `teks_standard.ilike.%${escapedSearch}%`,
          `content_focus_key.ilike.%${escapedSearch}%`,
        ].join(","),
      );
    }

    /*
     * ----------------------------------------------------------
     * 5. Execute query
     * ----------------------------------------------------------
     */

    const { data, error, count } = await query;

    if (error) {
      console.error("[admin/passage-bank/drafts] Draft list fetch failed", {
        error: error.message,
        admin_user_id: user.id,
      });

      return NextResponse.json(
        {
          error: "Failed to retrieve passage-bank drafts.",

          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 6. Build lightweight response rows
     * ----------------------------------------------------------
     */

    const drafts = (data ?? []).map((draft) => {
      const validation =
        draft.validation_json && typeof draft.validation_json === "object"
          ? draft.validation_json
          : {};

      const generation =
        draft.generation_json && typeof draft.generation_json === "object"
          ? draft.generation_json
          : {};

      const errorCount = Array.isArray(validation.errors)
        ? validation.errors.length
        : 0;

      const warningCount = Array.isArray(validation.warnings)
        ? validation.warnings.length
        : 0;

      const questionCount = Array.isArray(draft.draft_json?.questions)
        ? draft.draft_json.questions.length
        : 0;

      return {
        id: draft.id,

        status: draft.status,

        subject: draft.subject,

        grade_level: draft.grade_level,

        teks_standard: draft.teks_standard,

        passage_format: draft.passage_format,

        content_focus_key: draft.content_focus_key,

        title: draft.title,

        structurally_valid: validation.success === true,

        validation_error_count: errorCount,

        validation_warning_count: warningCount,

        question_count: questionCount,

        created_by: draft.created_by,

        updated_by: draft.updated_by,

        reviewed_by: draft.reviewed_by,

        published_passage_bank_id: draft.published_passage_bank_id,

        created_at: draft.created_at,

        updated_at: draft.updated_at,

        reviewed_at: draft.reviewed_at,

        published_at: draft.published_at,
      };
    });

    const total = Number(count ?? 0);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    /*
     * ----------------------------------------------------------
     * 7. Return paginated draft summaries
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      drafts,

      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPages,
        has_previous_page: page > 1,
        has_next_page: page < totalPages,
      },

      filters: {
        status,
        subject,
        grade_level: gradeLevel,
        teks_standard: teksStandard,
        passage_format: passageFormat,
        search,
      },
    });
  } catch (error) {
    console.error("[admin/passage-bank/drafts] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to retrieve passage-bank drafts.",
      },
      {
        status: 500,
      },
    );
  }
}

// /app/api/v2/admin/passage-bank/drafts/route.js
//
// POST /api/v2/admin/passage-bank/drafts
//
// Creates a brand-new MANUAL passage-bank draft package.
//
// This route:
// - requires passage-bank admin auth
// - accepts one passage + one or more questions
// - synchronizes shared passage text into every question_json
// - synchronizes outer/nested question metadata
// - saves to passage_bank_draft_packages
// - does NOT publish to passage_bank
// - marks validation as stale/required
//
// After creation:
// 1. use the returned draft.id
// 2. add more questions through the existing bulk PATCH route
// 3. run the normal draft validation endpoint
// 4. review/approve/publish normally



/**
 * Returns true only for plain JSON objects.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
 * Synchronize a manually supplied question with the parent passage.
 *
 * Important invariant:
 *
 * outer question.teks_standard
 * ===
 * question.question_json.teks_standard
 *
 * The same synchronization is applied to:
 * - question_type
 * - dok_level
 * - skill_focus
 * - assessment_move
 *
 * @param {object} question
 * @param {object} passage
 * @returns {object}
 */
function synchronizeQuestion(question, passage) {
  const questionJson = isPlainObject(question?.question_json)
    ? question.question_json
    : {};

  const sharedPassage = passage.passage;

  const questionTeks =
    normalizeRequiredString(
      question.teks_standard ??
        questionJson.teks_standard,
    ) || passage.teks_standard;

  const questionType =
    normalizeRequiredString(
      question.question_type ??
        questionJson.question_type,
    ) || "multiple_choice";

  const rawDok = Number(
    question.dok_level ??
      questionJson.dok_level ??
      1,
  );

  const dokLevel =
    Number.isInteger(rawDok) &&
    rawDok >= 1 &&
    rawDok <= 3
      ? rawDok
      : 1;

  const skillFocus =
    normalizeOptionalString(
      question.skill_focus ??
        questionJson.skill_focus,
    );

  const assessmentMove =
    normalizeOptionalString(
      question.assessment_move ??
        questionJson.assessment_move,
    );

  const dramaticFunction =
    normalizeOptionalString(
      question.dramatic_function ??
        questionJson.dramatic_function,
    );

  const targetScene =
    normalizeOptionalString(
      question.target_scene ??
        questionJson.target_scene,
    );

  const correctTargetKey =
    normalizeOptionalString(
      question.correct_target_key ??
        questionJson.correct_target_key,
    );

  const correctTargetText =
    normalizeOptionalString(
      question.correct_target_text ??
        questionJson.correct_target_text,
    );

  const correctDokLevel = Math.min(
    3,
    dokLevel + 1,
  );

  const incorrectDokLevel = Math.max(
    1,
    dokLevel - 1,
  );

  const existingNextLogic = isPlainObject(
    questionJson.next_question_logic,
  )
    ? questionJson.next_question_logic
    : {};

  const existingIfCorrect = isPlainObject(
    existingNextLogic.if_correct,
  )
    ? existingNextLogic.if_correct
    : {};

  const existingIfIncorrect = isPlainObject(
    existingNextLogic.if_incorrect,
  )
    ? existingNextLogic.if_incorrect
    : {};

  const normalizedNextLogic = {
    ...existingNextLogic,

    if_correct: {
      ...existingIfCorrect,

      action:
        normalizeRequiredString(
          existingIfCorrect.action,
        ) ||
        (dokLevel < 3
          ? "increase_difficulty"
          : "maintain_mastery"),

      dok_level: [1, 2, 3].includes(
        Number(existingIfCorrect.dok_level),
      )
        ? Number(existingIfCorrect.dok_level)
        : correctDokLevel,
    },

    if_incorrect: {
      ...existingIfIncorrect,

      action:
        normalizeRequiredString(
          existingIfIncorrect.action,
        ) ||
        (dokLevel === 1
          ? "retry_with_scaffold"
          : "decrease_difficulty"),

      dok_level: [1, 2, 3].includes(
        Number(existingIfIncorrect.dok_level),
      )
        ? Number(existingIfIncorrect.dok_level)
        : incorrectDokLevel,
    },
  };

  return {
    ...question,

    teks_standard: questionTeks,

    question_type: questionType,

    dok_level: dokLevel,

    skill_focus: skillFocus,

    assessment_move: assessmentMove,

    dramatic_function: dramaticFunction,

    target_scene: targetScene,

    correct_target_key: correctTargetKey,

    correct_target_text: correctTargetText,

    review_status:
      normalizeOptionalString(
        question.review_status,
      ) || "draft",

    is_active: false,

    times_used: 0,

    question_json: {
      ...questionJson,

      teks_standard: questionTeks,

      question_type: questionType,

      dok_level: dokLevel,

      skill_focus: skillFocus,

      assessment_move: assessmentMove,

      passage: sharedPassage,

      source:
        normalizeOptionalString(
          questionJson.source,
        ) || "manual",

      generation_mode:
        normalizeOptionalString(
          questionJson.generation_mode,
        ) || "question_bank_question",

      content_focus_key:
        normalizeOptionalString(
          questionJson.content_focus_key,
        ) ||
        normalizeOptionalString(
          passage.content_focus_key,
        ),

      hot_text_targets:
        questionJson.hot_text_targets ?? null,

      dramatic_function: dramaticFunction,

      target_scene: targetScene,

      correct_target_key: correctTargetKey,

      correct_target_text: correctTargetText,

      next_question_logic:
        normalizedNextLogic,
    },
  };
}

/**
 * Expected request:
 *
 * {
 *   passage: {
 *     subject: "ELA",
 *     grade_level: "8",
 *     teks_standard: "8.7C",
 *     passage_format: "fiction",
 *     content_focus_key: "plot_development",
 *     content_focus: "...",
 *     title: "The House on Willow Lane",
 *     passage: "...",
 *     skill_tags: [],
 *     difficulty_level: 2
 *   },
 *   questions: [
 *     {
 *       teks_standard: "8.7C",
 *       question_type: "multiple_choice",
 *       dok_level: 1,
 *       skill_focus: "plot_development",
 *       assessment_move: "identify_key_plot_event",
 *       question_json: { ... }
 *     }
 *   ]
 * }
 */
export async function POST(request) {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Authenticate and authorize admin
     * ----------------------------------------------------------
     */

    const adminAuth =
      await requirePassageBankAdmin();

    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { user } = adminAuth;

    /*
     * ----------------------------------------------------------
     * 2. Parse request
     * ----------------------------------------------------------
     */

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isPlainObject(body)) {
      return NextResponse.json(
        {
          error:
            "Request body must be a JSON object.",
        },
        {
          status: 400,
        },
      );
    }

    const rawPassage = body.passage;

    const rawQuestions = body.questions;

    if (!isPlainObject(rawPassage)) {
      return NextResponse.json(
        {
          error:
            "passage must be a JSON object.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !Array.isArray(rawQuestions) ||
      rawQuestions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "questions must contain at least one question.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 3. Normalize passage
     * ----------------------------------------------------------
     */

    const subject =
      normalizeRequiredString(
        rawPassage.subject,
      );

    const gradeLevel =
      normalizeRequiredString(
        String(
          rawPassage.grade_level ?? "",
        ),
      );

    const teksStandard =
      normalizeRequiredString(
        rawPassage.teks_standard,
      );

    const passageFormat =
      normalizeRequiredString(
        rawPassage.passage_format,
      );

    const passageText =
      normalizeRequiredString(
        rawPassage.passage,
      );

    const title =
      normalizeRequiredString(
        rawPassage.title,
      );

    const contentFocusKey =
      normalizeOptionalString(
        rawPassage.content_focus_key,
      );

    const contentFocus =
      normalizeOptionalString(
        rawPassage.content_focus,
      );

    const difficultyLevel = Number(
      rawPassage.difficulty_level ?? 2,
    );

    if (
      !subject ||
      !gradeLevel ||
      !teksStandard ||
      !passageFormat ||
      !passageText ||
      !title
    ) {
      return NextResponse.json(
        {
          error:
            "passage.subject, passage.grade_level, passage.teks_standard, passage.passage_format, passage.title, and passage.passage are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      ![1, 2, 3].includes(
        difficultyLevel,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "passage.difficulty_level must be 1, 2, or 3.",
        },
        {
          status: 400,
        },
      );
    }

    const passage = {
      ...rawPassage,

      subject,

      grade_level: gradeLevel,

      teks_standard: teksStandard,

      passage_format: passageFormat,

      content_focus_key:
        contentFocusKey,

      content_focus:
        contentFocus,

      title,

      passage: passageText,

      skill_tags:
        normalizeStringArray(
          rawPassage.skill_tags,
        ),

      difficulty_level:
        difficultyLevel,

      /*
       * A draft is never directly active.
       * Activation happens through review/publication.
       */
      is_active: false,
    };

    /*
     * ----------------------------------------------------------
     * 4. Synchronize manual questions
     * ----------------------------------------------------------
     */

    const synchronizedQuestions =
      rawQuestions.map((question, index) => {
        if (!isPlainObject(question)) {
          throw new Error(
            `questions[${index}] must be an object.`,
          );
        }

        return synchronizeQuestion(
          question,
          passage,
        );
      });

    /*
     * ----------------------------------------------------------
     * 5. Minimal required question validation
     * ----------------------------------------------------------
     *
     * Full package validation is intentionally NOT performed here.
     * The existing draft validation endpoint remains authoritative.
     * ----------------------------------------------------------
     */

    for (
      let index = 0;
      index < synchronizedQuestions.length;
      index += 1
    ) {
      const question =
        synchronizedQuestions[index];

      const questionJson =
        question.question_json;

      if (!question.teks_standard) {
        return NextResponse.json(
          {
            error:
              `questions[${index}].teks_standard is required.`,
          },
          {
            status: 400,
          },
        );
      }

      if (!question.skill_focus) {
        return NextResponse.json(
          {
            error:
              `questions[${index}].skill_focus is required.`,
          },
          {
            status: 400,
          },
        );
      }

      if (!question.assessment_move) {
        return NextResponse.json(
          {
            error:
              `questions[${index}].assessment_move is required.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        !normalizeRequiredString(
          questionJson.stem,
        )
      ) {
        return NextResponse.json(
          {
            error:
              `questions[${index}].question_json.stem is required.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        question.question_type ===
        "multiple_choice"
      ) {
        if (
          !Array.isArray(
            questionJson.answer_options,
          ) ||
          questionJson.answer_options.length !==
            4
        ) {
          return NextResponse.json(
            {
              error:
                `questions[${index}].question_json.answer_options must contain exactly 4 options for multiple_choice.`,
            },
            {
              status: 400,
            },
          );
        }

        if (
          !normalizeRequiredString(
            questionJson.correct_answer,
          )
        ) {
          return NextResponse.json(
            {
              error:
                `questions[${index}].question_json.correct_answer is required.`,
            },
            {
              status: 400,
            },
          );
        }
      }
    }

    /*
     * ----------------------------------------------------------
     * 6. Build persistent draft package
     * ----------------------------------------------------------
     */

    const draftPackage = {
      passage,
      questions:
        synchronizedQuestions,
    };

    /*
     * This is a brand-new manual draft.
     *
     * It has not yet gone through the full package validator,
     * so validation must be considered stale/required.
     */
    const validationSnapshot = {
      success: false,

      stale: true,

      issues: [],

      errors: [],

      warnings: [],

      message:
        "Manual draft created. Structural validation is required before review.",

      created_at:
        new Date().toISOString(),

      created_by: user.id,
    };

    const generationSnapshot = {
      mode: "manual",

      source: "manual",

      created_at:
        new Date().toISOString(),

      created_by: user.id,

      request: {
        subject,

        grade_level: gradeLevel,

        teks_standard: teksStandard,

        passage_format:
          passageFormat,

        content_focus_key:
          contentFocusKey,

        content_focus:
          contentFocus,

        title,

        skill_tags:
          passage.skill_tags,

        difficulty_level:
          difficultyLevel,

        question_count:
          synchronizedQuestions.length,
      },
    };

    /*
     * ----------------------------------------------------------
     * 7. Save brand-new draft
     * ----------------------------------------------------------
     */

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: savedDraft,
      error: saveDraftError,
    } = await serviceSupabase
      .from(
        "passage_bank_draft_packages",
      )
      .insert({
        status: "draft",

        subject,

        grade_level:
          gradeLevel,

        teks_standard:
          teksStandard,

        passage_format:
          passageFormat,

        content_focus_key:
          contentFocusKey,

        title,

        draft_json:
          draftPackage,

        validation_json:
          validationSnapshot,

        generation_json:
          generationSnapshot,

        created_by:
          user.id,

        updated_by:
          user.id,

        reviewed_by: null,

        reviewed_at: null,

        published_passage_bank_id:
          null,
      })
      .select(
        `
          id,
          status,
          subject,
          grade_level,
          teks_standard,
          passage_format,
          content_focus_key,
          title,
          created_by,
          updated_by,
          created_at,
          updated_at
        `,
      )
      .single();

    if (
      saveDraftError ||
      !savedDraft
    ) {
      console.error(
        "[admin/passage-bank/drafts] Manual draft creation failed",
        {
          error:
            saveDraftError?.message ||
            "No draft was returned.",

          admin_user_id:
            user.id,

          subject,

          grade_level:
            gradeLevel,

          teks_standard:
            teksStandard,

          title,
        },
      );

      return NextResponse.json(
        {
          error:
            "Failed to create manual passage-bank draft.",

          details:
            process.env.NODE_ENV ===
            "development"
              ? saveDraftError?.message ||
                "No draft was returned."
              : undefined,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 8. Return new draft ID
     * ----------------------------------------------------------
     */

    console.info(
      "[admin/passage-bank/drafts] Manual draft created",
      {
        draft_id:
          savedDraft.id,

        admin_user_id:
          user.id,

        subject,

        grade_level:
          gradeLevel,

        teks_standard:
          teksStandard,

        title,

        question_count:
          synchronizedQuestions.length,
      },
    );

    return NextResponse.json(
      {
        success: true,

        validation_required:
          true,

        draft: {
          ...savedDraft,

          question_count:
            synchronizedQuestions.length,

          structurally_valid:
            false,

          validation_stale:
            true,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "[admin/passage-bank/drafts] Unexpected manual draft creation error",
      {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    );

    return NextResponse.json(
      {
        error:
          "Unexpected error while creating manual passage-bank draft.",

        details:
          process.env.NODE_ENV ===
          "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}