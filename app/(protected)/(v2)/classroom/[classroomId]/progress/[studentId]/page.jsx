// /app/(v2)/classroom/[classroomId]/progress/[studentId]/page.jsx
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import ProgressClient from "./ProgressClient";

export default async function ProgressPage({ params }) {
  const { classroomId, studentId } = await params;

  const serviceSupabase = await createV2ServiceClient();

  // Parallel fetch: attempts, portfolio, skill_gaps, student info, and adaptive sessions for session history
  const [attemptsResult, portfolioResult, skillGapsResult, sessionsResult, studentResult] =
    await Promise.all([
      // 1. All answered question_attempts for this student
      serviceSupabase
        .from("question_attempts")
        .select(
          "id, session_id, teks_standard, dok_level, question_type, is_correct, time_spent_seconds, created_at"
        )
        .eq("student_id", studentId)
        .not("student_answer", "is", null)
        .order("created_at", { ascending: true }),

      // 2. Portfolio row for this student + classroom
      serviceSupabase
        .from("portfolios")
        .select(
          "id, school_year, boy_score, moy_score, eoy_score, growth_percentage, teks_mastered, teks_struggling, last_updated"
        )
        .eq("student_id", studentId)
        .eq("classroom_id", classroomId)
        .maybeSingle(),

      // 3. Skill gaps ordered by correct_count ASC (weakest first)
      serviceSupabase
        .from("skill_gaps")
        .select(
          "id, teks_standard, subject, dok_level_struggling, question_type, attempts_count, correct_count, last_assessed, updated_at"
        )
        .eq("student_id", studentId)
        .order("correct_count", { ascending: true })
        .order("attempts_count", { ascending: false }),

      // 4. Adaptive sessions for session history
      serviceSupabase
        .from("adaptive_sessions")
        .select(
          "id, teks_standard, subject, grade_level, testing_window, status, started_at, completed_at, session_score, session_correct, session_total, join_code, expires_at"
        )
        .eq("student_id", studentId)
        .eq("classroom_id", classroomId)
        .order("started_at", { ascending: false }),

        // 5. Student info
      serviceSupabase
        .from("students")
        .select("id, first_name, last_name, student_code, grade_level")
        .eq("id", studentId)
        .single(),
    ]);
  const attempts = attemptsResult.data ?? [];
  const sessions = sessionsResult.data ?? [];
 
  // Build per-session aggregates from attempts:
  //   question_count — answered attempt count
  //   question_type  — first attempt's type (mirrors completeSession teksQuestionType logic)
  const sessionMeta = attempts.reduce((acc, a) => {
    if (!acc[a.session_id]) {
      acc[a.session_id] = { question_count: 0, question_type: a.question_type ?? null };
    }
    acc[a.session_id].question_count += 1;
    return acc;
  }, {});
 
  const enrichedSessions = sessions.map((s) => ({
    ...s,
    question_count: sessionMeta[s.id]?.question_count ?? 0,
    question_type: sessionMeta[s.id]?.question_type ?? null,
  }));


  return (
    <ProgressClient
      classroomId={classroomId}
      studentId={studentId}
      student={studentResult.data ?? null}
      portfolio={portfolioResult.data ?? null}
      skillGaps={skillGapsResult.data ?? []}
      sessions={enrichedSessions}
      attempts={attempts}
    />
  );
}
