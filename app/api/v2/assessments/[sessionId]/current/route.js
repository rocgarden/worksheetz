// /app/api/v2/assessments/[sessionId]/current/route.js
// Branch: v2/student-success-platform
//
// Public route — no auth required (student-facing).
// Returns the current unanswered question for a session,
// or signals session_complete if all questions are answered.
//
// Flow:
//   1. Feature flag guard - not used yet but will be important as we iterate on the session experience and want to gate access.
//   2. Validate sessionId param
//   3. Fetch adaptive_sessions row — 404 if not found
//   4. If completed → return { session_complete: true, joined_name }
//   5. If in_progress → fetch most recent question_attempt where student_answer IS NULL
//   6. If no unanswered attempt found → trigger complete route internally → return session_complete
//   7. Return question fields (never correct_answer or explanation)

import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  // ── 1. Feature flag guard ────────────────────────────────────────────────

  // ── 2. Validate sessionId route param ───────────────────────────────────
  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId in route." },
      { status: 400 },
    );
  }

  const serviceSupabase = await createV2ServiceClient();

  // ── 3. Fetch session — join students for joined_name ────────────────────
  // We join students inline so we can build joined_name in one query.
  const { data: session, error: sessionError } = await serviceSupabase
    .from("adaptive_sessions")
    .select(
      `id,
       status,
       stimulus,
       stimulus_json,
       passage_format,
       students (
         first_name,
         last_name
       )`,
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  // Build joined_name from the joined student row
  const joined_name = session.students
    ? `${session.students.first_name} ${session.students.last_name}`.trim()
    : null;

  // ── 4. Session already completed ─────────────────────────────────────────
  if (session.status === "completed") {
    return NextResponse.json(
      { session_complete: true, joined_name },
      { status: 200 },
    );
  }

  // ── 5. Guard against abandoned sessions ──────────────────────────────────
  if (session.status === "abandoned") {
    return NextResponse.json(
      { error: "Session has been abandoned.", session_complete: false },
      { status: 409 },
    );
  }

  // ── 6. Fetch the most recent unanswered question_attempt ─────────────────
  // student_answer IS NULL → question was generated but not yet submitted.
  // Order by created_at DESC → get the latest pending question.
  const { data: attempt, error: attemptError } = await serviceSupabase
    .from("question_attempts")
    .select(
      `id,
       teks_standard,
       dok_level,
       question_type,
       question_json,
       question_source`,
    )
    .eq("session_id", sessionId)
    .is("student_answer", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attemptError) {
    console.error("[assessments/current] attempt fetch error:", attemptError);
    return NextResponse.json(
      { error: "Failed to fetch current question." },
      { status: 500 },
    );
  }

  // ── 7. No unanswered attempt — session is done, trigger complete ──────────
  // This handles the edge case where submit generated a final question
  // but the complete signal was lost (e.g. network drop).
  if (!attempt) {
    // Fire-and-forget internal complete — mark session as completed
    // so future /current calls return session_complete: true immediately.
    try {
      await serviceSupabase
        .from("adaptive_sessions")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", sessionId)
        .eq("status", "in_progress"); // guard: only update if still in_progress
    } catch (completeErr) {
      // Non-fatal — log and return session_complete anyway
      console.error("[assessments/current] auto-complete error:", completeErr);
    }

    return NextResponse.json(
      { session_complete: true, joined_name },
      { status: 200 },
    );
  }

  // ── 8. Extract safe question fields from question_json ────────────────────
  // correct_answer and explanation are intentionally excluded — server-side only.
  const q = attempt.question_json ?? {};
  return NextResponse.json(
    {
      session_id: sessionId,
      attempt_id: attempt.id,
      joined_name,
      stimulus: session.stimulus ?? null,
      stimulus_json:
        session.stimulus_json &&
        typeof session.stimulus_json === "object" &&
        !Array.isArray(session.stimulus_json)
          ? session.stimulus_json
          : null,
      passage_format: session.passage_format ?? "prose",
      question: {
        attempt_id: attempt.id,
        source: attempt.question_source ?? "ai",
        stem: q.stem ?? null,
        passage: q.passage ?? null,
        answer_options: q.answer_options ?? null,
        question_type: attempt.question_type,
        teks_standard: attempt.teks_standard,
        dok_level: attempt.dok_level,
        // hot_text_targets only present for hot_text question type
        hot_text_targets: q.hot_text_targets ?? null,
        passage_tokens: q.passage_tokens ?? null,
      },
      session_complete: false,
    },
    { status: 200 },
  );
}
