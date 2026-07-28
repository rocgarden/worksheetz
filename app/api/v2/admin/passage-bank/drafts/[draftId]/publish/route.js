// /app/api/v2/admin/passage-bank/drafts/[draftId]/publish/route.js
//
// Admin-only endpoint that publishes an approved passage-bank draft.
//
// POST /api/v2/admin/passage-bank/drafts/[draftId]/publish
//
// The database RPC atomically:
// - verifies the draft is approved
// - verifies validation is fresh and successful
// - inserts passage_bank
// - inserts connected passage_question_bank rows
// - marks the draft as published
// - stores published_passage_bank_id
// - inserts an immutable publish audit event

import { NextResponse } from "next/server";

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

export const dynamic = "force-dynamic";

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
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
      .map((email) =>
        email.trim().toLowerCase(),
      )
      .filter(Boolean),
  );
}

/**
 * @param {object|null} user
 * @returns {boolean}
 */
function isAuthorizedAdmin(user) {
  const email =
    normalizeOptionalString(
      user?.email,
    )?.toLowerCase();

  if (!email) {
    return false;
  }

  return getAdminEmails().has(email);
}

/**
 * Maps expected RPC failures to HTTP statuses.
 *
 * @param {string} message
 * @returns {number}
 */
function getRpcErrorStatus(message) {
  if (/not found/i.test(message)) {
    return 404;
  }

 if (
  /already been published|only approved drafts can be published|revision drafts must be published through/i.test(
    message,
  )
) {
  return 409;
}

  if (
    /must pass structural validation|validation is stale/i.test(
      message,
    )
  ) {
    return 422;
  }

  if (
    /must be a JSON|must contain at least one|is required/i.test(
      message,
    )
  ) {
    return 400;
  }

  return 500;
}

/**
 * POST /api/v2/admin/passage-bank/drafts/[draftId]/publish
 *
 * Optional body:
 *
 * {
 *   "note": "Approved package published.",
 *   "metadata": {}
 * }
 */
export async function POST(
  request,
  { params },
) {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Authenticate and authorize admin
     * ----------------------------------------------------------
     */

    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
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
     * 2. Validate draftId
     * ----------------------------------------------------------
     */

    const {
      draftId,
    } = await params;

    if (!isUuid(draftId)) {
      return NextResponse.json(
        {
          error:
            "A valid draftId is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 3. Parse optional request body
     * ----------------------------------------------------------
     */

    let body = {};

    const rawBody =
      await request.text();

    if (rawBody.trim()) {
      try {
        body =
          JSON.parse(rawBody);
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

    const note =
      normalizeOptionalString(
        body.note,
      );

    const metadata =
      body.metadata === undefined
        ? {}
        : body.metadata;

    if (!isPlainObject(metadata)) {
      return NextResponse.json(
        {
          error:
            "metadata must be a JSON object when provided.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 4. Run atomic approved-draft publication
     * ----------------------------------------------------------
     */

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: published,
      error: rpcError,
    } = await serviceSupabase.rpc(
      "publish_approved_passage_bank_draft",
      {
        p_draft_package_id:
          draftId,

        p_published_by:
          user.id,

        p_note:
          note,

        p_metadata:
          metadata,
      },
    );

    if (rpcError) {
      const errorMessage =
        rpcError.message ||
        "Draft publication failed.";

      const status =
        getRpcErrorStatus(
          errorMessage,
        );

      if (status >= 500) {
        console.error(
          "[admin/passage-bank/drafts/[draftId]/publish] RPC failed",
          {
            error:
              errorMessage,

            draft_id:
              draftId,

            admin_user_id:
              user.id,
          },
        );
      }

      return NextResponse.json(
        {
          error:
            errorMessage,
        },
        {
          status,
        },
      );
    }

    if (
      !isPlainObject(published) ||
      !isPlainObject(
        published.passage,
      ) ||
      !isPlainObject(
        published.draft,
      )
    ) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]/publish] RPC returned malformed data",
        {
          draft_id:
            draftId,

          admin_user_id:
            user.id,
        },
      );

      return NextResponse.json(
        {
          error:
            "Draft was published, but the publication response was malformed.",
        },
        {
          status: 500,
        },
      );
    }

    const questions =
      Array.isArray(
        published.questions,
      )
        ? published.questions
        : [];

    /*
     * ----------------------------------------------------------
     * 5. Return published package summary
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      draft: {
        id:
          published.draft.id,

        status:
          published.draft.status,

        published_passage_bank_id:
          published.draft
            .published_passage_bank_id,

        published_at:
          published.draft
            .published_at,

        updated_by:
          published.draft
            .updated_by,

        updated_at:
          published.draft
            .updated_at,
      },

      package: {
        passage_bank_id:
          published.passage.id,

        subject:
          published.passage.subject,

        grade_level:
          published.passage
            .grade_level,

        teks_standard:
          published.passage
            .teks_standard,

        passage_format:
          published.passage
            .passage_format,

        content_focus_key:
          published.passage
            .content_focus_key,

        title:
          published.passage.title,

        is_active:
          published.passage
            .is_active,

        question_count:
          questions.length,

        questions,
      },
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/drafts/[draftId]/publish] Unexpected error",
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
          "Failed to publish passage-bank draft.",
      },
      {
        status: 500,
      },
    );
  }
}