// /app/api/v2/admin/passage-bank/drafts/[draftId]/validate/route.js
//
// Admin-only endpoint that revalidates one saved draft package.
//
// POST /api/v2/admin/passage-bank/drafts/[draftId]/validate
//
// Flow:
// authenticate admin
// → fetch draft_json
// → run validatePassageQuestionBankPackage()
// → replace validation_json
// → update updated_by
// → return validation result
//
// This endpoint does not publish or approve content.

import { NextResponse } from "next/server";

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

import {
  validatePassageQuestionBankPackage,
} from "@/libs/adaptive/questionBank/validatePassageQuestionBankPackage";

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
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
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
 * POST /api/v2/admin/passage-bank/drafts/[draftId]/validate
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
     * 3. Fetch saved draft package
     * ----------------------------------------------------------
     */

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: existingDraft,
      error: fetchError,
    } = await serviceSupabase
      .from(
        "passage_bank_draft_packages",
      )
      .select(
        `
          id,
          status,
          draft_json,
          published_passage_bank_id
        `,
      )
      .eq(
        "id",
        draftId,
      )
      .maybeSingle();

    if (fetchError) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]/validate] Draft fetch failed",
        {
          error:
            fetchError.message,

          draft_id:
            draftId,

          admin_user_id:
            user.id,
        },
      );

      return NextResponse.json(
        {
          error:
            "Failed to retrieve passage-bank draft.",
        },
        {
          status: 500,
        },
      );
    }

    if (!existingDraft) {
      return NextResponse.json(
        {
          error:
            "Passage-bank draft was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      existingDraft.status ===
      "published"
    ) {
      return NextResponse.json(
        {
          error:
            "Published packages cannot be revalidated as editable drafts.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      existingDraft.status ===
      "archived"
    ) {
      return NextResponse.json(
        {
          error:
            "Archived drafts cannot be validated.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 4. Validate stored package shape
     * ----------------------------------------------------------
     */

    const draftPackage =
      existingDraft.draft_json;

    if (
      !isPlainObject(draftPackage) ||
      !isPlainObject(
        draftPackage.passage,
      ) ||
      !Array.isArray(
        draftPackage.questions,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Saved draft_json is malformed.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 5. Run complete package validation
     * ----------------------------------------------------------
     */

    const validation =
      validatePassageQuestionBankPackage(
        {
          passage:
            draftPackage.passage,

          questions:
            draftPackage.questions,
        },
        {
          allowUnknownQuestionTypes:
            false,

          treatRecommendationsAsErrors:
            false,
        },
      );

    const validationSnapshot = {
      success:
        validation.success,

      stale:
        false,

      issues:
        validation.issues,

      errors:
        validation.errors,

      warnings:
        validation.warnings,

      validated_at:
        new Date().toISOString(),

      validated_by:
        user.id,
    };

    /*
     * ----------------------------------------------------------
     * 6. Save fresh validation snapshot
     * ----------------------------------------------------------
     */

    const {
      data: updatedDraft,
      error: updateError,
    } = await serviceSupabase
      .from(
        "passage_bank_draft_packages",
      )
      .update({
        validation_json:
          validationSnapshot,

        updated_by:
          user.id,
      })
      .eq(
        "id",
        draftId,
      )
      .select(
        `
          id,
          status,
          updated_at
        `,
      )
      .single();

    if (
      updateError ||
      !updatedDraft
    ) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]/validate] Validation save failed",
        {
          error:
            updateError?.message ||
            "No updated draft was returned.",

          draft_id:
            draftId,

          admin_user_id:
            user.id,
        },
      );

      return NextResponse.json(
        {
          error:
            "Draft validation completed, but the result could not be saved.",

          details:
            process.env.NODE_ENV ===
            "development"
              ? updateError?.message ||
                "No updated draft was returned."
              : undefined,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 7. Return validation result
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      draft_id:
        updatedDraft.id,

      draft_status:
        updatedDraft.status,

      structurally_valid:
        validation.success,

      validation_stale:
        false,

      validation: {
        success:
          validation.success,

        issues:
          validation.issues,

        errors:
          validation.errors,

        warnings:
          validation.warnings,

        error_count:
          validation.errors.length,

        warning_count:
          validation.warnings.length,

        validated_at:
          validationSnapshot
            .validated_at,

        validated_by:
          user.id,
      },

      updated_at:
        updatedDraft.updated_at,
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/drafts/[draftId]/validate] Unexpected error",
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
          "Failed to validate passage-bank draft.",
      },
      {
        status: 500,
      },
    );
  }
}