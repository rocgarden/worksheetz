// /app/api/v2/classrooms/route.js
// Branch: v2/student-success-platform
//
// POST /api/v2/classrooms  — Create a new classroom for the teacher.
// GET  /api/v2/classrooms  — List all classrooms owned by the teacher,
//                            with student count per classroom.

import { createV2Client } from "@/libs/supabase/server-v2";
import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { NextResponse } from "next/server";

// ── Shared helpers ───────────────────────────────────────────────────────────


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

// ── POST /api/v2/classrooms ──────────────────────────────────────────────────
// Creates a new classroom row owned by the authenticated teacher.
// Enforces max_classrooms limit from profiles.
// testing_window is REQUIRED — a classroom with no window silently breaks
// portfolio scoring in completeSession.js (boy/moy/eoy_score never gets written).
 
export async function POST(req) {
  // 1. Feature flag -- can be enabled later once we have auth and plans working end-to-end.
 
 
  // 2. Auth
  const supabase = await createClient();
  const serviceSupabase = await createV2ServiceClient();
 
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
 
  console.log("Authenticated user ID:", user.id);
 
  // 3. Plan access check
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("classroom_plan, school_plan, max_classrooms")
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
 
  // 4. Parse and validate body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
 
  const { name, grade_level, subject, school_year, testing_window } = body;
 
  if (!name || !grade_level || !subject || !school_year) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: name, grade_level, subject, school_year.",
      },
      { status: 400 }
    );
  }
 
  // Normalize testing_window — treat empty string / whitespace-only as missing.
  // ("" is falsy but !== null, so `testing_window ?? null` alone would let it
  // slip through and silently break portfolio scoring downstream.)
  const normalizedWindow =
    typeof testing_window === "string" ? testing_window.trim() : testing_window;
 
  const validWindows = ["BOY", "MOY", "EOY"];
 
  // testing_window is now REQUIRED at classroom creation.
  if (!normalizedWindow) {
    return NextResponse.json(
      { error: "testing_window is required and must be BOY, MOY, or EOY." },
      { status: 400 }
    );
  }
 
  if (!validWindows.includes(normalizedWindow)) {
    return NextResponse.json(
      { error: "testing_window must be BOY, MOY, or EOY." },
      { status: 400 }
    );
  }
 
  // 5. Enforce max_classrooms limit
  const { count: existingCount, error: countError } = await serviceSupabase
    .from("classrooms")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", user.id);
 
  if (countError) {
    console.error("[classrooms/POST] count error:", countError);
    return NextResponse.json(
      { error: "Failed to verify classroom limit." },
      { status: 500 }
    );
  }
 
  const maxClassrooms = profile.max_classrooms ?? 1;
  if (existingCount >= maxClassrooms) {
    return NextResponse.json(
      {
        error: `Classroom limit reached (${maxClassrooms}). Upgrade to School Plan for unlimited classrooms.`,
        upgrade: true,
      },
      { status: 403 }
    );
  }
 
  // 6. Insert classroom
  const { data: classroom, error: insertError } = await serviceSupabase
    .from("classrooms")
    .insert({
      teacher_id: user.id,
      name: name.trim(),
      grade_level,
      subject,
      school_year,
      testing_window: normalizedWindow,
    })
    .select("id, name, grade_level, subject, school_year, testing_window, created_at")
    .single();
 
  if (insertError || !classroom) {
    console.error("[classrooms/POST] insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to create classroom." },
      { status: 500 }
    );
  }
 
  return NextResponse.json({ classroom }, { status: 201 });
}

// ── GET /api/v2/classrooms ───────────────────────────────────────────────────
// Returns all classrooms for this teacher with a student_count per classroom.

export async function GET(req) {
  // 1. Feature flag
 

  // 2. Auth
  const supabase = await createClient();
  const serviceSupabase = await createV2ServiceClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 3. Plan access check
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

  const planErr = planGuard(profile);
  if (planErr) return planErr;

  // 4. Fetch all classrooms for this teacher
  // Uses Supabase embedded count to get student_count in one query.
  const { data: classrooms, error: fetchError } = await serviceSupabase
    .from("classrooms")
    .select(
      `id,
       name,
       grade_level,
       subject,
       school_year,
       testing_window,
       created_at,
       updated_at,
       students(count),
       deleted_at`
    )
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (fetchError) {
    console.error("[classrooms/GET] fetch error:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch classrooms." },
      { status: 500 }
    );
  }

  // Flatten the students count from Supabase embedded aggregate format
  // [{ students: [{ count: N }] }] → [{ ..., student_count: N }]
  const formatted = (classrooms ?? []).map(({ students, ...rest }) => ({
    ...rest,
    student_count: students?.[0]?.count ?? 0,
  }));

  return NextResponse.json({ classrooms: formatted }, { status: 200 });
}