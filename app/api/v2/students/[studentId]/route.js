// /app/api/v2/students/[studentId]/route.js
// Branch: v2/student-success-platform
//
// PATCH  /api/v2/students/[studentId] — Update first_name, last_name, student_code only.
// DELETE /api/v2/students/[studentId] — Soft delete, stamps deleted_at.
//
// Both routes verify the student's classroom belongs to the
// authenticated teacher before touching any data.

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
  // Temp hardcoded user — swap for real auth once NEXT_PUBLIC_V2_ENABLED=true in prod
 // const user = { id: "e1a3fef9-ae21-478a-bc7a-e41f8df3d5e0" };
//const supabase = await createClient();
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) return { user: null, profile: null };
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

// ── PATCH /api/v2/students/[studentId] ──────────────────────────────────────
// Allows updating: first_name, last_name, student_code only.
// grade_level is never patchable — it comes from the classroom.
// teacher_id and classroom_id are never patchable.

export async function PATCH(req, { params }) {
  // 1. Feature flag

  // 2. Auth + plan
  const serviceSupabase = createV2ServiceClient();
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
  const { studentId } = await params;
  if (!studentId) {
    return NextResponse.json(
      { error: "Missing studentId in route." },
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

  // 5. Build update payload — only first_name, last_name, student_code allowed
  const allowedFields = ["first_name", "last_name", "student_code"];
  const updatePayload = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updatePayload[field] = typeof body[field] === "string"
        ? body[field].trim()
        : body[field];
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      {
        error:
          "No valid fields to update. Allowed: first_name, last_name, student_code.",
      },
      { status: 400 }
    );
  }

  // Validate non-empty strings
  for (const field of ["first_name", "last_name", "student_code"]) {
    if (updatePayload[field] !== undefined && !updatePayload[field]) {
      return NextResponse.json(
        { error: `${field} cannot be empty.` },
        { status: 400 }
      );
    }
  }

  // 6. Verify student belongs to this teacher, then update
  // teacher_id check on the student row is sufficient — no need for a
  // separate classroom lookup on PATCH since teacher_id was set on creation.
  const { data: updated, error: updateError } = await serviceSupabase
    .from("students")
    .update(updatePayload)
    .eq("id", studentId)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .select(
      "id, classroom_id, first_name, last_name, student_code, grade_level, created_at"
    )
    .single();

  if (updateError || !updated) {
    // Unique constraint on student_code
    if (updateError?.code === "23505") {
      return NextResponse.json(
        {
          error: `Student code "${updatePayload.student_code}" is already in use.`,
        },
        { status: 409 }
      );
    }
    if (updateError?.code === "PGRST116" || !updated) {
      return NextResponse.json(
        { error: "Student not found or access denied." },
        { status: 404 }
      );
    }
    console.error("[students/PATCH] update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update student." },
      { status: 500 }
    );
  }

  return NextResponse.json({ student: updated }, { status: 200 });
}

// ── DELETE /api/v2/students/[studentId] ─────────────────────────────────────
// Soft delete — stamps deleted_at rather than removing the row.
// Completed session data and skill_gaps are preserved for historical records.
// Blocks delete if the student has an in_progress adaptive session.

export async function DELETE(req, { params }) {
  // 1. Feature flag -can be removed once we confirm no old code paths reference this route
 

  // 2. Auth + plan
  const supabase = await createClient();
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

  // 3. Validate route param
  const { studentId } = await params;
  if (!studentId) {
    return NextResponse.json(
      { error: "Missing studentId in route." },
      { status: 400 }
    );
  }

  // 4. Confirm student exists and belongs to this teacher
  const { data: student, error: studentError } = await serviceSupabase
    .from("students")
    .select("id, first_name, last_name, classroom_id, deleted_at")
    .eq("id", studentId)
    .eq("teacher_id", user.id)
    .single();

  if (studentError || !student) {
    return NextResponse.json(
      { error: "Student not found or access denied." },
      { status: 404 }
    );
  }

  // Guard: already deleted
  if (student.deleted_at !== null) {
    return NextResponse.json(
      { error: "Student is already deleted." },
      { status: 409 }
    );
  }

  // 5. Cascade check — block if student has an in_progress session
  const { count: activeSessions, error: activeError } = await serviceSupabase
    .from("adaptive_sessions")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("status", "in_progress");

  if (activeError) {
    console.error("[students/DELETE] active session check error:", activeError);
    return NextResponse.json(
      { error: "Failed to verify active sessions." },
      { status: 500 }
    );
  }

  if (activeSessions > 0) {
    return NextResponse.json(
      {
        error: `Cannot remove student with ${activeSessions} active session(s). Complete or abandon them first.`,
        active_sessions: activeSessions,
      },
      { status: 409 }
    );
  }

  // 6. Soft delete — stamp deleted_at
  const deletedAt = new Date().toISOString();
  const { error: deleteError } = await serviceSupabase
    .from("students")
    .update({ deleted_at: deletedAt })
    .eq("id", studentId)
    .eq("teacher_id", user.id);

  if (deleteError) {
    console.error("[students/DELETE] delete error:", deleteError);
    return NextResponse.json(
      { error: "Failed to remove student." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      deleted: true,
      student_id: studentId,
      deleted_at: deletedAt,
      message: `Student "${student.first_name} ${student.last_name}" has been removed. Session history is preserved.`,
    },
    { status: 200 }
  );
}