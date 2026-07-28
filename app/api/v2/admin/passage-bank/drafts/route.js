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

import { createClient } from "@/libs/supabase/server";
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
 * Supports either:
 *
 * ADMIN_EMAIL=rgarcia646@gmail.com
 *
 * or:
 *
 * ADMIN_EMAILS=rgarcia646@gmail.com,admin2@example.com
 *
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
