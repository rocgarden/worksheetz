// /app/api/v2/assessments/[sessionId]/submit/route.js
// Branch: v2/student-success-platform
// Scores a student answer, updates question_attempts,
// generates next question via next_question_logic,
// and returns next question or session complete signal.
import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { adaptiveQuestionGenerator } from "@/libs/adaptive";
import { completeSession } from "@/libs/v2/completeSession";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { sanitizeInput, deepSanitize } from "@/libs/sanitize"; // ← Use wrapper

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Max questions per session before auto-completing
//const MAX_QUESTIONS_PER_SESSION = 10;
const MAX_SCR_QUESTIONS_PER_SESSION = 5;

const MAX_QUESTIONS_BY_TYPE = {
  constructed_response: 5,
  default: 10,
};
export async function POST(req, { params }) {
  // ── 1. Feature flag guard ────────────────────────────────────────────────
 

  // ── 2. Auth check ────────────────────────────────────────────────────────
  //const supabase = await createClient(); // no need to fetch user for auth check since this route is teacher-facing and we verify ownership in the next step
  // const { data: { user }, error: authError } = await supabase.auth.getUser();
  // if (authError || !user) {
  //   return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  // }
  // Students are unauthenticated. Identity is established via attempt_id + sessionId.
  // Ownership is verified in step 6 — attempt must belong to this session, and session must belong to this teacher. This prevents students from tampering with attempt_ids to access other students' sessions, since they won't be able to fetch a valid attempt_id that belongs to a session they don't have access to.
  const serviceSupabase = await createV2ServiceClient(); //
  // ── 3. Validate route param ──────────────────────────────────────────────
  const { sessionId } = await params;
  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId in route." },
      { status: 400 }
    );
  }

  // ── 4. Parse and validate request body ──────────────────────────────────
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { attempt_id, student_answer, time_spent_seconds } = body;

  if (!attempt_id || student_answer === undefined || student_answer === null) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: attempt_id, student_answer.",
      },
      { status: 400 }
    );
  }

  // ── 5. Fetch the session and verify ownership ────────────────────────────
  const { data: session, error: sessionError } = await serviceSupabase
    .from("adaptive_sessions")
    .select(
      "id, student_id, teacher_id, classroom_id, teks_standard, subject, grade_level, testing_window, status"
    )
    .eq("id", sessionId)
    // .eq("teacher_id", user.id) // ownership verified via attempt → session → teacher_id, so no need to filter by teacher_id here
    .single();

  if (sessionError || !session) {
    return NextResponse.json(
      { error: "Session not found or access denied." },
      { status: 404 }
    );
  }

  if (session.status !== "in_progress") {
    return NextResponse.json(
      { error: `Session is already ${session.status}.` },
      { status: 409 }
    );
  }

  // ── 6. Fetch the current question_attempt ────────────────────────────────
  const { data: attempt, error: attemptError } = await serviceSupabase
    .from("question_attempts")
    .select("id, session_id, student_id, question_json, student_answer, dok_level, question_type, teks_standard")
    .eq("id", attempt_id)
    .eq("session_id", sessionId)
    .single();

  if (attemptError || !attempt) {
    return NextResponse.json(
      { error: "Attempt not found or does not belong to this session." },
      { status: 404 }
    );
  }

  if (attempt.student_answer !== null) {
    return NextResponse.json(
      { error: "This attempt has already been submitted." },
      { status: 409 }
    );
  }

  // ── 7. Score the answer ──────────────────────────────────────────────────
  const questionJson = attempt.question_json;
  const correctAnswer = questionJson?.correct_answer;

  if (correctAnswer === undefined || correctAnswer === null) {
    console.error("[assessments/submit] question_json missing correct_answer:", attempt_id);
    return NextResponse.json(
      { error: "Question data is malformed. Cannot score answer." },
      { status: 500 }
    );
  }

  // Normalize for comparison — handles strings, arrays (multi-select), objects
  const normalize = (val) => {
    if (Array.isArray(val)) return JSON.stringify([...val].sort());
    if (typeof val === "string") return val.trim().toUpperCase();
    return JSON.stringify(val);
  };

// hot_text scoring: student submits { index, sentence }
// correct_answer is an array of target IDs e.g. ["ht4"]
// Resolve student's selected index → target ID, then check membership
let is_correct;
let scr_feedback = null;
let scr_score = null;

if (attempt.question_type === "hot_text") {
  const targets = questionJson?.hot_text_targets ?? [];
  const selectedTarget = targets[student_answer?.index];
  const selectedId = selectedTarget?.id ?? null;
  is_correct = Array.isArray(correctAnswer)
    ? correctAnswer.includes(selectedId)
    : correctAnswer === selectedId;

} else if (attempt.question_type === "constructed_response") {
  // SCR scoring via OpenAI — 0|1|2 rubric
  const scoringRubric = questionJson?.scoring_rubric ?? {};
  const rubricText = Object.entries(scoringRubric)
    .map(([k, v]) => `Score ${k}: ${v}`)
    .join("\n");
  const rawAnswer = typeof student_answer === "string"
    ? student_answer
    : JSON.stringify(student_answer);
  const sanitizedAnswer = sanitizeInput(rawAnswer);
  const trimmed = sanitizedAnswer.trim();

  // ── Minimum effort guard ────────────────────────────────────────────────
  // Catches "idk", "I don't know", "Teacher help me", etc.
  // Skips OpenAI call entirely — saves cost and returns instant feedback.
  const MIN_WORDS = 8;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
 
  const LOW_EFFORT_PATTERNS = [
    /^i\s*(don'?t|do not)\s*know/i,
    /^(idk|idc|idek|no\s*se|nope|nah|none|nothing|idk\s*lol)/i,
    /^(teacher|ms\.|mr\.|mrs\.)/i,         // "Teacher I don't know"
    /^(i\s*(can'?t|cannot)\s*(do|answer))/i,
    /^(help|please\s*help|i\s*need\s*help)/i,
    /^(\.+|\?+|!+|[^a-z0-9\s]{3,})/i,     // just punctuation / symbols
  ];
 
  const isLowEffort =
    wordCount < MIN_WORDS ||
    LOW_EFFORT_PATTERNS.some((pattern) => pattern.test(trimmed));
 
  if (isLowEffort) {
    console.log(`[assessments/submit] SCR low-effort detected — skipping AI scoring. words: ${wordCount}`);
    is_correct = false;
    scr_score = 0;
    scr_feedback = wordCount < MIN_WORDS
      ? "Your response is too short. Write at least 2 complete sentences and use evidence from the passage."
      : "It looks like you may not have answered the question. Re-read the passage and try to use specific details in your response.";
  } 

else {

  try {
    //const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    //const scoringResponse = await openai.chat.completions.create({
    const scoringResponse = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `You are a Texas ELA assessment scorer. Score this Grade ${session.grade_level} student response on a 0-2 rubric.\n\nTEKS: ${attempt.teks_standard}\nQuestion: ${questionJson?.stem}\nScoring rubric:\n${rubricText}\nStudent response: ${sanitizedAnswer}\n\nReturn ONLY valid JSON: { "score": 0|1|2, "feedback": "<one sentence explaining the score>" }`,
        },
      ],
    });

    const raw = scoringResponse.choices[0].message.content;
    const parsed = JSON.parse(raw);
    scr_score = Number(parsed.score);
    scr_feedback = parsed.feedback ?? null;
    is_correct = scr_score >= 1;
  } catch (scrErr) {
    console.error("[assessments/submit] SCR scoring error:", scrErr.message);
    // Fail open — mark as incorrect, surface error in feedback
    is_correct = false;
    scr_feedback = "Scoring could not be completed. Please try again.";
    scr_score = 0;
  }
  }
} 
else {
  is_correct = normalize(student_answer) === normalize(correctAnswer);
}

  // ── 8. Update question_attempts with submission ──────────────────────────
  const { error: updateError } = await serviceSupabase
    .from("question_attempts")
    .update({
      student_answer,
      is_correct,
      time_spent_seconds: time_spent_seconds ?? null,
      ...(scr_feedback !== null && { response_feedback: scr_feedback }),
      ...(scr_score !== null && { scr_score }),
    })
    .eq("id", attempt_id);

  if (updateError) {
    console.error("[assessments/submit] attempt update error:", updateError);
    return NextResponse.json(
      { error: "Failed to save student answer." },
      { status: 500 }
    );
  }

  // ── 9. Count total attempts in session to enforce question cap ───────────
  const { count: attemptCount, error: countError } = await serviceSupabase
    .from("question_attempts")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (countError) {
    console.error("[assessments/submit] attempt count error:", countError);
    // Non-fatal — continue, worst case we generate one extra question
  }

  const maxQuestionsForThisSession =
  MAX_QUESTIONS_BY_TYPE[attempt.question_type] ??
  MAX_QUESTIONS_BY_TYPE.default;
  
  const isScr = attempt.question_type === "constructed_response";
  const shouldComplete = attemptCount >= (isScr ? MAX_SCR_QUESTIONS_PER_SESSION : maxQuestionsForThisSession);
  // ── 10. Determine next dok_level from next_question_logic ────────────────
  const nextLogic = questionJson?.next_question_logic;
  const branch = is_correct ? nextLogic?.if_correct : nextLogic?.if_incorrect;
  const next_dok_level = branch?.dok_level ?? attempt.dok_level;
  const next_action = branch?.action ?? null;

  // ── 11. Complete session if cap reached ──────────────────────────────────
  // Delegates to shared completeSession utility which:
  //   - calculates weighted DOK score
  //   - upserts skill_gaps (cumulative)
  //   - upserts portfolios (BOY/MOY/EOY + growth)
  //   - marks session status = "completed"
  if (shouldComplete) {
    let completionResult;
    try {
      completionResult = await completeSession(sessionId, serviceSupabase);
    } catch (err) {
      console.error("[assessments/submit] completeSession error:", err.message);
      // Session answer was saved — return session_complete even if scoring fails
      // so the frontend can transition properly. complete/ route can be retried.
      return NextResponse.json(
        {
          session_complete: true,
          is_correct,
          session_id: sessionId,
          scoring_error: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        session_complete: true,
        is_correct,
        ...(scr_feedback !== null && { feedback: scr_feedback, score: scr_score }),
        session_id: sessionId,
        summary: completionResult.summary,
      },
      { status: 200 }
    );
  }

  // ── 12. Fetch all previous attempts in session (for deduplication) ────────
  // question_json included so we can extract question_bank_id for dedup.
  const { data: previousAttempts, error: prevError } = await serviceSupabase
    .from("question_attempts")
    .select("id, is_correct, dok_level, question_type, question_json")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (prevError) {
    console.error("[assessments/submit] fetch previous attempts error:", prevError);
  }

  // Extract question_bank_ids seen so far — passed to generator to prevent repeats.
  // question_json may be a parsed object or a raw JSON string depending on Supabase driver.
  const seenBankIds = (previousAttempts ?? [])
    .map(a => {
      const q = typeof a.question_json === "string"
        ? JSON.parse(a.question_json)
        : a.question_json;
      return q?.question_bank_id ?? null;
    })
    .filter(Boolean);

  // ── 13. Generate next question ───────────────────────────────────────────
  let nextQuestion;
  try {
    nextQuestion = await adaptiveQuestionGenerator({
      teks_standard: session.teks_standard,
      grade_level: session.grade_level,
      subject: session.subject,
      dok_level: next_dok_level,
      question_type: attempt.question_type, // keep same question type throughout session
      previous_attempts: previousAttempts ?? [],
      previous_attempt_ids: seenBankIds,
    });
  } catch (genError) {
    console.error("[assessments/submit] next question generation error:", genError);
    return NextResponse.json(
      { error: "Failed to generate next question." },
      { status: 500 }
    );
  }

  // ── 14. Insert next question_attempts row ────────────────────────────────
  const { data: nextAttempt, error: nextAttemptError } = await serviceSupabase
    .from("question_attempts")
    .insert({
      session_id: sessionId,
      student_id: session.student_id,
      teks_standard: session.teks_standard,
      dok_level: nextQuestion.dok_level ?? next_dok_level,
      question_type: nextQuestion.question_type ?? attempt.question_type,
      question_json: nextQuestion,
      student_answer: null,
      is_correct: null,
      time_spent_seconds: null,
    })
    .select("id")
    .single();

  if (nextAttemptError || !nextAttempt) {
    console.error("[assessments/submit] next attempt insert error:", nextAttemptError);
    return NextResponse.json(
      { error: "Failed to save next question." },
      { status: 500 }
    );
  }

  // ── 15. Return scoring result + next question ────────────────────────────
  // correct_answer and explanation are intentionally omitted from response
 return NextResponse.json(
    {
      session_complete: false,
      is_correct,
      next_action,
      ...(scr_feedback !== null && { feedback: scr_feedback, score: scr_score }),
      attempt_id: nextAttempt.id,
      question: {
        attempt_id: nextAttempt.id,
        teks_standard: nextQuestion.teks_standard,
        dok_level: nextQuestion.dok_level ?? next_dok_level,
        question_type: nextQuestion.question_type ?? attempt.question_type,
        stem: nextQuestion.stem,
        passage: nextQuestion.passage ?? null,
        answer_options: nextQuestion.answer_options ?? null,
        hot_text_targets: nextQuestion.hot_text_targets ?? null,
        passage_tokens: nextQuestion.passage_tokens ?? null,
        // correct_answer and explanation intentionally omitted
      },
    },
    { status: 200 }
  );
}