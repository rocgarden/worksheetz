// /app/api/v2/admin/passage-bank/generate/route.js
//
// Admin-only route for generating a reviewable passage/question-bank draft.
//
// Flow:
// request
// → admin authentication
// → shared generatePassageQuestionBankDraft dispatcher
// → subject-specific generator
// → normalized draft package
// → shared structural validation
// → return draft for human review
//
// This route does NOT insert into passage_bank or passage_question_bank.

import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

import { generatePassageQuestionBankDraft } from "@/libs/adaptive/questionBank/generators";
import { validatePassageQuestionBankPackage } from "@/libs/adaptive/questionBank/validatePassageQuestionBankPackage";
export const dynamic = "force-dynamic";

const MAX_TOTAL_QUESTIONS = 30;

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
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
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Supports either:
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
  const email = normalizeOptionalString(user?.email)?.toLowerCase();

  if (!email) {
    return false;
  }

  return getAdminEmails().has(email);
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.map((item) => normalizeOptionalString(item)).filter(Boolean),
    ),
  ];
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function normalizeDokLevel(value) {
  const dokLevel = Number(value);

  return [1, 2, 3].includes(dokLevel) ? dokLevel : null;
}

/**
 * Validates and normalizes the requested question plan.
 *
 * @param {unknown} rawPlan
 * @returns {{
 *   success: boolean,
 *   data: Array<object>,
 *   error: string|null
 * }}
 */
function normalizeQuestionPlan(rawPlan) {
  if (!Array.isArray(rawPlan) || rawPlan.length === 0) {
    return {
      success: false,
      data: [],
      error: "question_plan must contain at least one entry.",
    };
  }

  const normalizedPlan = [];
  let totalQuestions = 0;

  for (let index = 0; index < rawPlan.length; index += 1) {
    const item = rawPlan[index];

    if (!isPlainObject(item)) {
      return {
        success: false,
        data: [],
        error: `question_plan[${index}] must be an object.`,
      };
    }

    const questionType = normalizeRequiredString(item.question_type);

    const dokLevel = normalizeDokLevel(item.dok_level);

    const count = Number(item.count ?? 1);

    if (!questionType) {
      return {
        success: false,
        data: [],
        error: `question_plan[${index}].question_type is required.`,
      };
    }

    if (!dokLevel) {
      return {
        success: false,
        data: [],
        error: `question_plan[${index}].dok_level must be 1, 2, or 3.`,
      };
    }

    if (!Number.isInteger(count) || count < 1 || count > 20) {
      return {
        success: false,
        data: [],
        error: `question_plan[${index}].count must be an integer from 1 to 20.`,
      };
    }

    totalQuestions += count;

    normalizedPlan.push({
      question_type: questionType,
      dok_level: dokLevel,
      count,
    });
  }

  if (totalQuestions > MAX_TOTAL_QUESTIONS) {
    return {
      success: false,
      data: [],
      error: `A maximum of ${MAX_TOTAL_QUESTIONS} questions may be generated per request.`,
    };
  }

  return {
    success: true,
    data: normalizedPlan,
    error: null,
  };
}

/**
 * POST /api/v2/admin/passage-bank/generate
 *
 * Request example:
 *
 * {
 *   "subject": "ELA",
 *   "grade_level": "8",
 *   "teks_standard": "8.8C",
 *   "passage_format": "drama",
 *   "content_focus_key": "misunderstanding_deadline_choice",
 *   "content_focus": "overheard information...",
 *   "title": "Before the Upload",
 *   "skill_tags": ["dramatic_action"],
 *   "difficulty_level": 3,
 *   "testing_window": null,
 *   "question_plan": [
 *     {
 *       "question_type": "multiple_choice",
 *       "dok_level": 1,
 *       "count": 3
 *     },
 *     {
 *       "question_type": "hot_text",
 *       "dok_level": 2,
 *       "count": 3
 *     }
 *   ]
 * }
 */
export async function POST(request) {
  try {
    /*
     * ----------------------------------------------------------
     * 1. Authenticate and authorize admin
     * ----------------------------------------------------------
     */

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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
          error: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 2. Parse body
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

    /*
     * ----------------------------------------------------------
     * 3. Validate request fields
     * ----------------------------------------------------------
     */

    const subject = normalizeRequiredString(body.subject);

    const gradeLevel = normalizeRequiredString(String(body.grade_level ?? ""));

    const teksStandard = normalizeRequiredString(body.teks_standard);

    const passageFormat = normalizeRequiredString(body.passage_format);

    const difficultyLevel = normalizeDokLevel(body.difficulty_level ?? 2);

    if (!subject || !gradeLevel || !teksStandard || !passageFormat) {
      return NextResponse.json(
        {
          error:
            "subject, grade_level, teks_standard, and passage_format are required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!difficultyLevel) {
      return NextResponse.json(
        {
          error: "difficulty_level must be 1, 2, or 3.",
        },
        {
          status: 400,
        },
      );
    }

    const questionPlanResult = normalizeQuestionPlan(body.question_plan);

    if (!questionPlanResult.success) {
      return NextResponse.json(
        {
          error: questionPlanResult.error,
        },
        {
          status: 400,
        },
      );
    }

    /*
     * ----------------------------------------------------------
     * 4. Generate using shared dispatcher
     * ----------------------------------------------------------
     */

    const generatedPackage = await generatePassageQuestionBankDraft({
      subject,
      gradeLevel,
      teksStandard,
      passageFormat,

      contentFocus: normalizeOptionalString(body.content_focus),

      contentFocusKey: normalizeOptionalString(body.content_focus_key),

      title: normalizeOptionalString(body.title),

      skillTags: normalizeStringArray(body.skill_tags),

      difficultyLevel,

      testingWindow: normalizeOptionalString(body.testing_window),

      questionPlan: questionPlanResult.data,

      generatorOptions: isPlainObject(body.generator_options)
        ? body.generator_options
        : {},
    });

    /*
     * ----------------------------------------------------------
     * 5. Validate normalized generated package
     * ----------------------------------------------------------
     */

    const validation = validatePassageQuestionBankPackage(
      {
        passage: generatedPackage.passage,

        questions: generatedPackage.questions,
      },
      {
        allowUnknownQuestionTypes: false,

        treatRecommendationsAsErrors: false,
      },
    );
 /*
 * ----------------------------------------------------------
 * 6. Build the persistent draft package
 * ----------------------------------------------------------
 */

const draftPackage = {
  passage: generatedPackage.passage,
  questions: generatedPackage.questions,
};

const validationSnapshot = {
  success: validation.success,
  issues: validation.issues,
  errors: validation.errors,
  warnings: validation.warnings,
};

const generationSnapshot = {
  ...(isPlainObject(generatedPackage.generation)
    ? generatedPackage.generation
    : {}),

  request: {
    subject,
    grade_level: gradeLevel,
    teks_standard: teksStandard,
    passage_format: passageFormat,

    content_focus:
      normalizeOptionalString(
        body.content_focus,
      ),

    content_focus_key:
      normalizeOptionalString(
        body.content_focus_key,
      ),

    requested_title:
      normalizeOptionalString(
        body.title,
      ),

    skill_tags:
      normalizeStringArray(
        body.skill_tags,
      ),

    difficulty_level:
      difficultyLevel,

    testing_window:
      normalizeOptionalString(
        body.testing_window,
      ),

    question_plan:
      questionPlanResult.data,

    generator_options:
      isPlainObject(
        body.generator_options,
      )
        ? body.generator_options
        : {},
  },
};

/*
 * ----------------------------------------------------------
 * 7. Persist the generated draft
 * ----------------------------------------------------------
 */

const serviceSupabase =
  await createV2ServiceClient();

const {
  data: savedDraft,
  error: saveDraftError,
} = await serviceSupabase
  .from(
    "passage_bank_draft_packages",
  )
  .insert({
    status: "draft",

    subject:
      generatedPackage.passage.subject,

    grade_level:
      String(
        generatedPackage.passage
          .grade_level,
      ),

    teks_standard:
      generatedPackage.passage
        .teks_standard,

    passage_format:
      generatedPackage.passage
        .passage_format,

    content_focus_key:
      normalizeOptionalString(
        generatedPackage.passage
          .content_focus_key,
      ),

    title:
      normalizeOptionalString(
        generatedPackage.passage.title,
      ),

    draft_json:
      draftPackage,

    validation_json:
      validationSnapshot,

    generation_json:
      generationSnapshot,

    created_by:
      user.id,

    updated_by:
      user.id,
  })
  .select(
    `
      id,
      status,
      created_at,
      updated_at
    `,
  )
  .single();

if (
  saveDraftError ||
  !savedDraft
) {
  console.error(
    "[admin/passage-bank/generate] Draft persistence failed",
    {
      error:
        saveDraftError?.message ||
        "No saved draft was returned.",

      generated_by:
        user.id,

      subject:
        generatedPackage.passage
          .subject,

      grade_level:
        generatedPackage.passage
          .grade_level,

      teks_standard:
        generatedPackage.passage
          .teks_standard,
    },
  );

  return NextResponse.json(
    {
      error:
        "The content was generated, but the draft could not be saved.",

      details:
        process.env.NODE_ENV ===
        "development"
          ? saveDraftError?.message ||
            "No saved draft was returned."
          : undefined,
    },
    {
      status: 500,
    },
  );
}

/*
 * ----------------------------------------------------------
 * 8. Return the saved reviewable draft
 * ----------------------------------------------------------
 */

console.info(
  "[admin/passage-bank/generate] Draft generated and saved",
  {
    draft_id:
      savedDraft.id,

    generated_by:
      user.id,

    subject:
      generatedPackage.passage
        .subject,

    grade_level:
      generatedPackage.passage
        .grade_level,

    teks_standard:
      generatedPackage.passage
        .teks_standard,

    passage_format:
      generatedPackage.passage
        .passage_format,

    question_count:
      generatedPackage.questions
        .length,

    structurally_valid:
      validation.success,
  },
);

return NextResponse.json({
  success: true,

  ready_for_review: true,

  structurally_valid:
    validation.success,

  draft_id:
    savedDraft.id,

  draft_status:
    savedDraft.status,

  saved_at:
    savedDraft.created_at,

  draft:
    draftPackage,

  validation:
    validationSnapshot,

  generation:
    generationSnapshot,
});
  } catch (error) {
    console.error("[admin/passage-bank/generate] Generation failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Unable to generate passage question-bank draft.",

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
