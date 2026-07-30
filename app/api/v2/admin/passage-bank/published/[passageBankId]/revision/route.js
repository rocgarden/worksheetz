// /app/api/v2/admin/passage-bank/published/[passageBankId]/revision/route.js
//
// Admin-only endpoint that creates an editable revision draft from an
// active published passage-bank package.
//
// POST /api/v2/admin/passage-bank/published/[passageBankId]/revision
//
// The database RPC atomically:
// - locks the active published package
// - verifies it is the latest revision
// - prevents duplicate open revision drafts
// - allocates the next revision number
// - copies the passage and connected questions into draft_json
// - marks validation stale
// - creates an immutable revision_created audit event

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
    /open revision draft already exists/i.test(
      message,
    )
  ) {
    return 409;
  }

  if (
    /only the active|only the latest/i.test(
      message,
    )
  ) {
    return 409;
  }

  if (
    /missing revision lineage|has no connected questions|is required/i.test(
      message,
    )
  ) {
    return 422;
  }

  return 500;
}

export async function POST(
  request,
  { params },
) {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Authenticate and authorize the admin
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
     * 3. Parse the optional body
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
     * 4. Create the revision draft atomically
     * ----------------------------------------------------------
     */

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: result,
      error: rpcError,
    } = await serviceSupabase.rpc(
      "create_passage_bank_revision_draft",
      {
        p_passage_bank_id:
          passageBankId,

        p_created_by:
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
        "Revision-draft creation failed.";

      const status =
        getRpcErrorStatus(
          errorMessage,
        );

      if (status >= 500) {
        console.error(
          "[admin/passage-bank/published/[passageBankId]/revision] RPC failed",
          {
            error:
              errorMessage,

            passage_bank_id:
              passageBankId,

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
      !isPlainObject(result.draft) ||
      !isPlainObject(result.source)
    ) {
      console.error(
        "[admin/passage-bank/published/[passageBankId]/revision] RPC returned malformed data",
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
            "Revision draft was created, but the response was malformed.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 5. Return the revision draft summary
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      source: {
        passage_bank_id:
          result.source
            .passage_bank_id,

        revision_root_id:
          result.source
            .revision_root_id,

        revision_number:
          result.source
            .revision_number,

        title:
          result.source.title,
      },

      draft: {
        id:
          result.draft.id,

        status:
          result.draft.status,

        subject:
          result.draft.subject,

        grade_level:
          result.draft.grade_level,

        teks_standard:
          result.draft.teks_standard,

        passage_format:
          result.draft
            .passage_format,

        content_focus_key:
          result.draft
            .content_focus_key,

        title:
          result.draft.title,

        revision_of_passage_bank_id:
          result.draft
            .revision_of_passage_bank_id,

        revision_root_id:
          result.draft
            .revision_root_id,

        revision_number:
          result.draft
            .revision_number,

        validation_json:
          result.draft
            .validation_json,

        created_by:
          result.draft.created_by,

        created_at:
          result.draft.created_at,
      },

      question_count:
        result.question_count,

      target_revision_number:
        result.target_revision_number,
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/published/[passageBankId]/revision] Unexpected error",
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
          "Failed to create passage-bank revision draft.",
      },
      {
        status: 500,
      },
    );
  }
}