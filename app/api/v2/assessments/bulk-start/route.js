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
//   7. For each student — in parallel with Promise.allSettled:
//      a. Generate unique join_code
//      b. Insert adaptive_sessions row with expires_at
//      c. Generate first question via adaptiveQuestionGenerator
//      d. Insert question_attempts row
//   8. Return successes array + failures array (never abort on one failure)

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { adaptiveQuestionGenerator } from "@/libs/adaptive";
import { generateJoinCode } from "@/libs/joinCode";
import { NextResponse } from "next/server";

// ── Helper: create one session for one student ────────────────────────────────
// Returns { ok: true, ...studentRow } on success, { ok: false, ...reason } on fail.
async function startStudentSession({
  student,
  classroom,
  teacher_id,
  teks_standard,
  question_type,
  testing_window,
  expires_in_hours,
  serviceSupabase,
}) {
  const { grade_level, subject } = classroom;
  const student_id = student.id;

  // 1. Unique join code
  let join_code;
  try {
    join_code = await generateJoinCode();
  } catch (err) {
    console.error(`[bulk-start] join code failed for student ${student_id}:`, err);
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
  const expires_at = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

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
      status: "in_progress",
      join_code,
      expires_at,
    })
    .select("id, join_code")
    .single();

  if (sessionError || !session) {
    console.error(`[bulk-start] session insert failed for student ${student_id}:`, sessionError);
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

  // 4. Generate first question
  let question;
  try {
    question = await adaptiveQuestionGenerator({
      teks_standard,
      grade_level,
      subject,
      dok_level: 1,
      question_type,
      previous_attempts: [],
    });
  } catch (genErr) {
    console.error(`[bulk-start] question generation failed for student ${student_id}:`, genErr);

    // Abandon the session so it doesn't sit in_progress with no question
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
      reason: "Failed to generate first question.",
    };
  }

  // 5. Insert first question_attempts row
  const { error: attemptError } = await serviceSupabase
    .from("question_attempts")
    .insert({
      session_id,
      student_id,
      teks_standard,
      dok_level: question.dok_level ?? 1,
      question_type: question.question_type ?? question_type,
      question_json: question,
      student_answer: null,
      is_correct: null,
      time_spent_seconds: null,
    });

  if (attemptError) {
    console.error(`[bulk-start] attempt insert failed for student ${student_id}:`, attemptError);

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

  // 6. Success
  return {
    ok: true,
    student_id,
    session_id,
    join_code: session.join_code,
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

  // ── 4. Parse + validate body ─────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    classroom_id,
    teks_standard,
    question_type,
    testing_window,
    expires_in_hours,
  } = body;

  if (!classroom_id || !teks_standard || !question_type) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: classroom_id, teks_standard, question_type.",
      },
      { status: 400 }
    );
  }

  const validQuestionTypes = [
    "multiple_choice",
    "multi_select",
    "constructed_response",
    "hot_text",
    "hotspot",
    "drag_and_drop",
    "inline_choice",
    "match_table",
    "order",
    "griddable",
  ];

  if (!validQuestionTypes.includes(question_type)) {
    return NextResponse.json(
      { error: `Invalid question_type: ${question_type}.` },
      { status: 400 }
    );
  }

  const validWindows = ["BOY", "MOY", "EOY"];
  if (testing_window && !validWindows.includes(testing_window)) {
    return NextResponse.json(
      { error: `Invalid testing_window. Must be BOY, MOY, or EOY.` },
      { status: 400 }
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
      { status: 404 }
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
      { status: 500 }
    );
  }

  if (!students || students.length === 0) {
    return NextResponse.json(
      { error: "No active students found in this classroom." },
      { status: 404 }
    );
  }

  // ── 7. Create sessions in parallel — never abort on single failure ────────
  const results = await Promise.allSettled(
    students.map((student) =>
      startStudentSession({
        student,
        classroom,
        teacher_id: user.id,
        teks_standard,
        question_type,
        testing_window,
        expires_in_hours,
        serviceSupabase,
      })
    )
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
    { status: 201 }
  );
}