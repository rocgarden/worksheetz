// /app/api/v2/generators/elaQuestionBankPromptParts.js

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function getQuestionJson(question) {
  if (
    isPlainObject(
      question?.question_json,
    )
  ) {
    return question.question_json;
  }

  if (
    typeof question?.question_json ===
    "string"
  ) {
    try {
      const parsed =
        JSON.parse(
          question.question_json,
        );

      return isPlainObject(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

function getCorrectTargetText(
  question,
  questionJson,
) {
  const topLevelTarget =
    normalizeOptionalString(
      question?.correct_target_text,
    );

  if (topLevelTarget) {
    return topLevelTarget;
  }

  const targets =
    Array.isArray(
      questionJson.hot_text_targets,
    )
      ? questionJson.hot_text_targets
      : [];

  const correctAnswers =
    Array.isArray(
      questionJson.correct_answer,
    )
      ? questionJson.correct_answer
      : [
          questionJson.correct_answer,
        ];

  const normalizedAnswerIds =
    correctAnswers
      .map((answer) =>
        normalizeOptionalString(
          String(answer ?? ""),
        ),
      )
      .filter(Boolean);

  const correctTarget =
    targets.find((target) => {
      if (!isPlainObject(target)) {
        return false;
      }

      const targetId =
        normalizeOptionalString(
          target.id,
        );

      return (
        target.is_correct === true ||
        (
          targetId &&
          normalizedAnswerIds.includes(
            targetId,
          )
        )
      );
    });

  return normalizeOptionalString(
    correctTarget?.text,
  );
}

export function buildELAAvoidPriorBankQuestions(
  priorBankQuestions = [],
) {
  if (
    !Array.isArray(
      priorBankQuestions,
    ) ||
    priorBankQuestions.length === 0
  ) {
    return "";
  }

  const safeQuestions =
    priorBankQuestions
      .filter(isPlainObject)
      .map((question) => {
        const questionJson =
          getQuestionJson(
            question,
          );

        return {
          stem:
            normalizeOptionalString(
              questionJson.stem,
            ),

          question_type:
            normalizeOptionalString(
              question.question_type,
            ) ||
            normalizeOptionalString(
              questionJson.question_type,
            ),

          dok_level:
            Number(
              question.dok_level ??
                questionJson.dok_level ??
                0,
            ) || null,

          skill_focus:
            normalizeOptionalString(
              question.skill_focus,
            ) ||
            normalizeOptionalString(
              questionJson.skill_focus,
            ),

          assessment_move:
            normalizeOptionalString(
              question.assessment_move,
            ) ||
            normalizeOptionalString(
              questionJson.assessment_move,
            ),

          target_scene:
            normalizeOptionalString(
              question.target_scene,
            ),

          dramatic_function:
            normalizeOptionalString(
              question.dramatic_function,
            ),

          correct_target_text:
            getCorrectTargetText(
              question,
              questionJson,
            ),
        };
      })
      .filter(
        (question) =>
          question.stem ||
          question.skill_focus ||
          question.assessment_move ||
          question.correct_target_text,
      );

  if (
    safeQuestions.length === 0
  ) {
    return "";
  }

  return `PASSAGE-BANK QUESTION HISTORY

The following questions already exist for this same passage:

${JSON.stringify(
  safeQuestions,
  null,
  2,
)}

Generate a question that adds meaningful coverage rather than restating an existing question.

PRIORITY RULES:
1. Do not reuse an existing correct_target_text.
2. Do not repeat the same question purpose using slightly different wording.
3. Prefer a different skill_focus when the TEKS supports one.
4. Prefer a different assessment_move when the TEKS supports one.
5. Prefer a different passage region, event, paragraph, stanza, section, scene, or evidence detail.
6. Avoid repeating the same stem structure.
7. Match the requested question_type and DOK level.
8. The new question must still be directly supported by the supplied passage.
9. If full variation is impossible, prioritize:
   - a different correct answer target,
   - a different question purpose,
   - a different assessment move,
   - a different passage region.`;
}

export function buildELAQuestionBankMetadataInstructions({
  generationMode,
  passageFormat,
}) {
  if (
    generationMode !==
    "question_bank_question"
  ) {
    return "";
  }

  const normalizedFormat =
    typeof passageFormat === "string"
      ? passageFormat
          .trim()
          .toLowerCase()
      : "";

  if (normalizedFormat === "drama") {
    return `PASSAGE-BANK REVIEW METADATA

This question will be stored in a reviewed passage question bank.

Include these additional top-level JSON fields:

"dramatic_function": "<the dramatic purpose assessed by this question>",
"target_scene": "<the exact scene label, such as Scene 1, Scene 2, Scene 3, or Scene 4>"

DRAMATIC FUNCTION RULES:
- Use a concise function such as:
  - clue
  - revelation
  - realization
  - complication
  - competing_priorities
  - decision
  - consequence
  - partial_resolution
  - resolution
  - character_motivation
  - dramatic_action
- Choose the function actually assessed by the stem, not merely a function that appears somewhere in the passage.
- target_scene must identify the scene containing the main evidence or correct target.
- Use the scene label exactly as it appears in the passage.
- Do not invent a scene.
- Do not return null for these fields when the passage format is drama.

ASSESSMENT ALIGNMENT RULES:
- The correct answer must directly perform the requested assessment_move.
- The stem, correct answer, explanation, dramatic_function, and target_scene must all assess the same dramatic purpose.
- Do not select a clue when the assessment_move asks for the actual problem, conflict, decision, revelation, consequence, or resolution.
- If dramatic_function is "clue", the stem must explicitly ask students to identify a clue.
- If assessment_move is "identify_initial_problem", select the line that actually establishes the first conflict, competing responsibility, or problem.
- For "identify_initial_problem", do not select a line that merely hints that a problem may exist.
- If assessment_move is "identify_later_problem", select the line that establishes the later conflict or complication, not an earlier clue.
- If assessment_move is "identify_key_detail", the selected detail must directly contribute to the dramatic action identified in the stem.
- The explanation must state why the correct answer fulfills the exact assessment_move.
- Do not justify the answer only by saying that it aligns with the TEKS.

HOT-TEXT ANSWER RULES:
- Exactly one hot_text target must clearly and completely answer the stem.
- No incorrect target may be equally reasonable as the correct answer.
- Distractors may be related to the same conflict, but they must represent a different dramatic function, a different stage of the conflict, or a clearly incorrect interpretation.
- correct_target_text must be the strongest and most direct answer, not merely the earliest related line.
- target_scene must be the scene containing correct_target_text.

- A single-answer hot-text stem must ask for one identifiable function or relationship.
- Do not write a compound stem that requires one target to show two separate events, such as both a realization and the later action caused by it.
- When the assessment_move asks how a detail advances action, the stem must ask students to connect the selected detail to what happens next, not merely identify a line.
- The correct target does not need to contain the later event, but it must clearly cause, motivate, or prepare for that later event.
- Hot-text questions currently require exactly one correct target at every DOK level.
- DOK 2 and DOK 3 must increase reasoning complexity through the stem and explanation, not by requiring multiple selections.
- The correct target must independently and completely answer the stem.
- Do not write a stem that requires combining two separate lines, events, scenes, or pieces of evidence.
- If a reasoning task naturally requires two pieces of evidence, choose the single strongest line or generate a different question type.
- For DOK 3, do not use stems that only ask "which line shows," "which line identifies," or "which line reveals" unless the stem also requires evaluation, justification, or strongest-evidence reasoning.
- If the assessment_move begins with "justify," the stem must ask for the strongest evidence supporting a stated analysis.
- DOK 3 hot-text questions may still have one correct target, but the student must evaluate which target best supports the analysis.
FINAL SELF-CHECK:
Before returning JSON, verify all of the following:
1. The correct target directly answers the stem.
2. No distractor answers the stem equally well.
3. The correct target performs the requested assessment_move.
4. dramatic_function accurately describes the role of the correct target.
5. target_scene contains the correct target.
6. The explanation justifies the exact correct target rather than discussing the passage generally.`;  }

  /*
   * Other ELA passage formats do not currently have dedicated
   * database metadata columns. Keep the prompt framework active,
   * but do not invent drama metadata for non-drama passages.
   */
  return `PASSAGE-BANK REVIEW METADATA

This question will be stored in a reviewed passage question bank.

Do not include dramatic_function or target_scene unless the supplied passage format is drama.`;
}