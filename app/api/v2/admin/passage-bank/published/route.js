// /app/api/v2/admin/passage-bank/published/route.js
//
// Admin-only endpoint for listing published passage-bank packages.
//
// GET /api/v2/admin/passage-bank/published
//
// Supported filters:
// - subject
// - grade_level
// - teks_standard
// - passage_format
// - active
// - search
// - page
// - page_size
//
// Returns one summary row per passage_bank record, including the number of
// connected passage_question_bank rows.

import { NextResponse } from "next/server";

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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
 * @param {string|null} value
 * @returns {boolean|null}
 */
function normalizeBooleanFilter(value) {
  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
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
 * GET /api/v2/admin/passage-bank/published
 */
export async function GET(request) {
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
     * 2. Parse filters and pagination
     * ----------------------------------------------------------
     */

    const { searchParams } = new URL(request.url);

    const subject = normalizeOptionalString(searchParams.get("subject"));

    const gradeLevel = normalizeOptionalString(searchParams.get("grade_level"));

    const teksStandard = normalizeOptionalString(
      searchParams.get("teks_standard"),
    );

    const passageFormat = normalizeOptionalString(
      searchParams.get("passage_format"),
    );

    const activeRaw = searchParams.get("active");

    const active = normalizeBooleanFilter(activeRaw);

    const search = normalizeOptionalString(searchParams.get("search"));

    const page = normalizePositiveInteger(searchParams.get("page"), 1);

    const requestedPageSize = normalizePositiveInteger(
      searchParams.get("page_size"),
      DEFAULT_PAGE_SIZE,
    );

    const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);

    if (activeRaw !== null && active === null) {
      return NextResponse.json(
        {
          error: "active must be true or false.",
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
     * 3. Build passage-bank query
     * ----------------------------------------------------------
     */

    const serviceSupabase = await createV2ServiceClient();

    let query = serviceSupabase
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
              question_type,
              dok_level,
              review_status,
              is_active
            )
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

    if (active !== null) {
      query = query.eq("is_active", active);
    }

    if (search) {
      const escapedSearch = search.replace(/[%_]/g, "\\$&").replace(/,/g, "");

      query = query.or(
        [
          `title.ilike.%${escapedSearch}%`,
          `teks_standard.ilike.%${escapedSearch}%`,
          `content_focus_key.ilike.%${escapedSearch}%`,
          `content_focus.ilike.%${escapedSearch}%`,
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
      console.error(
        "[admin/passage-bank/published] Published package list failed",
        {
          error: error.message,
          admin_user_id: user.id,
        },
      );

      return NextResponse.json(
        {
          error: "Failed to retrieve published passage-bank packages.",

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
     * 6. Build package summaries
     * ----------------------------------------------------------
     */

    const packages = (data ?? []).map((passage) => {
      const questions = Array.isArray(passage.passage_question_bank)
        ? passage.passage_question_bank
        : [];

      const activeQuestions = questions.filter(
        (question) =>
          question.is_active === true && question.review_status === "approved",
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
            .filter((dok) => [1, 2, 3].includes(dok)),
        ),
      ].sort();

      return {
        id: passage.id,

        subject: passage.subject,

        grade_level: passage.grade_level,

        teks_standard: passage.teks_standard,

        passage_format: passage.passage_format,

        content_focus_key: passage.content_focus_key,

        content_focus: passage.content_focus,

        title: passage.title,

        skill_tags: passage.skill_tags,

        difficulty_level: passage.difficulty_level,

        is_active: passage.is_active,

        question_count: questions.length,

        active_question_count: activeQuestions.length,

        question_types: questionTypes,

        dok_levels: dokLevels,

        created_at: passage.created_at,

        updated_at: passage.updated_at,

        revision_root_id: passage.revision_root_id,

        revision_number: passage.revision_number,

        replaces_passage_bank_id: passage.replaces_passage_bank_id,

        superseded_at: passage.superseded_at,
      };
    });

    const total = Number(count ?? 0);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    /*
     * ----------------------------------------------------------
     * 7. Return paginated results
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      packages,

      pagination: {
        page,
        page_size: pageSize,
        total,
        total_pages: totalPages,
        has_previous_page: page > 1,
        has_next_page: page < totalPages,
      },

      filters: {
        subject,
        grade_level: gradeLevel,
        teks_standard: teksStandard,
        passage_format: passageFormat,
        active,
        search,
      },
    });
  } catch (error) {
    console.error("[admin/passage-bank/published] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to retrieve published passage-bank packages.",
      },
      {
        status: 500,
      },
    );
  }
}
