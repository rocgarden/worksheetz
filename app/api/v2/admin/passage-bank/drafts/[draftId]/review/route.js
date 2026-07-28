// /app/api/v2/admin/passage-bank/drafts/[draftId]/review/route.js
//
// Admin-only endpoint for changing a draft package's review status.
//
// POST /api/v2/admin/passage-bank/drafts/[draftId]/review
//
// Supported actions:
// - submit_for_review
// - approve
// - reject
// - return_to_draft
// - archive
// - restore
//
// The database RPC atomically:
// 1. locks the draft
// 2. validates the transition
// 3. updates the draft status
// 4. inserts the immutable audit event

import { NextResponse } from "next/server";

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

export const dynamic = "force-dynamic";

const ACTION_CONFIG = Object.freeze({
  submit_for_review: {
    rpcAction: "submitted_for_review",
    toStatus: "in_review",
  },

  approve: {
    rpcAction: "approved",
    toStatus: "approved",
  },

  reject: {
    rpcAction: "rejected",
    toStatus: "rejected",
  },

  return_to_draft: {
    rpcAction: "returned_to_draft",
    toStatus: "draft",
  },

  archive: {
    rpcAction: "archived",
    toStatus: "archived",
  },

  restore: {
    rpcAction: "restored",
    toStatus: "draft",
  },
});

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
 * Supports:
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
 * Maps expected workflow/database errors to an HTTP status.
 *
 * @param {string} message
 * @returns {number}
 */
function getRpcErrorStatus(message) {
  if (
    /not found/i.test(message)
  ) {
    return 404;
  }

  if (
    /already in status|invalid review transition|cannot change review status|may only be restored/i.test(
      message,
    )
  ) {
    return 409;
  }

  if (
    /validation is stale|must pass structural validation/i.test(
      message,
    )
  ) {
    return 422;
  }

  if (
    /invalid destination status|invalid review action|does not match destination/i.test(
      message,
    )
  ) {
    return 400;
  }

  return 500;
}

/**
 * POST /api/v2/admin/passage-bank/drafts/[draftId]/review
 *
 * Body:
 *
 * {
 *   "action": "submit_for_review",
 *   "note": "Ready for review.",
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
     * 3. Parse request body
     * ----------------------------------------------------------
     */

    let body;

    try {
      body =
        await request.json();
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

    const action =
      normalizeOptionalString(
        body.action,
      );

    const actionConfig =
      action
        ? ACTION_CONFIG[action]
        : null;

    if (!actionConfig) {
      return NextResponse.json(
        {
          error:
            "action must be one of: submit_for_review, approve, reject, return_to_draft, archive, or restore.",
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
     * 4. Run atomic review-status transaction
     * ----------------------------------------------------------
     */

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: updatedDraft,
      error: rpcError,
    } = await serviceSupabase.rpc(
      "update_passage_bank_draft_review_status",
      {
        p_draft_package_id:
          draftId,

        p_to_status:
          actionConfig.toStatus,

        p_action:
          actionConfig.rpcAction,

        p_note:
          note,

        p_performed_by:
          user.id,

        p_metadata:
          metadata,
      },
    );

    if (rpcError) {
      const errorMessage =
        rpcError.message ||
        "Review-status update failed.";

      const status =
        getRpcErrorStatus(
          errorMessage,
        );

      if (status >= 500) {
        console.error(
          "[admin/passage-bank/drafts/[draftId]/review] RPC failed",
          {
            error:
              errorMessage,

            draft_id:
              draftId,

            requested_action:
              action,

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

    if (!updatedDraft) {
      return NextResponse.json(
        {
          error:
            "Review-status update returned no draft.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 5. Return updated draft summary
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      action,

      draft: {
        id:
          updatedDraft.id,

        status:
          updatedDraft.status,

        subject:
          updatedDraft.subject,

        grade_level:
          updatedDraft.grade_level,

        teks_standard:
          updatedDraft.teks_standard,

        passage_format:
          updatedDraft.passage_format,

        content_focus_key:
          updatedDraft
            .content_focus_key,

        title:
          updatedDraft.title,

        reviewed_by:
          updatedDraft.reviewed_by,

        reviewed_at:
          updatedDraft.reviewed_at,

        updated_by:
          updatedDraft.updated_by,

        updated_at:
          updatedDraft.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/drafts/[draftId]/review] Unexpected error",
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
          "Failed to update passage-bank draft review status.",
      },
      {
        status: 500,
      },
    );
  }
}