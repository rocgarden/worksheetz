// /app/api/v2/assessments/[sessionId]/complete/route.js
// Branch: v2/student-success-platform
//
// Marks adaptive_sessions as completed, calculates per-standard
// performance from question_attempts, upserts skill_gaps for the
// student, and updates portfolios with the new session score.
//
// Scoring logic lives in /libs/v2/completeSession.js — shared with submit route.
//
// Called by the frontend after submit returns session_complete: true,
// OR can be called directly to force-complete a session.
import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { completeSession } from "@/libs/v2/completeSession";
import { NextResponse } from "next/server";

export async function POST(req, { params }) {
  // ── 1. Feature flag guard ────────────────────────────────────────────────
 

  // ── 2. Auth check ────────────────────────────────────────────────────────
const supabase = await createClient();
const serviceSupabase = await createV2ServiceClient();
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}
  // ── 3. Validate sessionId route param ───────────────────────────────────
  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId in route." },
      { status: 400 }
    );
  }

  // ── 4. Fetch the session — verify it belongs to this teacher ─────────────
  const { data: session, error: sessionError } = await serviceSupabase
    .from("adaptive_sessions")
    .select("id, status, teacher_id")
    .eq("id", sessionId)
    .eq("teacher_id", user.id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Session not found or access denied." },
      { status: 404 }
    );
  }

  // ── 5. Idempotency guard — return early if already completed ─────────────
  // Prevents re-running scoring logic if the client calls complete twice.
  if (session.status === "completed") {
    return NextResponse.json(
      { already_complete: true, session_id: sessionId },
      { status: 200 }
    );
  }

  // ── 6. Guard against abandoned sessions ──────────────────────────────────
  if (session.status === "abandoned") {
    return NextResponse.json(
      { error: "Cannot complete an abandoned session." },
      { status: 409 }
    );
  }

  // ── 7. Run scoring, upserts, and mark session completed ──────────────────
  let result;
  try {
    result = await completeSession(sessionId, serviceSupabase);
  } catch (err) {
    console.error("[assessments/complete] completeSession error:", err.message);
    return NextResponse.json(
      { error: err.message ?? "Failed to complete session." },
      { status: 500 }
    );
  }

  // ── 8. Return summary ────────────────────────────────────────────────────
  return NextResponse.json(
    {
      session_id: sessionId,
      status: "completed",
      session_score: result.summary.score,
      total_questions: result.summary.total,
      correct: result.summary.correct,
      skill_gaps_updated: result.summary.skill_gaps_updated,
      portfolio_updated: result.summary.portfolio_updated,
    },
    { status: 200 }
  );
}