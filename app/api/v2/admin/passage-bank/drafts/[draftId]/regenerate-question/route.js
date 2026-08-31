// /app/api/v2/admin/passage-bank/drafts/[draftId]/regenerate-question/route.js

import { NextResponse } from "next/server";

import { requirePassageBankAdmin } from "@/libs/v2/passageBank/requirePassageBankAdmin";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { generatePassageQuestionBankDraft } from "@/libs/adaptive/questionBank/generators";

export const dynamic = "force-dynamic";

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeRequiredString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
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

  return [1, 2, 3].includes(dokLevel)
    ? dokLevel
    : null;
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function POST(
  request,
  { params },
) {
  try {
    const adminAuth =
      await requirePassageBankAdmin();

    if (!adminAuth.success) {
      return adminAuth.response;
    }

    const { user } = adminAuth;

    const { draftId } = await params;

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

    let body;

    try {
      body = await request.json();
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

    const questionIndex =
      Number(body.question_index);

    if (
      !Number.isInteger(questionIndex) ||
      questionIndex < 0
    ) {
      return NextResponse.json(
        {
          error:
            "question_index must be a non-negative integer.",
        },
        {
          status: 400,
        },
      );
    }

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: existingDraft,
      error: draftError,
    } = await serviceSupabase
      .from(
        "passage_bank_draft_packages",
      )
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
          generation_json
        `,
      )
      .eq(
        "id",
        draftId,
      )
      .maybeSingle();

    if (draftError) {
      console.error(
        "[admin/passage-bank/regenerate-question] Draft lookup failed",
        {
          error:
            draftError.message,

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
            "Published packages cannot be edited. Create a revision first.",
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
            "Archived drafts cannot be edited.",
        },
        {
          status: 409,
        },
      );
    }

    const draftPackage =
      isPlainObject(
        existingDraft.draft_json,
      )
        ? existingDraft.draft_json
        : null;

    const passage =
      isPlainObject(
        draftPackage?.passage,
      )
        ? draftPackage.passage
        : null;

    const existingQuestions =
      Array.isArray(
        draftPackage?.questions,
      )
        ? draftPackage.questions
        : [];

    if (!passage) {
      return NextResponse.json(
        {
          error:
            "The draft does not contain a valid passage.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      questionIndex >=
      existingQuestions.length
    ) {
      return NextResponse.json(
        {
          error:
            "The selected question does not exist.",
        },
        {
          status: 404,
        },
      );
    }

    const selectedQuestion =
      existingQuestions[
        questionIndex
      ];

    if (
      !isPlainObject(
        selectedQuestion,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The selected question is invalid.",
        },
        {
          status: 409,
        },
      );
    }

    const passageText =
      normalizeRequiredString(
        passage.passage,
      );

    if (!passageText) {
      return NextResponse.json(
        {
          error:
            "The saved passage text is required.",
        },
        {
          status: 409,
        },
      );
    }

    const questionType =
      normalizeRequiredString(
        selectedQuestion
          .question_type ??
          selectedQuestion
            .question_json
            ?.question_type,
      );

    const dokLevel =
      normalizeDokLevel(
        selectedQuestion
          .dok_level ??
          selectedQuestion
            .question_json
            ?.dok_level,
      );

    if (
      !questionType ||
      !dokLevel
    ) {
      return NextResponse.json(
        {
          error:
            "The selected question must have a valid question type and DOK level.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * Exclude the selected question from repetition history.
     * All other questions help the generator avoid duplication.
     */
    const priorQuestions =
      existingQuestions.filter(
        (_, index) =>
          index !== questionIndex,
      );

    const generatedPackage =
      await generatePassageQuestionBankDraft({
        subject:
          normalizeRequiredString(
            passage.subject,
          ) ||
          existingDraft.subject,

        gradeLevel:
          normalizeRequiredString(
            String(
              passage.grade_level ??
                existingDraft.grade_level ??
                "",
            ),
          ),

        teksStandard:
          normalizeRequiredString(
            passage.teks_standard,
          ) ||
          existingDraft.teks_standard,

        passageFormat:
          normalizeRequiredString(
            passage.passage_format,
          ) ||
          existingDraft.passage_format,

        contentFocus:
          normalizeOptionalString(
            passage.content_focus,
          ),

        contentFocusKey:
          normalizeOptionalString(
            passage.content_focus_key,
          ) ||
          normalizeOptionalString(
            existingDraft.content_focus_key,
          ),

        title:
          normalizeOptionalString(
            passage.title,
          ) ||
          normalizeOptionalString(
            existingDraft.title,
          ),

        skillTags:
          Array.isArray(
            passage.skill_tags,
          )
            ? passage.skill_tags
            : [],

        difficultyLevel:
          normalizeDokLevel(
            passage.difficulty_level,
          ) ||
          dokLevel,

        questionPlan: [
          {
            question_type:
              questionType,

            dok_level:
              dokLevel,

            count:
              1,
          },
        ],

        generatorOptions: {
          existing_stimulus:
            passageText,

          prior_bank_questions:
            priorQuestions,

          generation_mode:
            "question_bank_regenerate_question",

          admin_generation:
            true,

          requested_skill_focus:
            normalizeOptionalString(
              body.skill_focus,
            ) ||
            normalizeOptionalString(
              selectedQuestion.skill_focus,
            ),

          requested_assessment_move:
            normalizeOptionalString(
              body.assessment_move,
            ) ||
            normalizeOptionalString(
              selectedQuestion.assessment_move,
            ),
        },
      });

    const regeneratedQuestion =
      Array.isArray(
        generatedPackage.questions,
      )
        ? generatedPackage.questions[0]
        : null;

    if (
      !isPlainObject(
        regeneratedQuestion,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "The generator did not return a usable replacement question.",
        },
        {
          status: 500,
        },
      );
    }

   /*
 * Prefer metadata returned by the regenerated question.
 * Fall back to the existing reviewed metadata only when the
 * replacement did not provide a usable value.
 */
const dramaticFunction =
  normalizeOptionalString(
    regeneratedQuestion
      .dramatic_function,
  ) ||
  normalizeOptionalString(
    regeneratedQuestion
      .question_json
      ?.dramatic_function,
  ) ||
  normalizeOptionalString(
    selectedQuestion
      .dramatic_function,
  ) ||
  normalizeOptionalString(
    selectedQuestion
      .question_json
      ?.dramatic_function,
  ) ||
  null;

const targetScene =
  normalizeOptionalString(
    regeneratedQuestion
      .target_scene,
  ) ||
  normalizeOptionalString(
    regeneratedQuestion
      .question_json
      ?.target_scene,
  ) ||
  normalizeOptionalString(
    selectedQuestion
      .target_scene,
  ) ||
  normalizeOptionalString(
    selectedQuestion
      .question_json
      ?.target_scene,
  ) ||
  null;

const mergedQuestion = {
  ...regeneratedQuestion,

  dramatic_function:
    dramaticFunction,

  target_scene:
    targetScene,

  question_json: {
    ...regeneratedQuestion
      .question_json,

    ...(dramaticFunction
      ? {
          dramatic_function:
            dramaticFunction,
        }
      : {}),

    ...(targetScene
      ? {
          target_scene:
            targetScene,
        }
      : {}),
  },
};

const updatedQuestions =
  existingQuestions.map(
    (question, index) =>
      index === questionIndex
        ? mergedQuestion
        : question,
  );

    const updatedDraftPackage = {
      ...draftPackage,

      passage,

      questions:
        updatedQuestions,
    };

    const staleValidation = {
      success: false,
      stale: true,

      issues: [],
      errors: [],
      warnings: [],

      message:
        "A question was regenerated after the most recent validation.",

      previous_validation:
        isPlainObject(
          existingDraft.validation_json,
        )
          ? {
              success:
                existingDraft
                  .validation_json
                  .success === true,

              error_count:
                Array.isArray(
                  existingDraft
                    .validation_json
                    .errors,
                )
                  ? existingDraft
                      .validation_json
                      .errors.length
                  : 0,

              warning_count:
                Array.isArray(
                  existingDraft
                    .validation_json
                    .warnings,
                )
                  ? existingDraft
                      .validation_json
                      .warnings.length
                  : 0,
            }
          : null,

      invalidated_at:
        new Date().toISOString(),

      invalidated_by:
        user.id,
    };

    const existingGeneration =
      isPlainObject(
        existingDraft.generation_json,
      )
        ? existingDraft.generation_json
        : {};

    const regenerationHistory =
      Array.isArray(
        existingGeneration
          .regenerated_questions,
      )
        ? existingGeneration
            .regenerated_questions
        : [];

    const updatedGeneration = {
      ...existingGeneration,

      last_generation:
        generatedPackage.generation,

      regenerated_questions: [
        ...regenerationHistory,

        {
          regenerated_at:
            new Date().toISOString(),

          regenerated_by:
            user.id,

          question_index:
            questionIndex,

         question_type:
  mergedQuestion
    .question_type,

dok_level:
  mergedQuestion
    .dok_level,
        },
      ],
    };

    const {
      data: updatedDraft,
      error: updateError,
    } = await serviceSupabase
      .from(
        "passage_bank_draft_packages",
      )
      .update({
        status:
          "draft",

        draft_json:
          updatedDraftPackage,

        validation_json:
          staleValidation,

        generation_json:
          updatedGeneration,

        updated_by:
          user.id,

        reviewed_by:
          null,

        reviewed_at:
          null,
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
        "[admin/passage-bank/regenerate-question] Draft update failed",
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
            "The replacement question was generated, but the draft could not be updated.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,

      validation_required:
        true,

      draft_id:
        updatedDraft.id,

      draft_status:
        updatedDraft.status,

      updated_at:
        updatedDraft.updated_at,

      question_index:
        questionIndex,

      question:
        mergedQuestion,

      generation:
        generatedPackage.generation,
    });
  } catch (error) {
    console.error(
      "[admin/passage-bank/regenerate-question] Unexpected error",
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
          "Failed to regenerate the selected question.",

        details:
          process.env.NODE_ENV ===
          "development"
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