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

import { createClient } from "@/libs/supabase/server";
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
 * Returns the configured administrator email addresses.
 *
 * ADMIN_EMAILS should be a comma-separated environment variable:
 *
 * ADMIN_EMAILS=rgarcia646@gmail.com,admin2@example.com
 *
 * @returns {Set<string>}
 */
function getAdminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAIL || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Verifies that the authenticated user is an authorized administrator.
 *
 * Replace this helper later if the application moves administrator roles
 * into profiles, app_metadata, or a dedicated permissions table.
 *
 * @param {object} user
 * @returns {boolean}
 */
function isAuthorizedAdmin(user) {
  const email = normalizeOptionalString(user?.email)?.toLowerCase();

  if (!email) {
    return false;
  }

  return getAdminEmails().has(email);
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

/**
 * POST /api/v2/admin/passage-bank
 *
 * Expected request body:
 *
 * {
 *   "passage": {
 *     "subject": "ELA",
 *     "grade_level": "8",
 *     "teks_standard": "8.8C",
 *     "passage_format": "drama",
 *     "content_focus_key": "misunderstanding_deadline_choice",
 *     "content_focus": "...",
 *     "title": "Before the Upload",
 *     "passage": "...",
 *     "skill_tags": ["dramatic_action"],
 *     "difficulty_level": 3,
 *     "is_active": true
 *   },
 *   "questions": [
 *     {
 *       "question_type": "hot_text",
 *       "dok_level": 2,
 *       "skill_focus": "...",
 *       "assessment_move": "...",
 *       "dramatic_function": "reveals_motivation",
 *       "target_scene": "scene_3",
 *       "correct_target_text": "...",
 *       "correct_target_key": "...",
 *       "question_json": {},
 *       "review_status": "approved",
 *       "is_active": true
 *     }
 *   ]
 * }
 */
export async function POST(request) {
  try {
    /*
     * ------------------------------------------------------------
     * 1. Authenticate the requesting user
     * ------------------------------------------------------------
     */

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    if (!isAuthorizedAdmin(user)) {
      return NextResponse.json(
        {
          error: "Administrator access is required.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * ------------------------------------------------------------
     * 2. Parse the request body
     * ------------------------------------------------------------
     */

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
