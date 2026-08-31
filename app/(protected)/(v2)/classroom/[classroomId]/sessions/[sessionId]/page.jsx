// /app/(protected)/(v2)/classroom/[classroomId]/sessions/[sessionId]/page.jsx

import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import SessionDetailClient from "./SessionDetailClient";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function SessionDetailPage({ params }) {
  const { classroomId, sessionId } = await params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // ── V2 data ───────────────────────────────────────────────────────────────
  const v2 = createV2ServiceClient();

  // Verify teacher owns this classroom
  const { data: classroom, error: classroomError } = await v2
    .from("classrooms")
    .select("id, name, grade_level, subject")
    .eq("id", classroomId)
    .eq("teacher_id", user.id)
    .single();

  if (classroomError || !classroom) redirect(`/classroom/${classroomId}`);

  // Fetch session + student name via join
  // Note: question_type intentionally omitted — column not yet in prod schema.
  // Derive it from question_attempts rows instead (each attempt has question_type).
  const { data: session, error: sessionError } = await v2
    .from("adaptive_sessions")
    .select(
      `id, teks_standard, subject, grade_level, testing_window,
       status, started_at, completed_at,
       students ( id, first_name, last_name, student_code )`
    )
    .eq("id", sessionId)
    .eq("classroom_id", classroomId)
    .single();

  if (sessionError || !session) redirect(`/classroom/${classroomId}`);

  // Fetch all answered question_attempts in order
  const { data: attempts, error: attemptsError } = await v2
    .from("question_attempts")
    .select(
      `id, dok_level, question_type, question_json, student_answer,
       is_correct, time_spent_seconds, created_at,
       scr_score, response_feedback`
    )
    .eq("session_id", sessionId)
    .not("student_answer", "is", null)
    .order("created_at", { ascending: true });

  if (attemptsError) {
    console.error("[SessionDetailPage] attempts fetch error:", attemptsError);
  }

  return (
    <SessionDetailClient
      session={session}
      student={session.students}
      attempts={attempts ?? []}
      classroomId={classroomId}
      classroomName={classroom.name}
    />
  );
}