// /app/api/v2/students/bulk/route.js
// Branch: v2/student-success-platform
//
// POST /api/v2/students/bulk
// Receives classroom_id + array of student objects, validates, auto-generates
// student_codes where missing, and batch inserts into the students table.
//
// Request body:
//   { classroom_id: string, students: Array<{ first_name, last_name, student_code? }> }
//
// Response (200):
//   { created: number, students: Array<student row> }
//
// Response (207 Multi-Status) when some rows failed validation:
//   { created: number, students: Array<student row>, failed: Array<{ row, reason }> }
//
// Response (4xx) for auth / plan / classroom / limit failures.

import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";           // production auth
import { createV2ServiceClient } from "@/libs/supabase/server-v2"; // v2-dev data

// ── Feature flag guard ───────────────────────────────────────────────────────
// function featureGuard() {
//   if (process.env.NEXT_PUBLIC_V2_ENABLED !== "true") {
//     return NextResponse.json(
//       { error: "V2 features are not enabled." },
//       { status: 403 }
//     );
//   }
//   return null;
// }

// ── Classroom-scoped prefix for student codes ────────────────────────────────
// Takes the first 4 uppercase hex chars of classroom_id (e.g. "BE18").
// This guarantees codes are unique table-wide even across classrooms.
function classroomPrefix(classroomId) {
  return classroomId.replace(/-/g, "").slice(0, 4).toUpperCase();
}

// ── Format a zero-padded student code number ─────────────────────────────────
function formatCode(prefix, n) {
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

export async function POST(req) {
  // 1. Feature flag
//   const flagErr = featureGuard();
//   if (flagErr) return flagErr;

  // 2. Auth — production Supabase client for user identity
  const supabase = await createClient();
  const serviceSupabase = await createV2ServiceClient();

  // TODO: remove hardcoded bypass and uncomment below before merging to main
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  //const user = { id: "e1a3fef9-ae21-478a-bc7a-e41f8df3d5e0" };

  // 3. Plan access check
  const { data: profile, error: profileError } = await serviceSupabase
    .from("profiles")
    .select("classroom_plan, school_plan, max_students_per_class")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Could not retrieve user profile." },
      { status: 500 }
    );
  }

  const hasAccess =
    profile.classroom_plan === true || profile.school_plan === true;
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Classroom plan required.", upgrade: true },
      { status: 403 }
    );
  }

  // 4. Parse body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { classroom_id, students: rawStudents } = body;

  if (!classroom_id) {
    return NextResponse.json(
      { error: "Missing required field: classroom_id." },
      { status: 400 }
    );
  }

  if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
    return NextResponse.json(
      { error: "students must be a non-empty array." },
      { status: 400 }
    );
  }

  if (rawStudents.length > 100) {
    return NextResponse.json(
      { error: "Maximum 100 students per upload." },
      { status: 400 }
    );
  }

  // 5. Verify classroom belongs to this teacher and is not deleted
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

  // 6. Check capacity — count existing non-deleted students
  const maxStudents = profile.max_students_per_class ?? 30;

  const { count: currentCount, error: countError } = await serviceSupabase
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("classroom_id", classroom_id)
    .is("deleted_at", null);

  if (countError) {
    console.error("[students/bulk] count error:", countError);
    return NextResponse.json(
      { error: "Failed to verify student limit." },
      { status: 500 }
    );
  }

  const available = maxStudents - currentCount;
  if (available <= 0) {
    return NextResponse.json(
      {
        error: `Student limit reached (${maxStudents}). Upgrade to School Plan for a higher limit.`,
        upgrade: true,
      },
      { status: 403 }
    );
  }

  // 7. Validate each row — collect valid rows and per-row failures
  const validRows = [];
  const failed = [];

  rawStudents.forEach((row, idx) => {
    const first_name = row.first_name?.trim();
    const last_name = row.last_name?.trim();
    const student_code = row.student_code?.trim() || null;

    if (!first_name || !last_name) {
      failed.push({ row: idx + 1, reason: "First Name and Last Name are required." });
      return;
    }

    if (first_name.length > 50 || last_name.length > 50) {
      failed.push({ row: idx + 1, reason: "Names must be 50 characters or fewer." });
      return;
    }

    validRows.push({ first_name, last_name, student_code, _rowIndex: idx + 1 });
  });

  // Enforce capacity on valid rows only
  if (validRows.length > available) {
    return NextResponse.json(
      {
        error: `Upload would exceed student limit. This classroom has room for ${available} more student(s) (limit: ${maxStudents}).`,
        upgrade: available === 0,
      },
      { status: 403 }
    );
  }

  // 8. Build student_codes for rows that didn't provide one.
  //    Query ALL rows for this classroom (including soft-deleted) so we never
  //    reuse a code that the unique constraint would reject.
  const prefix = classroomPrefix(classroom_id);

  const { data: existingStudents, error: existingError } = await serviceSupabase
    .from("students")
    .select("student_code")
    .eq("classroom_id", classroom_id);

  if (existingError) {
    console.error("[students/bulk] existing students fetch error:", existingError);
    return NextResponse.json(
      { error: "Failed to generate student codes." },
      { status: 500 }
    );
  }

  // Parse all existing numeric suffixes for this prefix to find the next free number
  const usedNumbers = new Set(
    (existingStudents ?? [])
      .map((s) => s.student_code)
      .filter((c) => c && c.startsWith(prefix + "-"))
      .map((c) => parseInt(c.slice(prefix.length + 1), 10))
      .filter((n) => !isNaN(n))
  );

  let nextNum = 1;
  function nextCode() {
    while (usedNumbers.has(nextNum)) nextNum++;
    const code = formatCode(prefix, nextNum);
    usedNumbers.add(nextNum);
    nextNum++;
    return code;
  }

  // 9. Check for duplicate student_codes already in the table from provided codes
  const providedCodes = validRows
    .map((r) => r.student_code)
    .filter(Boolean);

  let takenCodes = new Set();
  if (providedCodes.length > 0) {
    const { data: codeDupes } = await serviceSupabase
      .from("students")
      .select("student_code")
      .in("student_code", providedCodes);

    takenCodes = new Set((codeDupes ?? []).map((s) => s.student_code));
  }

  // Finalize each valid row — assign codes, flag code collisions
  const toInsert = [];

  for (const row of validRows) {
    if (row.student_code && takenCodes.has(row.student_code)) {
      failed.push({
        row: row._rowIndex,
        reason: `Student Code "${row.student_code}" is already in use. Leave this column blank to auto-generate a code.`});
      continue;
    }

    toInsert.push({
      classroom_id,
      teacher_id: user.id,
      first_name: row.first_name,
      last_name: row.last_name,
      student_code: row.student_code ?? nextCode(),
      grade_level: classroom.grade_level,
    });
  }

  if (toInsert.length === 0) {
    return NextResponse.json(
      { created: 0, students: [], failed },
      { status: failed.length > 0 ? 207 : 200 }
    );
  }

  // 10. Batch insert
  const { data: inserted, error: insertError } = await serviceSupabase
    .from("students")
    .insert(toInsert)
    .select("id, first_name, last_name, student_code, grade_level, created_at");

  if (insertError) {
    console.error("[students/bulk] insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to insert students. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      created: inserted.length,
      students: inserted,
      ...(failed.length > 0 ? { failed } : {}),
    },
    { status: failed.length > 0 ? 207 : 201 }
  );
}