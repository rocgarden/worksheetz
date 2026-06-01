// /app/api/v2/progress/route.js
// Branch: v2/student-success-platform
//
// GET /api/v2/progress?student_id=xxx
//
// Returns all question_attempts for a student across all sessions,
// grouped by teks_standard + dok_level with correct/attempt counts.
// Also returns session history from adaptive_sessions.
// Verifies the student's classroom belongs to the authenticated teacher.

import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

function planGuard(profile) {
  const hasAccess =
    profile.classroom_plan === true || profile.school_plan === true;
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Classroom plan required.", upgrade: true },
      { status: 403 }
    );
  }
  return null;
}

export async function GET(req) {
  // ── 1. Feature flag guard - can be enabled later once we have auth and plans working end-to-end.
  

  // ── 2. Auth check ────────────────────────────────────────────────────────
  const supabase = await createClient();
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) {
  //   return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  // }
  //const user = { id: "e1a3fef9-ae21-478a-bc7a-e41f8df3d5e0" };
  const serviceSupabase = await createV2ServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  // ── 3. Plan access check ─────────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
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

  const planErr = planGuard(profile);
  if (planErr) return planErr;

  // ── 4. Validate query param ──────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const student_id = searchParams.get("student_id");

  if (!student_id) {
    return NextResponse.json(
      { error: "Missing required query param: student_id." },
      { status: 400 }
    );
  }

  // ── 5. Verify student exists and belongs to a classroom owned by this teacher
  const { data: student, error: studentError } = await serviceSupabase
    .from("students")
    .select("id, first_name, last_name, student_code, classroom_id, grade_level")
    .eq("id", student_id)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .single();

  if (studentError || !student) {
    return NextResponse.json(
      { error: "Student not found or access denied." },
      { status: 404 }
    );
  }

  // ── 6. Verify classroom belongs to this teacher ──────────────────────────
  const { data: classroom, error: classroomError } = await serviceSupabase
    .from("classrooms")
    .select("id, name, grade_level, subject")
    .eq("id", student.classroom_id)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .single();

  if (classroomError || !classroom) {
    return NextResponse.json(
      { error: "Classroom not found or access denied." },
      { status: 404 }
    );
  }

  // ── 7. Fetch all answered question_attempts for this student ─────────────
  // Only answered attempts (student_answer not null) are included in
  // performance aggregation. Unanswered rows are in-flight questions.
  const { data: attempts, error: attemptsError } = await serviceSupabase
    .from("question_attempts")
    .select(
      "id, session_id, teks_standard, dok_level, question_type, is_correct, time_spent_seconds, created_at"
    )
    .eq("student_id", student_id)
    .not("student_answer", "is", null)
    .order("created_at", { ascending: true });

  if (attemptsError) {
    console.error("[progress/GET] attempts fetch error:", attemptsError);
    return NextResponse.json(
      { error: "Failed to fetch student attempts." },
      { status: 500 }
    );
  }

  // ── 8. Fetch session history for this student ────────────────────────────
  const { data: sessions, error: sessionsError } = await serviceSupabase
    .from("adaptive_sessions")
    .select(
      "id, teks_standard, subject, grade_level, testing_window, status, started_at, completed_at"
    )
    .eq("student_id", student_id)
    .eq("teacher_id", user.id)
    .order("started_at", { ascending: false });

  if (sessionsError) {
    console.error("[progress/GET] sessions fetch error:", sessionsError);
    return NextResponse.json(
      { error: "Failed to fetch session history." },
      { status: 500 }
    );
  }

  // ── 9. Group attempts by teks_standard → dok_level ──────────────────────
  // Structure: { [teks]: { [dok]: { correct, total, question_types: Set } } }
  const grouped = {};

  for (const attempt of attempts ?? []) {
    const teks = attempt.teks_standard;
    const dok = attempt.dok_level;

    if (!grouped[teks]) {
      grouped[teks] = {};
    }
    if (!grouped[teks][dok]) {
      grouped[teks][dok] = { correct: 0, total: 0, question_types: new Set() };
    }

    grouped[teks][dok].total += 1;
    if (attempt.is_correct === true) {
      grouped[teks][dok].correct += 1;
    }
    if (attempt.question_type) {
      grouped[teks][dok].question_types.add(attempt.question_type);
    }
  }

  // Serialize into response shape — Sets → arrays, add accuracy
  const performance_by_standard = Object.entries(grouped).map(
    ([teks_standard, dokMap]) => {
      const by_dok = Object.entries(dokMap).map(([dok, data]) => ({
        dok_level: Number(dok),
        attempts_count: data.total,
        correct_count: data.correct,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        question_types: [...data.question_types],
      }));

      // Roll up totals across all DOK levels for this standard
      const totalAttempts = by_dok.reduce((sum, d) => sum + d.attempts_count, 0);
      const totalCorrect = by_dok.reduce((sum, d) => sum + d.correct_count, 0);

      return {
        teks_standard,
        attempts_count: totalAttempts,
        correct_count: totalCorrect,
        accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
        by_dok,
      };
    }
  );

  // ── 10. Return assembled progress data ───────────────────────────────────
  return NextResponse.json(
    {
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_code: student.student_code,
        grade_level: student.grade_level,
        classroom_id: student.classroom_id,
        classroom_name: classroom.name,
      },
      total_attempts: attempts?.length ?? 0,
      performance_by_standard,
      session_history: (sessions ?? []).map((s) => ({
        session_id: s.id,
        teks_standard: s.teks_standard,
        subject: s.subject,
        grade_level: s.grade_level,
        testing_window: s.testing_window,
        status: s.status,
        started_at: s.started_at,
        completed_at: s.completed_at,
      })),
    },
    { status: 200 }
  );
}