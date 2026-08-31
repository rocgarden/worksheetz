// /app/api/v2/admin/passage-bank/[passageBankId]/questions/route.js
//
// Adds reviewed passage_question_bank rows to an EXISTING
// passage_bank row.
//
// This is intentionally separate from:
// POST /api/v2/admin/passage-bank
//
// The normal passage-bank POST publishes:
//   new passage + new questions
//
// This endpoint publishes:
//   existing passage + new questions
//
// This allows one stimulus to support multiple primary TEKS.
//
// Example:
// passage_bank:
//   id = abc123
//   teks_standard = 6.8D.i
//
// attached questions:
//   passage_bank_id = abc123
//   teks_standard = 6.8D.iii
//
// Security:
// - Requires signed-in Supabase user.
// - Requires user's email in ADMIN_EMAILS.
// - Uses V2 service-role client for writes.
//

import { NextResponse } from "next/server";

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

import {
  validatePassageQuestionBankPackage,
} from "@/libs/adaptive/questionBank/validatePassageQuestionBankPackage";

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

function normalizeRequiredString(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function getAdminEmails() {
  return new Set(
    String(process.env.ADMIN_EMAIL || "")
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

  if (!email) {
    return false;
  }

  return getAdminEmails().has(email);
}

/**
 * Builds final passage_question_bank rows.
 *
 * IMPORTANT:
 * - passage_bank_id always comes from the URL/existing passage.
 * - subject and grade always come from the existing passage.
 * - question TEKS comes from the QUESTION, not the passage.
 *
 * This is what allows:
 *
 * passage.teks_standard = 6.8D.i
 * question.teks_standard = 6.8D.iii
 */
function buildQuestionRows({
  validatedQuestions,
  passage,
  passageBankId,
  userId,
}) {
  const now = new Date().toISOString();

  return validatedQuestions.map(
    (question) => {
      const reviewStatus =
        normalizeOptionalString(
          question.review_status,
        ) || "draft";

      const isApproved =
        reviewStatus === "approved";

      const questionTeks =
        normalizeRequiredString(
          question.teks_standard,
        );

      const questionJson =
        isPlainObject(
          question.question_json,
        )
          ? {
              ...question.question_json,

              // Force nested TEKS to match
              // the question row TEKS.
              teks_standard:
                questionTeks,

              // Force exact existing stimulus.
              passage:
                passage.passage,
            }
          : question.question_json;

      return {
        passage_bank_id:
          passageBankId,

        // IMPORTANT:
        // preserve the question's primary TEKS.
        teks_standard:
          questionTeks,

        // These belong to the stimulus.
        subject:
          passage.subject,

        grade_level:
          passage.grade_level,

        question_type:
          question.question_type,

        dok_level:
          Number(
            question.dok_level,
          ),

        skill_focus:
          normalizeOptionalString(
            question.skill_focus,
          ),

        assessment_move:
          normalizeOptionalString(
            question.assessment_move,
          ),

        dramatic_function:
          normalizeOptionalString(
            question.dramatic_function,
          ),

        target_scene:
          normalizeOptionalString(
            question.target_scene,
          ),

        correct_target_text:
          normalizeOptionalString(
            question.correct_target_text,
          ),

        correct_target_key:
          normalizeOptionalString(
            question.correct_target_key,
          ),

        question_json:
          questionJson,

        review_status:
          reviewStatus,

        is_active:
          isApproved &&
          question.is_active === true,

        times_used: 0,

        created_by:
          userId,

        reviewed_by:
          isApproved
            ? userId
            : null,

        reviewed_at:
          isApproved
            ? now
            : null,
      };
    },
  );
}

export async function POST(
  request,
  { params },
) {
  try {
    // ---------------------------------------------------------
    // 1. Authenticate
    // ---------------------------------------------------------

    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } =
      await supabase.auth.getUser();

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
          error:
            "Administrator access is required.",
        },
        {
          status: 403,
        },
      );
    }

    // ---------------------------------------------------------
    // 2. Resolve passage ID
    // ---------------------------------------------------------

    const resolvedParams =
      await params;

    const passageBankId =
      normalizeRequiredString(
        resolvedParams?.passageBankId,
      );

    if (!passageBankId) {
      return NextResponse.json(
        {
          error:
            "passageBankId is required.",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 3. Parse request body
    // ---------------------------------------------------------

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

    const rawQuestions =
      body.questions;

    if (
      !Array.isArray(rawQuestions) ||
      rawQuestions.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "questions must contain at least one question-bank row.",
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 4. Load EXISTING passage
    // ---------------------------------------------------------

    const serviceSupabase =
      await createV2ServiceClient();

    const {
      data: passage,
      error: passageError,
    } =
      await serviceSupabase
        .from("passage_bank")
        .select(`
          id,
          subject,
          grade_level,
          teks_standard,
          passage_format,
          content_focus_key,
          content_focus,
          title,
          passage,
          skill_tags,
          difficulty_level,
          is_active
        `)
        .eq(
          "id",
          passageBankId,
        )
        .maybeSingle();

    if (passageError) {
      console.error(
        "[admin/passage-bank/questions] Passage lookup failed",
        {
          passage_bank_id:
            passageBankId,

          error:
            passageError.message,
        },
      );

      return NextResponse.json(
        {
          error:
            "Unable to load passage bank.",
          details:
            passageError.message,
        },
        {
          status: 500,
        },
      );
    }

    if (!passage) {
      return NextResponse.json(
        {
          error:
            "Passage bank row was not found.",
          code:
            "PASSAGE_BANK_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    if (passage.is_active !== true) {
      return NextResponse.json(
        {
          error:
            "Questions can only be attached to an active published passage.",
          code:
            "PASSAGE_BANK_NOT_ACTIVE",
        },
        {
          status: 409,
        },
      );
    }

    // ---------------------------------------------------------
    // 5. Normalize incoming question identity
    //
    // Subject + grade come from existing passage.
    //
    // TEKS intentionally stays question-specific.
    // ---------------------------------------------------------

    const normalizedQuestions =
      rawQuestions.map(
        (question) => {
          if (!isPlainObject(question)) {
            return question;
          }

          const questionTeks =
            normalizeRequiredString(
              question.teks_standard,
            );

          return {
            ...question,

            passage_bank_id:
              passage.id,

            subject:
              passage.subject,

            grade_level:
              passage.grade_level,

            teks_standard:
              questionTeks,

            question_json:
              isPlainObject(
                question.question_json,
              )
                ? {
                    ...question.question_json,

                    teks_standard:
                      questionTeks,

                    passage:
                      passage.passage,
                  }
                : question.question_json,
          };
        },
      );

    // ---------------------------------------------------------
    // 6. Require a question TEKS
    //
    // We do NOT silently fall back to passage.teks_standard,
    // because this endpoint exists specifically to support
    // attaching a different primary TEKS.
    // ---------------------------------------------------------

    const missingTeksIndexes =
      normalizedQuestions
        .map(
          (question, index) =>
            !normalizeRequiredString(
              question?.teks_standard,
            )
              ? index
              : null,
        )
        .filter(
          (index) =>
            index !== null,
        );

    if (
      missingTeksIndexes.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Every attached question must include teks_standard.",

          issues:
            missingTeksIndexes.map(
              (index) => ({
                path:
                  `questions[${index}].teks_standard`,

                message:
                  "teks_standard is required for attached questions.",
              }),
            ),
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 7. Validate package against EXISTING passage
    //
    // This preserves:
    // - exact passage validation
    // - subject validation
    // - grade validation
    // - question-type validation
    // - answer validation
    // - duplicate/recommendation checks
    //
    // But intentionally allows question TEKS != passage TEKS.
    // ---------------------------------------------------------

    const packageValidation =
      validatePassageQuestionBankPackage(
        {
          passage: {
            ...passage,

            // Validate as non-active package metadata.
            // We are not publishing a new passage.
            is_active: false,
          },

          questions:
            normalizedQuestions,
        },
        {
          allowUnknownQuestionTypes:
            false,

          treatRecommendationsAsErrors:
            false,

          allowQuestionTeksMismatch:
            true,

          requirePrimaryTeksQuestion:
           false,
        },
      );

    if (!packageValidation.success) {
      return NextResponse.json(
        {
          error:
            "Passage question-bank validation failed.",

          issues:
            packageValidation.issues,

          errors:
            packageValidation.errors,

          warnings:
            packageValidation.warnings,
        },
        {
          status: 400,
        },
      );
    }

    // ---------------------------------------------------------
    // 8. Build final DB rows
    // ---------------------------------------------------------

    const questionRows =
      buildQuestionRows({
        validatedQuestions:
          packageValidation.data
            .questions,

        passage,

        passageBankId:
          passage.id,

        userId:
          user.id,
      });

    // ---------------------------------------------------------
    // 9. Insert questions only
    //
    // One Postgres INSERT statement:
    // no new passage_bank row is created.
    // ---------------------------------------------------------

    const {
      data: insertedQuestions,
      error: insertError,
    } =
      await serviceSupabase
        .from(
          "passage_question_bank",
        )
        .insert(
          questionRows,
        )
        .select();

    if (insertError) {
      console.error(
        "[admin/passage-bank/questions] Question insert failed",
        {
          passage_bank_id:
            passage.id,

          passage_teks:
            passage.teks_standard,

          question_teks: [
            ...new Set(
              questionRows.map(
                (question) =>
                  question.teks_standard,
              ),
            ),
          ],

          question_count:
            questionRows.length,

          error:
            insertError.message,
        },
      );

      return NextResponse.json(
        {
          error:
            "Failed to attach questions to passage bank.",

          details:
            insertError.message,
        },
        {
          status: 500,
        },
      );
    }

    // ---------------------------------------------------------
    // 10. Return existing passage + attached questions
    // ---------------------------------------------------------

    console.info(
      "[admin/passage-bank/questions] Questions attached to existing passage",
      {
        passage_bank_id:
          passage.id,

        passage_primary_teks:
          passage.teks_standard,

        attached_question_teks: [
          ...new Set(
            (
              insertedQuestions ??
              []
            ).map(
              (question) =>
                question.teks_standard,
            ),
          ),
        ],

        question_count:
          insertedQuestions?.length ??
          0,

        created_by:
          user.id,
      },
    );

    return NextResponse.json(
      {
        success: true,

        passage,

        questions:
          insertedQuestions ?? [],

        warnings:
          packageValidation.warnings,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "[admin/passage-bank/questions] Unexpected route error",
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
          "Unable to attach questions to passage bank.",
      },
      {
        status: 500,
      },
    );
  }
}