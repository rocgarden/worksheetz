// /app/api/v2/admin/passage-bank/drafts/[draftId]/route.js
//
// Admin-only endpoint for retrieving one complete passage-bank draft package.
//
// GET /api/v2/admin/passage-bank/drafts/[draftId]
//
// Returns:
// - package metadata
// - complete draft_json
// - validation snapshot
// - generation snapshot
//
// This endpoint does not update, validate, approve, publish, or delete drafts.

import { NextResponse } from "next/server";
import { requirePassageBankAdmin } from "@/libs/v2/passageBank/requirePassageBankAdmin";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

import { resolvePassageBankAuditActors } from "@/libs/v2/passageBank/resolveAuditActors";

export const dynamic = "force-dynamic";

/**
 * @param {unknown} value
 * @returns {string|null}
 */

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

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
 * GET /api/v2/admin/passage-bank/drafts/[draftId]
 */
export async function GET(request, { params }) {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Authenticate and authorize admin
     * ----------------------------------------------------------
     */
    const adminAuth = await requirePassageBankAdmin();

    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { user } = adminAuth;

    /*
     * ----------------------------------------------------------
     * 2. Validate draftId
     * ----------------------------------------------------------
     */

    const { draftId } = await params;

    if (!isUuid(draftId)) {
      return NextResponse.json(
        {
          error: "A valid draftId is required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 3. Retrieve complete draft package
     * ----------------------------------------------------------
     */

    const serviceSupabase = await createV2ServiceClient();

    const { data: draft, error: draftError } = await serviceSupabase
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
      )
      .eq("id", draftId)
      .maybeSingle();

    if (draftError) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]] Draft fetch failed",
        {
          error: draftError.message,

          draft_id: draftId,

          admin_user_id: user.id,
        },
      );

      return NextResponse.json(
        {
          error: "Failed to retrieve passage-bank draft.",

          details:
            process.env.NODE_ENV === "development"
              ? draftError.message
              : undefined,
        },
        {
          status: 500,
        },
      );
    }

    if (!draft) {
      return NextResponse.json(
        {
          error: "Passage-bank draft was not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 4. Normalize response summary
     * ----------------------------------------------------------
     */

    const draftPackage =
      draft.draft_json && typeof draft.draft_json === "object"
        ? draft.draft_json
        : {
            passage: null,
            questions: [],
          };

    const passage =
      draftPackage.passage && typeof draftPackage.passage === "object"
        ? draftPackage.passage
        : null;

    const questions = Array.isArray(draftPackage.questions)
      ? draftPackage.questions
      : [];

    const validation =
      draft.validation_json && typeof draft.validation_json === "object"
        ? draft.validation_json
        : {
            success: false,
            issues: [],
            errors: [],
            warnings: [],
          };

    const generation =
      draft.generation_json && typeof draft.generation_json === "object"
        ? draft.generation_json
        : {};

    /*
     * ----------------------------------------------------------
     * Fetch draft review and workflow history
     * ----------------------------------------------------------
     */

    const { data: reviewEventRows, error: reviewEventError } =
      await serviceSupabase
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
        .eq("draft_package_id", draftId)
        .order("created_at", {
          ascending: false,
        });

    if (reviewEventError) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]] Review history fetch failed",
        {
          error: reviewEventError.message,

          draft_id: draftId,
        },
      );

      return NextResponse.json(
        {
          error: "Failed to load draft review history.",
        },
        {
          status: 500,
        },
      );
    }

    const reviewEvents = await resolvePassageBankAuditActors({
      serviceSupabase,
      events: reviewEventRows,
    });
    console.log("Review Events:: ", reviewEvents);
    /*
     * ----------------------------------------------------------
     * 5. Return complete draft
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      draft: {
        id: draft.id,

        status: draft.status,

        subject: draft.subject,

        grade_level: draft.grade_level,

        teks_standard: draft.teks_standard,

        passage_format: draft.passage_format,

        content_focus_key: draft.content_focus_key,

        title: draft.title,

        passage,

        questions,

        question_count: questions.length,

        structurally_valid: validation.success === true,

        validation_error_count: Array.isArray(validation.errors)
          ? validation.errors.length
          : 0,

        validation_warning_count: Array.isArray(validation.warnings)
          ? validation.warnings.length
          : 0,

        validation,

        generation,

        reviewEvents: reviewEvents,

        created_by: draft.created_by,

        updated_by: draft.updated_by,

        reviewed_by: draft.reviewed_by,

        published_passage_bank_id: draft.published_passage_bank_id,

        created_at: draft.created_at,

        updated_at: draft.updated_at,

        reviewed_at: draft.reviewed_at,

        published_at: draft.published_at,
      },
    });
  } catch (error) {
    console.error("[admin/passage-bank/drafts/[draftId]] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Failed to retrieve passage-bank draft.",
      },
      {
        status: 500,
      },
    );
  }
}

/**
 * PATCH /api/v2/admin/passage-bank/drafts/[draftId]
 *
 * Expected body:
 *
 * {
 *   "passage": {
 *     "subject": "ELA",
 *     "grade_level": "8",
 *     "teks_standard": "8.8C",
 *     "passage_format": "drama",
 *     "content_focus_key": "...",
 *     "content_focus": "...",
 *     "title": "...",
 *     "passage": "...",
 *     "skill_tags": [],
 *     "difficulty_level": 2,
 *     "is_active": false
 *   },
 *   "questions": []
 * }
 *
 * This endpoint saves edits but does not run the complete package validator.
 * Any content edit marks the previous validation snapshot as stale.
 */
export async function PATCH(request, { params }) {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Authenticate and authorize admin
     * ----------------------------------------------------------
     */
    const adminAuth = await requirePassageBankAdmin();

    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { user } = adminAuth;

    /*
     * ----------------------------------------------------------
     * 2. Validate draftId
     * ----------------------------------------------------------
     */

    const { draftId } = await params;

    if (!isUuid(draftId)) {
      return NextResponse.json(
        {
          error: "A valid draftId is required.",
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

    const passage = body.passage;

    const questions = body.questions;

    if (!isPlainObject(passage)) {
      return NextResponse.json(
        {
          error: "passage must be a JSON object.",
        },
        {
          status: 400,
        },
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        {
          error: "questions must contain at least one question.",
        },
        {
          status: 400,
        },
      );
    }

    const subject = normalizeRequiredString(passage.subject);

    const gradeLevel = normalizeRequiredString(
      String(passage.grade_level ?? ""),
    );

    const teksStandard = normalizeRequiredString(passage.teks_standard);

    const passageFormat = normalizeRequiredString(passage.passage_format);

    const passageText = normalizeRequiredString(passage.passage);

    if (
      !subject ||
      !gradeLevel ||
      !teksStandard ||
      !passageFormat ||
      !passageText
    ) {
      return NextResponse.json(
        {
          error:
            "passage.subject, passage.grade_level, passage.teks_standard, passage.passage_format, and passage.passage are required.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 4. Fetch existing draft and check edit state
     * ----------------------------------------------------------
     */

    const serviceSupabase = await createV2ServiceClient();

    const { data: existingDraft, error: existingDraftError } =
      await serviceSupabase
        .from("passage_bank_draft_packages")
        .select(
          `
          id,
          status,
          validation_json,
          published_passage_bank_id
        `,
        )
        .eq("id", draftId)
        .maybeSingle();

    if (existingDraftError) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]] Draft lookup failed before update",
        {
          error: existingDraftError.message,

          draft_id: draftId,

          admin_user_id: user.id,
        },
      );

      return NextResponse.json(
        {
          error: "Failed to retrieve passage-bank draft.",
        },
        {
          status: 500,
        },
      );
    }

    if (!existingDraft) {
      return NextResponse.json(
        {
          error: "Passage-bank draft was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (existingDraft.status === "published") {
      return NextResponse.json(
        {
          error:
            "Published packages cannot be edited as drafts. Create a revision instead.",
        },
        {
          status: 409,
        },
      );
    }

    if (existingDraft.status === "archived") {
      return NextResponse.json(
        {
          error: "Archived drafts cannot be edited.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 5. Build updated draft package
     * ----------------------------------------------------------
     */

    const updatedDraftPackage = {
      passage,
      questions,
    };

    const sharedPassage =
      typeof updatedDraftPackage?.passage?.passage === "string"
        ? updatedDraftPackage.passage.passage
        : "";

    const sharedTeksStandard =
      typeof updatedDraftPackage?.passage?.teks_standard === "string"
        ? updatedDraftPackage.passage.teks_standard
        : "";

    const synchronizedQuestions = updatedDraftPackage.questions.map(
      (question) => {
        const questionJson = isPlainObject(question?.question_json)
          ? question.question_json
          : {};

        const questionTeksStandard =
          normalizeRequiredString(
            question.teks_standard ?? questionJson.teks_standard,
          ) || sharedTeksStandard;

        const questionType =
          normalizeRequiredString(
            question.question_type ?? questionJson.question_type,
          ) || "multiple_choice";
        const dokLevel = Number(
          question.dok_level ?? questionJson.dok_level ?? 1,
        );

        const currentDokLevel =
          Number.isInteger(dokLevel) && dokLevel >= 1 && dokLevel <= 3
            ? dokLevel
            : 1;

        const skillFocus = normalizeOptionalString(
          question.skill_focus ?? questionJson.skill_focus,
        );

        const assessmentMove = normalizeOptionalString(
          question.assessment_move ?? questionJson.assessment_move,
        );

        const correctTargetKey = normalizeOptionalString(
          question.correct_target_key ?? questionJson.correct_target_key,
        );

        const correctTargetText = normalizeOptionalString(
          question.correct_target_text ?? questionJson.correct_target_text,
        );

        const correctDokLevel = Math.min(3, currentDokLevel + 1);

        const incorrectDokLevel = Math.max(1, currentDokLevel - 1);

        const existingNextLogic = isPlainObject(
          questionJson.next_question_logic,
        )
          ? questionJson.next_question_logic
          : {};

        const existingIfCorrect = isPlainObject(existingNextLogic.if_correct)
          ? existingNextLogic.if_correct
          : {};

        const existingIfIncorrect = isPlainObject(
          existingNextLogic.if_incorrect,
        )
          ? existingNextLogic.if_incorrect
          : {};

        const normalizedNextLogic = {
          ...existingNextLogic,

          if_correct: {
            ...existingIfCorrect,

            action:
              normalizeRequiredString(existingIfCorrect.action) ||
              "increase_difficulty",

            dok_level: [1, 2, 3].includes(Number(existingIfCorrect.dok_level))
              ? Number(existingIfCorrect.dok_level)
              : correctDokLevel,
          },

          if_incorrect: {
            ...existingIfIncorrect,

            action:
              normalizeRequiredString(existingIfIncorrect.action) ||
              "decrease_difficulty",

            dok_level: [1, 2, 3].includes(Number(existingIfIncorrect.dok_level))
              ? Number(existingIfIncorrect.dok_level)
              : incorrectDokLevel,
          },
        };

        const dramaticFunction =
          normalizeOptionalString(question.dramatic_function) ||
          normalizeOptionalString(questionJson.dramatic_function) ||
          null;

        const targetScene =
          normalizeOptionalString(question.target_scene) ||
          normalizeOptionalString(questionJson.target_scene) ||
          null;

        return {
          ...question,

          teks_standard: questionTeksStandard,

          question_type: questionType,

          dok_level: currentDokLevel,
          skill_focus: skillFocus,
          assessment_move: assessmentMove,

          dramatic_function: dramaticFunction,

          target_scene: targetScene,
          correct_target_key: correctTargetKey,
          correct_target_text: correctTargetText,

          question_json: {
            ...questionJson,

            passage: sharedPassage,

            question_type: questionType,

            answer_options:
              questionType === "hot_text" ||
              questionType === "constructed_response"
                ? null
                : Array.isArray(questionJson.answer_options)
                  ? questionJson.answer_options
                  : [],

            teks_standard: questionTeksStandard,

            dok_level: currentDokLevel,

            dramatic_function: dramaticFunction,
            skill_focus: skillFocus,
            assessment_move: assessmentMove,
            target_scene: targetScene,
            correct_target_key: correctTargetKey,
            correct_target_text: correctTargetText,

            next_question_logic: normalizedNextLogic,
          },
        };
      },
    );

    const synchronizedDraftPackage = {
      ...updatedDraftPackage,
      questions: synchronizedQuestions,
    };
    /*
     * Any content change invalidates the previous structural-validation
     * snapshot. The dedicated validation endpoint will replace this stale
     * snapshot during Step 5.
     */
    const staleValidation = {
      success: false,
      stale: true,

      issues: [],
      errors: [],
      warnings: [],

      message: "This draft was edited after its most recent validation.",

      previous_validation: isPlainObject(existingDraft.validation_json)
        ? {
            success: existingDraft.validation_json.success === true,

            error_count: Array.isArray(existingDraft.validation_json.errors)
              ? existingDraft.validation_json.errors.length
              : 0,

            warning_count: Array.isArray(existingDraft.validation_json.warnings)
              ? existingDraft.validation_json.warnings.length
              : 0,
          }
        : null,

      invalidated_at: new Date().toISOString(),

      invalidated_by: user.id,
    };

    /*
     * ----------------------------------------------------------
     * 6. Save draft edits
     * ----------------------------------------------------------
     */

    const { data: updatedDraft, error: updateError } = await serviceSupabase
      .from("passage_bank_draft_packages")
      .update({
        /*
         * Editing an in-review, approved, or rejected package returns it
         * to draft status. It must be validated and reviewed again.
         */
        status: "draft",

        subject,
        grade_level: gradeLevel,
        teks_standard: teksStandard,
        passage_format: passageFormat,

        content_focus_key: normalizeOptionalString(passage.content_focus_key),

        title: normalizeOptionalString(passage.title),

        draft_json: synchronizedDraftPackage,

        validation_json: staleValidation,

        updated_by: user.id,

        reviewed_by: null,

        reviewed_at: null,
      })
      .eq("id", draftId)
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
          updated_by,
          updated_at
        `,
      )
      .single();

    if (updateError || !updatedDraft) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]] Draft update failed",
        {
          error: updateError?.message || "No updated draft was returned.",

          draft_id: draftId,

          admin_user_id: user.id,
        },
      );

      return NextResponse.json(
        {
          error: "Failed to update passage-bank draft.",

          details:
            process.env.NODE_ENV === "development"
              ? updateError?.message || "No updated draft was returned."
              : undefined,
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 7. Return updated summary
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      validation_required: true,

      draft: {
        id: updatedDraft.id,

        status: updatedDraft.status,

        subject: updatedDraft.subject,

        grade_level: updatedDraft.grade_level,

        teks_standard: updatedDraft.teks_standard,

        passage_format: updatedDraft.passage_format,

        content_focus_key: updatedDraft.content_focus_key,

        title: updatedDraft.title,

        question_count: synchronizedQuestions.length,

        structurally_valid: false,

        validation_stale: true,

        updated_by: updatedDraft.updated_by,

        updated_at: updatedDraft.updated_at,
      },
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/drafts/[draftId]] Unexpected update error",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return NextResponse.json(
      {
        error: "Failed to update passage-bank draft.",
      },
      {
        status: 500,
      },
    );
  }
}
