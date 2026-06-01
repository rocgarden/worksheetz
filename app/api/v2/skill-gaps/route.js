// /app/api/v2/skill-gaps/route.js
// Branch: v2/student-success-platform
//
// GET /api/v2/skill-gaps?student_id=xxx
//
// Returns all skill_gaps rows for a student ordered by correct_count ASC
// so the weakest areas (fewest correct) surface first.
// Verifies the student's classroom belongs to the authenticated teacher.

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { NextResponse } from "next/server";


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
  // ── 1. Feature flag guard - can be removed once we confirm no old code paths reference this route


  // ── 2. Auth check ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const serviceSupabase = await createV2ServiceClient();
  
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
    .select("id, name")
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

  // ── 7. Fetch all skill_gaps for this student ─────────────────────────────
  // Order by correct_count ASC — weakest areas (fewest correct) first.
  // Secondary sort by attempts_count DESC so well-tested gaps rank before
  // gaps with very few data points at the same correct_count.
  const { data: skillGaps, error: skillGapsError } = await serviceSupabase
    .from("skill_gaps")
    .select(
      "id, teks_standard, subject, dok_level_struggling, attempts_count, correct_count, last_assessed, updated_at"
    )
    .eq("student_id", student_id)
    .order("correct_count", { ascending: true })
    .order("attempts_count", { ascending: false });

  if (skillGapsError) {
    console.error("[skill-gaps/GET] fetch error:", skillGapsError);
    return NextResponse.json(
      { error: "Failed to fetch skill gaps." },
      { status: 500 }
    );
  }

  // ── 8. Annotate each gap with accuracy and mastery status ────────────────
  const MASTERY_THRESHOLD = 0.6;

  const annotated = (skillGaps ?? []).map((gap) => {
    const accuracy =
      gap.attempts_count > 0
        ? Math.round((gap.correct_count / gap.attempts_count) * 100)
        : 0;

    const is_mastered =
      gap.dok_level_struggling === null && accuracy >= MASTERY_THRESHOLD * 100;

    return {
      id: gap.id,
      teks_standard: gap.teks_standard,
      subject: gap.subject,
      dok_level_struggling: gap.dok_level_struggling,
      attempts_count: gap.attempts_count,
      correct_count: gap.correct_count,
      accuracy,
      is_mastered,
      last_assessed: gap.last_assessed,
      updated_at: gap.updated_at,
    };
  });

  // ── 9. Return skill gaps ─────────────────────────────────────────────────
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
      total_standards_tracked: annotated.length,
      mastered_count: annotated.filter((g) => g.is_mastered).length,
      struggling_count: annotated.filter((g) => !g.is_mastered).length,
      skill_gaps: annotated,
    },
    { status: 200 }
  );
}