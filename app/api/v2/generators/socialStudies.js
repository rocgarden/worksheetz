//app/api/v2/generators/socialStudies.js
import {
  saveToQuestionBank,
  validateQuestionShape,
  buildAnswerFields,
  validateQuestionQuality,
  buildNextQuestionLogic,
} from "./shared";
import {
  SS_DOK_DESCRIPTORS,
  buildSSHeader,
  SS_STIMULUS_DESIGN_RULES,
  SS_ASSESSMENT_MOVE_RULES,
  SS_ALIGNMENT_RULES,
  SS_VARIETY_RULES,
  SS_QUESTION_FOCUS_RULES,
  SS_UNIQUE_ANSWER_RULES,
  SS_DISTRACTOR_DESIGN_RULES,
  SS_CONTENT_FOCUS_RULES,
  SS_DOK_QUALITY_RULES,
  SS_STEM_PRECISION_RULES,
  SS_SOURCE_STYLE_RULES,
  SS_ANSWER_CONSISTENCY_RULES,
  SS_DOK_3_REASONING_RULES,
  SS_7_2A_QUALITY_RULES,
  getSSQuestionTypeRules,
  getSSSkillFocusRules,
  getSSAssessmentMoveRules,
  buildSSAvoidPreviousAttempts,
  buildSSPassageInstruction,
  buildSSFocusNote,
  buildSSOutputSchema,
} from "./socialStudiesPromptParts";
import { setCachedQuestion } from "@/libs/redis-cache";
import OpenAI from "openai";
import { TEKS_SS_LABELS } from "@/libs/constants/teksSocialStudiesMap";


/**
 * System prompt for Social Studies questions.
 * Grade-aware: maps grade level to the correct course name and content scope.
 */
function buildSSSystemPrompt(grade_level) {
  const courseByGrade = {
    "6": "World Cultures and Geography (Grade 6)",
    "7": "Texas History (Grade 7)",
    "8": "United States History to Reconstruction (Grade 8)",
  };
  const courseName = courseByGrade[String(grade_level)] ?? `Grade ${grade_level} Social Studies`;
 
  return `You are an expert Texas Social Studies curriculum specialist and assessment writer with deep knowledge of TEKS standards, STAAR format, and the incoming Student Success Tool assessment framework for grades 6-8.
 
Your current assignment is writing questions for: ${courseName}
 
Your role is to generate high-quality, classroom-ready Social Studies assessment questions aligned to specific TEKS standards and Depth of Knowledge (DOK) levels.
 
CRITICAL RULES:
- Every question must be directly and explicitly aligned to the given TEKS standard and course content.
- DOK level must be authentically reflected in cognitive demand — not just vocabulary.
- For DOK 1: Test recall of specific facts, dates, key people, or place names.
- For DOK 2: Require the student to explain cause-and-effect, compare perspectives, or interpret a source.
- For DOK 3: Require evaluation of historical significance, analysis of multiple perspectives, or drawing conclusions from evidence.  
- DOK 1 multiple_choice: always use a standalone stem — no passage, UNLESS a content_focus 
  is specified, in which case write a 100-150 word passage grounded in that topic.
   - DOK 2-3 multiple_choice: short passage (80-100 words) only when it adds context. Standalone stems are also fine at DOK 2-3.   
 - hot_text and constructed_response always require a passage (100-150 words).
 - All passages must be original, historically accurate, and grade-appropriate.
- Multiple choice questions must have exactly 4 options. Only one is correct.
- Hot text questions require a passage — student selects the historically significant phrase or sentence.
- Multi-select questions have exactly 5 options. Exactly 2 or 3 are correct. Student must select ALL correct answers.
- Inline choice is not used as a standalone question type in this phase.
- Constructed response requires a passage and asks student to write 2-4 sentences supported by historical evidence.
- Never reuse the same stem or passage structure from previous_attempts provided.
- Return ONLY valid JSON. No markdown, no explanation, no preamble.`;
}

/**
 * User prompt builder for Social Studies questions.
 * When stimulus is provided: instructs GPT to reuse that exact passage verbatim.
 * When content_focus is provided and no stimulus: anchors the generated passage to that topic.
 */
function buildSSUserPrompt({
  teks_standard,
  grade_level,
  dok_level,
  question_type,
  previous_attempts = [],
  content_focus = null,
  stimulus = null,
  skill_focus = null,
  assessment_move = null,
}) {
  const teksDescription = TEKS_SS_LABELS[teks_standard] ?? null;
  const dokDesc = SS_DOK_DESCRIPTORS[dok_level];

  const passageInstruction = buildSSPassageInstruction({
    question_type,
    dok_level,
    content_focus,
    stimulus,
  });

  const avoidNote = buildSSAvoidPreviousAttempts(previous_attempts);

  const focusNote = buildSSFocusNote({
    content_focus,
    stimulus,
  });

  console.log(`[DEBUG] skill_focus for ${teks_standard}:`, skill_focus);
  console.log(`[DEBUG] assessment_move for ${assessment_move}:`, assessment_move);

  const promptParts = [
    buildSSHeader({
      teks_standard,
      teksDescription,
      grade_level,
      dok_level,
      dokDesc,
      question_type,
      skill_focus,
      assessment_move,
    }),

    SS_STIMULUS_DESIGN_RULES,

    SS_ASSESSMENT_MOVE_RULES,

    SS_ALIGNMENT_RULES,

    getSSSkillFocusRules(skill_focus),

    getSSAssessmentMoveRules(assessment_move),

    SS_QUESTION_FOCUS_RULES,

    SS_UNIQUE_ANSWER_RULES,

    SS_DISTRACTOR_DESIGN_RULES,

    content_focus ? SS_CONTENT_FOCUS_RULES : "",

    SS_DOK_QUALITY_RULES,

    Number(dok_level) === 3 ? SS_DOK_3_REASONING_RULES : "",

    SS_STEM_PRECISION_RULES,

    SS_SOURCE_STYLE_RULES,

    SS_VARIETY_RULES,

    SS_ANSWER_CONSISTENCY_RULES,

    teks_standard === "7.2A" ? SS_7_2A_QUALITY_RULES : "",

    getSSQuestionTypeRules(question_type),

    avoidNote,

    focusNote,

    `PASSAGE INSTRUCTION: ${passageInstruction}`,

    buildSSOutputSchema({
      teks_standard,
      dok_level,
      question_type,
      buildAnswerFields,
      buildNextQuestionLogic,
    }),
  ];

  return promptParts.filter(Boolean).join("\n\n");
}

/**
 * Generates a single Social Studies question via OpenAI structured JSON output.
 * Handles all supported question types.
 * SS questions use short informational passages (100-200 words) for hot_text and
 * constructed_response; standalone stems for fact-based multiple_choice questions.
 */
export async function generateSSQuestion({ teks_standard, grade_level, dok_level, question_type, 
  previous_attempts = [], content_focus = null, stimulus = null, skill_focus=null, assessment_move=null }) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 
  const systemPrompt = buildSSSystemPrompt(grade_level);
  const userPrompt = buildSSUserPrompt({
    teks_standard,
    grade_level,
    dok_level,
    question_type,
    previous_attempts,
    content_focus,
    stimulus,
    skill_focus,
    assessment_move,
  });
 
  const MAX_ATTEMPTS = question_type === "hot_text" ? 4 : 3;
  let lastError;
 
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature:
        question_type === "hot_text"
          ? attempt === 1
            ? 0.3
            : 0.1
          : attempt === 1
          ? 0.7
          : attempt === 2
          ? 0.3
          : 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
 
    const raw = response.choices[0].message.content;
 
    let question;
    try {
      question = JSON.parse(raw);
    } catch {
      lastError = new Error("OpenAI returned invalid JSON for SS question generation.");
      console.warn(`[socialStudies] SS JSON parse failed on attempt ${attempt}/${MAX_ATTEMPTS}`);
      continue;
    }
 
    try {
      validateQuestionShape(question, question_type);
    } catch (validationErr) {
      lastError = validationErr;
      console.warn(`[socialStudies] SS validation failed on attempt ${attempt}/${MAX_ATTEMPTS}: ${validationErr.message}`);
      continue;
    }
    // Build enrichedQuestion BEFORE branching on stimulus —
    // both paths need the merged skill_focus/assessment_move for quality checks
    const enrichedQuestion = {
      ...question,
      skill_focus,
      assessment_move,
    };

    const quality = validateQuestionQuality(enrichedQuestion);
    if (!quality.ok) {
      lastError = new Error(quality.errors.join(" "));
      console.warn(
        `[socialStudies] Quality validation failed on attempt ${attempt}/${MAX_ATTEMPTS}:`,
        quality.errors
      );
      continue;
    }

      // NOW branch on stimulus — both paths have already passed quality checks
    if (stimulus) {
      if (attempt > 1) {
        console.log(`[socialStudies] SS stimulus generation succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`);
      }
      return { ...enrichedQuestion, source: "generated" };
    }

    const questionBankId = await saveToQuestionBank({
      question: enrichedQuestion,   // ← save the enriched version, not raw "question"
      teks_standard,
      grade_level,
      dok_level,
      question_type,
      subject: "Social Studies",
    });

    const questionWithId = questionBankId
      ? { ...enrichedQuestion, question_bank_id: questionBankId }
      : enrichedQuestion;

    try {
      await setCachedQuestion(teks_standard, dok_level, grade_level, question_type, questionWithId);
    } catch (cacheErr) {
      console.warn("[socialStudies] SS Redis write failed (non-fatal):", cacheErr.message);
    }

    if (attempt > 1) {
      console.log(`[socialStudies] SS generation succeeded on attempt ${attempt}/${MAX_ATTEMPTS}`);
    }
    return { ...questionWithId, source: "generated" };
  }
  throw new Error(`SS question generation failed after ${MAX_ATTEMPTS} attempts. Last error: ${lastError?.message}`);
}