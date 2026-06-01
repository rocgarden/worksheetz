// /app/api/v2/portfolio/route.js
// Branch: v2/student-success-platform
//
// GET /api/v2/portfolio?student_id=xxx&classroom_id=xxx
//
// Returns the portfolio row for a student + classroom combination.
// Includes boy_score, moy_score, eoy_score, growth_percentage,
// teks_mastered, and teks_struggling.
// Verifies the classroom belongs to the authenticated teacher.

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
  // ── 1. Feature flag guard - can be enabled later once we have auth and plans working end-to-end ───────


  // ── 2. Auth check ────────────────────────────────────────────────────────
  const supabase = await createClient();
 
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

  // ── 4. Validate query params ─────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const student_id = searchParams.get("student_id");
  const classroom_id = searchParams.get("classroom_id");

  if (!student_id || !classroom_id) {
    return NextResponse.json(
      { error: "Missing required query params: student_id, classroom_id." },
      { status: 400 }
    );
  }

  // ── 5. Verify classroom belongs to this teacher ──────────────────────────
  const { data: classroom, error: classroomError } = await serviceSupabase
    .from("classrooms")
    .select("id, name, grade_level, subject, school_year")
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

  // ── 6. Verify student belongs to this classroom and teacher ─────────────
  const { data: student, error: studentError } = await serviceSupabase
    .from("students")
    .select("id, first_name, last_name, student_code, grade_level")
    .eq("id", student_id)
    .eq("classroom_id", classroom_id)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .single();

  if (studentError || !student) {
    return NextResponse.json(
      { error: "Student not found or access denied." },
      { status: 404 }
    );
  }

  // ── 7. Fetch portfolio row ───────────────────────────────────────────────
  // maybeSingle — portfolio may not exist yet if no session has been completed.
  const { data: portfolio, error: portfolioError } = await serviceSupabase
    .from("portfolios")
    .select(
      "id, school_year, boy_score, moy_score, eoy_score, growth_percentage, teks_mastered, teks_struggling, last_updated"
    )
    .eq("student_id", student_id)
    .eq("classroom_id", classroom_id)
    .maybeSingle();

  if (portfolioError) {
    console.error("[portfolio/GET] portfolio fetch error:", portfolioError);
    return NextResponse.json(
      { error: "Failed to fetch portfolio." },
      { status: 500 }
    );
  }

  // ── 8. Return portfolio — null values are valid (no data yet for window) ─
  return NextResponse.json(
    {
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_code: student.student_code,
        grade_level: student.grade_level,
      },
      classroom: {
        id: classroom.id,
        name: classroom.name,
        grade_level: classroom.grade_level,
        subject: classroom.subject,
        school_year: classroom.school_year,
      },
      portfolio: portfolio
        ? {
            id: portfolio.id,
            school_year: portfolio.school_year,
            boy_score: portfolio.boy_score ?? null,
            moy_score: portfolio.moy_score ?? null,
            eoy_score: portfolio.eoy_score ?? null,
            growth_percentage: portfolio.growth_percentage ?? null,
            teks_mastered: portfolio.teks_mastered ?? [],
            teks_struggling: portfolio.teks_struggling ?? [],
            last_updated: portfolio.last_updated,
          }
        : null, // No sessions completed yet for this student + classroom
    },
    { status: 200 }
  );
}