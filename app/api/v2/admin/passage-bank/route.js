// /app/api/v2/admin/passage-bank/route.js
//
// Protected admin route that creates:
//
// 1. Multiple reviewed passage_question_bank rows connected through
//    passage_bank_id.
//
// The route validates every question before writing any question rows.
//
// Security:
// - Requires a signed-in Supabase user.
// - Requires the user's email to appear in ADMIN_EMAILS.
// - Uses the V2 service-role client for database writes.
//

import { NextResponse } from "next/server";
import { requirePassageBankAdmin } from "@/libs/v2/passageBank/requirePassageBankAdmin";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

import { validatePassageQuestionBankPackage } from "@/libs/adaptive/questionBank/validatePassageQuestionBankPackage";
const VALID_DOK_LEVELS = new Set([1, 2, 3]);

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
 * Normalizes an optional string.
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
 * Normalizes a required string.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Validates and normalizes skill tags.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeSkillTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.map((tag) => normalizeOptionalString(tag)).filter(Boolean),
    ),
  ];
}

/**
 * Validates the incoming passage object.
 *
 * @param {unknown} rawPassage
 * @returns {{
 *   success: boolean,
 *   data: object|null,
 *   errors: Array<{path: string, message: string}>
 * }}
 */
function validatePassage(rawPassage) {
  const errors = [];

  if (!isPlainObject(rawPassage)) {
    return {
      success: false,
      data: null,
      errors: [
        {
          path: "passage",
          message: "passage must be a JSON object.",
        },
      ],
    };
  }

  const subject = normalizeRequiredString(rawPassage.subject);
  const gradeLevel = normalizeRequiredString(
    String(rawPassage.grade_level ?? ""),
  );
  const teksStandard = normalizeRequiredString(rawPassage.teks_standard);
  const passageFormat = normalizeRequiredString(rawPassage.passage_format);
  const contentFocusKey = normalizeRequiredString(rawPassage.content_focus_key);
  const contentFocus = normalizeRequiredString(rawPassage.content_focus);
  const title = normalizeRequiredString(rawPassage.title);
  const passage = normalizeRequiredString(rawPassage.passage);

  const difficultyLevel = Number(rawPassage.difficulty_level ?? 2);

  if (!subject) {
    errors.push({
      path: "passage.subject",
      message: "subject is required.",
    });
  }

  if (!gradeLevel) {
    errors.push({
      path: "passage.grade_level",
      message: "grade_level is required.",
    });
  }

  if (!teksStandard) {
    errors.push({
      path: "passage.teks_standard",
      message: "teks_standard is required.",
    });
  }

  if (!passageFormat) {
    errors.push({
      path: "passage.passage_format",
      message: "passage_format is required.",
    });
  }

  if (!contentFocusKey) {
    errors.push({
      path: "passage.content_focus_key",
      message: "content_focus_key is required.",
    });
  }

  if (!contentFocus) {
    errors.push({
      path: "passage.content_focus",
      message: "content_focus is required.",
    });
  }

  if (!title) {
    errors.push({
      path: "passage.title",
      message: "title is required.",
    });
  }

  if (!passage) {
    errors.push({
      path: "passage.passage",
      message: "passage text is required.",
    });
  }

  if (!VALID_DOK_LEVELS.has(difficultyLevel)) {
    errors.push({
      path: "passage.difficulty_level",
      message: "difficulty_level must be 1, 2, or 3.",
    });
  }

  if (errors.length > 0) {
    return {
      success: false,
      data: null,
      errors,
    };
  }

  return {
    success: true,
    data: {
      subject,
      grade_level: gradeLevel,
      teks_standard: teksStandard,
      passage_format: passageFormat,
      content_focus_key: contentFocusKey,
      content_focus: contentFocus,
      title,
      passage,
      skill_tags: normalizeSkillTags(rawPassage.skill_tags),
      difficulty_level: difficultyLevel,
      is_active: rawPassage.is_active !== false,
    },
    errors: [],
  };
}

/**
 * Builds complete question-bank rows from the incoming question objects.
 *
 * Passage identity fields are always derived from the newly inserted passage.
 * The request cannot assign a question to a different subject, grade, TEKS,
 * or passage ID.
 *
 * @param {Array<object>} rawQuestions
 * @param {object} passage
 * @param {string} userId
 * @returns {Array<object>}
 */
function buildQuestionRows({
  validatedQuestions,
  passage,
  userId,
}) {
  const now = new Date().toISOString();

  return validatedQuestions.map((question) => {
    const reviewStatus =
      normalizeOptionalString(
        question.review_status,
      ) || "draft";

    const isApproved =
      reviewStatus === "approved";

    return {
      teks_standard:
        passage.teks_standard,

      subject:
        passage.subject,

      grade_level:
        passage.grade_level,

      question_type:
        question.question_type,

      dok_level:
        Number(question.dok_level),

      skill_focus:
        normalizeOptionalString(
          question.skill_focus,
        ),

      assessment_move:
        normalizeOptionalString(
          question.assessment_move,
        ),

      dramatic_function:
        normalizeOptionalString(
          question.dramatic_function,
        ),

      target_scene:
        normalizeOptionalString(
          question.target_scene,
        ),

      correct_target_text:
        normalizeOptionalString(
          question.correct_target_text,
        ),

      correct_target_key:
        normalizeOptionalString(
          question.correct_target_key,
        ),

      question_json:
        question.question_json,

      review_status:
        reviewStatus,

      is_active:
        isApproved &&
        question.is_active === true,

      times_used: 0,

      created_by:
        userId,

      reviewed_by:
        isApproved ? userId : null,

      reviewed_at:
        isApproved ? now : null,
    };
  });
}

export async function GET() {
  try {
    /*
     * ------------------------------------------------------------
     * 1. Authenticate and authorize the administrator
     * ------------------------------------------------------------
     */

    const adminAuth =
     await requirePassageBankAdmin();

    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const serviceSupabase = await createV2ServiceClient();

    /*
     * ------------------------------------------------------------
     * 2. Load draft packages
     * ------------------------------------------------------------
     */

    const {
      data: drafts,
      error: draftsError,
    } = await serviceSupabase
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
          validation_json,
          created_by,
          updated_by,
          reviewed_by,
          published_passage_bank_id,
          revision_of_passage_bank_id,
          revision_root_id,
          revision_number,
          created_at,
          updated_at,
          reviewed_at,
          published_at
        `,
      )
      .order("updated_at", {
        ascending: false,
      });

    if (draftsError) {
      console.error(
        "[admin/passage-bank] Failed to load draft overview data",
        {
          error: draftsError.message,
        },
      );

      return NextResponse.json(
        {
          error: "Unable to load passage-bank drafts.",
          details: draftsError.message,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ------------------------------------------------------------
     * 3. Load published passage packages
     * ------------------------------------------------------------
     */

    const {
      data: publishedPackages,
      error: publishedError,
    } = await serviceSupabase
      .from("passage_bank")
     .select(
        `
          id,
          subject,
          grade_level,
          teks_standard,
          passage_format,
          content_focus_key,
          title,
          is_active,
          revision_root_id,
          revision_number,
          replaces_passage_bank_id,
          superseded_at,
          created_at,
          updated_at
        `,
      )
      .order("updated_at", {
        ascending: false,
      });

    if (publishedError) {
      console.error(
        "[admin/passage-bank] Failed to load published overview data",
        {
          error: publishedError.message,
        },
      );

      return NextResponse.json(
        {
          error: "Unable to load published passage-bank packages.",
          details: publishedError.message,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ------------------------------------------------------------
     * 4. Load recent audit events
     * ------------------------------------------------------------
     */

    const {
      data: recentEvents,
      error: eventsError,
    } = await serviceSupabase
      .from("passage_bank_review_events")
      .select(
        `
          id,
          draft_package_id,
          published_passage_bank_id,
          action,
          from_status,
          to_status,
          note,
          validation_snapshot,
          metadata,
          performed_by,
          created_at
        `,
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(20);

    if (eventsError) {
      console.error(
        "[admin/passage-bank] Failed to load recent audit events",
        {
          error: eventsError.message,
        },
      );

      return NextResponse.json(
        {
          error: "Unable to load passage-bank audit activity.",
          details: eventsError.message,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ------------------------------------------------------------
     * 5. Normalize collections
     * ------------------------------------------------------------
     */

    const draftRows = Array.isArray(drafts)
      ? drafts
      : [];

    const publishedRows = Array.isArray(
      publishedPackages,
    )
      ? publishedPackages
      : [];

    const auditRows = Array.isArray(recentEvents)
      ? recentEvents
      : [];

    /*
     * ------------------------------------------------------------
     * 6. Build draft summary metrics
     * ------------------------------------------------------------
     */

  const archivedDrafts = draftRows.filter(
  (draft) => draft.status === "archived",
);

const currentDrafts = draftRows.filter(
  (draft) => draft.status !== "archived",
);

const draftCountsByStatus = draftRows.reduce(
  (counts, draft) => {
    const status =
      normalizeOptionalString(draft.status) ||
      "draft";

    counts[status] =
      (counts[status] || 0) + 1;

    return counts;
  },
  {},
);

const needsReview = currentDrafts.filter(
  (draft) => draft.status === "in_review",
);

const approvedNotPublished =
  currentDrafts.filter(
    (draft) =>
      draft.status === "approved" &&
      !draft.published_passage_bank_id,
  );

const revisionsAwaitingReview =
  currentDrafts.filter(
    (draft) =>
      Boolean(
        draft.revision_of_passage_bank_id,
      ) &&
      ["draft", "in_review"].includes(
        draft.status,
      ),
  );

const returnedForChanges =
  currentDrafts.filter(
    (draft) => draft.status === "rejected",
  );

    /*
     * ------------------------------------------------------------
     * 7. Build published summary metrics
     * ------------------------------------------------------------
     */

    const activePublished =
      publishedRows.filter(
        (row) => row.is_active === true,
      );

    const inactivePublished =
      publishedRows.filter(
        (row) => row.is_active !== true,
      );

    const supersededPublished =
     publishedRows.filter(
      (row) =>
        Boolean(row.superseded_at),
    );

    const currentPublished =
      publishedRows.filter(
        (row) =>
          !row.superseded_at,
      );

    /*
     * ------------------------------------------------------------
     * 8. Return overview payload
     * ------------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      summary: {
          drafts: {
          total: draftRows.length,
          current: currentDrafts.length,
          archived: archivedDrafts.length,
          by_status: draftCountsByStatus,
          needs_review: needsReview.length,
          approved_not_published:
            approvedNotPublished.length,
          revisions_awaiting_review:
            revisionsAwaitingReview.length,
          returned_for_changes:
            returnedForChanges.length,
        },

        published: {
          total: publishedRows.length,
          active: activePublished.length,
          inactive: inactivePublished.length,
          current: currentPublished.length,
          superseded:
            supersededPublished.length,
        },
      },

      review_queue: {
        needs_review: needsReview,
        returned_for_changes:
          returnedForChanges,
        approved_not_published:
          approvedNotPublished,
        revisions_awaiting_review:
          revisionsAwaitingReview,
      },

      recent_activity: auditRows,
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank] Unexpected overview route error",
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
          "Unable to load passage-bank admin overview.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request) {
  try {
    /*
     * ------------------------------------------------------------
     * 1. Authenticate the requesting user
     * ------------------------------------------------------------
     */



    /*
     * ------------------------------------------------------------
     * 2. Parse the request body
     * ------------------------------------------------------------
     */

    const adminAuth =
    await requirePassageBankAdmin();

    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { user } = adminAuth;

    let body;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Request body must contain valid JSON.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isPlainObject(body)) {
      return NextResponse.json(
        {
          error: "Request body must be a JSON object.",
        },
        {
          status: 400,
        },
      );
    }

    const rawQuestions = body.questions;

    if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return NextResponse.json(
        {
          error: "questions must contain at least one question-bank row.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ------------------------------------------------------------
     * 3. Validate the passage
     * ------------------------------------------------------------
     */

    const passageValidation = validatePassage(body.passage);

    if (!passageValidation.success) {
      return NextResponse.json(
        {
          error: "Passage validation failed.",
          issues: passageValidation.errors,
        },
        {
          status: 400,
        },
      );
    }

    const passageData = passageValidation.data;

/*
 * ------------------------------------------------------------
 * 4. Validate the complete reviewed package before any writes
 * ------------------------------------------------------------
 */

const packageValidation =
  validatePassageQuestionBankPackage(
    {
      passage: {
        ...passageData,

        /*
         * Validate the package as an unpublished draft.
         * Final activation is applied only after validation passes.
         */
        is_active: false,
      },

      questions: rawQuestions,
    },
    {
      allowUnknownQuestionTypes: false,
      treatRecommendationsAsErrors: false,
    },
  );

if (!packageValidation.success) {
  return NextResponse.json(
    {
      error:
        "Passage question-bank package validation failed.",

      issues:
        packageValidation.issues,

      errors:
        packageValidation.errors,

      warnings:
        packageValidation.warnings,
    },
    {
      status: 400,
    },
  );
}

const validatedPackage =
  packageValidation.data;

/*
 * ------------------------------------------------------------
 * 5. Build the final RPC payload
 * ------------------------------------------------------------
 */

const finalPassageData = {
  ...passageData,

  is_active:
    body.passage?.is_active === true,
};

const questionRows =
  buildQuestionRows({
    validatedQuestions:
      validatedPackage.questions,

    passage:
      finalPassageData,

    userId:
      user.id,
  });

/*
 * ------------------------------------------------------------
 * 6. Atomically publish passage and questions
 * ------------------------------------------------------------
 */

const serviceSupabase =
  await createV2ServiceClient();

const {
  data: publishedPackage,
  error: publishError,
} = await serviceSupabase.rpc(
  "publish_passage_question_bank_package",
  {
    p_passage:
      finalPassageData,

    p_questions:
      questionRows,
  },
);

if (publishError || !publishedPackage) {
  console.error(
    "[admin/passage-bank] Atomic publish failed",
    {
      error:
        publishError?.message ||
        "No package was returned.",

      title:
        finalPassageData.title,

      teks_standard:
        finalPassageData.teks_standard,
    },
  );

  return NextResponse.json(
    {
      error:
        "Failed to publish passage question bank.",

      details:
        publishError?.message ||
        "No package was returned.",
    },
    {
      status: 500,
    },
  );
}

/*
 * ------------------------------------------------------------
 * 7. Return the connected passage and questions
 * ------------------------------------------------------------
 */

const insertedPassage =
  publishedPackage.passage;

const insertedQuestions =
  Array.isArray(
    publishedPackage.questions,
  )
    ? publishedPackage.questions
    : [];

console.info(
  "[admin/passage-bank] Passage and question bank created",
  {
    passage_bank_id:
      insertedPassage?.id,

    subject:
      insertedPassage?.subject,

    grade_level:
      insertedPassage?.grade_level,

    teks_standard:
      insertedPassage?.teks_standard,

    question_count:
      insertedQuestions.length,

    created_by:
      user.id,
  },
);

return NextResponse.json(
  {
    success: true,

    passage:
      insertedPassage,

    questions:
      insertedQuestions,

    warnings:
      packageValidation.warnings,
  },
  {
    status: 201,
  },
);
 } catch (error) {
  console.error(
    "[admin/passage-bank] Unexpected route error",
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
        "Unable to create passage question bank.",
    },
    {
      status: 500,
    },
  );
 }
}
