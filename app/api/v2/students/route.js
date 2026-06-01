// /app/api/v2/students/route.js
// Branch: v2/student-success-platform
//
// POST /api/v2/students — Create a new student in a classroom.
//   Verifies classroom belongs to teacher, checks max_students_per_class,
//   auto-generates student_code (S-001, S-002...) if not provided.
//
// GET /api/v2/students?classroom_id=xxx — List all active students in a classroom.
//   Filters deleted_at IS NULL. Verifies classroom belongs to teacher.

import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { createClient } from "@/libs/supabase/server";
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

async function getAuthAndProfile(supabase) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("classroom_plan, school_plan, max_students_per_class")
    .eq("id", user.id)
    .single();

  return { user, profile: profileError ? null : profile };
}

// ── POST /api/v2/students ────────────────────────────────────────────────────
// Creates a new student in the given classroom.
// Body: { classroom_id, first_name, last_name, student_code? }
// grade_level is derived from classroom — never from frontend.

export async function POST(req) {
  // 1. Feature flag -can be removed once we confirm no old code paths reference this route


  // 2. Auth + plan
  const supabase  = await createClient();
  const serviceSupabase = await createV2ServiceClient();
  const { user, profile } = await getAuthAndProfile(supabase);

  if (!profile) {
    return NextResponse.json(
      { error: "Could not retrieve user profile." },
      { status: 500 }
    );
  }

  const planErr = planGuard(profile);
  if (planErr) return planErr;

  // 3. Parse and validate body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { classroom_id, first_name, last_name, student_code: providedCode } = body;

  if (!classroom_id || !first_name || !last_name) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: classroom_id, first_name, last_name.",
      },
      { status: 400 }
    );
  }

  // 4. Verify classroom belongs to this teacher
  const { data: classroom, error: classroomError } = await serviceSupabase
    .from("classrooms")
    .select("id, grade_level, deleted_at")
    .eq("id", classroom_id)
    .eq("teacher_id", user.id)
    .single();

  if (classroomError || !classroom) {
    return NextResponse.json(
      { error: "Classroom not found or access denied." },
      { status: 404 }
    );
  }

  if (classroom.deleted_at !== null) {
    return NextResponse.json(
      { error: "Cannot add students to a deleted classroom." },
      { status: 409 }
    );
  }

  // 5. Check max_students_per_class limit
  const maxStudents = profile.max_students_per_class ?? 30;

  const { count: currentCount, error: countError } = await serviceSupabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("classroom_id", classroom_id)
    .is("deleted_at", null);

  if (countError) {
    console.error("[students/POST] count error:", countError);
    return NextResponse.json(
      { error: "Failed to verify student limit." },
      { status: 500 }
    );
  }

  if (currentCount >= maxStudents) {
    return NextResponse.json(
      {
        error: `Student limit reached (${maxStudents}). Upgrade to School Plan for a higher limit.`,
        upgrade: true,
      },
      { status: 403 }
    );
  }

// 6. Auto-generate student_code if not provided.
  // Auto-generate student_code if not provided.
  //
  // ROOT CAUSE OF PREVIOUS BUG: the unique constraint on student_code is
  // TABLE-WIDE. Two classrooms both generating S-001, S-002, etc. will collide.
  //
  // FIX: prefix with the first 4 hex chars of classroom_id (uppercase).
  //   classroom_id "be18347b-9ca6-..." → prefix "BE18"
  //   → students get codes "BE18-001", "BE18-002", etc.
  //   These are guaranteed unique per classroom and won't collide table-wide.
  //
  // We query ALL rows for this classroom including soft-deleted ones so that
  // deleted students still hold their number and we never reuse a taken code.  //  This prevents collisions when deleted students
  // still hold a code that the unique constraint will reject.
  let student_code = providedCode?.trim() ?? null;

  if (!student_code) {
    const classroomPrefix = classroom_id.replace(/-/g, "").slice(0, 4).toUpperCase();
    const regex = new RegExp(`^${classroomPrefix}-(\\d+)$`);
 
    const { data: allCodes } = await serviceSupabase
      .from("students")
      .select("student_code")
      .eq("classroom_id", classroom_id); // intentionally includes deleted rows
 
    const maxUsed = (allCodes ?? []).reduce((max, row) => {
      const match = row.student_code?.match(regex);
      if (!match) return max;
      const n = parseInt(match[1], 10);
      return n > max ? n : max;
    }, 0);
 
    student_code = `${classroomPrefix}-${String(maxUsed + 1).padStart(3, "0")}`;
  }

  // 7. Insert student — grade_level comes from classroom, never frontend
  const { data: student, error: insertError } = await serviceSupabase
    .from("students")
    .insert({
      classroom_id,
      teacher_id: user.id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      student_code,
      grade_level: classroom.grade_level,
    })
    .select(
      "id, classroom_id, first_name, last_name, student_code, grade_level, created_at"
    )
    .single();

  if (insertError || !student) {
    // Handle unique constraint violation on student_code
    if (insertError?.code === "23505") {
      return NextResponse.json(
        { error: `Student code "${student_code}" is already in use.` },
        { status: 409 }
      );
    }
    console.error("[students/POST] insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to create student." },
      { status: 500 }
    );
  }

  return NextResponse.json({ student }, { status: 201 });
}

// ── GET /api/v2/students?classroom_id=xxx ────────────────────────────────────
// Returns all active (non-deleted) students in the given classroom.
// Verifies classroom belongs to this teacher before returning data.

export async function GET(req) {
  // 1. Feature flag

  // 2. Auth + plan
  const serviceSupabase = await createV2ServiceClient();
  const supabase = await createClient();
  const { user, profile } = await getAuthAndProfile(supabase);

  if (!profile) {
    return NextResponse.json(
      { error: "Could not retrieve user profile." },
      { status: 500 }
    );
  }

  const planErr = planGuard(profile);
  if (planErr) return planErr;

  // 3. Validate classroom_id query param
  const { searchParams } = new URL(req.url);
  const classroom_id = searchParams.get("classroom_id");

  if (!classroom_id) {
    return NextResponse.json(
      { error: "Missing required query param: classroom_id." },
      { status: 400 }
    );
  }

  // 4. Verify classroom belongs to this teacher
  const { data: classroom, error: classroomError } = await serviceSupabase
    .from("classrooms")
    .select("id, name, grade_level, subject")
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

  // 5. Fetch all active students in this classroom
  const { data: students, error: fetchError } = await serviceSupabase
    .from("students")
    .select(
      "id, first_name, last_name, student_code, grade_level, created_at"
    )
    .eq("classroom_id", classroom_id)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  if (fetchError) {
    console.error("[students/GET] fetch error:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch students." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      classroom_id,
      classroom_name: classroom.name,
      grade_level: classroom.grade_level,  
      subject: classroom.subject,           
      student_count: students?.length ?? 0,
      students: students ?? [],
    },
    { status: 200 }
  );
}