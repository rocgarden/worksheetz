// /app/api/v2/assessments/bulk-start/route.js
// Branch: v2/student-success-platform
//
// Whole-class assignment — creates one adaptive session per active student
// in a classroom. Each student gets a unique join_code and first question.
//
// Flow:
//   1. Feature flag guard
//   2. Auth check (production supabase createClient)
//   3. Plan access check (classroom_plan or school_plan required)
//   4. Parse + validate body
//   5. Verify classroom belongs to teacher (v2 service client)
//   6. Fetch all active students in classroom (deleted_at IS NULL)
//   7. Select one approved shared passage package
//   8. Select one approved shared first question
//   9. For each active student, in parallel:
//      a. Generate a unique join_code
//      b. Insert a bank-backed adaptive_sessions row
//      c. Insert the approved first question_attempts row
//   10. Return successes and failures
import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { getPassageFormatForTEKS } from "@/libs/adaptive/passageFormat";
// import { ELA_CONTENT_FOCUS_CHIPS } from "@/libs/constants/adaptiveContentFocusOptions";

import {
  getReusablePassageForSession,
  getReusableQuestionForSession,
  incrementPassageQuestionUsage,
} from "@/libs/adaptive/passageBank";
import { generateJoinCode } from "@/libs/joinCode";
import { NextResponse } from "next/server";

/*
 * Initial release:
 * every student in one bulk assignment receives the same published passage.
 *
 * Future option:
 * change the selection layer to "distributed" and assign students across
 * multiple eligible passage packages.
 */
const PASSAGE_ASSIGNMENT_STRATEGY = "shared";

// function getELAContentFocusPrompt(teks_standard, content_focus_key) {
//   const chips = ELA_CONTENT_FOCUS_CHIPS[teks_standard] ?? [];

//   const chip = chips.find((item) => item.key === content_focus_key);

//   return chip?.prompt ?? null;
// }

// ── Helper: create one session for one student ────────────────────────────────
// Returns { ok: true, ...studentRow } on success, { ok: false, ...reason } on fail.
async function startStudentSession({
  student,
  classroom,
  teacher_id,
  teks_standard,
  question_type,
  starting_dok,
  testing_window,
  expires_in_hours,
  // content_focus,
  // content_focus_key,
  selected_passage,
  selected_question,
  serviceSupabase,
}) {
  const { grade_level, subject } = classroom;
  const student_id = student.id;

  // 1. Unique join code
  let join_code;
  try {
    join_code = await generateJoinCode();
  } catch (err) {
    console.error(
      `[bulk-start] join code failed for student ${student_id}:`,
      err,
    );
    return {
      ok: false,
      student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      student_code: student.student_code,
      reason: "Failed to generate join code.",
    };
  }

  // 2. Compute expires_at
  const hours = Number(expires_in_hours) || 24;
  const expires_at = new Date(
    Date.now() + hours * 60 * 60 * 1000,
  ).toISOString();

  // const passage_format = getPassageFormatForTEKS(teks_standard);

  // const normalizedContentFocusKey =
  //   typeof content_focus_key === "string" && content_focus_key.trim()
  //     ? content_focus_key.trim()
  //     : null;

  // const normalizedFreeTextContentFocus =
  //   typeof content_focus === "string" && content_focus.trim()
  //     ? content_focus.trim()
  //     : null;

  // const chipContentFocus =
  //   subject === "ELA" && normalizedContentFocusKey
  //     ? getELAContentFocusPrompt(teks_standard, normalizedContentFocusKey)
  //     : null;

  // const normalizedContentFocus =
  //   chipContentFocus ?? normalizedFreeTextContentFocus;

  // const startingDok = 1;

  // const shouldUsePassageBank =
  //   subject === "ELA" &&
  //   passage_format === "drama" &&
  //   Boolean(normalizedContentFocusKey);

  // const reusablePassage = shouldUsePassageBank
  //   ? await getReusablePassageForSession({
  //       supabase: serviceSupabase,

  //       subject,

  //       grade_level,

  //       teks_standard,

  //       passage_format,

  //       // content_focus_key: normalizedContentFocusKey, //temp commented out-for admin assign only
  //       content_focus_key:null,
  //       question_type,
  //       dok_level: 1,
  //     })
  //   : null;
  const passage_format = selected_passage.passage_format;

  const sessionStimulus = selected_passage.passage;

  // const reusableBankQuestion = await getReusableQuestionForSession({
  //   supabase: serviceSupabase,

  //   passage_bank_id: selected_passage.id,

  //   question_type,

  //   dok_level: starting_dok,

  //   exclude_question_ids: [],
  // });
  const reusableBankQuestion =
  selected_question;

  if (
  !reusableBankQuestion?.id ||
  !reusableBankQuestion?.question_json
    ) {
    return {
      ok: false,
      student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      student_code: student.student_code,
      reason:
        "No approved starting question is available for the selected passage.",
      code: "PASSAGE_QUESTION_BANK_INVENTORY_UNAVAILABLE",
    };
  }

  // const sessionStimulus = reusablePassage?.passage ?? null;

  // const reusableBankQuestion = reusablePassage
  //   ? await getReusableQuestionForSession({
  //       supabase: serviceSupabase,

  //       passage_bank_id: reusablePassage.id,

  //       question_type,

  //       dok_level: startingDok,

  //       exclude_question_ids: [],
  //     })
  //   : null;

  // 3. Insert session row
  const { data: session, error: sessionError } = await serviceSupabase
    .from("adaptive_sessions")
    .insert({
      student_id,
      teacher_id,
      classroom_id: classroom.id,
      teks_standard,
      subject,
      grade_level,
      testing_window: testing_window ?? classroom.testing_window ?? null,
      question_type,
      content_focus: null,

      content_focus_key: null,

      passage_format,

      passage_bank_id: selected_passage.id,

      stimulus: sessionStimulus,
      // content_focus: normalizedContentFocus,

      // content_focus_key: normalizedContentFocusKey,

      // passage_format,

      // passage_bank_id: reusablePassage?.id ?? null,

      // stimulus: sessionStimulus,

      status: "in_progress",
      join_code,
      expires_at,
    })
    .select("id, join_code")
    .single();

  if (sessionError || !session) {
    console.error(
      `[bulk-start] session insert failed for student ${student_id}:`,
      sessionError,
    );
    return {
      ok: false,
      student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      student_code: student.student_code,
      reason: "Failed to create session.",
    };
  }

  const session_id = session.id;

  // 4. Select a reviewed bank question before AI fallback
  // let question;
  // let questionSource;
  // let selectedPassageQuestionBankId = null;

  // if (reusableBankQuestion?.id && reusableBankQuestion?.question_json) {
  //   question = reusableBankQuestion.question_json;

  //   questionSource = "bank";

  //   selectedPassageQuestionBankId = reusableBankQuestion.id;
  // } else {
  //   questionSource = "ai";

  //   try {
  //     question = await adaptiveQuestionGenerator({
  //       teks_standard,
  //       grade_level,
  //       subject,

  //       dok_level: startingDok,

  //       question_type,

  //       previous_attempt_ids: [],

  //       previous_attempts: [],

  //       content_focus: normalizedContentFocus,

  //       content_focus_key: normalizedContentFocusKey,

  //       stimulus: sessionStimulus,

  //       passage_format,
  //     });
  //   } catch (genErr) {
  //     console.error(
  //       `[bulk-start] question generation failed for student ${student_id}:`,
  //       genErr,
  //     );

  //     await serviceSupabase
  //       .from("adaptive_sessions")
  //       .update({
  //         status: "abandoned",
  //       })
  //       .eq("id", session_id);

  //     return {
  //       ok: false,
  //       student_id,
  //       first_name: student.first_name,
  //       last_name: student.last_name,
  //       student_code: student.student_code,
  //       reason: "Failed to generate first question.",
  //     };
  //   }
  // }
  const question = reusableBankQuestion.question_json;

  const questionSource = "bank";

  const selectedPassageQuestionBankId = reusableBankQuestion.id;
  // 4.5. Save an AI-generated passage only when no reviewed passage was used
  // if (!sessionStimulus && question.passage) {
  //   const { error: stimulusError } = await serviceSupabase
  //     .from("adaptive_sessions")
  //     .update({
  //       stimulus: question.passage,
  //     })
  //     .eq("id", session_id);

  //   if (stimulusError) {
  //     console.warn(
  //       `[bulk-start] fallback stimulus save failed for student ${student_id} (non-fatal):`,
  //       stimulusError.message,
  //     );
  //   }
  // }

  // 5. Insert first question_attempts row
  const { data: attempt, error: attemptError } = await serviceSupabase
    .from("question_attempts")
    .insert({
      session_id,
      student_id,
      teks_standard,

      dok_level:
        question.dok_level ?? reusableBankQuestion?.dok_level ?? startingDok,

      question_type:
        question.question_type ??
        reusableBankQuestion?.question_type ??
        question_type,

      question_json: question,

      passage_question_bank_id: selectedPassageQuestionBankId,

      question_source: questionSource,

      student_answer: null,
      is_correct: null,
      time_spent_seconds: null,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    console.error(
      `[bulk-start] attempt insert failed for student ${student_id}:`,
      attemptError,
    );

    await serviceSupabase
      .from("adaptive_sessions")
      .update({ status: "abandoned" })
      .eq("id", session_id);

    return {
      ok: false,
      student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      student_code: student.student_code,
      reason: "Failed to save first question.",
    };
  }

  if (questionSource === "bank" && reusableBankQuestion) {
    await incrementPassageQuestionUsage({
      supabase: serviceSupabase,

      question: reusableBankQuestion,
    });
  }

  // 6. Success
  return {
    ok: true,
    student_id,
    session_id,
    join_code: session.join_code,

    attempt_id: attempt.id,

    question_source: questionSource,

    first_name: student.first_name,

    last_name: student.last_name,

    student_code: student.student_code,
  };
}

// ── POST /api/v2/assessments/bulk-start ──────────────────────────────────────

export async function POST(req) {
  // ── 1. Feature flag guard ────────────────────────────────────────────────
  //   if (process.env.NEXT_PUBLIC_V2_ENABLED !== "true") {
  //     return NextResponse.json(
  //       { error: "V2 features are not enabled." },
  //       { status: 403 }
  //     );
  //   }

  // ── 2. Auth check ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const serviceSupabase = await createV2ServiceClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 3. Plan access check ─────────────────────────────────────────────────
  const { data: profile, error: profileError } = await serviceSupabase
    .from("profiles")
    .select("classroom_plan, school_plan")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Could not retrieve user profile." },
      { status: 500 },
    );
  }

  const hasClassroomAccess =
    profile.classroom_plan === true || profile.school_plan === true;

  if (!hasClassroomAccess) {
    return NextResponse.json(
      { error: "Classroom plan required.", upgrade: true },
      { status: 403 },
    );
  }

  // ── 4. Parse + validate body ─────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const {
    classroom_id,
    teks_standard,
    // question_type,
    testing_window,
    expires_in_hours,
    // content_focus = null,
    // content_focus_key = null,
  } = body;

  /*
   * Initial teacher-assignment defaults.
   * These are controlled by the server, not the client.
   */
  const question_type = "multiple_choice";

  const startingDok = 1;

  if (!classroom_id || !teks_standard) {
    return NextResponse.json(
      {
        error: "Missing required fields: classroom_id, teks_standard.",
      },
      { status: 400 },
    );
  }

  // const validQuestionTypes = [
  //   "multiple_choice",
  //   "multi_select",
  //   "constructed_response",
  //   "hot_text",
  //   "hotspot",
  //   "drag_and_drop",
  //   "inline_choice",
  //   "match_table",
  //   "order",
  //   "griddable",
  // ];

  // if (!validQuestionTypes.includes(question_type)) {
  //   return NextResponse.json(
  //     { error: `Invalid question_type: ${question_type}.` },
  //     { status: 400 },
  //   );
  // }

  const validWindows = ["BOY", "MOY", "EOY"];
  if (testing_window && !validWindows.includes(testing_window)) {
    return NextResponse.json(
      { error: `Invalid testing_window. Must be BOY, MOY, or EOY.` },
      { status: 400 },
    );
  }

  // ── 5. Verify classroom belongs to teacher ───────────────────────────────
  const { data: classroom, error: classroomError } = await serviceSupabase
    .from("classrooms")
    .select("id, teacher_id, grade_level, subject, testing_window, name")
    .eq("id", classroom_id)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .single();

  if (classroomError || !classroom) {
    return NextResponse.json(
      { error: "Classroom not found or access denied." },
      { status: 404 },
    );
  }

  // ── 6. Fetch all active students in classroom ────────────────────────────
  const { data: students, error: studentsError } = await serviceSupabase
    .from("students")
    .select("id, first_name, last_name, student_code")
    .eq("classroom_id", classroom_id)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  if (studentsError) {
    console.error("[bulk-start] students fetch error:", studentsError);
    return NextResponse.json(
      { error: "Failed to fetch students." },
      { status: 500 },
    );
  }

  if (!students || students.length === 0) {
    return NextResponse.json(
      { error: "No active students found in this classroom." },
      { status: 404 },
    );
  }

  const passage_format = getPassageFormatForTEKS(teks_standard);
console.log("[assessments/start] passage lookup args:", {
  subject: classroom.subject,
  grade_level: classroom.grade_level,
  teks_standard,
  passage_format,
  question_type,
  dok_level: startingDok,
});
const shouldUsePassageBank =
  classroom.subject === "ELA" &&
  Boolean(passage_format);

  if (!shouldUsePassageBank) {
    return NextResponse.json(
      {
        error:
          "Published passage-bank assignment is not configured for this TEKS yet.",
        code: "PASSAGE_BANK_NOT_CONFIGURED",
      },
      { status: 409 },
    );
  }

  const sharedPassage = await getReusablePassageForSession({
    supabase: serviceSupabase,

    subject: classroom.subject,

    grade_level: classroom.grade_level,

    teks_standard,

    passage_format,

    /*
     * No teacher content-focus selection.
     * All published focus variants are eligible.
     */
    content_focus_key: null,

    question_type,

    dok_level: startingDok,
  });

  if (!sharedPassage) {
    return NextResponse.json(
      {
        error:
          "No approved published passage package is available for this TEKS.",
        code: "PASSAGE_BANK_INVENTORY_UNAVAILABLE",
      },
      { status: 409 },
    );
  }

  // const resolvePassageForStudent = () => {
  //   if (PASSAGE_ASSIGNMENT_STRATEGY === "shared") {
  //     return sharedPassage;
  //   }

  //   /*
  //    * Future distributed mode:
  //    * return a passage from a preloaded eligible passage pool,
  //    * using round-robin, balanced usage, or another policy.
  //    */
  //   return sharedPassage;
  // };

  const sharedFirstQuestion = await getReusableQuestionForSession({
    supabase: serviceSupabase,
    passage_bank_id: sharedPassage.id,
    teks_standard,
    question_type,
    dok_level: startingDok,
    exclude_question_ids: [],
  });

  if (!sharedFirstQuestion) {
    return NextResponse.json(
      {
        error:
          "No approved starting question is available for the selected passage.",

        code: "PASSAGE_QUESTION_BANK_INVENTORY_UNAVAILABLE",
      },
      { status: 409 },
    );
  }

  const sharedPackage = {
  passage: sharedPassage,
  first_question: sharedFirstQuestion,
};

const resolvePackageForStudent = (
  _student,
  _studentIndex,
) => {
  if (
    PASSAGE_ASSIGNMENT_STRATEGY ===
    "shared"
  ) {
    return sharedPackage;
  }

  /*
   * Future distributed mode:
   * return one item from an eligiblePackages array.
   *
   * Each package must contain its matching passage
   * and approved first question.
   */
  return sharedPackage;
};

  // ── 7. Create sessions in parallel — never abort on single failure ────────
 const results = await Promise.allSettled(
  students.map(
    (student, studentIndex) => {
      const selectedPackage =
        resolvePackageForStudent(
          student,
          studentIndex,
        );

      return startStudentSession({
        student,
        classroom,
        teacher_id: user.id,
        teks_standard,
        question_type,
        starting_dok: startingDok,
        testing_window,
        expires_in_hours,

        selected_passage:
          selectedPackage.passage,

        selected_question:
          selectedPackage.first_question,

        serviceSupabase,
      });
    },
  ),
);

  const successes = [];
  const failures = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      const val = result.value;
      if (val.ok) {
        successes.push({
          student_id: val.student_id,

          session_id: val.session_id,

          join_code: val.join_code,

          attempt_id: val.attempt_id,

          question_source: val.question_source,

          first_name: val.first_name,

          last_name: val.last_name,

          student_code: val.student_code,
        });
      } else {
        failures.push({
          student_id: val.student_id,
          first_name: val.first_name,
          last_name: val.last_name,
          student_code: val.student_code,
          reason: val.reason,
          code: val.code ?? null,
        });
      }
    } else {
      // Promise itself rejected (unexpected)
      console.error("[bulk-start] unexpected rejection:", result.reason);
      failures.push({ reason: "Unexpected error." });
    }
  }

  // ── 8. Return results ────────────────────────────────────────────────────
  return NextResponse.json(
    {
      classroom_id,
      classroom_name: classroom.name,
      teks_standard,
      question_type,
      testing_window: testing_window ?? classroom.testing_window ?? null,
      expires_in_hours: Number(expires_in_hours) || 24,
      total_students: students.length,
      success_count: successes.length,
      failure_count: failures.length,
      sessions: successes,
      failures,
    },
    { status: 201 },
  );
}
