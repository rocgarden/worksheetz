// /libs/adaptive/passageBank.js

/**
 * Selects an active reusable passage matching the session metadata.
 *
 * @param {{
 *   supabase: object,
 *   subject: string,
 *   grade_level: string|number,
 *   teks_standard: string,
 *   passage_format: string,
 *   content_focus_key?: string|null
 * }} params
 *
 * @returns {Promise<object|null>}
 */
/**
 * Returns an active passage that has at least one eligible reviewed question
 * for the requested question type and starting DOK.
 *
 * @returns {Promise<object|null>}
 */
export async function getReusablePassageForSession({
  supabase,
  subject,
  grade_level,
  teks_standard,
  passage_format,
  content_focus_key,
  question_type,
  dok_level,
}) {
  if (
    !supabase ||
    !subject ||
    !grade_level ||
    !teks_standard ||
    !passage_format ||
    !question_type
  ) {
    return null;
  }

  const normalizedDok = Math.max(1, Math.min(3, Number(dok_level) || 1));

  let query = supabase
    .from("passage_bank")
    .select(
      `
        id,
        title,
        passage,
        stimulus_json,
        subject,
        grade_level,
        teks_standard,
        passage_format,
        content_focus_key,
        content_focus,
        skill_tags,
        difficulty_level,
        passage_question_bank!inner (
          id
        )
      `,
    )
    .eq("subject", subject)
    .eq("grade_level", String(grade_level))

    // IMPORTANT:
    // Do NOT require passage_bank.teks_standard
    // to match the assigned TEKS anymore.
    //
    // .eq("teks_standard", teks_standard)

    .eq("passage_format", passage_format)
    .eq("is_active", true)

    // The QUESTION bank now determines
    // whether this passage supports the assigned TEKS.
    .eq("passage_question_bank.teks_standard", teks_standard)
    .eq("passage_question_bank.question_type", question_type)
    .eq("passage_question_bank.dok_level", normalizedDok)
    .eq("passage_question_bank.review_status", "approved")
    .eq("passage_question_bank.is_active", true);

  if (content_focus_key) {
    query = query.eq("content_focus_key", content_focus_key);
  }

  const { data, error } = await query.limit(10);

  if (error) {
    console.warn("[passageBank] passage lookup failed:", error.message);

    return null;
  }

  if (!data?.length) {
    return null;
  }

  const selectedPassage = data[Math.floor(Math.random() * data.length)];

  /*
   * The embedded relationship was used only
   * to enforce the inner join.
   * Do not return it as part of the
   * session passage object.
   */
  const { passage_question_bank: _eligibleQuestions, ...passage } =
    selectedPassage;

  return passage;
}

/**
 * Selects one approved, active question connected to a passage.
 *
 * The selector prefers the least-used matching questions and then randomly
 * selects from that small candidate pool to reduce repetition.
 *
 * It does not:
 * - insert question_attempts
 * - increment times_used
 * - generate an AI fallback question
 *
 * @param {{
 *   supabase: object,
 *   passage_bank_id: string,
 *   question_type: string,
 *   dok_level: number,
 *   exclude_question_ids?: string[]
 * }} params
 *
 * @returns {Promise<object|null>}
 */
export async function getReusableQuestionForSession({
  supabase,
  passage_bank_id,
  teks_standard,
  question_type,
  dok_level,
  exclude_question_ids = [],
}) {
  if (!supabase || !passage_bank_id || !teks_standard || !question_type) {
    return null;
  }

  const normalizedDok = Math.max(1, Math.min(3, Number(dok_level) || 1));

  let query = supabase
    .from("passage_question_bank")
    .select(
      `
        id,
        passage_bank_id,
        teks_standard,
        subject,
        grade_level,
        question_type,
        dok_level,
        skill_focus,
        assessment_move,
        dramatic_function,
        target_scene,
        correct_target_text,
        correct_target_key,
        question_json,
        times_used
      `,
    )
    .eq("passage_bank_id", passage_bank_id)

    // NEW:
    .eq("teks_standard", teks_standard)

    .eq("question_type", question_type)
    .eq("dok_level", normalizedDok)
    .eq("review_status", "approved")
    .eq("is_active", true)
    .order("times_used", {
      ascending: true,
    })
    .limit(10);

  const excludedIds = [
    ...new Set(
      exclude_question_ids.filter((id) => typeof id === "string" && id.trim()),
    ),
  ];

  if (excludedIds.length > 0) {
    const quotedExcludedIds = excludedIds.map((id) => `"${id}"`).join(",");

    query = query.not("id", "in", `(${quotedExcludedIds})`);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("[passageBank] question lookup failed:", error.message);

    return null;
  }

  if (!data?.length) {
    return null;
  }

  /*
   * Only randomize among questions tied
   * for the lowest usage count.
   */
  const lowestUsage = Number(data[0]?.times_used) || 0;

  const leastUsedCandidates = data.filter(
    (question) => (Number(question.times_used) || 0) === lowestUsage,
  );

  return leastUsedCandidates[
    Math.floor(Math.random() * leastUsedCandidates.length)
  ];
}

/**
 * Increments usage only after a bank question has been successfully saved
 * to question_attempts.
 *
 * Failure is non-fatal because usage tracking must not break an assessment.
 *
 * @param {{
 *   supabase: object,
 *   question: object
 * }} params
 *
 * @returns {Promise<boolean>}
 */
export async function incrementPassageQuestionUsage({ supabase, question }) {
  if (!supabase || !question?.id) {
    return false;
  }

  const { error } = await supabase.rpc("increment_passage_question_usage", {
    p_question_id: question.id,
  });

  if (error) {
    console.warn("[passageBank] usage increment failed:", error.message);

    return false;
  }

  return true;
}
