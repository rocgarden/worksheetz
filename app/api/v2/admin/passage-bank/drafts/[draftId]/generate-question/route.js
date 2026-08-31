// /app/api/v2/admin/passage-bank/drafts/[draftId]/generate-question/route.js
//
// Generates one additional question from an existing passage-bank draft.
//
// Flow:
// admin authentication
// → load current draft package
// → reuse the saved edited passage
// → pass existing questions as prior-bank history
// → generate exactly one new question
// → append it to draft_json.questions
// → mark validation stale
// → save and return the generated question

import { NextResponse } from "next/server";

import { requirePassageBankAdmin } from "@/libs/v2/passageBank/requirePassageBankAdmin";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

import { generatePassageQuestionBankDraft } from "@/libs/adaptive/questionBank/generators";

export const dynamic = "force-dynamic";
const QUESTION_TYPE_ALIASES = Object.freeze({
  drag_drop: "drag_and_drop",
  next_place_in_line: "sequence",
  match: "matching",
});
const SUPPORTED_QUESTION_TYPES =
  new Set([
    "multiple_choice",
    "multi_select",
    "hot_text",
    "constructed_response",
    // Add these only after their full
    // generator and validator paths pass.
    // "drag_and_drop",
    // "matching",
    // "sequence",
    // "grid",
    // "complete_table",
    // "inline_choice",
    // "evidence_pair",
  ]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

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

function normalizeDokLevel(value) {
  const dokLevel = Number(value);

  return [1, 2, 3].includes(dokLevel) ? dokLevel : null;
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function normalizeQuestionType(
  value,
) {
  const raw =
    normalizeRequiredString(
      value,
    );

  if (!raw) {
    return "";
  }

  return (
    QUESTION_TYPE_ALIASES[raw] ||
    raw
  );
}

export async function POST(request, { params }) {
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
     * 2. Validate draft ID
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

    // const questionType = normalizeRequiredString(body.question_type);
const questionType =
  normalizeQuestionType(
    body.question_type,
  );

const dokLevel =
  normalizeDokLevel(
    body.dok_level,
  );

if (!questionType) {
  return NextResponse.json(
    {
      error:
        "question_type is required.",
    },
    {
      status: 400,
    },
  );
}

if (
  !SUPPORTED_QUESTION_TYPES.has(
    questionType,
  )
) {
  return NextResponse.json(
    {
      error:
        `Question type "${questionType}" is not currently supported for passage-bank generation.`,
    },
    {
      status: 400,
    },
  );
}

if (!dokLevel) {
  return NextResponse.json(
    {
      error:
        "dok_level must be 1, 2, or 3.",
    },
    {
      status: 400,
    },
  );
}
    const requestedSkillFocus = normalizeOptionalString(body.skill_focus);

    const requestedAssessmentMove = normalizeOptionalString(
      body.assessment_move,
    );

    if (!questionType) {
      return NextResponse.json(
        {
          error: "question_type is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!dokLevel) {
      return NextResponse.json(
        {
          error: "dok_level must be 1, 2, or 3.",
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 4. Load existing editable draft
     * ----------------------------------------------------------
     */

    const serviceSupabase = await createV2ServiceClient();

    const { data: existingDraft, error: draftError } = await serviceSupabase
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
          generation_json,
          validation_json
        `,
      )
      .eq("id", draftId)
      .maybeSingle();

    if (draftError) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]/generate-question] Draft lookup failed",
        {
          error: draftError.message,

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
            "Published packages cannot receive new draft questions. Create a revision first.",
        },
        {
          status: 409,
        },
      );
    }

    if (existingDraft.status === "archived") {
      return NextResponse.json(
        {
          error: "Archived drafts cannot receive new questions.",
        },
        {
          status: 409,
        },
      );
    }

    const draftPackage = isPlainObject(existingDraft.draft_json)
      ? existingDraft.draft_json
      : null;

    const passage = isPlainObject(draftPackage?.passage)
      ? draftPackage.passage
      : null;

    const existingQuestions = Array.isArray(draftPackage?.questions)
      ? draftPackage.questions
      : [];

    if (!passage) {
      return NextResponse.json(
        {
          error: "The draft does not contain a valid passage object.",
        },
        {
          status: 409,
        },
      );
    }

    const passageText = normalizeRequiredString(passage.passage);

    if (!passageText) {
      return NextResponse.json(
        {
          error:
            "The draft passage text is required before generating another question.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 5. Generate one question from the saved passage
     * ----------------------------------------------------------
     */
    const generatorOptions = {
      existing_stimulus: passageText,

      prior_bank_questions: existingQuestions,

      generation_mode: "question_bank_add_question",

      admin_generation: true,

      requested_skill_focus: requestedSkillFocus,

      requested_assessment_move: requestedAssessmentMove,
    };

    if (
      normalizeRequiredString(passage.passage_format).toLowerCase() === "drama"
    ) {
      generatorOptions.requested_target_scene = normalizeOptionalString(
        body.target_scene,
      );

      generatorOptions.requested_dramatic_function = normalizeOptionalString(
        body.dramatic_function,
      );
    }

    const generatedPackage = await generatePassageQuestionBankDraft({
      subject:
        normalizeRequiredString(passage.subject) || existingDraft.subject,

      gradeLevel: normalizeRequiredString(
        String(passage.grade_level ?? existingDraft.grade_level ?? ""),
      ),

      teksStandard:
        normalizeRequiredString(passage.teks_standard) ||
        existingDraft.teks_standard,

      passageFormat:
        normalizeRequiredString(passage.passage_format) ||
        existingDraft.passage_format,

      contentFocus: normalizeOptionalString(passage.content_focus),

      contentFocusKey:
        normalizeOptionalString(passage.content_focus_key) ||
        normalizeOptionalString(existingDraft.content_focus_key),

      title:
        normalizeOptionalString(passage.title) ||
        normalizeOptionalString(existingDraft.title),

      skillTags: Array.isArray(passage.skill_tags) ? passage.skill_tags : [],

      difficultyLevel: normalizeDokLevel(passage.difficulty_level) || dokLevel,

      testingWindow: normalizeOptionalString(body.testing_window),

      questionPlan: [
        {
          question_type: questionType,

          dok_level: dokLevel,

          count: 1,
        },
      ],

      generatorOptions,
    });

    const generatedQuestion = Array.isArray(generatedPackage.questions)
      ? generatedPackage.questions[0]
      : null;

    if (!isPlainObject(generatedQuestion)) {
      return NextResponse.json(
        {
          error: "The generator did not return a usable question.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 6. Append generated question and mark validation stale
     * ----------------------------------------------------------
     */

    const updatedQuestions = [...existingQuestions, generatedQuestion];

    const updatedDraftPackage = {
      ...draftPackage,

      passage,

      questions: updatedQuestions,
    };

    const staleValidation = {
      success: false,
      stale: true,

      issues: [],
      errors: [],
      warnings: [],

      message: "A new question was generated after the most recent validation.",

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

    const existingGeneration = isPlainObject(existingDraft.generation_json)
      ? existingDraft.generation_json
      : {};

    const generatedQuestionHistory = Array.isArray(
      existingGeneration.generated_questions,
    )
      ? existingGeneration.generated_questions
      : [];

    const updatedGeneration = {
      ...existingGeneration,

      last_generation: generatedPackage.generation,

      generated_questions: [
        ...generatedQuestionHistory,
        {
          generated_at: new Date().toISOString(),

          generated_by: user.id,

          question_type: generatedQuestion.question_type,

          dok_level: generatedQuestion.dok_level,

          question_index: updatedQuestions.length - 1,
        },
      ],
    };

    /*
     * ----------------------------------------------------------
     * 7. Save updated draft
     * ----------------------------------------------------------
     */

    const { data: updatedDraft, error: updateError } = await serviceSupabase
      .from("passage_bank_draft_packages")
      .update({
        status: "draft",

        draft_json: updatedDraftPackage,

        validation_json: staleValidation,

        generation_json: updatedGeneration,

        updated_by: user.id,

        reviewed_by: null,

        reviewed_at: null,
      })
      .eq("id", draftId)
      .select(
        `
          id,
          status,
          updated_at
        `,
      )
      .single();

    if (updateError || !updatedDraft) {
      console.error(
        "[admin/passage-bank/drafts/[draftId]/generate-question] Draft update failed",
        {
          error: updateError?.message || "No updated draft was returned.",

          draft_id: draftId,

          admin_user_id: user.id,
        },
      );

      return NextResponse.json(
        {
          error:
            "The question was generated, but the draft could not be updated.",

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
     * 8. Return generated question
     * ----------------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      validation_required: true,

      draft_id: updatedDraft.id,

      draft_status: updatedDraft.status,

      updated_at: updatedDraft.updated_at,

      question_count: updatedQuestions.length,

      question: generatedQuestion,

      generation: generatedPackage.generation,
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/drafts/[draftId]/generate-question] Unexpected generation error",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );

    return NextResponse.json(
      {
        error: "Failed to generate an additional passage-bank question.",

        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}
