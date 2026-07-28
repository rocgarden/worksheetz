// /app/api/v2/admin/passage-bank/published/[passageBankId]/route.js
//
// Admin-only endpoint for retrieving one published passage-bank package.
//
// GET /api/v2/admin/passage-bank/published/[passageBankId]
//
// Returns:
// - complete passage_bank row
// - all connected passage_question_bank rows
// - package summary counts
//
// This endpoint does not edit, deactivate, archive, or publish content.

import { NextResponse } from "next/server";

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { resolvePassageBankAuditActors } from "@/libs/v2/passageBank/resolveAuditActors";

export const dynamic = "force-dynamic";

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
 * @returns {boolean}
 */
function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

/**
 * @returns {Set<string>}
 */
function getAdminEmails() {
  const values = [
    process.env.ADMIN_EMAIL || "",
    process.env.ADMIN_EMAILS || "",
  ];

  return new Set(
    values
      .join(",")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * @param {object|null} user
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
 * GET /api/v2/admin/passage-bank/published/[passageBankId]
 */
export async function GET(request, { params }) {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Authenticate and authorize admin
     * ----------------------------------------------------------
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
          error: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 2. Validate passageBankId
     * ----------------------------------------------------------
     */

    const { passageBankId } = await params;

    if (!isUuid(passageBankId)) {
      return NextResponse.json(
        {
          error: "A valid passageBankId is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 3. Fetch passage and connected questions
     * ----------------------------------------------------------
     */

    const serviceSupabase = await createV2ServiceClient();

    const { data: passage, error: passageError } = await serviceSupabase
      .from("passage_bank")
      .select(
        `
          id,
          subject,
          grade_level,
          teks_standard,
          passage_format,
          content_focus_key,
          content_focus,
          title,
          passage,
          skill_tags,
          difficulty_level,
          is_active,
          created_at,
          updated_at,
        revision_root_id,
        revision_number,
        replaces_passage_bank_id,
        superseded_at,
          passage_question_bank (
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
            times_used,
            created_by,
            reviewed_by,
            reviewed_at,
            created_at,
            updated_at
          )
        `,
      )
      .eq("id", passageBankId)
      .maybeSingle();

    if (passageError) {
      console.error(
        "[admin/passage-bank/published/[passageBankId]] Package fetch failed",
        {
          error: passageError.message,

          passage_bank_id: passageBankId,

          admin_user_id: user.id,
        },
      );

      return NextResponse.json(
        {
          error: "Failed to retrieve published passage-bank package.",

          details:
            process.env.NODE_ENV === "development"
              ? passageError.message
              : undefined,
        },
        {
          status: 500,
        },
      );
    }

    if (!passage) {
      return NextResponse.json(
        {
          error: "Published passage-bank package was not found.",
        },
        {
          status: 404,
        },
      );
    }
    /*
 * ----------------------------------------------------------
 * 4. Fetch revision history
 * ----------------------------------------------------------
 */

const revisionRootId =
  passage.revision_root_id ||
  passage.id;

const {
  data: revisionRows,
  error: revisionError,
} = await serviceSupabase
  .from("passage_bank")
  .select(
    `
      id,
      title,
      revision_root_id,
      revision_number,
      replaces_passage_bank_id,
      superseded_at,
      is_active,
      created_at,
      updated_at
    `,
  )
  .or(
    [
      `id.eq.${revisionRootId}`,
      `revision_root_id.eq.${revisionRootId}`,
    ].join(","),
  )
  .order(
    "revision_number",
    {
      ascending: true,
    },
  );

if (revisionError) {
  console.error(
    "[admin/passage-bank/published/[passageBankId]] Revision history fetch failed",
    {
      error:
        revisionError.message,

      passage_bank_id:
        passageBankId,

      revision_root_id:
        revisionRootId,
    },
  );

  return NextResponse.json(
    {
      error:
        "Failed to load package revision history.",
    },
    {
      status: 500,
    },
  );
}

const revisions =
  Array.isArray(revisionRows)
    ? revisionRows
    : [];

/*
 * ----------------------------------------------------------
 * 5. Fetch review and publication audit history
 * ----------------------------------------------------------
 */

const {
  data: reviewEventRows,
  error: reviewEventError,
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
  .eq(
    "published_passage_bank_id",
    passageBankId,
  )
  .order(
    "created_at",
    {
      ascending: false,
    },
  );

if (reviewEventError) {
  console.error(
    "[admin/passage-bank/published/[passageBankId]] Review history fetch failed",
    {
      error:
        reviewEventError.message,

      passage_bank_id:
        passageBankId,
    },
  );

  return NextResponse.json(
    {
      error:
        "Failed to load package review history.",
    },
    {
      status: 500,
    },
  );
}

const reviewEvents =
  await resolvePassageBankAuditActors({
    serviceSupabase,
    events: reviewEventRows,
  });
    /*
     * ----------------------------------------------------------
     * 4. Normalize and sort questions
     * ----------------------------------------------------------
     */

    const questions = Array.isArray(passage.passage_question_bank)
      ? [...passage.passage_question_bank].sort((a, b) => {
          const dokDifference = Number(a.dok_level) - Number(b.dok_level);

          if (dokDifference !== 0) {
            return dokDifference;
          }

          return String(a.created_at ?? "").localeCompare(
            String(b.created_at ?? ""),
          );
        })
      : [];

    const approvedQuestions = questions.filter(
      (question) => question.review_status === "approved",
    );

    const activeQuestions = questions.filter(
      (question) =>
        question.review_status === "approved" && question.is_active === true,
    );

    const inactiveQuestions = questions.filter(
      (question) => question.is_active !== true,
    );

    const questionTypes = [
      ...new Set(
        questions.map((question) => question.question_type).filter(Boolean),
      ),
    ];

    const dokLevels = [
      ...new Set(
        questions
          .map((question) => Number(question.dok_level))
          .filter((dokLevel) => [1, 2, 3].includes(dokLevel)),
      ),
    ].sort();

    /*
     * ----------------------------------------------------------
     * 5. Return complete package
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      package: {
        id: passage.id,

        subject: passage.subject,

        grade_level: passage.grade_level,

        teks_standard: passage.teks_standard,

        passage_format: passage.passage_format,

        content_focus_key: passage.content_focus_key,

        content_focus: passage.content_focus,

        title: passage.title,

        passage: passage.passage,

        skill_tags: passage.skill_tags,

        difficulty_level: passage.difficulty_level,

        is_active: passage.is_active,

        questions,

        summary: {
          question_count: questions.length,

          approved_question_count: approvedQuestions.length,

          active_question_count: activeQuestions.length,

          inactive_question_count: inactiveQuestions.length,

          question_types: questionTypes,

          dok_levels: dokLevels,
        },
        revision_root_id: passage.revision_root_id,

        revision_number: passage.revision_number,

        replaces_passage_bank_id: passage.replaces_passage_bank_id,

        superseded_at: passage.superseded_at,

        revisions, 

         review_events: reviewEvents,

        created_at: passage.created_at,

        updated_at: passage.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/published/[passageBankId]] Unexpected error",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return NextResponse.json(
      {
        error: "Failed to retrieve published passage-bank package.",
      },
      {
        status: 500,
      },
    );
  }
}
