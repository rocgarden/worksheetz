/**
 * /app/api/v2/questions/route.js
 *
 * POST /api/v2/questions
 * Generates or retrieves the next adaptive question for a student session.
 *
 * Plan access: Classroom or School plan required.
 * Feature flag: NEXT_PUBLIC_V2_ENABLED must be true.
 *
 * Body:
 *   {
 *     session_id:          string  (uuid — adaptive_sessions.id)
 *     teks_standard:       string  e.g. "7.6A"
 *     grade_level:         string  e.g. "7"
 *     dok_level:           number  1 | 2 | 3
 *     question_type:       string  "multiple_choice" | "hot_text"
 *     subject:             string  "ELA"
 *     previous_attempt_ids: string[]  (question_bank IDs already seen)
 *     previous_attempts:   object[]  (full attempt objects for prompt dedup)
 *   }
 *
 * Response:
 *   { question: {...}, source: "redis" | "question_bank" | "generated" }
 */

import { NextResponse } from "next/server";
// import { createClient } from "@/libs/supabase/server";
import { createV2Client } from "@/libs/supabase/server-v2";
import { adaptiveQuestionGenerator} from "@/app/api/v2/generators/adaptiveQuestionGenerator";

// Feature flag guard — all v2 routes check this
function isV2Enabled() {
  return process.env.NEXT_PUBLIC_V2_ENABLED === "true";
}

export async function POST(req) {
  // ── Feature flag ───────────────────────────────────────────────────────────
  if (!isV2Enabled()) {
    return NextResponse.json({ error: "This feature is not yet available." }, { status: 403 });
  }

  // ── Auth ───────────────────────────────────────────────────────────────────
//    const supabase = await createClient();
const supabase = await createV2Client();
   const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
//const user = { id: 'e1a3fef9-ae21-478a-bc7a-e41f8df3d5e0' }


  // ── Plan access check ──────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("classroom_plan, school_plan, plan_name")
    .eq("id", user.id)
    .single();

    if (!profile?.classroom_plan && !profile?.school_plan) {
  return NextResponse.json(
    {
      error: "Upgrade required.",
      message: "Adaptive practice sessions require a Classroom or School plan.",
      upgrade_url: "/pricing",
    },
    { status: 403 }
  );
}

 

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    session_id,
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    subject,
    previous_attempt_ids = [],
    previous_attempts = [],
  } = body;

  // Basic required field check
  if (!session_id || !teks_standard || !grade_level || !dok_level || !question_type || !subject) {
    return NextResponse.json(
      { error: "Missing required fields: session_id, teks_standard, grade_level, dok_level, question_type, subject" },
      { status: 400 }
    );
  }

  // ── Verify session belongs to this teacher ─────────────────────────────────
  const { data: session, error: sessionError } = await supabase
    .from("adaptive_sessions")
    .select("id, teacher_id, status")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (session.teacher_id !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (session.status === "completed" || session.status === "abandoned") {
    return NextResponse.json({ error: "Session is already closed." }, { status: 409 });
  }

  // ── Generate question (3-layer cache) ─────────────────────────────────────
  try {
    const question = await adaptiveQuestionGenerator({
      teks_standard,
      grade_level,
      dok_level: Number(dok_level),
      question_type,
      subject,
      previous_attempt_ids,
      previous_attempts,
    });

    return NextResponse.json({ question }, { status: 200 });
  } catch (err) {
    console.error("[/api/v2/questions] Generation failed:", err.message);

    // Surface validation errors clearly (bad params)
    if (err.message.includes("not yet supported") || err.message.includes("required")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Question generation failed. Please try again." }, { status: 500 });
  }
}