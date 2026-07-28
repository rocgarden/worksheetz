// /app/api/v2/admin/passage-bank/drafts/[draftId]/publish-revision/route.js
//
// Admin-only endpoint that publishes an approved revision draft.
//
// POST /api/v2/admin/passage-bank/drafts/[draftId]/publish-revision
//
// The database RPC atomically:
// - validates the approved revision draft
// - publishes the new passage/question package
// - assigns revision lineage
// - supersedes the previous active version
// - deactivates the previous version's questions
// - marks the revision draft as published
// - inserts revision_published and superseded audit events

import { NextResponse } from "next/server";

import { createClient } from "@/libs/supabase/server";
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

function getAdminEmails() {
  return new Set(
    [
      process.env.ADMIN_EMAIL || "",
      process.env.ADMIN_EMAILS || "",
    ]
      .join(",")
      .split(",")
      .map((email) =>
        email.trim().toLowerCase(),
      )
      .filter(Boolean),
  );
}

function isAuthorizedAdmin(user) {
  const email =
    normalizeOptionalString(
      user?.email,
    )?.toLowerCase();

  return Boolean(
    email &&
    getAdminEmails().has(email),
  );
}

function getRpcErrorStatus(message) {
  if (/not found/i.test(message)) {
    return 404;
  }

  if (
    /already been published|newer passage-bank revision already exists/i.test(
      message,
    )
  ) {
    return 409;
  }

  if (
    /only approved revision drafts can be published|source passage-bank revision is no longer active|expected revision number/i.test(
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
    /not configured as a passage-bank revision|must be a JSON|must contain at least one|is required|root does not match/i.test(
      message,
    )
  ) {
    return 400;
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
     * 3. Parse optional body
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
     * 4. Publish the revision atomically
     * ----------------------------------------------------------
     */

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: result,
      error: rpcError,
    } = await serviceSupabase.rpc(
      "publish_passage_bank_revision",
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
        "Revision publication failed.";

      const status =
        getRpcErrorStatus(
          errorMessage,
        );

      if (status >= 500) {
        console.error(
          "[admin/passage-bank/drafts/[draftId]/publish-revision] RPC failed",
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
      !isPlainObject(result) ||
      !isPlainObject(result.draft) ||
      !isPlainObject(result.source) ||
      !isPlainObject(result.passage)
    ) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]/publish-revision] RPC returned malformed data",
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
            "Revision was published, but the response was malformed.",
        },
        {
          status: 500,
        },
      );
    }

    const questions =
      Array.isArray(
        result.questions,
      )
        ? result.questions
        : [];

    /*
     * ----------------------------------------------------------
     * 5. Return revision publication summary
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      draft: {
        id:
          result.draft.id,

        status:
          result.draft.status,

        revision_of_passage_bank_id:
          result.draft
            .revision_of_passage_bank_id,

        revision_root_id:
          result.draft
            .revision_root_id,

        revision_number:
          result.draft
            .revision_number,

        published_passage_bank_id:
          result.draft
            .published_passage_bank_id,

        published_at:
          result.draft
            .published_at,

        updated_by:
          result.draft
            .updated_by,

        updated_at:
          result.draft
            .updated_at,
      },

      superseded: {
        passage_bank_id:
          result.source
            .passage_bank_id,

        revision_root_id:
          result.source
            .revision_root_id,

        revision_number:
          result.source
            .revision_number,

        is_active:
          result.source
            .is_active,

        superseded_at:
          result.source
            .superseded_at,
      },

      package: {
        passage_bank_id:
          result.passage.id,

        revision_root_id:
          result.passage
            .revision_root_id,

        revision_number:
          result.passage
            .revision_number,

        replaces_passage_bank_id:
          result.passage
            .replaces_passage_bank_id,

        subject:
          result.passage.subject,

        grade_level:
          result.passage
            .grade_level,

        teks_standard:
          result.passage
            .teks_standard,

        passage_format:
          result.passage
            .passage_format,

        content_focus_key:
          result.passage
            .content_focus_key,

        title:
          result.passage.title,

        is_active:
          result.passage
            .is_active,

        question_count:
          questions.length,

        questions,
      },
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/drafts/[draftId]/publish-revision] Unexpected error",
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
          "Failed to publish passage-bank revision.",
      },
      {
        status: 500,
      },
    );
  }
}