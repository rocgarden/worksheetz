// /libs/v2/completeSession.js
// Branch: v2/student-success-platform
//
// Shared utility that contains all session-completion scoring logic.
// Called by:
//   - /app/api/v2/assessments/[sessionId]/complete/route.js (explicit complete)
//   - /app/api/v2/assessments/[sessionId]/submit/route.js   (auto-complete on cap)
//
// Signature:
//   completeSession(sessionId, serviceSupabase) → { success: true, summary }
//
// Throws with a descriptive message on any unrecoverable error.
// Non-fatal errors (skill_gap upsert failures, portfolio upsert failures)
// are logged but do not throw — the session is still marked completed.
//
// BOY/MOY/EOY score strategy (Option A — window average):
//   The score stored in portfolios.boy_score (or moy/eoy) is the average of the
//   DOK-weighted scores across ALL completed sessions for that student + classroom
//   + testing_window. This means:
//     - A single completed session → its score is the window score.
//     - Multiple sessions (e.g. classroom bulk assignment) → their scores are
//       averaged so no single session overwrites the others.
//   sessionScore for the current session is calculated first, then all completed
//   sessions in the same window (including this one) are fetched and averaged.

const MASTERY_THRESHOLD = 0.6;
const DOK_WEIGHTS = { 1: 1, 2: 2, 3: 3 };

/**
 * Completes an adaptive session:
 *  1. Fetches all answered question_attempts for the session
 *  2. Builds a per-teks/per-dok performance map
 *  3. Calculates weighted DOK session score (0–100)
 *  4. Upserts skill_gaps (cumulative attempts/correct counts)
 *  5. Averages all completed window scores → upserts portfolios
 *  6. Marks adaptive_sessions status = "completed" with completed_at timestamp
 *
 * @param {string} sessionId - UUID of the adaptive_sessions row
 * @param {object} serviceSupabase - createV2ServiceClient() instance
 * @returns {{ success: true, summary }}
 * @throws {Error} with message if session fetch or attempts fetch fails
 */
export async function completeSession(sessionId, serviceSupabase) {
  const completedAt = new Date().toISOString();

  // ── 1. Fetch the session ─────────────────────────────────────────────────
  const { data: session, error: sessionError } = await serviceSupabase
    .from("adaptive_sessions")
    .select(
      "id, student_id, classroom_id, teks_standard, subject, grade_level, testing_window, status"
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(
      `completeSession: session not found or fetch failed for id=${sessionId}`
    );
  }

  // ── 2. Fetch all answered question_attempts ──────────────────────────────
  // Only rows where student_answer IS NOT NULL (i.e. actually answered).
  const { data: attempts, error: attemptsError } = await serviceSupabase
    .from("question_attempts")
    .select("id, teks_standard, dok_level, is_correct, student_answer, question_type, scr_score")
    .eq("session_id", sessionId)
    .not("student_answer", "is", null);

  if (attemptsError) {
    throw new Error(
      `completeSession: failed to fetch attempts for session=${sessionId}`
    );
  }

  const answeredAttempts = attempts ?? [];

  // ── 3. Build performance map ─────────────────────────────────────────────
  // Shape: { [teks_standard]: { [dok_level]: { correct: number, total: number } } }
  const performanceMap = {};

  for (const attempt of answeredAttempts) {
    const teks = attempt.teks_standard;
    const dok = attempt.dok_level;

    if (!performanceMap[teks]) performanceMap[teks] = {};
    if (!performanceMap[teks][dok]) performanceMap[teks][dok] = { correct: 0, total: 0 };

    performanceMap[teks][dok].total += 1;
    if (attempt.is_correct === true) {
      performanceMap[teks][dok].correct += 1;
    }
  }

  // after building performanceMap, build a teks→question_type map
  const teksQuestionType = {};
  for (const attempt of answeredAttempts) {
    if (!teksQuestionType[attempt.teks_standard]) {
      teksQuestionType[attempt.teks_standard] = attempt.question_type;
    }
  }

  // ── 4. Calculate weighted session score (0–100) ──────────────────────────
  // DOK 1 = 1pt, DOK 2 = 2pts, DOK 3 = 3pts per correct answer.
  let totalEarned = 0;
  let totalPossible = 0;
  let totalCorrect = 0;

 for (const attempt of answeredAttempts) {
    const weight = DOK_WEIGHTS[attempt.dok_level] ?? 1;
    totalPossible += weight;

    if (attempt.question_type === "constructed_response" && attempt.scr_score !== null) {
      // Partial credit: 2 = full weight, 1 = half weight, 0 = no credit
      if (Number(attempt.scr_score) === 2) {
        totalEarned += weight;
        totalCorrect += 1;
      } else if (Number(attempt.scr_score) === 1) {
        totalEarned += weight * 0.5;
        if (attempt.is_correct === true) totalCorrect += 1;
      }
    } else if (attempt.is_correct === true) {
      totalEarned += weight;
      totalCorrect += 1;
    }
  }

  const sessionScore =
    totalPossible > 0
      ? Math.round((totalEarned / totalPossible) * 100)
      : 0;

  // ── 5. Upsert skill_gaps per teks_standard ───────────────────────────────
  // Strategy:
  //   - Find lowest DOK level with < 60% accuracy → dok_level_struggling
  //   - If all DOK levels pass → dok_level_struggling = null (mastered)
  //   - Cumulative counts: fetch existing row first and add to totals
  //   - Conflict target: (student_id, teks_standard)
  const skillGapUpserts = [];

  for (const [teks, dokMap] of Object.entries(performanceMap)) {
    let totalTeksCorrect = 0;
    let totalTeksQuestions = 0;
    let lowestStruggleDok = null;

    for (const dok of [1, 2, 3]) {
      if (!dokMap[dok]) continue;
      const { correct, total } = dokMap[dok];
      totalTeksCorrect += correct;
      totalTeksQuestions += total;

      const rate = total > 0 ? correct / total : 0;
      if (rate < MASTERY_THRESHOLD && lowestStruggleDok === null) {
        lowestStruggleDok = dok;
      }
    }

    skillGapUpserts.push({
      student_id: session.student_id,
      teks_standard: teks,
      subject: session.subject,
      question_type: teksQuestionType[teks] ?? null,
      dok_level_struggling: lowestStruggleDok, // null = mastered
      attempts_count: totalTeksQuestions,
      correct_count: totalTeksCorrect,
      last_assessed: completedAt,
    });
  }

  let skillGapsUpdated = 0;

  for (const gap of skillGapUpserts) {
    // Fetch existing row to accumulate counts (upsert replaces, not increments)
    const { data: existingGap } = await serviceSupabase
      .from("skill_gaps")
      .select("attempts_count, correct_count")
      .eq("student_id", gap.student_id)
      .eq("teks_standard", gap.teks_standard)
      .maybeSingle();

    const cumulativeAttempts = (existingGap?.attempts_count ?? 0) + gap.attempts_count;
    const cumulativeCorrect = (existingGap?.correct_count ?? 0) + gap.correct_count;

    const { error: upsertError } = await serviceSupabase
      .from("skill_gaps")
      .upsert(
        {
          student_id: gap.student_id,
          teks_standard: gap.teks_standard,
          subject: gap.subject,
          question_type: gap.question_type,
          dok_level_struggling: gap.dok_level_struggling,
          attempts_count: cumulativeAttempts,
          correct_count: cumulativeCorrect,
          last_assessed: gap.last_assessed,
          updated_at: completedAt,
        },
        { onConflict: "student_id,teks_standard" }
      );

    if (upsertError) {
      console.error(
        `[completeSession] skill_gap upsert error for ${gap.teks_standard}:`,
        upsertError
      );
      // Non-fatal — log and continue
    } else {
      skillGapsUpdated += 1;
    }
  }

  // ── 6. Mark session as completed BEFORE averaging ────────────────────────
  // Must happen here so the session is included when we query all completed
  // sessions in the same window for the average calculation below.
  const { error: completeError } = await serviceSupabase
    .from("adaptive_sessions")
    .update({ status: "completed", completed_at: completedAt, session_score: sessionScore, session_correct: totalCorrect, session_total: answeredAttempts.length })
    .eq("id", sessionId);

  if (completeError) {
    throw new Error(
      `completeSession: failed to mark session completed for id=${sessionId}`
    );
  }

  // ── 7. Update portfolios (window average strategy) ───────────────────────
  //
  // Instead of writing sessionScore directly, we:
  //   a) Fetch all completed session IDs for this student + classroom + window
  //   b) Fetch all answered attempts for those sessions
  //   c) Compute a fresh DOK-weighted score across ALL of them
  //   d) Write that averaged score to the portfolio column
  //
  // This means classroom bulk assignments (many sessions, same window) naturally
  // roll up into one representative score rather than the last session winning.

  let portfolioUpdated = false;

  const windowToColumn = {
    BOY: "boy_score",
    MOY: "moy_score",
    EOY: "eoy_score",
  };

  const scoreColumn = windowToColumn[session.testing_window] ?? null;

    if (!scoreColumn) {
    console.warn(
      `[completeSession] session=${sessionId} classroom=${session.classroom_id} has no valid testing_window ("${session.testing_window}") — portfolio score will NOT be written. Set classrooms.testing_window to BOY/MOY/EOY to fix.`
    );
  }

  let windowScore = sessionScore; // fallback: just use this session's score

  if (scoreColumn && session.testing_window) {
    // a) All completed sessions for this student + classroom + window
    const { data: windowSessions } = await serviceSupabase
      .from("adaptive_sessions")
      .select("id")
      .eq("student_id", session.student_id)
      .eq("classroom_id", session.classroom_id)
      .eq("testing_window", session.testing_window)
      .eq("status", "completed");

    const windowSessionIds = (windowSessions ?? []).map((s) => s.id);

    if (windowSessionIds.length > 1) {
      // b) All answered attempts across those sessions
    const { data: windowAttempts } = await serviceSupabase
        .from("question_attempts")
        .select("dok_level, is_correct, question_type, scr_score")
        .in("session_id", windowSessionIds)
        .not("student_answer", "is", null);

     if (windowAttempts && windowAttempts.length > 0) {
        // c) Recompute DOK-weighted score across all window attempts
        let wEarned = 0;
        let wPossible = 0;

        for (const a of windowAttempts) {
          const w = DOK_WEIGHTS[a.dok_level] ?? 1;
          wPossible += w;

          if (a.question_type === "constructed_response" && a.scr_score !== null) {
            if (Number(a.scr_score) === 2) wEarned += w;
            else if (Number(a.scr_score) === 1) wEarned += w * 0.5;
          } else if (a.is_correct === true) {
            wEarned += w;
          }
        }

        windowScore = wPossible > 0 ? Math.round((wEarned / wPossible) * 100) : 0;
      }
    }
    // If only 1 session (the one we just completed), windowScore stays = sessionScore
  }

  // Fetch current portfolio row (may not exist yet)
  const { data: existingPortfolio } = await serviceSupabase
    .from("portfolios")
    .select("id, boy_score, moy_score, eoy_score, growth_percentage, teks_mastered, teks_struggling")
    .eq("student_id", session.student_id)
    .eq("classroom_id", session.classroom_id)
    .maybeSingle();

  // Fetch all skill_gaps for this student to rebuild mastered/struggling lists
  const { data: allSkillGaps } = await serviceSupabase
    .from("skill_gaps")
    .select("teks_standard, dok_level_struggling, correct_count, attempts_count")
    .eq("student_id", session.student_id);

  const teksMastered = [];
  const teksStruggling = [];

  if (allSkillGaps) {
    for (const sg of allSkillGaps) {
      const overallRate =
        sg.attempts_count > 0 ? sg.correct_count / sg.attempts_count : 0;

      if (sg.dok_level_struggling === null && overallRate >= MASTERY_THRESHOLD) {
        teksMastered.push(sg.teks_standard);
      } else {
        teksStruggling.push(sg.teks_standard);
      }
    }
  }

  // Fetch school_year from classroom
  const { data: classroom } = await serviceSupabase
    .from("classrooms")
    .select("school_year")
    .eq("id", session.classroom_id)
    .single();

  // Build portfolio payload — carry forward existing window scores
  const portfolioPayload = {
    student_id: session.student_id,
    classroom_id: session.classroom_id,
    school_year: classroom?.school_year ?? null,
    teks_mastered: teksMastered,
    teks_struggling: teksStruggling,
    last_updated: completedAt,
  };

  if (existingPortfolio) {
    portfolioPayload.boy_score = existingPortfolio.boy_score ?? null;
    portfolioPayload.moy_score = existingPortfolio.moy_score ?? null;
    portfolioPayload.eoy_score = existingPortfolio.eoy_score ?? null;
  }

  // d) Write the window-averaged score (not just this session's score)
  if (scoreColumn) {
    portfolioPayload[scoreColumn] = windowScore;
  }

  // Recalculate growth_percentage if both BOY and EOY are available
  const boy = portfolioPayload.boy_score;
  const eoy = portfolioPayload.eoy_score;

  if (boy != null && eoy != null && boy > 0) {
    portfolioPayload.growth_percentage = Math.round(((eoy - boy) / boy) * 100);
  } else {
    portfolioPayload.growth_percentage = existingPortfolio?.growth_percentage ?? null;
  }

  const { error: portfolioError } = await serviceSupabase
    .from("portfolios")
    .upsert(portfolioPayload, { onConflict: "student_id,classroom_id" });

  if (portfolioError) {
    console.error("[completeSession] portfolio upsert error:", portfolioError);
    // Non-fatal — session is still completed, skill_gaps still updated
  } else {
    portfolioUpdated = true;
  }

  // ── 8. Return summary ────────────────────────────────────────────────────
  return {
    success: true,
    summary: {
      total: answeredAttempts.length,
      correct: totalCorrect,
      score: sessionScore,       // this session's individual score
      window_score: windowScore, // averaged across all sessions in this window
      skill_gaps_updated: skillGapsUpdated,
      portfolio_updated: portfolioUpdated,
    },
  };
}

