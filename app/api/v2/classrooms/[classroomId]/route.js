// /app/api/v2/classrooms/[classroomId]/route.js
// Branch: v2/student-success-platform
//
// GET    /api/v2/classrooms/[classroomId]  — Fetch single classroom + student count
// PATCH  /api/v2/classrooms/[classroomId]  — Update name, subject, grade_level, testing_window
// DELETE /api/v2/classrooms/[classroomId]  — Soft delete with cascade check

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

async function getAuthAndProfile(supabase) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("classroom_plan, school_plan")
    .eq("id", user.id)
    .single();

  return { user, profile: profileError ? null : profile };
}

// ── GET /api/v2/classrooms/[classroomId] ────────────────────────────────────
// Returns a single classroom with student list and active session count.

export async function GET(req, { params }) {
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

  // 3. Validate route param
  const { classroomId } = await params;
  if (!classroomId) {
    return NextResponse.json(
      { error: "Missing classroomId in route." },
      { status: 400 }
    );
  }

  // 4. Fetch classroom — must belong to this teacher
  const { data: classroom, error: classroomError } = await serviceSupabase
    .from("classrooms")
    .select(
      `id,
       name,
       grade_level,
       subject,
       school_year,
       testing_window,
       created_at,
       updated_at`
    )
    .eq("id", classroomId)
    .eq("teacher_id", user.id)
    .single();

  if (classroomError || !classroom) {
    return NextResponse.json(
      { error: "Classroom not found or access denied." },
      { status: 404 }
    );
  }

  // 5. Fetch students for this classroom
  const { data: students, error: studentsError } = await serviceSupabase
    .from("students")
    .select("id, first_name, last_name, student_code, grade_level, created_at")
    .eq("classroom_id", classroomId)
    .eq("teacher_id", user.id)
    .order("last_name", { ascending: true });

  if (studentsError) {
    console.error("[classrooms/GET/:id] students fetch error:", studentsError);
    return NextResponse.json(
      { error: "Failed to fetch students for classroom." },
      { status: 500 }
    );
  }

  // 6. Count active (in_progress) sessions for this classroom
  const { count: activeSessionCount, error: sessionCountError } =
    await serviceSupabase
      .from("adaptive_sessions")
      .select("id", { count: "exact", head: true })
      .eq("classroom_id", classroomId)
      .eq("status", "in_progress");

  if (sessionCountError) {
    console.error(
      "[classrooms/GET/:id] session count error:",
      sessionCountError
    );
    // Non-fatal — return 0
  }

  return NextResponse.json(
    {
      classroom: {
        ...classroom,
        student_count: students?.length ?? 0,
        active_sessions: activeSessionCount ?? 0,
        students: students ?? [],
      },
    },
    { status: 200 }
  );
}

// ── PATCH /api/v2/classrooms/[classroomId] ───────────────────────────────────
// Allows updating: name, subject, grade_level, testing_window.
// school_year is intentionally not patchable — it's set at creation.
// teacher_id is never patchable.

export async function PATCH(req, { params }) {
  // 1. Feature flag --- can be enabled later once we have auth and plans working end-to-end.

  // 2. Auth + plan
  const supabase = await createClient();
  const serviceSupabase =  createV2ServiceClient();
  const { user, profile } = await getAuthAndProfile(supabase);

  if (!profile) {
    return NextResponse.json(
      { error: "Could not retrieve user profile." },
      { status: 500 }
    );
  }

  const planErr = planGuard(profile);
  if (planErr) return planErr;

  // 3. Validate route param
  const { classroomId } = await params;
  if (!classroomId) {
    return NextResponse.json(
      { error: "Missing classroomId in route." },
      { status: 400 }
    );
  }

  // 4. Parse body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  // 5. Build update payload — only allow specific fields
  const allowedFields = ["name", "subject", "grade_level", "testing_window"];
  const updatePayload = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updatePayload[field] = body[field];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      {
        error:
          "No valid fields to update. Allowed: name, subject, grade_level, testing_window.",
      },
      { status: 400 }
    );
  }

  // Validate testing_window if provided
  const validWindows = ["BOY", "MOY", "EOY"];
  if (
    updatePayload.testing_window &&
    !validWindows.includes(updatePayload.testing_window)
  ) {
    return NextResponse.json(
      { error: "testing_window must be BOY, MOY, or EOY." },
      { status: 400 }
    );
  }

  // Trim name if provided
  if (updatePayload.name) {
    updatePayload.name = updatePayload.name.trim();
    if (!updatePayload.name) {
      return NextResponse.json(
        { error: "name cannot be empty." },
        { status: 400 }
      );
    }
  }

  updatePayload.updated_at = new Date().toISOString();

  // 6. Verify classroom belongs to this teacher, then update
  const { data: updated, error: updateError } = await serviceSupabase
    .from("classrooms")
    .update(updatePayload)
    .eq("id", classroomId)
    .eq("teacher_id", user.id)
    .select(
      "id, name, grade_level, subject, school_year, testing_window, created_at, updated_at"
    )
    .single();

  if (updateError || !updated) {
    // If no rows matched, the classroom doesn't exist or doesn't belong to teacher
    if (updateError?.code === "PGRST116" || !updated) {
      return NextResponse.json(
        { error: "Classroom not found or access denied." },
        { status: 404 }
      );
    }
    console.error("[classrooms/PATCH] update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update classroom." },
      { status: 500 }
    );
  }

  return NextResponse.json({ classroom: updated }, { status: 200 });
}

// ── DELETE /api/v2/classrooms/[classroomId] ──────────────────────────────────
// Soft delete — marks classroom as deleted rather than hard removing.
// Blocks delete if there are in_progress adaptive sessions (cascade check).
// Students and completed sessions are preserved for historical records.
//
// Soft delete pattern: adds deleted_at timestamptz to classrooms table.
// All GET queries filter WHERE deleted_at IS NULL.
// (Run: ALTER TABLE classrooms ADD COLUMN deleted_at timestamptz;)

export async function DELETE(req, { params }) {
  // 1. Feature flag --- can be enabled later once we have auth and plans working end-to-end.
 

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

  // 3. Validate route param
  const { classroomId } = await params;
  if (!classroomId) {
    return NextResponse.json(
      { error: "Missing classroomId in route." },
      { status: 400 }
    );
  }

  // 4. Confirm classroom exists and belongs to this teacher
  const { data: classroom, error: classroomError } = await serviceSupabase
    .from("classrooms")
    .select("id, name, deleted_at")
    .eq("id", classroomId)
    .eq("teacher_id", user.id)
    .single();

  if (classroomError || !classroom) {
    return NextResponse.json(
      { error: "Classroom not found or access denied." },
      { status: 404 }
    );
  }

  // Guard: already deleted
  if (classroom.deleted_at !== null) {
    return NextResponse.json(
      { error: "Classroom is already deleted." },
      { status: 409 }
    );
  }

  // 5. Cascade check — block if active sessions exist
  const { count: activeSessions, error: activeError } = await serviceSupabase
    .from("adaptive_sessions")
    .select("id", { count: "exact", head: true })
    .eq("classroom_id", classroomId)
    .eq("status", "in_progress");

  if (activeError) {
    console.error("[classrooms/DELETE] active session check error:", activeError);
    return NextResponse.json(
      { error: "Failed to verify active sessions." },
      { status: 500 }
    );
  }

  if (activeSessions > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete classroom with ${activeSessions} active session(s). Complete or abandon them first.`,
        active_sessions: activeSessions,
      },
      { status: 409 }
    );
  }

  // 6. Soft delete — stamp deleted_at
  const deletedAt = new Date().toISOString();
  const { error: deleteError } = await serviceSupabase
    .from("classrooms")
    .update({ deleted_at: deletedAt, updated_at: deletedAt })
    .eq("id", classroomId)
    .eq("teacher_id", user.id);

  if (deleteError) {
    console.error("[classrooms/DELETE] delete error:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete classroom." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      deleted: true,
      classroom_id: classroomId,
      deleted_at: deletedAt,
      message: `Classroom "${classroom.name}" has been deleted. Student records are preserved.`,
    },
    { status: 200 }
  );
}