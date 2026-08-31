// /app/api/v2/generators/sciencePromptParts.js

export const SCIENCE_DOK_DESCRIPTORS = {
  1: "recall and reproduction — identifying facts, terms, observations, simple relationships, or directly stated evidence",
  2: "skills and concepts — explaining relationships, comparing data, connecting cause and effect, interpreting models, or applying science concepts",
  3: "strategic thinking — using evidence to justify a scientific claim, evaluating explanations, analyzing systems, or reasoning from multiple pieces of evidence",
};

export function buildScienceHeader({
  teks_standard,
  teksDescription,
  grade_level,
  dok_level,
  dokDesc,
  question_type,
  skill_focus,
  assessment_move,
}) {
  return `Generate one Grade ${grade_level} Science question.

TEKS Standard: ${teks_standard}${teksDescription ? `\nTEKS Description: ${teksDescription}` : ""}
${skill_focus ? `Skill Focus: ${skill_focus} — this is the specific thinking move or science skill to assess, distinct from the broader TEKS standard.\n` : ""}
${assessment_move ? `ASSESSMENT MOVE: ${assessment_move}
You must write a question that matches this assessment move. Do not repeat the same stem pattern used in previous_attempts.\n` : ""}DOK Level: ${dok_level} — ${dokDesc}
Question Type: ${question_type}`;
}

export const SCIENCE_TASK_MODEL_RULES = `
SCIENCE TASK MODEL:
1. Identify the science phenomenon or system.
2. Determine what evidence/data the student must use.
3. Apply the assessment_move.
4. Match reasoning depth to DOK.
5. Write distractors from realistic misconceptions.
`;

export const SCIENCE_BASE_ALIGNMENT_RULES = `
SCIENCE ALIGNMENT RULE:
- The passage/stimulus, stem, correct answer, and explanation must all match the TEKS standard, skill_focus, and assessment_move.
- If skill_focus is matter_cycles, focus on matter, nutrients, carbon, water, atoms, substances, or materials moving through or being recycled in a system. Do not make the correct answer mainly about energy source or energy transfer.
- If skill_focus is energy_flow, focus on energy source, producers, consumers, food chains, food webs, or energy transfer. Do not make the correct answer mainly about nutrient recycling.
- If skill_focus is ecosystem_interactions, focus on relationships among organisms, roles in an ecosystem, or how one organism affects another.
- If skill_focus is system_modeling, focus on identifying, interpreting, revising, or evaluating components, relationships, or processes in a system model.
- If skill_focus is data_interpretation, the question must require interpreting described data, measurements, patterns, or trends.
- If skill_focus is claim_evidence_reasoning, the question must require matching or evaluating a claim, evidence, or reasoning.
- If skill_focus is ecosystem_interactions, focus on relationships among organisms, such as producer-consumer, predator-prey, herbivore-plant, decomposer-dead matter, or how a change in one organism affects another. Do not make the main task about nutrient cycling unless the stem explicitly asks how organism interactions support matter cycling.
`;

export const SCIENCE_CONTENT_FOCUS_RULES = `
SCIENCE CONTENT FOCUS RULE:
- If Content Focus is provided, treat it as the teacher's lesson objective, not just a topic suggestion.
- The passage/stimulus, stem, correct answer, distractors, and explanation must stay centered on the Content Focus.
- Do not drift to unrelated science concepts, systems, organisms, processes, or vocabulary.
- If the Content Focus names a process, model, system, data pattern, relationship, or science concept, the passage/stimulus and question must directly support it.
- The question should assess the Content Focus through the selected skill_focus and assessment_move.
`;

export const SCIENCE_STIMULUS_DESIGN_RULES = `
SCIENCE STIMULUS DESIGN RULE:
- Write the passage/stimulus as a focused classroom science scenario, model description, investigation, data-based description, or short reading selection.
- The stimulus must support the TEKS, Content Focus, skill_focus, assessment_move, and DOK level.
- For DOK 2 and DOK 3, include enough information for students to reason from evidence, not just recall a definition.
- Use concrete science contexts such as observations, simple investigations, food webs, models, diagrams described in words, data tables described in words, or cause/effect relationships.
- Do not overload the stimulus with unrelated facts.
- Every detail should help students answer likely questions.
- Avoid stimuli where each answer can be found by matching one obvious sentence unless the question is intentionally DOK 1.
`;

export const SCIENCE_SAME_STIMULUS_DEPTH_RULES = `
SCIENCE SAME-STIMULUS DEPTH RULE:
- When generating a stimulus, include enough science information to support 3-5 related questions from the same stimulus.
- Include at least 2-3 different evidence targets or reasoning targets when appropriate.
- Good science stimuli may include:
  - a cause/effect relationship
  - a model component and its role
  - a data pattern
  - an interaction within a system
  - an input/output relationship
  - an example and non-example
  - a prediction based on evidence
- Avoid building the entire stimulus around only one obvious fact.
- For Science hot_text, write stimulus sentences so each selectable target has a distinct evidence purpose.
- Avoid two target sentences that support the same claim equally well.
- For ecosystems, separate evidence purposes clearly:
  - one sentence for producers starting energy flow
  - one sentence for consumers transferring energy
  - one sentence for decomposers recycling matter
  - one sentence for nutrients supporting plant growth
  - one sentence for how a change affects the food web
`;

export const SCIENCE_ENERGY_FLOW_RULES = `
SCIENCE ENERGY FLOW RULE:
- Producers/plants are the primary biological source of energy entering most food chains because they convert sunlight into stored chemical energy.
- Consumers such as insects, herbivores, predators, and decomposers are not primary energy sources.
- Do not mark consumers as correct when the question asks for primary energy sources or producers.
- If asking about energy transfer, consumers may transfer energy, but they are not producers.
`;

export const SCIENCE_STIMULUS_USE_RULES = `
STIMULUS USE RULE:
- The question must require information from the provided stimulus.
- Do not generate a question answerable without reading the stimulus unless passage is explicitly null for a DOK 1 recall item.
- Do not introduce outside scientific facts unless explicitly required.
- For multi_select, every correct answer must be directly supported by the passage/stimulus or clearly required by the TEKS skill.
- If the passage does not mention decomposers, nutrients, water movement, carbon, oxygen, or matter cycling, do not make those the correct answers unless the stem clearly asks students to apply outside science knowledge.
- Prefer generating a stimulus that includes the needed science evidence before asking a multi-select question.
`;

export const SCIENCE_QUESTION_CONSTRUCTION_RULES = `
QUESTION CONSTRUCTION:
- The stem must ask ONE clear scientific task.
- The answer must depend on reasoning or evidence, not only memorization, except for intentional DOK 1 recall.
- Do not ask multiple concepts in one item.
- Avoid “Which statement is true?” unless DOK 1.
- Prefer observable evidence over definitions.
`;

export const SCIENCE_VARIETY_RULES = `
SCIENCE VARIETY RULE:
- Do not repeatedly assess the same fact, model component, data point, organism, process step, variable, or evidence sentence across previous_attempts.
- If previous_attempts already used one detail as the correct answer, choose a different detail, relationship, or reasoning target.
- Vary questions across observation, evidence, cause/effect, model interpretation, data interpretation, prediction, and explanation when appropriate.
- Avoid repeating the same stem structure across the session.
`;

export const SCIENCE_SAME_STIMULUS_VARIETY_RULES = `
SCIENCE SAME-STIMULUS VARIETY RULE:
- When stimulus is provided, do not keep asking about the same evidence detail, model component, organism, process, variable, or relationship.
- If a previous question already assessed one part of the stimulus, the next question should assess a different part or a different reasoning relationship.
- Across a session, vary the correct answer target even when using the same stimulus.
- Do not repeatedly use the same sentence, detail, data point, or model relationship as the correct answer.
`;

export const SCIENCE_ANSWER_CONSISTENCY_RULES = `
SCIENCE ANSWER CONSISTENCY RULE:
- The correct_answer id must match the intended correct answer choice.
- The explanation must describe the exact correct answer text.
- Do not identify the correct answer by letter in the explanation.
- Do not write "The correct answer is A/B/C/D."
- Do not write "option A/B/C/D is correct."
- Do not write "choice A/B/C/D is correct."
- Do not put answer letters in parentheses after answer text, such as "(A)" or "(D)".
- Instead, explain using the answer text only.
- Before finalizing, verify the explanation does not refer to any answer letter.
`;

export const SCIENCE_DOK_1_RULES = `
SCIENCE DOK 1 RULE:
- Ask students to identify, recall, match, recognize, or locate a clearly stated science fact, observation, term, model part, organism role, or simple relationship.
- Vary the task format: identify, classify, match, select the role, choose the model component, or locate evidence.
- Do not use “Which organism...” more than once in a session.
- Do not ask students to evaluate, justify, or reason from multiple evidence points at DOK 1.
`;

export const SCIENCE_DOK_2_RULES = `
SCIENCE DOK 2 RULE:
- Require students to connect a science concept to evidence, an observation, a model, a data pattern, or a cause/effect relationship.
- Good DOK 2 tasks include explaining relationships, comparing examples, interpreting a simple model, connecting structure to function, or applying a concept to a scenario.
- Do not make DOK 2 answerable by copying only one sentence from the stimulus.
- The explanation must identify the reasoning connection, not only quote the stimulus.
`;

export const SCIENCE_DOK_3_RULES = `
SCIENCE DOK 3 RULE:
- Require students to analyze, justify, evaluate, predict, or choose the best-supported scientific explanation using evidence.
- DOK 3 should require multiple details from the stimulus.
- Prefer stems such as:
  - "Which explanation is best supported by the evidence?"
  - "Which claim is best supported by the model?"
  - "Which conclusion can be drawn from the data?"
  - "Which evidence best supports the prediction?"
  - "Which factor most likely caused..."
- Avoid DOK 3 questions where the answer is a single directly stated fact.
- For DOK 3, the explanation must include the reasoning step students should make.
- Hard vocabulary alone does NOT increase DOK.
`;

export function getScienceDOKRules(dok_level) {
  if (Number(dok_level) === 1) return SCIENCE_DOK_1_RULES;
  if (Number(dok_level) === 2) return SCIENCE_DOK_2_RULES;
  return SCIENCE_DOK_3_RULES;
}

export const SCIENCE_ENERGY_FLOW_MULTI_SELECT_RULES = `
SCIENCE ENERGY_FLOW MULTI_SELECT RULE:
- If asking for "roles directly involved in energy flow," include producers as one of the correct answers unless the stem narrows the task to consumers.
- If the intended answers are herbivores and carnivores, the stem must say "consumer roles" or "roles that transfer energy between organisms."
- Avoid stems where more than 2-3 options could reasonably be correct.
`;

export const SCIENCE_EVIDENCE_REASONING_RULES = `
SCIENCE EVIDENCE AND REASONING RULE:
- If skill_focus or assessment_move involves evidence, the correct answer must be the strongest evidence for the exact claim, conclusion, prediction, or explanation in the stem.
- If skill_focus or assessment_move involves reasoning, the correct answer must connect evidence to a science concept.
- Avoid answer choices that are all true science facts but do not answer the exact question.
- Distractors may be true statements, but they must be incorrect for the exact claim, model, data pattern, cause/effect relationship, or science process being assessed.
`;

export const SCIENCE_CAUSE_EFFECT_RULES = `
SCIENCE CAUSE/EFFECT RULE:
- If the question assesses cause and effect, the stem must clearly identify the cause, the effect, or the relationship students should explain.
- The correct answer must connect the cause to the effect using science reasoning.
- Distractors should include plausible wrong causes, wrong effects, reversed relationships, or unrelated observations.
`;

export const SCIENCE_MODEL_RULES = `
SCIENCE MODEL RULE:
- If the question involves a model, food web, diagram, system, or process, clearly describe the model in the stimulus.
- The question should ask students to identify a model part, explain a relationship, predict a change, or use the model as evidence.
- Do not ask students to interpret a visual model unless the needed information is described clearly in text.
`;

export const SCIENCE_DATA_RULES = `
SCIENCE DATA RULE:
- If the question involves data, include a simple data pattern in the stimulus using clear text.
- The question should ask students to identify a pattern, compare values, make a prediction, or choose the best-supported conclusion.
- Do not require calculations beyond grade-appropriate reasoning unless the TEKS and prompt require it.
- Distractors should reflect common data misreadings, reversed patterns, or unsupported conclusions.
`;

export const SCIENCE_MATTER_CYCLES_RULES = `
SCIENCE MATTER CYCLES RULE:
- If skill_focus is matter_cycles, focus on matter being moved, reused, decomposed, recycled, or transformed in a system.
- Correct answers should involve matter, nutrients, atoms, carbon, oxygen, water, substances, materials, or decomposers when supported by the stimulus.
- Do not confuse matter cycling with energy flow.
- Energy flows through ecosystems, while matter cycles through ecosystems.
- Matter-cycles questions should clearly ask about nutrients, matter, dead organisms, waste, soil, decomposition, or materials being reused.
- Do not label a matter-cycling task as ecosystem_interactions unless the question is specifically about how organism roles interact to support the cycle.
`;

export function getScienceSkillFocusRules(skill_focus) {
  switch (skill_focus) {
    case "energy_flow":
      return `${SCIENCE_ENERGY_FLOW_RULES}`;

    case "matter_cycles":
      return `${SCIENCE_MATTER_CYCLES_RULES}`;

    case "ecosystem_interactions":
      return "";

    case "system_modeling":
    case "model_interpretation":
    case "systems_model":
    case "model":
      return SCIENCE_MODEL_RULES;

    case "data_interpretation":
    case "analyze_data":
    case "data":
      return SCIENCE_DATA_RULES;

    case "claim_evidence_reasoning":
    case "evidence":
    case "text_evidence":
    case "scientific_evidence":
      return SCIENCE_EVIDENCE_REASONING_RULES;

    case "cause_effect":
    case "cause_and_effect":
      return SCIENCE_CAUSE_EFFECT_RULES;

    default:
      return "";
  }
}

export function getScienceAssessmentMoveRules(assessment_move) {
  if (!assessment_move) return "";

  return `
SCIENCE ASSESSMENT MOVE RULE:
- The question must directly match this assessment_move: ${assessment_move}.
- Do not write a generic science question if the assessment_move requires a specific task.
- If the assessment_move asks students to identify evidence, the correct answer must be the strongest evidence for the exact claim.
- If the assessment_move asks students to explain a relationship, the correct answer must connect the relationship using science reasoning.
- If the assessment_move asks students to interpret a model, the correct answer must use the model or system described in the stimulus.
- If the assessment_move asks students to analyze data, the correct answer must match the data pattern in the stimulus.
- If the assessment_move asks students to predict, the prediction must be supported by evidence from the stimulus.
`;
}

export const SCIENCE_MULTIPLE_CHOICE_RULES = `
SCIENCE MULTIPLE_CHOICE RULE:
- Multiple-choice questions must have exactly 4 answer options.
- Exactly 1 answer option must be correct.
- The stem must be precise enough that only one answer is defensible.
- Distractors should be plausible but clearly incorrect based on the stimulus and science concept.
- Avoid answer choices that are all partly true.
- Good distractors may include:
  - reversed cause/effect
  - wrong model part
  - wrong data pattern
  - unsupported prediction
  - related but incorrect science vocabulary
  - true fact that does not answer the exact stem
`;

export const SCIENCE_MULTI_SELECT_RULES = `
SCIENCE MULTI_SELECT RULE:
- Multi-select questions must have exactly 5 answer options.
- Exactly 2 or 3 options must be correct.
- If exactly 2 answers are correct, the stem must say "Select TWO" or "Select BOTH".
- If exactly 3 answers are correct, the stem must say "Select THREE".
- Avoid generic "Select ALL that apply" when the number of correct answers is known.
- The stem must be narrow enough that exactly 2 or exactly 3 options are defensible.
- Do not include extra true statements as distractors.
- Before finalizing, test every unselected option: "Could a student defend this answer using the stimulus?"
- If yes, either include it as correct and change the stem to Select THREE, or replace the option.
- Every correct answer must answer the exact same task in the stem.
- If two different ideas are being assessed, name both ideas in the stem.
- Avoid broad stems such as "directly involved in energy flow" or "directly involved in matter cycling" unless every defensible correct option is included.
- If the stem says "Select TWO," narrow the task to exactly two roles, organisms, processes, or relationships.
- For energy_flow, specify the exact part of the energy path being assessed, such as:
  - "Select TWO roles that transfer energy from producers to consumers."
  - "Select TWO components that begin the energy flow in this food web."
  - "Select TWO consumer roles that transfer energy by eating other organisms."
- For matter_cycles, specify the exact matter-cycling process being assessed, such as:
  - "Select TWO decomposer actions that recycle matter."
  - "Select TWO components involved in returning nutrients to soil."
  - "Select TWO roles that help nutrients become available to producers again."
`;

export const SCIENCE_MULTI_SELECT_DOK_RULES = `
SCIENCE MULTI_SELECT DOK RULE:
- For DOK 1 multi_select, ask students to select explicit facts, model parts, observations, or directly supported details.
- For DOK 2, ask students to select relationships, evidence, examples, or cause/effect connections.
- For DOK 3, ask students to select evidence, conclusions, or explanations that support deeper reasoning.
- Do not ask broad multi-select questions where many options could be scientifically true.
`;

export const SCIENCE_HOT_TEXT_RULES = `
SCIENCE HOT_TEXT RULE:
- A passage/stimulus IS REQUIRED.
- The stem must ask the student to click/select one specific word, phrase, sentence, data statement, model description, evidence span, or relationship from the stimulus.
- hot_text_targets must include exactly 3-5 selectable options.
- Exactly 1 target must have is_correct: true.
- All other targets must have is_correct: false.
- Each target must have a unique id: ht1, ht2, ht3, ht4, ht5.
- correct_answer must be an array containing exactly the correct target id, for example ["ht2"].
- Do NOT include passage_tokens. The server builds passage_tokens automatically.

SCIENCE HOT_TEXT EXACT TARGET RULE:
- Every hot_text_targets[].text value must be copied EXACTLY from the passage/stimulus.
- The target text must appear in the passage/stimulus character-for-character.
- Do not paraphrase target text.
- Do not shorten target text.
- Do not reword target text.
- Do not change capitalization.
- Do not change punctuation.
- Do not add or remove commas, periods, quotation marks, apostrophes, or hyphens.
- Use complete sentences from the passage as targets whenever possible.
- When stimulus is provided, choose targets only from the exact stimulus text.
- Before finalizing, verify each target text appears in the passage with passage.includes(targetText).
- Do not invent passage_tokens.
- Provide hot_text_targets only.
`;

export const SCIENCE_HOT_TEXT_DOK_RULES = `
SCIENCE HOT_TEXT DOK RULE:
- Use hot_text mainly for identifying evidence from the stimulus.
- For DOK 1, ask students to identify a fact, observation, term, model part, or explicitly stated relationship.
- For DOK 2, ask students to select evidence that supports a relationship, cause/effect, data pattern, process, or model interpretation.
- For DOK 3, only use hot_text when the task asks students to select the strongest evidence for a conclusion, prediction, explanation, or claim.
- Avoid DOK 3 hot_text stems that ask students to perform broad analysis when the task only allows selecting one text span.
`;

export const SCIENCE_HOT_TEXT_BEST_EVIDENCE_RULES = `
SCIENCE HOT_TEXT BEST EVIDENCE RULE:
- If the stem asks for the "best" evidence, the correct target must be clearly stronger than every distractor target.
- Do not include another target that could also reasonably support the same claim, conclusion, prediction, relationship, or explanation.
- If two sentences both support the same answer, revise the stem to make the task more specific.
- Distractor targets may be related, but they must not answer the exact stem as well as the correct target.

SCIENCE HOT_TEXT PRECISION RULE:
- For hot_text, the stem must point to one exact evidence purpose.
- If the correct target is about decomposers, name decomposers in the stem.
- If the correct target is about producers, name producers in the stem.
- If the correct target is about herbivores, name herbivores in the stem.
- If the correct target is about consumers, name consumers in the stem.
- Avoid broad stems such as:
  - "Select the sentence that explains energy flow."
  - "Select the sentence that explains matter cycling."
  - "Select the sentence that best supports ecosystem balance."
- Prefer precise stems such as:
  - "Select the sentence that explains how decomposers return nutrients to the soil."
  - "Select the sentence that explains how producers begin energy flow."
  - "Select the sentence that explains how herbivores transfer energy from producers to consumers."
  - "Select the sentence that explains how decomposers support new plant growth."
`;

export const SCIENCE_CONSTRUCTED_RESPONSE_RULES = `
SCIENCE CONSTRUCTED_RESPONSE RULE:
- A passage/stimulus IS REQUIRED.
- The stem must ask students to answer in 2-4 complete sentences.
- The prompt should require evidence or science reasoning from the stimulus.
- The correct_answer must be a concise model response, around 1-3 sentences.
- Include a scoring_rubric with keys "0", "1", and "2".
- The 0-point rubric should describe no response, off-topic response, unsupported response, or scientifically inaccurate response.
- The 1-point rubric should describe a partial response that addresses the prompt but lacks enough evidence, science accuracy, or reasoning.
- The 2-point rubric should describe a complete response with clear evidence and correct science reasoning.
`;

export const SCIENCE_CONSTRUCTED_RESPONSE_DOK_RULES = `
SCIENCE CONSTRUCTED_RESPONSE DOK RULE:
- DOK 1 constructed response should ask for a simple identification or explanation using one piece of evidence.
- DOK 2 constructed response should ask students to explain a relationship, cause/effect, model role, data pattern, or science concept using evidence.
- DOK 3 constructed response should ask students to justify, evaluate, predict, or explain using more than one detail from the stimulus.
- DOK 3 should not be answerable by copying one sentence from the stimulus.
`;

export function getScienceQuestionTypeRules({ question_type, skill_focus }) {
  switch (question_type) {
    case "multiple_choice":
      return SCIENCE_MULTIPLE_CHOICE_RULES;

    case "multi_select":
      return `${SCIENCE_MULTI_SELECT_RULES}
${SCIENCE_MULTI_SELECT_DOK_RULES}
${skill_focus === "energy_flow" ? SCIENCE_ENERGY_FLOW_MULTI_SELECT_RULES : ""}`;

    case "hot_text":
      return `${SCIENCE_HOT_TEXT_RULES}
${SCIENCE_HOT_TEXT_DOK_RULES}
${SCIENCE_HOT_TEXT_BEST_EVIDENCE_RULES}`;

    case "constructed_response":
      return `${SCIENCE_CONSTRUCTED_RESPONSE_RULES}
${SCIENCE_CONSTRUCTED_RESPONSE_DOK_RULES}`;

    default:
      return "";
  }
}

export function buildScienceAvoidPreviousAttempts(previous_attempts = []) {
  if (!previous_attempts.length) return "";

  const safeAttempts = previous_attempts
    .map((a) => {
      try {
        const q =
          typeof a.question_json === "string"
            ? JSON.parse(a.question_json)
            : a.question_json;

        return {
          stem: q?.stem,
          skill_focus: q?.skill_focus,
          assessment_move: q?.assessment_move,
          correct_answer: q?.correct_answer,
        };
      } catch {
        return {
          stem: a?.stem ?? null,
        };
      }
    })
    .filter((a) => a.stem || a.skill_focus || a.assessment_move);

  if (!safeAttempts.length) return "";

  return `IMPORTANT — Avoid repeating these previous attempts in this session:
${JSON.stringify(safeAttempts, null, 2)}`;
}

export function buildSciencePassageInstruction({
  question_type,
  dok_level,
  content_focus,
  stimulus,
}) {
  const requiresStimulus =
    question_type === "hot_text" ||
    question_type === "constructed_response" ||
    question_type === "multi_select";

  if (stimulus) {
    return `CRITICAL — Use this exact passage for this question. Do NOT generate a new passage:
"${stimulus}"
The passage field in your JSON must be this exact text verbatim.`;
  }

  if (content_focus) {
    return `CRITICAL — A passage IS REQUIRED for this question. Generate an original 160-240 word focused classroom science passage about: ${content_focus}. Do not write a standalone stem. The passage field must not be empty.`;
  }

  if (requiresStimulus) {
    return `Generate an original 150-230 word science passage appropriate for the TEKS standard, skill_focus, assessment_move, and DOK level.`;
  }

  if (Number(dok_level) === 1) {
    return `A passage is optional for this DOK 1 standalone question. If the question requires evidence, a model, a scenario, or data, include a brief 100-180 word passage. Otherwise set "passage": null.`;
  }

  return `Generate an original 150-230 word science passage if it helps assess the TEKS standard, skill_focus, assessment_move, and DOK level.`;
}

export function buildScienceFocusNote({ content_focus, stimulus }) {
  if (stimulus || !content_focus) return "";

  return `Content Focus: Anchor all passages and questions in the context of "${content_focus}". Do not use unrelated topics, systems, models, organisms, or processes.`;
}

export function buildScienceOutputSchema({
  teks_standard,
  dok_level,
  question_type,
  buildAnswerFields,
  buildNextQuestionLogic,
}) {
  return `Return a single JSON object with this exact shape:
{
  "teks_standard": "${teks_standard}",
  "dok_level": ${dok_level},
  "question_type": "${question_type}",
  "passage": "<when content_focus is set: always include a 160-240 word passage about that topic, even at DOK 1. When no content_focus: omit only for DOK 1 recall stems, include 100-230 word scenario for DOK 2-3 and all hot_text/constructed_response/multi_select>",
  "stem": "<the question prompt shown to the student>",
  ${buildAnswerFields(question_type, dok_level)},
  "explanation": "<why the correct answer is correct, referencing the TEKS standard, scientific reasoning, evidence, and DOK level>",
${question_type === "constructed_response" ? `"scoring_rubric": { "0": "No response or completely off topic.", "1": "Partial — addresses the prompt but lacks scientific evidence or reasoning.", "2": "Complete — clear response with explicit scientific evidence and accurate terminology." },` : ""}  ${buildNextQuestionLogic(dok_level, question_type)}
}`;
}