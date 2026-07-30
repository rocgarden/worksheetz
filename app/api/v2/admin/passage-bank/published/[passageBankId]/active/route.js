// /app/api/v2/admin/passage-bank/published/[passageBankId]/active/route.js
//
// Admin-only endpoint for activating or deactivating a published
// passage-bank package and all of its connected questions.
//
// PATCH /api/v2/admin/passage-bank/published/[passageBankId]/active
//
// Body:
// {
//   "is_active": false,
//   "note": "Temporarily removed from adaptive selection.",
//   "metadata": {}
// }
//
// The database RPC atomically:
// - validates the requested state
// - updates passage_bank.is_active
// - updates every connected passage_question_bank.is_active
// - prevents superseded revisions from being reactivated
// - inserts an immutable audit event

import { NextResponse } from "next/server";

import { requirePassageBankAdmin } from "@/libs/v2/passageBank/requirePassageBankAdmin";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

export const dynamic = "force-dynamic";

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function getRpcErrorStatus(message) {
  if (/not found/i.test(message)) {
    return 404;
  }

  if (
    /already active|already inactive/i.test(
      message,
    )
  ) {
    return 409;
  }

  if (
    /superseded passage-bank revisions cannot be reactivated|only the latest passage-bank revision can be reactivated|another revision.+already active/i.test(
      message,
    )
  ) {
    return 409;
  }

  if (
    /p_performed_by is required|p_is_active is required/i.test(
      message,
    )
  ) {
    return 400;
  }

  return 500;
}

export async function PATCH(
  request,
  { params },
) {
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
     * 2. Validate passageBankId
     * ----------------------------------------------------------
     */

    const {
      passageBankId,
    } = await params;

    if (!isUuid(passageBankId)) {
      return NextResponse.json(
        {
          error:
            "A valid passageBankId is required.",
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

    if (
      typeof body.is_active !==
      "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "is_active must be a boolean.",
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
     * 4. Update package and question state atomically
     * ----------------------------------------------------------
     */

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: result,
      error: rpcError,
    } = await serviceSupabase.rpc(
      "set_passage_bank_active_state",
      {
        p_passage_bank_id:
          passageBankId,

        p_is_active:
          body.is_active,

        p_performed_by:
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
        "Package activation update failed.";

      const status =
        getRpcErrorStatus(
          errorMessage,
        );

      if (status >= 500) {
        console.error(
          "[admin/passage-bank/published/[passageBankId]/active] RPC failed",
          {
            error:
              errorMessage,

            passage_bank_id:
              passageBankId,

            requested_is_active:
              body.is_active,

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
      !isPlainObject(result) ||
      !isPlainObject(result.passage)
    ) {
      console.error(
        "[admin/passage-bank/published/[passageBankId]/active] RPC returned malformed data",
        {
          passage_bank_id:
            passageBankId,

          admin_user_id:
            user.id,
        },
      );

      return NextResponse.json(
        {
          error:
            "Package state changed, but the response was malformed.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 5. Return updated package state
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      action:
        result.action,

      package: {
        passage_bank_id:
          result.passage.id,

        revision_root_id:
          result.passage
            .revision_root_id,

        revision_number:
          result.passage
            .revision_number,

        title:
          result.passage.title,

        subject:
          result.passage.subject,

        grade_level:
          result.passage
            .grade_level,

        teks_standard:
          result.passage
            .teks_standard,

        is_active:
          result.passage
            .is_active,

        superseded_at:
          result.passage
            .superseded_at,

        updated_at:
          result.passage
            .updated_at,

        question_count:
          result.question_count,

        active_question_count:
          result.active_question_count,
      },

      draft_package_id:
        result.draft_package_id,
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/published/[passageBankId]/active] Unexpected error",
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
          "Failed to update passage-bank package state.",
      },
      {
        status: 500,
      },
    );
  }
}