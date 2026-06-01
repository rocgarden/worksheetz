// /app/api/v2/assessments/join/route.js
// Branch: v2/student-success-platform
// Public endpoint — no teacher auth required.
// Student enters a 6-digit join_code and their first name.
// Returns session_id + first unanswered question so /session/[sessionId] can begin.

import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { NextResponse } from "next/server";

export async function POST(req) {
  // ── 1. Feature flag guard ────────────────────────────────────────────────
 

  // ── 2. Parse and validate request body ──────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { join_code, first_name } = body;

  if (!join_code || !first_name) {
    return NextResponse.json(
      { error: "Missing required fields: join_code, first_name." },
      { status: 400 }
    );
  }

  // Validate join_code format — must be exactly 6 digits
  const cleanCode = String(join_code).trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return NextResponse.json(
      { error: "Join code must be exactly 6 digits." },
      { status: 400 }
    );
  }

  const cleanName = String(first_name).trim();
  if (!cleanName || cleanName.length > 50) {
    return NextResponse.json(
      { error: "First name is required and must be 50 characters or fewer." },
      { status: 400 }
    );
  }

  
  const serviceSupabase = await createV2ServiceClient();

  // ── 3. Look up session by join_code ──────────────────────────────────────
  const { data: session, error: sessionError } = await serviceSupabase
    .from("adaptive_sessions")
    .select(
      "id, student_id, status, teks_standard, subject, grade_level, testing_window, join_code, expires_at"
    )
    .eq("join_code", cleanCode)
    .single();

  // ── Guard: session must not be expired ────────────────────────────────
  if (session.expires_at && new Date(session.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This session has expired. Ask your teacher to create a new one." },
      { status: 410 }
    );
  }

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Session not found. Please check your join code." },
      { status: 404 }
    );
  }

  // ── 4. Guard: session must be in_progress ────────────────────────────────
  if (session.status === "completed") {
    return NextResponse.json(
      { error: "This session has already been completed." },
      { status: 409 }
    );
  }

  if (session.status === "abandoned") {
    return NextResponse.json(
      { error: "This session is no longer active. Ask your teacher to start a new one." },
      { status: 409 }
    );
  }

  if (session.status !== "in_progress") {
    return NextResponse.json(
      { error: "Session is not available." },
      { status: 409 }
    );
  }

  // ── 5. Stamp joined_name on the session ──────────────────────────────────
  // joined_name is a display-only field — stores first name the student enters.
  // It does NOT overwrite any PII in the students table.
  // If adaptive_sessions doesn't have joined_name yet, add it in your migration:
  //   ALTER TABLE adaptive_sessions ADD COLUMN IF NOT EXISTS joined_name text;
  const { error: updateError } = await serviceSupabase
    .from("adaptive_sessions")
    .update({ joined_name: cleanName })
    .eq("id", session.id);

  if (updateError) {
    // Non-fatal — log but continue. Student can still proceed.
    console.error("[assessments/join] joined_name update error:", updateError);
  }

  // ── 6. Fetch the first unanswered question_attempt for this session ──────
  // "Unanswered" means student_answer IS NULL.
  // There should be exactly one pending attempt at any point in a session.
  const { data: attempt, error: attemptError } = await serviceSupabase
    .from("question_attempts")
    .select(
      "id, teks_standard, dok_level, question_type, question_json"
    )
    .eq("session_id", session.id)
    .is("student_answer", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (attemptError || !attempt) {
    console.error("[assessments/join] attempt fetch error:", attemptError);
    return NextResponse.json(
      { error: "No active question found for this session. The session may have already been answered." },
      { status: 404 }
    );
  }

  // ── 7. Strip sensitive fields from question_json before returning ─────────
  // correct_answer and explanation are server-side only — never sent to client.
  const { correct_answer, explanation, ...safeQuestion } = attempt.question_json ?? {};

  // ── 8. Return session context + first question ────────────────────────────
  return NextResponse.json(
    {
      session_id: session.id,
      student_first_name: cleanName,
      teks_standard: session.teks_standard,
      subject: session.subject,
      grade_level: session.grade_level,
      testing_window: session.testing_window,
      question: {
        attempt_id: attempt.id,
        teks_standard: attempt.teks_standard,
        dok_level: attempt.dok_level,
        question_type: attempt.question_type,
        ...safeQuestion,
      },
    },
    { status: 200 }
  );
}