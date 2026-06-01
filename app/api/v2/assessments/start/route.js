// /app/api/v2/assessments/start/route.js
// Branch: v2/student-success-platform
// Creates an adaptive_sessions row, generates the first question,
// saves it to question_attempts, and returns session_id + join_code + first question.

import { createClient } from "@/libs/supabase/server";
import { createV2Client } from "@/libs/supabase/server-v2";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { adaptiveQuestionGenerator } from "@/libs/adaptive";
import { generateJoinCode } from "@/libs/joinCode";
import { NextResponse } from "next/server";

export async function POST(req) {
  // ── 1. Feature flag guard ────────────────────────────────────────────────
 

  // ── 2. Auth check ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const serviceSupabase = await createV2ServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
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
      { status: 500 }
    );
  }

  const hasClassroomAccess =
    profile.classroom_plan === true || profile.school_plan === true;

  if (!hasClassroomAccess) {
    return NextResponse.json(
      { error: "Classroom plan required.", upgrade: true },
      { status: 403 }
    );
  }

  // ── 4. Parse and validate request body ──────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { student_id, classroom_id, teks_standard, question_type, testing_window } = body;

  if (!student_id || !classroom_id || !teks_standard || !question_type) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: student_id, classroom_id, teks_standard, question_type.",
      },
      { status: 400 }
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
      { status: 404 }
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
      { status: 404 }
    );
  }

  // ── 7. Derive grade_level and subject from classroom (never from frontend)
  const { grade_level, subject,  } = classroom;

  // ── 8. Generate unique join code ─────────────────────────────────────────
  let join_code;
  try {
    join_code = await generateJoinCode();
  } catch (codeError) {
    console.error("[assessments/start] join code generation error:", codeError);
    return NextResponse.json(
      { error: "Failed to generate session join code." },
      { status: 500 }
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
      subject,
      grade_level,
      testing_window: testing_window ?? null,
      status: "in_progress",
      join_code,
      expires_at,
    })
    .select("id, join_code")
    .single();

  if (sessionError || !session) {
    console.error("[assessments/start] session insert error:", sessionError);
    return NextResponse.json(
      { error: "Failed to create session." },
      { status: 500 }
    );
  }

  const session_id = session.id;

  // ── 10. Generate first question (3-layer cache: Redis → question_bank → AI)
  let question;
  try {
    question = await adaptiveQuestionGenerator({
      teks_standard,
      grade_level,
      subject,
      dok_level: 1,          // always start at DOK 1
      question_type,
      previous_attempts: [], // no prior attempts on first question
    });
  } catch (genError) {
    console.error("[assessments/start] question generation error:", genError);

    // Roll back the session so it doesn't sit as in_progress with no question
    await serviceSupabase
      .from("adaptive_sessions")
      .update({ status: "abandoned" })
      .eq("id", session_id);

    return NextResponse.json(
      { error: "Failed to generate first question." },
      { status: 500 }
    );
  }

  // ── 11. Save first question to question_attempts ─────────────────────────
  const { data: attempt, error: attemptError } = await serviceSupabase
    .from("question_attempts")
    .insert({
      session_id,
      student_id,
      teks_standard,
      dok_level: question.dok_level ?? 1,
      question_type: question.question_type ?? question_type,
      question_json: question,
      student_answer: null,  // not answered yet
      is_correct: null,
      time_spent_seconds: null,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    console.error("[assessments/start] attempt insert error:", attemptError);

    await serviceSupabase
      .from("adaptive_sessions")
      .update({ status: "abandoned" })
      .eq("id", session_id);

    return NextResponse.json(
      { error: "Failed to save first question attempt." },
      { status: 500 }
    );
  }

  // ── 12. Return session_id, join_code, attempt_id, and first question ──────
  return NextResponse.json(
    {
      session_id,
      join_code: session.join_code,
      attempt_id: attempt.id,
      question: {
        attempt_id: attempt.id,
        teks_standard: question.teks_standard,
        dok_level: question.dok_level ?? 1,
        question_type: question.question_type ?? question_type,
        stem: question.stem,
        passage: question.passage ?? null,
        answer_options: question.answer_options ?? null,
        hot_text_targets: question.hot_text_targets ?? null,
        passage_tokens: question.passage_tokens ?? null,
        // correct_answer and explanation intentionally omitted from response
        // they live in question_json in the DB — fetched server-side on submit
      },
    },
    { status: 201 }
  );
}