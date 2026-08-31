// /app/api/v2/assessments/start/route.js
// Branch: v2/student-success-platform
// Creates an adaptive_sessions row, generates the first question,
// saves it to question_attempts, and returns session_id + join_code + first question.

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { adaptiveQuestionGenerator } from "@/libs/adaptive";
import { generateJoinCode } from "@/libs/joinCode";
import { NextResponse } from "next/server";
import { getPassageFormatForTEKS } from "@/libs/adaptive/passageFormat";
import { ELA_CONTENT_FOCUS_CHIPS } from "@/libs/constants/adaptiveContentFocusOptions";
import {
  getReusablePassageForSession,
  getReusableQuestionForSession,
  incrementPassageQuestionUsage,
} from "@/libs/adaptive/passageBank";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req) {
  // ── 1. Feature flag guard ────────────────────────────────────────────────

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
  console.log("Authenticated user ID:", user.id);

  // ── 3. Plan access check ─────────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("classroom_plan, school_plan")
    .eq("id", user.id)
    .single();

  console.log("User profile:", profile);
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

  // ── 4. Parse and validate request body ──────────────────────────────────
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
    student_id,
    classroom_id,
    teks_standard,
    testing_window,

    /*
     * Retained for future teacher controls.
     * Currently ignored unless explicitly restored below.
     */
    content_focus = null,
    content_focus_key = null,
  } = body;

  /*
   * Initial production defaults.
   * Do not trust frontend overrides during the MC-only launch.
   */
  const question_type = "multiple_choice";
  const startingDok = 1;

  function getELAContentFocusPrompt(teks_standard, content_focus_key) {
    const chips = ELA_CONTENT_FOCUS_CHIPS[teks_standard] ?? [];
    const chip = chips.find((item) => item.key === content_focus_key);

    return chip?.prompt ?? null;
  }

  const normalizedContentFocusKey =
    typeof content_focus_key === "string" && content_focus_key.trim()
      ? content_focus_key.trim()
      : null;
  const normalizedFreeTextContentFocus =
    typeof content_focus === "string" && content_focus.trim()
      ? content_focus.trim()
      : null;

  // const normalizedContentFocus = getELAContentFocusPrompt(
  //   teks_standard,
  //   normalizedContentFocusKey,
  // );

  // if (!student_id || !classroom_id || !teks_standard || !question_type) {
  if (!student_id || !classroom_id || !teks_standard) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: student_id, classroom_id, teks_standard.",
      },
      { status: 400 },
    );
  }

  // ── 5. Verify classroom belongs to this teacher ──────────────────────────
  const { data: classroom, error: classroomError } = await serviceSupabase
    .from("classrooms")
    .select("id, teacher_id, grade_level, subject, testing_window")
    .eq("id", classroom_id)
    .eq("teacher_id", user.id)
    .single();

  if (classroomError || !classroom) {
    return NextResponse.json(
      { error: "Classroom not found or access denied." },
      { status: 404 },
    );
  }

  // ── 6. Verify student belongs to this classroom ──────────────────────────
  const { data: student, error: studentError } = await serviceSupabase
    .from("students")
    .select("id, classroom_id, teacher_id")
    .eq("id", student_id)
    .eq("classroom_id", classroom_id)
    .eq("teacher_id", user.id)
    .single();

  if (studentError || !student) {
    return NextResponse.json(
      { error: "Student not found or does not belong to this classroom." },
      { status: 404 },
    );
  }

  // ── 7. Derive grade_level and subject from classroom (never from frontend)
  const { grade_level, subject } = classroom;
  const chipContentFocus =
    subject === "ELA" && normalizedContentFocusKey
      ? getELAContentFocusPrompt(teks_standard, normalizedContentFocusKey)
      : null;

  const normalizedContentFocus =
    chipContentFocus ?? normalizedFreeTextContentFocus;

  const passage_format = getPassageFormatForTEKS(teks_standard);
  console.log("[assessments/start] passage lookup args:", {
    subject,
    grade_level,
    teks_standard,
    passage_format,
    question_type,
    dok_level: startingDok,
  });
  const shouldUsePassageBank = subject === "ELA" && Boolean(passage_format);
  // normalizedContentFocusKey;
  // dok_level: clamp to 1-3
  //  const startingDok = Math.max(1, Math.min(3, Number(dok_level) || 1));

  const reusablePassage = shouldUsePassageBank
    ? await getReusablePassageForSession({
        supabase: serviceSupabase,
        subject,
        grade_level,
        teks_standard,
        passage_format,
        // Teacher is not selecting a content focus during initial launch.
        // The selector should consider every eligible published focus variant.
        content_focus_key: null,

        // Server-controlled launch defaults.
        question_type,
        dok_level: startingDok,
      })
    : null;

  if (shouldUsePassageBank && !reusablePassage) {
    return NextResponse.json(
      {
        error: "No approved passage-bank package is available for this TEKS.",
        code: "PASSAGE_BANK_INVENTORY_UNAVAILABLE",
      },
      { status: 409 },
    );
  }
  console.log("[assessments/start] reusable passage:", {
    found: Boolean(reusablePassage),
    id: reusablePassage?.id ?? null,
    title: reusablePassage?.title ?? null,
    teks_standard: reusablePassage?.teks_standard ?? null,
    passage_format: reusablePassage?.passage_format ?? null,
  });

  const sessionStimulus = reusablePassage?.passage ?? null;

  const sessionStimulusJson = isPlainObject(reusablePassage?.stimulus_json)
    ? reusablePassage.stimulus_json
    : null;

  const reusableBankQuestion = reusablePassage
    ? await getReusableQuestionForSession({
        supabase: serviceSupabase,
        passage_bank_id: reusablePassage.id,
        teks_standard,
        question_type,
        dok_level: startingDok,
        exclude_question_ids: [],
      })
    : null;

  if (shouldUsePassageBank && !reusableBankQuestion) {
    return NextResponse.json(
      {
        error:
          "No approved multiple-choice question is available for this TEKS and starting DOK.",
        code: "PASSAGE_QUESTION_BANK_INVENTORY_UNAVAILABLE",
      },
      { status: 409 },
    );
  }

  // testing_window: body > classroom.testing_window fallback
  const effectiveWindow = testing_window || classroom.testing_window || null;
  // ── 8. Generate unique join code ─────────────────────────────────────────
  let join_code;
  try {
    join_code = await generateJoinCode();
  } catch (codeError) {
    console.error("[assessments/start] join code generation error:", codeError);
    return NextResponse.json(
      { error: "Failed to generate session join code." },
      { status: 500 },
    );
  }

  // ── 9. Create adaptive_sessions row ─────────────────────────────────────
  // Session expires 24 hours after creation
  const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: session, error: sessionError } = await serviceSupabase
    .from("adaptive_sessions")
    .insert({
      student_id,
      teacher_id: user.id,
      classroom_id,
      teks_standard,
      subject: classroom.subject,
      grade_level: classroom.grade_level,
      testing_window: effectiveWindow,
      question_type,
      status: "in_progress",
      content_focus: normalizedContentFocus,
      content_focus_key: normalizedContentFocusKey,
      passage_format,
      passage_bank_id: reusablePassage?.id ?? null,
      join_code: join_code,
      expires_at,
      stimulus: sessionStimulus,

      stimulus_json: sessionStimulusJson,
      // stimulus,
    })
    .select("id, join_code")
    .single();

  if (sessionError || !session) {
    console.error("[assessments/start] session insert error:", sessionError);
    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 },
    );
  }

  const session_id = session.id;

  //let stimulus = null;
  // ── 10. Select a reviewed bank question before AI fallback ────────────────
  let question;
  let questionSource;
  let selectedPassageQuestionBankId = null;

  if (reusableBankQuestion?.id && reusableBankQuestion?.question_json) {
    question = reusableBankQuestion.question_json;
    questionSource = "bank";
    selectedPassageQuestionBankId = reusableBankQuestion.id;
  } else if (shouldUsePassageBank) {
    /*
     * Defensive guard. Teacher-started ELA drama sessions must never
     * create live instructional content.
     */
    await serviceSupabase
      .from("adaptive_sessions")
      .delete()
      .eq("id", session_id);

    return NextResponse.json(
      {
        error: "Approved passage-bank content is unavailable.",
        code: "BANK_CONTENT_UNAVAILABLE",
      },
      { status: 409 },
    );
  } else {
    questionSource = "ai";

    try {
      question = await adaptiveQuestionGenerator({
        teks_standard,
        grade_level: classroom.grade_level,
        subject: classroom.subject,
        dok_level: startingDok,
        question_type,
        previous_attempt_ids: [],
        previous_attempts: [],
        content_focus: normalizedContentFocus,
        content_focus_key: normalizedContentFocusKey,
        stimulus: sessionStimulus,
        passage_format,
      });
    } catch (genError) {
      console.error("[assessments/start] question generation error:", genError);

      await serviceSupabase
        .from("adaptive_sessions")
        .delete()
        .eq("id", session_id);

      return NextResponse.json(
        {
          error: "Failed to generate first question.",
        },
        {
          status: 500,
        },
      );
    }
  }

  // ── 11. Save first question to question_attempts ─────────────────────────
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
    console.error("[assessments/start] attempt insert error:", attemptError);
    await serviceSupabase
      .from("adaptive_sessions")
      .delete()
      .eq("id", session_id);
    return NextResponse.json(
      { error: "Failed to save first question attempt." },
      { status: 500 },
    );
  }

  if (questionSource === "bank" && reusableBankQuestion) {
    await incrementPassageQuestionUsage({
      supabase: serviceSupabase,
      question: reusableBankQuestion,
    });
  }

  // ── 12. Save generated passage as fallback stimulus only if no cached passage was used
  // If sessionStimulus exists, the session already has the reviewed cached passage.
  if (!sessionStimulus && question.passage) {
    const { error: stimulusError } = await serviceSupabase
      .from("adaptive_sessions")
      .update({ stimulus: question.passage })
      .eq("id", session_id);

    if (stimulusError) {
      console.warn(
        "[assessments/start] fallback stimulus save failed (non-fatal):",
        stimulusError.message,
      );
    }
  }

  // ── 13. Return session_id, join_code, attempt_id, and first question ──────
  return NextResponse.json(
    {
      session_id,
      join_code: session.join_code,
      attempt_id: attempt.id,

      stimulus: sessionStimulus,

      question: {
        attempt_id: attempt.id,
        source: questionSource,

        teks_standard: question.teks_standard ?? teks_standard,

        dok_level:
          question.dok_level ?? reusableBankQuestion?.dok_level ?? startingDok,

        question_type:
          question.question_type ??
          reusableBankQuestion?.question_type ??
          question_type,

        stem: question.stem,
        passage: question.passage ?? sessionStimulus ?? null,

        answer_options: question.answer_options ?? null,

        hot_text_targets: question.hot_text_targets ?? null,

        passage_tokens: question.passage_tokens ?? null,
      },
    },
    { status: 201 },
  );
}
