// /app/api/v2/generators/elaPromptParts.js
export function buildElaTeksClusterPassageRules({
  primaryTeks,
  supportedTeks = [],
}) {
  const supportingList =
    supportedTeks.length > 0 ? supportedTeks.join(", ") : "none";

  return `
TEKS PACKAGE ALIGNMENT

Primary TEKS:
${primaryTeks}

Supporting TEKS:
${supportingList}

Write the passage primarily to support assessment of ${primaryTeks}.

The passage must also contain sufficient explicit and implicit textual evidence to support valid questions aligned to the listed supporting TEKS.

Do not force every supporting standard into the passage unnaturally.
Do not mention TEKS codes in the passage.
The primary TEKS must remain the strongest and most fully developed alignment.
`.trim();
}
// ─────────────────────────────────────────────────────────────────────────────
// DOK DESCRIPTORS
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_DOK_DESCRIPTORS = {
  1: "recall and reproduction — basic fact retrieval, literal comprehension, defining vocabulary in context",
  2: "skills and concepts — inference, author's purpose, text structure, comparing ideas within a text",
  3: "strategic thinking — evaluating author's choices, synthesizing across texts, supporting claims with textual evidence",
};

// ─────────────────────────────────────────────────────────────────────────────
// HEADER / CORE ALIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

export function buildELAHeader({
  teks_standard,
  teksDescription,
  grade_level,
  dok_level,
  dokDesc,
  question_type,
  skill_focus,
  assessment_move,
}) {
  return `Generate one Grade ${grade_level} ELA question.

TEKS Standard: ${teks_standard}${teksDescription ? `\nTEKS Description: ${teksDescription}` : ""}
${skill_focus ? `Skill Focus: ${skill_focus} — this is the specific ELA skill to assess, distinct from the broader TEKS standard.\n` : ""}
${assessment_move ? `Assessment Move: ${assessment_move} — the question must directly perform this task.\n` : ""}DOK Level: ${dok_level} — ${dokDesc}
Question Type: ${question_type}`;
}

export const ELA_BASE_ALIGNMENT_RULES = `
ELA ALIGNMENT RULE:
- The passage, stem, correct answer, distractors, and explanation must all match the TEKS standard, skill_focus, assessment_move, and DOK level.
- The question must assess the selected skill_focus, not just the broader TEKS standard.
- If assessment_move is provided, the question must directly perform that task.
- The explanation must clearly connect the correct answer to the passage and to the TEKS-aligned ELA skill.
- Do not create questions that can be answered without reading the passage unless the question type intentionally does not require a passage.
- Do not drift into a different genre, standard, or skill focus.
`;

export const ELA_TITLE_CONSISTENCY_RULES = `
ELA TITLE CONSISTENCY RULE:
- If a title is provided below, the passage's internal title line (e.g., "Title: ...") must use that exact title, word for word.
- Do not invent a different title.
- If no title is provided, choose a title that clearly reflects the Content Focus and use it consistently in the internal title line.
`;

export const ELA_ANSWER_CONSISTENCY_RULES = `
ELA ANSWER CONSISTENCY RULE:
- The correct_answer id must match the intended correct answer choice or target.
- The explanation must describe the exact correct answer text or target.
- Do not identify the correct answer by letter in the explanation.
- Do not write "The correct answer is A/B/C/D."
- Do not write "Option A/B/C/D is correct."
- Do not write "option A/B/C/D is correct."
- Do not write "Choice A/B/C/D is correct."
- Do not write "choice A/B/C/D is correct."
- Instead, explain using the answer text only.
- Before finalizing, verify the explanation does not refer to any answer letter.
`;

export const ELA_CONTENT_FOCUS_RULES = `
ELA CONTENT FOCUS RULE:
- If Content Focus is provided, treat it as the teacher's lesson objective, not just a topic suggestion.
- The passage, stem, correct answer, distractors, and explanation must stay centered on the Content Focus.
- Do not drift to unrelated genres, topics, skills, or themes.
- If the Content Focus names a genre, theme, reading skill, author craft move, or type of inference, the passage and question must directly support it.
- The question should assess the Content Focus through the selected skill_focus and assessment_move.

MULTI-COMPONENT CONTENT FOCUS RULE:
- If Content Focus names multiple distinct narrative components (for example, separated by commas or "and" — such as a misunderstanding, a complication, a choice, or a deadline), the passage must include EACH named component as a separate, clearly identifiable story beat.
- Do not merge two named components into a single event. Each component must be distinguishable from the others in the plot.
- Do not resolve or drop a named component early. If a Difficult Choice is required, the passage must explicitly establish both competing actions before the protagonist decides. The reader should understand why a reasonable person could choose either action.
- If a deadline or time pressure is named, the passage must make the deadline concrete (a specific time, a countdown, a closing window) and the pressure must still be present when the competing priorities occurs.
If any condition is not met, rewrite the passage.

- Before finalizing, verify each named component in the Content Focus is separately and clearly present in the passage. If any component is missing, weak, or merged with another, rewrite the passage before returning it.
`;

export const ELA_STORY_PLANNING_RULES = `
ELA STORY PLANNING RULE:
Before writing the passage, first determine the underlying story structure. Do not begin writing until the story satisfies the requested Content Focus.

Internally identify:
- The protagonist's initial goal or responsibility.
- The misunderstanding or triggering event.
- The second complication that increases the conflict.
- The approaching deadline or source of time pressure, if required.
- The protagonist's two competing courses of action.
- The meaningful benefit of choosing the first action.
- The meaningful benefit of choosing the second action.
- The meaningful cost or consequence of choosing each action.
- The turning point that forces the protagonist to decide.
- The action or immediate consequence that concludes the excerpt.

The passage should then be written from this plan naturally. Do not output the planning notes.

STORY PLAN VALIDATION:
Before writing the passage, verify the planned story.
- Every Content Focus component has its own identifiable story event.
- The misunderstanding directly affects later events.
- The second complication makes the original problem more difficult rather than resolving it.
- The competing priorities exists because the misunderstanding and the second complication combine to create competing priorities.
- The protagonist has at least two reasonable actions.
- Each action has a meaningful advantage.
- Each action has a meaningful disadvantage.
- If one option is obviously better than the other, redesign the story before writing.

CRITICAL — NAMING A CHOICE IS NOT THE SAME AS BUILDING ONE:
A line like "Should I do A or B?" is NOT a difficult choice by itself. A difficult choice only exists if choosing one option actually costs something the character cannot get back — time, trust, an opportunity, someone else's wellbeing, or a responsibility left unmet. If the character can do both options back-to-back with no real loss, the choice was fake. Redesign the story so that picking one option necessarily means NOT fully getting the other.

EXAMPLE OF A PASSAGE THAT CORRECTLY BUILDS A DIFFICULT CHOICE:
A student overhears a partial conversation and believes a teammate abandoned a shared responsibility before a deadline (misunderstanding). Time is running out (deadline). The student finds the teammate and learns the teammate has a second, unrelated obligation — a family member urgently needs something only the teammate can provide, and that obligation has its own closing window at nearly the same time (second complication). The two of them now face one real choice: the teammate could stay and help finish the shared work (benefit: the deadline is met safely; cost: the family obligation is missed or put at risk), or the teammate could leave to handle the family obligation (benefit: the family need is met; cost: the shared work may not be finished in time, unless someone else steps in and takes on real risk to cover it). The passage shows the two characters explicitly weighing both options — naming what is gained and what is lost with each — before one character makes a decisive choice and personally absorbs the resulting risk or effort. The excerpt ends showing the immediate result of that choice, not just the moment of deciding.

Do not copy this example's plot. Use only its STRUCTURE: two options, each with a real and different cost, explicitly weighed before a decision is made and acted on.
`;

export const ELA_VARIETY_RULES = `
ELA VARIETY RULE:
- Do not repeatedly assess the same sentence, detail, character action, inference, word, or piece of evidence across previous_attempts.
- If previous_attempts already used one passage detail as the correct answer, choose a different detail or inference target.
- Vary inference targets across character feelings, motivation, relationships, setting clues, cause/effect, theme clues, author's craft, and evidence strength when appropriate.
- Avoid repeating the same stem structure across the session.
`;

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDED STIMULUS / SAME PASSAGE RULES
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_PROVIDED_STIMULUS_RULES = `
PROVIDED STIMULUS RULE:
- A passage/stimulus has already been provided.
- Do NOT generate a new passage.
- Do NOT rewrite, shorten, summarize, simplify, replace, or improve the passage.
- Use the provided passage exactly as the source text.
- The passage field in the returned JSON must match the provided passage verbatim.
- Generate only the question, answer options or targets, correct answer, explanation, scoring logic, and next question logic.
- The correct answer must be directly supported by the provided passage.
- The explanation must reference details from the provided passage.
- Do not invent facts, lines, events, dialogue, stage directions, stanzas, or sentences that are not in the provided passage.
- For hot_text, every hot_text target must be copied exactly from the provided passage.
`;

export const ELA_SAME_PASSAGE_VARIETY_RULES = `
ELA SAME-PASSAGE VARIETY RULE:
- When stimulus is provided, do not keep asking about the same inference, same character trait, same sentence, same line, same scene, same stanza, or same evidence detail.
- Across a session, vary the correct answer target even when using the same passage.
- Do not repeatedly use the same action, sentence, line, phrase, or detail as the correct answer.
- If previous_attempts already assessed one detail, choose a different detail or a different thinking task.
- If previous_attempts already used one scene, stanza, paragraph, or section as the correct target, consider another scene, stanza, paragraph, or section when the passage supports it.
- Avoid repeating the same stem frame across the session.
`;

export const ELA_STIMULUS_DESIGN_RULES = `
ELA STIMULUS DESIGN RULE:
- Write the passage as a focused classroom reading selection, not as disconnected details.
- The passage must support the TEKS, content_focus, skill_focus, assessment_move, and DOK level.
- Use grade-appropriate vocabulary and sentence structure.
- For Grade 6-8, use a clear middle-school reading level.
- The passage should include enough context for students to infer, identify evidence, analyze character or author choices, or connect ideas.
- Avoid passages where each question can be answered by matching one obvious sentence unless the question is intentionally DOK 1.
- For DOK 2 and DOK 3, include clues that require students to connect details.
- Do not make the passage overly long or unfocused.

ELA SAME-STIMULUS INFERENCE DEPTH RULE:
- When generating a passage for inference, implicit_meaning, or text_evidence, include at least 2-3 different inference targets.
- The passage should support more than one valid question across the same session.
- Include clues for different targets, such as:
  - character feeling
  - character motivation
  - conflict or problem
  - relationship between events
  - setting influence
  - character change from beginning to end
  - theme or lesson
- Do not build the entire passage around only one obvious inference.
- Avoid passages where every question is about the same feeling, action, or detail.
`;

// ─────────────────────────────────────────────────────────────────────────────
// LITERARY: PLOT
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_PLOT_ELEMENTS_RULES = `
ELA PLOT ELEMENTS RULE:
- If the TEKS standard is 6.7C, 7.7C, or 8.7C, the passage must contain a clear plot structure.
- Include enough story development for students to identify or analyze:
  - conflict or problem
  - rising action
  - climax or turning point
  - falling action
  - resolution
- Do not use an overly short event summary with only one simple problem and immediate resolution.
- The passage should include at least 6-8 sentences when assessing plot elements.
- If asking about climax, the correct answer must be the true turning point of the story, not just the final action.
- If asking about resolution, the correct answer must show how the main conflict is solved.
- If asking about rising action, the correct answer must show events that build tension before the turning point.
`;

export const ELA_GRADE_7_PLOT_RULES = `
ELA GRADE 7 PLOT RULE:
- For 7.7C, include plot elements that allow students to analyze foreshadowing and suspense.
- The passage should include at least one clue, warning, unusual detail, or unresolved question that builds suspense.
- The foreshadowing clue must connect clearly to a later event.
- Do not ask about foreshadowing unless the passage actually includes a meaningful earlier clue.
- Do not ask about suspense unless the passage includes tension, uncertainty, danger, pressure, or delayed information.
`;

export const ELA_GRADE_8_PLOT_RULES = `
ELA GRADE 8 PLOT RULE:
- For 8.7C, the passage must include at least one clearly identifiable non-linear or complex plot structure:
  - flashback
  - foreshadowing
  - subplot
  - parallel plot structure
- If using flashback, clearly signal a shift to an earlier time with phrases such as "years earlier," "last spring," "she remembered," or "the memory returned."
- Do not label ordinary background information as a flashback.
- If the assessment_move is explain_flashback_effect, the passage must include a true flashback that changes the reader's understanding of the present conflict.
- If using parallel plot structure, include two clearly comparable plot threads that develop side by side.
- If using subplot, the subplot must connect meaningfully to the main plot.
- Do not use non-linear structure as decoration; it must affect the reader's understanding of character, conflict, theme, or resolution.
`;

// ─────────────────────────────────────────────────────────────────────────────
// LITERARY: POETRY
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_POETRY_RULES = `
ELA POETRY RULE:
- If the TEKS standard is 6.8B, 7.8B, or 8.8B, the passage/stimulus must be a short original poem, not a prose passage.
- The poem should be grade-appropriate and should include enough visible structure for the question to analyze how form affects meaning.
- Preserve line breaks in the poem.
- Do not flatten the poem into a paragraph.
- Questions must ask how a poetry element affects meaning, mood, pacing, emphasis, voice, rhythm, or message.
- Avoid asking students only to identify a poetry element unless the question is DOK 1.
- Do not name the poetry elements directly inside the poem in a way that gives away the answer.
- The poem should demonstrate rhyme, meter, punctuation, capitalization, line breaks, or graphical elements through its structure.
- Avoid lines such as "Punctuation pauses," "Capital letters show," "Rhyme creates," or "Meter makes."
- Students should infer the effect of the poetic element from how the poem is written, not from the poem explaining itself.
- For DOK 1 poetry_structure questions, avoid answer choices where all options are valid poetry elements unless only one is clearly emphasized in the stem.
- Prefer asking about a specific visible feature, such as rhyme pattern, repeated punctuation, short line, long line, stanza break, or unusual capitalization.
- Distractors should be less supported by the poem, not just other poetry terms.
`;

export const ELA_GRADE_6_POETRY_RULES = `
GRADE 6 POETRY RULE:
- For 6.8B, focus on meter, rhythm, stanzas, and line breaks.
- The poem should include noticeable rhythm or repeated structure.
- The question may ask how line breaks emphasize words, slow the reader, create rhythm, or shape meaning.
- Do not focus on rhyme scheme, punctuation, capitalization, or graphical elements unless they support the main meter/structure focus.
`;

export const ELA_GRADE_7_POETRY_RULES = `
GRADE 7 POETRY RULE:
- For 7.8B, focus on rhyme scheme, meter, punctuation, and capitalization.
- The stimulus must be an original poem that USES these elements naturally.
- The poem must NOT explain, name, define, or mention the poetry elements being assessed.
- Do NOT include instructional lines such as:
  - "Each line begins with capitals"
  - "The rhyme scheme flows"
  - "Punctuation pauses"
  - "Capital letters show"
  - "Rhyme creates"
  - "Meter makes"
  - "Line breaks show"
  - "Punctuation dances"
  - "Comma slows"
  - "Commas"
  - "Capital letters"
  - "Capitals"
  - "Capitalization"
  - "Line length"
  - "Long lines"
  - "Short lines"
  - "Poetry structure"
  - "Structural elements"
  - "Graphical elements"
- The poem should demonstrate rhyme, meter, punctuation, and capitalization through its form, not through explanation.
- Students should infer the effect of the poetic element from how the poem is written.
- Do not ask about rhyme scheme unless a clear rhyme pattern exists.
- Do not ask about capitalization unless capitalization is used purposefully beyond ordinary capitalization at the beginning of each line.
- Ordinary capitalization at the beginning of each line does not count as meaningful capitalization.
- If asking about capitalization, the poem must include purposeful unusual capitalization, such as all caps, repeated capitalization, or capitalization used for emphasis.
- Do not ask about punctuation unless punctuation changes pacing, emphasis, or meaning.
`;

export const ELA_GRADE_8_POETRY_RULES = `
GRADE 8 POETRY RULE:
- For 8.8B, focus on graphical elements, punctuation, and line length.
- The poem should include visible structural choices such as short/long lines, spacing, repeated punctuation, unusual punctuation, isolated words, or visual arrangement.
- The question should ask how those visual or graphical choices affect meaning, pacing, mood, emphasis, or voice.
- Do not ask about graphical elements unless the poem visibly includes them.
- Do not name the poetry elements directly inside the poem in a way that gives away the answer.
- The poem should include purposeful punctuation or capitalization when the question asks about pacing, emphasis, tone, or meaning.
`;

// ─────────────────────────────────────────────────────────────────────────────
// LITERARY: DRAMA
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_DRAMA_RULES = `
ELA DRAMA FORMAT RULE:
- If the TEKS standard is 4.9C, 5.9C, 6.8C, 7.8C, or 8.8C, the stimulus must be written as a short drama excerpt, not a prose passage or poem.
- Include a title.
- Include a Characters list.
- Character descriptions should identify role or relationship only, such as "a student," "a classmate," "a teacher," "a friend," or "a neighbor."
- Do not describe emotions, personality traits, motivations, worries, or behavior in the Characters list.
- Do not directly label character traits that students are supposed to infer, such as "confident," "shy," "brave," "nervous," "caring," "angry," "diligent," "curious," or "outgoing."
- Let dialogue and stage directions reveal character traits.
- Include clearly labeled scenes, such as SCENE 1, SCENE 2, and when appropriate SCENE 3.
- Use numbered lines throughout the drama excerpt.
- Continue line numbering across scenes. Do not restart numbering at each scene.
- Include character tags in all caps followed by a colon.
- Include stage directions in brackets.
- Include dialogue that reveals character, conflict, or dramatic action.
- Preserve drama formatting and line breaks.
- Do not flatten the excerpt into a paragraph.
- Do not explain the drama elements inside the excerpt.
- Do not include labels such as "Initial Problem," "Complication," "Turning Point," or "Partial Resolution" inside the generated excerpt.
`;

export const ELA_GRADE_4_5_DRAMA_RULES = `
GRADE 4-5 DRAMA RULE:
- For 4.9C and 5.9C, focus on drama structure such as character tags, acts, scenes, and stage directions.
- The question may ask students to identify or explain the purpose of character tags, stage directions, acts, or scenes.
- Do not require advanced analysis of dramatic action for grades 4-5.
`;

export const ELA_GRADE_6_7_DRAMA_RULES = `
GRADE 6-7 DRAMA RULE:
- For 6.8C and 7.8C, focus on how playwrights develop characters through dialogue and staging.
- The drama excerpt must include dialogue that reveals character traits, motivations, relationships, or changes.
- Stage directions must show meaningful actions, gestures, movement, pauses, or expressions.
- Questions should connect dialogue or staging to character development.
`;

export const ELA_GRADE_8_DRAMA_RULES = `
GRADE 8 DRAMA RULE:
- For 8.8C, the excerpt must show dramatic action developing across scenes.
- The passage must contain enough escalation, turning-point pressure, and partial resolution for DOK 2 and DOK 3 analysis.
- The excerpt must feel like a complete dramatic arc.

SCENE COUNT:
- Use THREE scenes minimum.
- Use FOUR scenes when the conflict involves overheard information, misunderstanding, deadline pressure, competing obligations, discovery, revelation, or meaningful consequence.
- A TWO-scene drama is not allowed.

SCENE 1 — INITIAL CONFLICT:
- Introduce a concrete dramatic problem with stakes tied to responsibility, reputation, trust, relationship, obligation, promise, or group responsibility.
- Include a detail that can become more important later.
- Show why the misunderstanding, secret, discovery, overheard information, disagreement, or hidden plan matters.
- Use numbered stage directions to conceal or reveal information, show hesitation, or establish tension.
- Scene 1 must leave room for meaningful escalation.

SCENE 2 — ESCALATION:
- Scene 2 must make the conflict harder, riskier, or more emotionally difficult than Scene 1.
- Include at least TWO of:
  - new consequence
  - increased pressure
  - deadline becoming urgent
  - revelation that changes understanding
  - second misunderstanding
  - partial truth creating uncertainty
  - competing obligation
  - discovery worsening the conflict
  - another character’s complicating action
  - damage to trust or relationship
  - responsibility becoming harder to fulfill
- Scene 2 must NOT clarify or solve the Scene 1 problem.
- Scene 2 must introduce a new development that changes what the character can realistically do next.
- By the end of Scene 2, at least one option from Scene 1 should become harder or less available.

SCENE 3 — TURNING POINT:
- Scene 3 must contain a meaningful decision, confrontation, realization, admission, warning, sacrifice, or action.
- Include a turning-point event (revelation, consequence, deadline shift, refusal, discovery, or confrontation) that forces commitment.
- The turning point must change the character’s available choices or raise the cost of one option.
- Include numbered stage directions showing emotional change, urgency, hesitation, or relationship shift.
- Scene 3 must change the audience’s understanding of an earlier detail or event.
- Scene 3 must NOT end with wondering alone.
- The character must begin carrying out a meaningful choice.

SCENE 4 — PARTIAL RESOLUTION:
- Use Scene 4 when stakes, consequences, or competing obligations require more space for believable resolution.
- Scene 4 must show the character acting on the turning-point decision.
- Resolve the immediate dramatic problem enough for completeness.
- Leave at least one lingering consequence, uncertainty, relationship issue, responsibility, or future effect.
- Include numbered stage directions showing changed relationships or responsibilities.
- Scene 4 must NOT fully resolve every problem or end with a neat, low-stakes conclusion.
- Show a consequence of the decision, not merely the decision itself.
- Avoid convenient solutions that eliminate the tradeoff.

DRAMATIC ESCALATION:
- Required progression:
  Scene 1: initial problem
  → Scene 2: complication or consequence increasing pressure
  → Scene 3: meaningful turning point or tradeoff
  → Scene 4 (when needed): action + partial resolution + lingering consequence
- The final choice must require cost, sacrifice, delay, damaged trust, missed opportunity, or unresolved obligation.
- Each later scene must meaningfully develop earlier events.
- At least one early detail must become more important later.
- At least one later revelation or action must change understanding of an earlier event.
- Avoid the weak pattern:
  misunderstanding → clarification → easy decision → neat ending.

DRAMATIC DENSITY:
- Include at least FOUR of:
  - misunderstanding changing interpretation
  - competing obligations
  - secret or incomplete truth
  - meaningful consequence
  - decision with real tradeoff
  - revelation increasing pressure
  - scene shift changing understanding
  - deadline pressure
  - relationship affected
  - damage to trust or reputation
  - responsibility to another person or group
  - another character’s complicating action
  - final action resolving one problem but leaving another open
- At least ONE must be a meaningful consequence.
- At least ONE must increase pressure after Scene 1.
- A misunderstanding alone is not enough.

STAKES:
- Stakes must be emotionally or socially meaningful.
- Stakes must involve responsibility, trust, reputation, obligation, relationship, promises, consequences for others, or competing priorities.
- Avoid conflicts where one option is obviously correct or carries almost no cost.

STAGE DIRECTIONS:
- Stage directions must contribute to dramatic action.
- Use them to build tension, reveal hesitation, conceal information, show reactions, mark conflict shifts, increase suspense, reveal changing relationships, or signal important details.
- Number all stage-direction lines.

CONTENT FOCUS RIGOR:
- The content_focus must create the initial situation; add at least one new development that complicates it.
- Overheard information must change understanding or create consequence.
- Misunderstanding must create or contribute to later consequence.
- Deadline pressure must interact with another obligation or consequence.
- Competing obligations must both be legitimate and create cost.
- Discovery or revelation must change understanding and create pressure.
- Do not use:
  misunderstanding → clarification → obvious decision → neat ending.

COMPLETENESS:
- The excerpt must include:
  problem → escalation → turning point → partial resolution → lingering consequence.
- The turning point must lead to action.
- The final scene must show the effect of the decision.

DOK 3 SUPPORT:
- Include enough connected evidence for DOK 3 analysis.
- Provide details that can be compared or connected across scenes.
- Include cause-and-effect relationships and early details whose meaning changes later.

LENGTH:
- Aim for 14–22 lines total.
- Use 4–7 lines per scene.
- Scene 2 must be long enough to escalate.
`;

export const ELA_GRADE_8_DRAMA_QUESTION_RULES = `
GRADE 8 DRAMA QUESTION RULE:
- For 8.8C, the question must focus on how acts, scenes, stage directions, plot details, key details, revelations, decisions, suspense, tension, or conflict develop dramatic action.
- Do not ask students only to identify character tags, speaker labels, or basic stage directions.
- Do not ask a generic character-trait question.
- If the question mentions stage directions, it must ask how they build tension, reveal danger, create suspense, advance action, or develop conflict.
- If the question mentions dialogue, it must connect that dialogue to dramatic action, conflict, tension, a revelation, a decision, or a turning point.
- Do not use the phrase "parallel plot detail" in student-facing stems.
- Prefer natural student-facing wording such as "new information," "misunderstanding," "choice," "decision," "turning point," "clarification," "consequence," or "resolution."
- Strong 8.8C questions may ask about:
  - details from stage directions that build dramatic action
  - how details build toward the highest point of tension
  - evidence of an initial problem and a later complication
  - how two key details create suspense or conflict
  - how a final scene creates a short resolution to the conflict
- For 8.8C, answer choices should explain how a scene action, dialogue exchange, stage direction, or revealed detail advances the conflict or changes the direction of the play.

8.8C REUSE PREVENTION:
- Do not reuse the same scene target.
- Do not reuse the same correct target text.
- Do not reuse the same assessment_move unless no other valid move exists.
`;

export const ELA_GRADE_4_5_DRAMA_EXCERPT_MODEL = `
GRADE 4-5 DRAMA EXCERPT MODEL:
- The example below shows the desired tone, format, and completeness for elementary drama.
- Do not copy the title, names, plot, setting, or wording.
- Generate a new original drama excerpt based on the requested content_focus.
- The excerpt should be simple, clear, and complete enough for students to understand the beginning, middle, and end.
- The focus should be on drama structure, character tags, stage directions, scenes, and how those parts help the reader understand the play.

MODEL EXCERPT:

Title: The Lost Poster

Characters
MIA: a student
CARLOS: Mia's classmate
MS. LEE: their teacher

SCENE 1
1 [MIA and CARLOS stand beside a table covered with art supplies.]
2 MIA: The fair starts soon, but our poster is missing.
3 CARLOS: [Looking under the table.] I put it right here after lunch.

SCENE 2
4 [MS. LEE enters, carrying a stack of papers.]
5 MS. LEE: I saw a poster by the front office.
6 MIA: [Smiling with relief.] That must be ours!
7 CARLOS: Let's get it before the doors open.

SCENE 3
8 [MIA and CARLOS return with the poster.]
9 MS. LEE: [Pointing to the wall.] Hang it where everyone can see it.
10 MIA: Now people will know where to go.
11 [CARLOS tapes the poster to the wall as students begin entering.]

MODEL USE RULE:
- Follow the model's simple drama format and complete structure.
- Do not reuse the model's poster, school fair, characters, or wording.
`;

export const ELA_GRADE_8_DRAMA_EXCERPT_MODEL = `
GRADE 8 DRAMA EXCERPT MODEL:
- The example below shows the desired tone, pacing, dramatic density, and completeness for 8.8C drama.
- Do not copy the title, names, setting, conflict, plot, or wording.
- Generate a new original drama excerpt based on the requested content_focus.
- The excerpt should be much shorter than a STAAR passage, but it should still include a beginning, middle, turning point, and short resolution.
- The drama should include enough conflict, pressure, misunderstanding, or consequence for DOK 2 and DOK 3 questions.
- SCENE 3 should include a decision, consequence, confrontation, or action that is caused by the misunderstanding or reveal in Scene 2.
- SCENE 3 must not simply clarify the misunderstanding.
- SCENE 3 should contain a turning point or consequence that creates meaningful action.

MODEL EXCERPT:

Title: The Hidden Schedule

Characters
LEAH: a stage crew member
TREVOR: Leah's friend
MS. RIVERA: the drama teacher
JORDAN: a student actor

SCENE 1
1 [Backstage after rehearsal, LEAH sorts through prop lists while glancing at the bulletin board.]
2 TREVOR: [Entering quickly.] Jordan said the rehearsal schedule might be changing again.
3 LEAH: Changing? We just finalized the lighting cues. If the schedule shifts, everything will fall apart.
4 [LEAH notices a crumpled paper tucked behind the bulletin board and pulls it out slowly.]

SCENE 2
5 [Later, LEAH pauses outside the costume room when she hears voices inside.]
6 JORDAN: [From inside.] I told Ms. Rivera the cast needed more time, so I suggested moving Friday's rehearsal.
7 MS. RIVERA: But the tech crew already planned the scene transitions. A shift now could ruin the timing.
8 [LEAH lowers the crumpled paper, realizing it is an early draft of a changed schedule.]
9 TREVOR: [Approaching quietly.] I heard someone say the principal wants a preview performance. That could force another change.

SCENE 3
10 [LEAH steps into the hallway, clutching the draft schedule.]
11 LEAH: Jordan, the crew can't keep adjusting. Why didn't you tell us you were pushing for a change?
12 JORDAN: [Sighing.] I wasn't trying to cause chaos. I thought more rehearsal time would help everyone.
13 MS. RIVERA: If we combine your idea with the crew's plan, we might keep Friday's rehearsal and still prepare for a preview.
14 [LEAH nods slowly, then hands the draft schedule to JORDAN.]
15 LEAH: Let's rewrite the timing together before the cast leaves.
16 [JORDAN and LEAH move toward the costume room, already discussing adjustments.]

MODEL USE RULE:
- Follow the model's tone, density, scene-to-scene development, and short complete arc.
- Do not reuse the model's schedule, rehearsal, stage crew, school play, preview performance, characters, or wording.
- The generated excerpt should include a concrete first problem, a later reveal that changes the audience's understanding, and a final action that partially resolves the immediate conflict.

MODEL QUESTION VARIETY FOR 8.8C HOT TEXT:
- The example below shows how questions should rotate across different dramatic functions.
- Do not copy these exact names, situations, or answer text.
- Use the same variety pattern when generating hot_text questions for 8.8C drama.

Example hot_text focus rotation:
1. Initial false belief:
   Stem: Which line shows what the character first believes incorrectly?
   Target: the line where the character reacts to incomplete or misunderstood information.

2. New information:
   Stem: Which line reveals information that changes the character's understanding of the situation?
   Target: the dialogue line that states the new information.

3. Character realization:
   Stem: Which stage direction shows the character realizing the earlier understanding was wrong?
   Target: the stage direction showing the reaction or realization.

4. Difficult choice:
   Stem: Which detail shows the moment the character must decide between two risks?
   Target: the line where the character names the choice, risk, or competing options.

5. Decision:
   Stem: Which line shows the character deciding what to do about the misunderstanding?
   Target: the dialogue line where the character states the decision.

6. Agreement:
   Stem: Which line shows another character agreeing to help carry out the decision?
   Target: the dialogue line where the other character agrees.

7. Final action:
   Stem: Which stage direction shows the characters beginning to act on their decision?
   Target: the final stage direction showing movement, action, or partial resolution.

- Across the same passage, avoid asking more than one question with the same target function.
- Do not repeatedly ask about only the Scene 2 reveal or misunderstanding.
- A strong 8.8C hot_text set should include targets from different scenes when the passage supports them.
- Avoid using the same scene as the correct target repeatedly.
- If one question targets Scene 2, the next question should consider Scene 1 or Scene 3 when the passage supports it.
- Do not use wording like "parallel plot detail" in the stem; describe the dramatic function naturally.
`;

// ─────────────────────────────────────────────────────────────────────────────
// INFORMATIONAL TEXT / ARGUMENT / AUTHOR CRAFT
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_INFORMATIONAL_TEXT_RULES = `
ELA INFORMATIONAL TEXT RULE:
- For informational TEKS, the passage should be expository, argumentative, procedural, or explanatory rather than fictional.
- The passage should include a clear central idea, supporting details, and logical organization.
- Use grade-appropriate nonfiction language.
- Include enough information for students to analyze relationships among ideas, author's purpose, text structure, claim, evidence, or development of central idea.
- Avoid writing a list of disconnected facts.
- Do not turn informational TEKS into a fictional story unless the TEKS specifically allows literary nonfiction or narrative nonfiction.
`;

export const ELA_CENTRAL_IDEA_RULES = `
CENTRAL IDEA RULE:
- The question must focus on the central idea, controlling idea, thesis, or how details develop a central idea.
- The correct answer must be broad enough to cover the whole passage or section, not just one detail.
- Distractors may be true details, but they must be too narrow, unsupported, or not central.
- For DOK 2 or DOK 3, require students to connect multiple details to the central idea.
`;

export const ELA_TEXT_STRUCTURE_RULES = `
TEXT STRUCTURE RULE:
- The question must focus on how the author organizes ideas.
- Possible structures include cause/effect, compare/contrast, problem/solution, sequence, description, classification, or claim/evidence.
- The correct answer must explain how the structure helps develop ideas, relationships, meaning, or purpose.
- Do not ask students to identify a structure unless the passage clearly uses that structure.
- For DOK 2 or DOK 3, ask how the structure affects understanding, emphasis, or development of ideas.
`;

export const ELA_AUTHOR_PURPOSE_RULES = `
AUTHOR PURPOSE / CRAFT RULE:
- The question must focus on why the author includes a detail, chooses a word, organizes information, uses evidence, or develops an idea in a specific way.
- The correct answer must explain the effect of the author's choice.
- Avoid questions that only ask students to label a feature without explaining its purpose or effect.
- Distractors should reflect plausible but unsupported author purposes.
`;

export const ELA_ARGUMENT_RULES = `
ARGUMENT / CLAIM / EVIDENCE RULE:
- The question must focus on claim, evidence, reasoning, counterclaim, support, or argument effectiveness.
- The correct answer must be supported by the passage.
- If asking for evidence, the correct answer must be the strongest evidence for the stated claim.
- If asking about reasoning, the correct answer must explain how evidence supports or fails to support the claim.
- Avoid generic opinion questions.
`;

export const ELA_COMPARE_TEXTS_RULES = `
COMPARE TEXTS / PERSPECTIVES RULE:
- The question must ask students to compare viewpoints, claims, structures, purposes, evidence, or treatment of ideas.
- Each perspective or text feature must be clearly grounded in the passage or paired passages.
- The correct answer must explain a meaningful similarity or difference.
- Avoid vague comparisons that could be answered without close reading.
`;

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE / GRAMMAR BOUNDARY
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_LANGUAGE_GRAMMAR_BOUNDARY_RULES = `
ELA LANGUAGE / GRAMMAR BOUNDARY RULE:
- If the TEKS standard is a language, grammar, revising, or editing standard, do not treat it as a literary comprehension standard.
- The question should assess grammar, usage, sentence structure, punctuation, capitalization, revision, or editing as appropriate to the TEKS.
- Do not force literary passage analysis for grammar-only standards.
- For future scaling, grammar-heavy TEKS should use a dedicated grammar/revising prompt path rather than the full reading-comprehension passage path.
`;

// ─────────────────────────────────────────────────────────────────────────────
// INFERENCE / EVIDENCE / CRAFT COMMON SKILL RULES
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_INFERENCE_RULES = `
ELA INFERENCE RULE:
- For inference or implicit_meaning, the correct answer should require interpreting a clue, not selecting a sentence that directly states the answer.
- If the stem asks about a feeling, motivation, relationship, theme, or implied idea, avoid making the correct answer a sentence that directly names that feeling or idea.
- The correct answer must be supported by passage clues.
- Distractors should be plausible but unsupported, contradicted, too broad, or based on misreading a clue.
- Directly stated evidence is acceptable for text_evidence or locate_supporting_detail, but not for inference-focused questions.
- Do not use the phrase "explicitly inferred." If the task is explicit, ask students to identify evidence. If the task is inferential, ask what can be inferred or implied.
`;

export const ELA_TEXT_EVIDENCE_RULES = `
ELA TEXT EVIDENCE RULE:
- For text_evidence, locate_supporting_detail, or evidence-based assessment moves, the correct answer must be the strongest evidence, not merely a related detail.
- Evidence-gap questions must have one clearly best missing evidence choice.
- Avoid choices that are all similarly useful.
- The explanation must explain why the selected evidence best supports the answer, inference, claim, or conclusion.
`;

export const ELA_IMPLIED_MEANING_PASSAGE_RULES = `
ELA IMPLIED MEANING PASSAGE RULE:
- If skill_focus is inference or implicit_meaning, do not directly state the exact feeling, trait, theme, or implied idea that the question will assess.
- Show the feeling, trait, theme, or implied idea through actions, dialogue, thoughts, choices, setting details, or reactions.
- Avoid sentences such as "determination written all over her face" if the question asks students to infer that the character is determined.
- Avoid directly naming emotions such as nervous, excited, angry, proud, lonely, relieved, or determined when those words are the intended answer.
- The passage should include clues that support the inference, but the answer should not be copied directly from the passage.
`;

export const ELA_NO_DIRECT_TRAIT_LABEL_RULES = `
ELA NO DIRECT TRAIT LABEL RULE:
- If skill_focus is inference or implicit_meaning, the passage must not directly state the exact feeling, trait, motivation, or implied idea that the question will assess.
- Do not write phrases such as:
  - "determination etched across his face"
  - "she felt nervous"
  - "he was proud"
  - "she was relieved"
  - "he felt accepted"
  when that feeling, trait, or implied idea is intended to be the answer.
- Show feelings and traits through actions, dialogue, thoughts, choices, body language, pacing, or reactions instead.
- Better: "Jamie took a deep breath, loosened his grip on the ball, and stepped toward the game."
- Worse: "Jamie stepped forward, determination etched across his face."
`;

// ─────────────────────────────────────────────────────────────────────────────
// DOK RULES
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_DOK_1_RULES = `
ELA DOK 1 RULE:
- Ask students to identify, recall, define, or locate information that is clearly stated in the passage.
- DOK 1 should still be purposeful and aligned to the skill_focus.
- Do not ask broad multi-step inference questions at DOK 1.
- If the skill_focus is inference or implicit_meaning at DOK 1, the inference must be simple and based on one clear clue.

POETRY ANSWER CHOICE RULE:
- For poetry questions, distractors must not be equally visible features in the poem.
- If the correct answer is "line breaks," do not include "meter" or "rhyme scheme" as distractors when those features are also present or strongly suggested.
- Distractors should be clearly less supported by the poem.
`;

export const ELA_DOK_2_RULES = `
ELA DOK 2 RULE:
- Require students to connect at least two details or interpret a relationship in the passage.
- Good DOK 2 tasks include explaining cause/effect, identifying author's purpose, comparing ideas, interpreting character motivation, or choosing evidence for a simple inference.
- Do not make DOK 2 answerable by copying one sentence from the passage.
- The explanation must identify the reasoning connection, not only quote the passage.
`;

export const ELA_DOK_3_RULES = `
ELA DOK 3 RULE:
- Require students to analyze, evaluate, justify, synthesize, or choose the best-supported conclusion.
- DOK 3 should require multiple details from the passage.
- Prefer stems such as:
  - "Which conclusion is best supported..."
  - "Which evidence best supports..."
  - "Which choice best explains how the author..."
  - "Which statement best explains the relationship between..."
  - "Which inference is best supported by the passage?"
- Avoid DOK 3 questions where the answer is a single directly stated sentence.
- For DOK 3, the question should usually require students to connect at least two different moments in the passage, such as the beginning and ending, a problem and response, an idea and supporting evidence, a structure and its effect, or a character action and later reaction.
- Avoid DOK 3 questions that only ask for a single feeling or one directly supported inference.

- For DOK 3 multiple-choice questions, the correct answer must explain a relationship between TWO ideas from the passage.

- The correct option must include both:
  1. the relevant event, clue, conflict, decision, or detail, AND
  2. its effect on the plot, conflict, character understanding, suspense, theme, or later event.

- Do not make the correct answer only identify:
  - what happens
  - what the character decides
  - what the clue suggests
  - what the outcome is

- For suspense or foreshadowing questions, the correct answer must explain:
  earlier clue or uncertainty
  → how it shapes reader expectations or tension
  → how that connects to a later event, conflict, or decision.

- Example structure for a strong correct option:
  "The earlier detail creates uncertainty about ___, which increases tension when ___ later occurs."

- Another valid structure:
  "The clue suggests ___ before the character knows it, which makes the later revelation more significant because ___."

- DOK 3 answer choices should express complete analytical reasoning, not labels or short conclusions.
`;

export function getELADOKRules(dok_level) {
  if (Number(dok_level) === 1) return ELA_DOK_1_RULES;
  if (Number(dok_level) === 2) return ELA_DOK_2_RULES;
  return ELA_DOK_3_RULES;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION TYPE RULES: GENERAL
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_MULTIPLE_CHOICE_RULES = `
ELA MULTIPLE_CHOICE RULE:
- Multiple-choice questions must have exactly 4 answer options.
- Exactly 1 answer option must be correct.
- The stem must be precise enough that only one answer is defensible.
- Distractors should be plausible but clearly incorrect based on the passage.
- Avoid answer choices that are all partly true.
- For inference questions, distractors may reflect common misreadings, unsupported assumptions, or overly literal interpretations.
- For text evidence questions, distractors may be related details but must not be the strongest support.
`;

export const ELA_MULTI_SELECT_RULES = `
ELA MULTI_SELECT RULE:
- Multi-select questions must have exactly 5 answer options.
- Exactly 2 or 3 options must be correct.
- If exactly 2 answers are correct, the stem must say "Select TWO" or "Select BOTH".
- If exactly 3 answers are correct, the stem must say "Select THREE".
- Avoid generic "Select ALL that apply" when the number of correct answers is known.
- The stem must be narrow enough that exactly 2 or exactly 3 options are defensible.
- Do not include extra true statements as distractors.
- Before finalizing, test every unselected option: "Could a student defend this answer using the passage?"
- If yes, either include it as correct and change the stem to Select THREE, or replace the option.
- For multi_select, all correct answers must answer the exact same task in the stem.
- If the stem asks for evidence of one trait, feeling, inference, claim, or idea, every correct answer must support that same trait, feeling, inference, claim, or idea.
- If two different ideas are being assessed, name both ideas in the stem.
`;

export const ELA_MULTI_SELECT_DOK_RULES = `
ELA MULTI_SELECT DOK RULE:
- For DOK 1 multi_select, ask students to select explicit clues or directly supported details from the passage.
- For DOK 1, do not ask broad multi-part inference questions.
- For DOK 2, ask students to connect clues, evidence, character actions, author's purpose, or related ideas.
- For DOK 3, ask students to select evidence or conclusions that support a deeper interpretation.
- Questions asking for multiple feelings, motivations, implied ideas, claims, or author choices should usually be DOK 2 or DOK 3.
`;

export const ELA_HOT_TEXT_RULES = `
ELA HOT_TEXT RULE:
- A passage/stimulus IS REQUIRED.
- The stem must ask the student to click/select one specific word, phrase, sentence, line, stage direction, stanza detail, or evidence span from the passage.
- hot_text_targets must include exactly 3-5 selectable options.
- Exactly 1 target must have is_correct: true.
- All other targets must have is_correct: false.
- Each target must have a unique id: ht1, ht2, ht3, ht4, ht5.
- correct_answer must be an array containing exactly the correct target id, for example ["ht2"].
- Do NOT include passage_tokens. The server builds passage_tokens automatically.

HOT_TEXT EXACT COPY RULE:
- Every hot_text_targets[].text value must be copied EXACTLY from the passage.
- The target text must appear in the passage character-for-character.
- Do not paraphrase target text.
- Do not shorten target text.
- Do not reword target text.
- Do not change capitalization.
- Do not change punctuation.
- Do not add or remove commas, periods, quotation marks, apostrophes, or hyphens.
- Before finalizing, verify that passage.includes(hot_text_targets[i].text) would return true for every target.

ELA HOT_TEXT TARGET RULE:
- For text_evidence, inference, implicit_meaning, theme, character motivation, central idea, author's craft, or argument evidence, prefer complete sentence targets.
- For vocabulary_context, figurative_language, word choice, poetry structure, or author's craft at the word/phrase level, phrase-level targets are allowed.
- Distractor targets must also be exact copies from the passage.
- Distractors should be plausible but clearly incorrect for the exact stem.
`;

export const ELA_HOT_TEXT_BEST_EVIDENCE_RULES = `
ELA HOT_TEXT BEST EVIDENCE RULE:
- If the stem asks for the "best" evidence, the correct target must be clearly stronger than every distractor target.
- Do not include another target that could also reasonably support the same inference, feeling, claim, central idea, implied meaning, or author choice.
- If two sentences both support the same inference or claim, revise the stem to make the task more specific.
- For example, instead of asking "Which sentence shows Maria felt more at ease?", ask:
  - "Which sentence shows Maria first began to relax by focusing on her sketch?"
  - "Which sentence shows Maria became completely absorbed in her drawing?"
- Distractor targets may be related, but they must not answer the exact stem as well as the correct target.
`;

export const ELA_HOT_TEXT_DOK_RULES = `
ELA HOT_TEXT DOK RULE:
- Use hot_text mainly for identifying evidence from the passage.
- For DOK 1, ask students to identify a word, phrase, sentence, line, stage direction, or detail that directly supports the task.
- For DOK 2, ask students to select evidence that supports an inference, relationship, purpose, text structure, central idea, or author choice.
- For DOK 3, only use hot_text when the task asks students to select the strongest evidence for a conclusion, interpretation, or author's choice.
- Avoid DOK 3 hot_text stems that ask students to perform broad analysis when the task only allows selecting one text span.
`;

export const ELA_CONSTRUCTED_RESPONSE_RULES = `
ELA CONSTRUCTED_RESPONSE RULE:
- A passage/stimulus IS REQUIRED.
- The stem must ask students to answer in 2-4 complete sentences.
- The prompt should require evidence from the passage.
- The correct_answer must be a concise model response, around 1-3 sentences.
- Include a scoring_rubric with keys "0", "1", and "2".
- The 0-point rubric should describe no response, off-topic response, or unsupported response.
- The 1-point rubric should describe a partial response that addresses the prompt but lacks enough evidence or reasoning.
- The 2-point rubric should describe a complete response with clear evidence and reasoning.
`;

export const ELA_CONSTRUCTED_RESPONSE_DOK_RULES = `
ELA CONSTRUCTED_RESPONSE DOK RULE:
- DOK 1 constructed response should ask for a simple explanation or identification using one piece of evidence.
- DOK 2 constructed response should ask students to explain a relationship, inference, character motivation, author's purpose, central idea, text evidence connection, or structure/effect relationship.
- DOK 3 constructed response should ask students to justify, evaluate, compare, or analyze using more than one detail from the passage.
- DOK 3 should not be answerable by copying one sentence from the passage.
`;

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION TYPE RULES: DRAMA-SPECIFIC
// ─────────────────────────────────────────────────────────────────────────────

export const ELA_DRAMA_MULTIPLE_CHOICE_RULES = `
DRAMA MULTIPLE CHOICE RULE:
- The question must be based on the drama excerpt, not a generic story passage.
- Answer choices should refer to dialogue, stage directions, acts, scenes, character actions, conflict, or dramatic action.
- Do not ask about drama formatting unless the TEKS standard focuses on drama structure.
`;

export const ELA_DRAMA_MULTI_SELECT_RULES = `
DRAMA MULTI-SELECT RULE:
- The question must have exactly two correct answers unless the stem clearly says Select THREE.
- Both correct answers must be clearly supported by the drama excerpt.
- Distractors may appear in the scene, but they must not answer the specific stem.
- Avoid answer choices that are all partially correct.
- For drama, good multi-select questions often ask students to select two lines, stage directions, scene events, or pieces of evidence.
`;

export const ELA_DRAMA_HOT_TEXT_RULES = `
DRAMA HOT TEXT RULES — VARIED & NON‑REPETITIVE

GENERAL HOT TEXT RULES:
- The question must ask students to select evidence from the drama excerpt.
- Correct targets must be complete numbered lines, complete dialogue lines, or complete bracketed stage directions.
- Do not use fragments unless the fragment is the exact evidence needed.
- The selected evidence must support dramatic action, conflict, tension, misunderstanding, revelation, decision, consequence, or scene structure.
- Avoid stems that could reasonably match more than one line.

8.8C DRAMATIC FUNCTION ROTATION (MANDATORY):
- When previous_attempts are provided, infer the previously used dramatic function from the previous stem, assessment_move, and correct_target_text.
- Choose a different dramatic function whenever the passage supports one.
To avoid repetition, each question must use a different dramatic function until all supported functions have been used. Supported functions include:
  1. Initial misunderstanding / false belief
  2. Early clue or pressure
  3. New information / reveal
  4. Character realization
  5. Second complication
  6. Difficult choice
  7. Decision line
  8. Agreement / support line
  9. Action toward resolution
  10. Final consequence or final action

Rules:
- Do not repeat “competing priorities or “pressure line” unless the passage has no other valid dramatic function left.
- Do not repeat “Scene 2 reveal” unless the passage has no other valid target.
- Do not repeat “consequence of misunderstanding” unless all other functions have been used.

SCENE ROTATION RULES:
- Rotate scenes whenever possible:
  - If a previous question used Scene 2, prefer Scene 1, Scene 3, or Scene 4 next.
  - If a previous question used Scene 3, prefer Scene 1, Scene 2, or Scene 4 next.
  - If a previous question used Scene 4, prefer Scene 1, Scene 2, or Scene 3 next.
- Do not ask more than two questions in a row about Scene 2.

FUNCTION PRECISION RULES:
- If the stem asks for a clue → key the earliest clue line.
- If the stem asks for a reveal → key the line where the meaning becomes clear.
- If the stem asks for realization → key the line showing the character’s shift in understanding.
- If the stem asks for competing priorities → key the line naming the competing options.
- If the stem asks for decision → key the line where the character states the decision.
- If the stem asks for agreement → key the line where another character agrees.
- If the stem asks for action → key the stage direction showing movement toward resolution.
- If the stem asks for consequence → key the line showing the result of earlier actions.

AVOID REPETITION OF SPECIFIC TARGET TYPES:
- Do not reuse:
  - the same pressure line
  - the same misunderstanding line
  - the same reveal line
  - the same realization line
  - the same competing priorities line
  - the same decision line
  - the same consequence line
  - the same final action line
- Do not reuse any line that has already been the correct answer.

STEM VARIETY RULES:
Use varied stem types across the question set:
Initial misunderstanding / false belief
Which line shows the character acting on an incorrect assumption?
Which line reveals what the character first believes about the situation?
Which line shows the misunderstanding that begins the conflict?
Early clue or pressure
Which detail introduces the problem that drives the dramatic action?
Which line shows the first sign of pressure in the play?
Which stage direction hints at the complication that follows?
New information / reveal
Which line reveals information that changes the character’s understanding?
Which line shows the moment the character learns the truth?
Which detail clarifies the meaning of the earlier clue?
Character realization
Which line shows the character reconsidering an earlier belief?
Which stage direction shows the character realizing what the label or message meant?
Which line reveals the character’s shift in understanding?
Second complication
Which line introduces the complication that makes the conflict more difficult?
Which detail shows how the situation becomes more complicated?
Which line adds a new problem to the dramatic action?
Competing priorities
Which line shows the competing priorities created by the two conflicting pressures?
Which line reveals the character weighing two possible actions?
Which detail shows the moment the character must decide between two risks?
Decision
Which line shows the character deciding how to respond to the conflict?
Which line contributes to the resolution by showing the character’s decision?
Which line reveals the action the character chooses to take?
Agreement / support
Which line shows another character agreeing to help resolve the conflict?
Which detail shows a character supporting the decision made in the scene?
Which line reveals cooperation that moves the plot toward resolution?
Action toward resolution
Which stage direction shows the characters beginning to act on their decision?
Which line contributes to the resolution of the play’s conflict?
Which detail shows the characters taking steps to solve the problem?
Final consequence / final action
Which line shows the consequence of the earlier misunderstanding?
Which detail reveals how the conflict is resolved at the end of the play?
Which line shows the final action that completes the dramatic resolution?
REUSE PREVENTION:
- Do not reuse the same stem purpose with different wording.
- Do not reuse the same dramatic function.
- Do not reuse the same scene target.
- Do not reuse the same correct target text.
- Do not reuse the same assessment_move unless no other valid move exists.
`;

export const ELA_DRAMA_CONSTRUCTED_RESPONSE_RULES = `
DRAMA CONSTRUCTED RESPONSE RULE:
- Ask students to explain how dialogue, staging, scene structure, or dramatic action affects character, conflict, tension, or meaning.
- Require evidence from the drama excerpt.
- The response should cite or refer to specific dialogue, stage directions, acts, scenes, or key plot details.
- For 8.8C, the response should explain how the evidence develops dramatic action, conflict, tension, revelation, decision, consequence, or a turning point.
- Avoid asking only for a character trait unless the TEKS is 6.8C or 7.8C.
`;

// ─────────────────────────────────────────────────────────────────────────────
// GRADE 8 DRAMA QUESTION FOCUS HELPER
// ─────────────────────────────────────────────────────────────────────────────

function buildGrade8DramaQuestionFocusRule({
  skill_focus,
  assessment_move,
  isParallelPlotConflict,
  isDramaticAction,
  isKeyDetailRevelation,
  isStageDirectionMove,
  isSceneMove,
}) {
  if (isParallelPlotConflict) {
    return `
GRADE 8 PARALLEL PLOT QUESTION FOCUS:
- Because skill_focus is parallel_plot_conflict, the question must require two related details, pressures, conflicts, or scene-based complications.
- Do not ask a parallel-plot question if the passage only has one misunderstanding followed by one reveal.
- The correct answer must match the assessment_move: ${assessment_move}.
- For hot_text, the stem must clearly specify whether students should select:
  - the first clue or pressure
  - the later complication
  - the line that connects both details
  - the turning point caused by both details
- Do not ask a generic character-trait, character-tag, or basic drama-structure question.
- If both Scene 2 and Scene 3 contain connected pressures or consequences, prefer Scene 3 for the target.
- Do not repeatedly target the Scene 2 reveal when Scene 3 shows the result of the conflict.
- Do not use the phrase "parallel plot detail" in the student-facing stem.
`;
  }

  if (isStageDirectionMove) {
    return `
GRADE 8 STAGE DIRECTION QUESTION FOCUS:
- Because the assessment_move is ${assessment_move}, the question must ask how a stage direction affects dramatic action.
- The correct stage direction must build tension, show a turning point, reveal danger, create suspense, show pressure, signal a change in conflict, or show movement toward resolution.
- Do not ask students to identify a stage direction only because it is in brackets.
- For hot_text, avoid broad stems like "Which stage direction increases tension?" unless only one stage direction clearly fits.
`;
  }

  if (isSceneMove) {
    return `
GRADE 8 SCENE STRUCTURE QUESTION FOCUS:
- Because the assessment_move is ${assessment_move}, the question must focus on how scene structure develops dramatic action.
- The correct answer should show how a scene begins, shifts, complicates, reframes earlier information, raises the stakes, leads to a decision, or creates partial resolution.
- Scene structure questions should rotate across scenes.
- If Scene 3 reframes or resolves earlier information, consider Scene 3 as the target.
`;
  }

  if (isKeyDetailRevelation) {
    return `
GRADE 8 KEY DETAIL QUESTION FOCUS:
- Because skill_focus is key_detail_revelation, the question must focus on how a clue, line, object, stage direction, or detail becomes important later.
- The stem must distinguish whether students should select:
  - the early clue
  - the later information that explains the clue
  - the character's realization
  - the decision or action caused by the revelation
- Do not use broad wording that could make multiple lines defensible.
`;
  }

  if (isDramaticAction) {
    return `
GRADE 8 DRAMATIC ACTION QUESTION FOCUS:
- Because skill_focus is dramatic_action, the question must focus on how a scene, stage direction, dialogue, plot event, decision, or reveal advances dramatic action.
- The correct answer must match the assessment_move: ${assessment_move}.
- Avoid questions that only ask students to identify a line without explaining or implying how it moves the action forward.
- When multiple scenes contain valid evidence for dramatic action, consider targets from Scene 3 if the scene includes a decision, confrontation, consequence, or partial resolution.
- Avoid repeatedly selecting Scene 2 unless Scene 3 lacks meaningful action.
`;
  }

  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION TYPE RULE SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

export function getELAQuestionTypeRules({
  question_type,
  teks_standard,
  skill_focus,
  assessment_move,
}) {
  const isDramaStandard = ["4.9C", "5.9C", "6.8C", "7.8C", "8.8C"].includes(
    teks_standard,
  );

  const isGrade8Drama = teks_standard === "8.8C";

  const isParallelPlotConflict = skill_focus === "parallel_plot_conflict";
  const isDramaticAction = skill_focus === "dramatic_action";
  const isKeyDetailRevelation = skill_focus === "key_detail_revelation";

  const isStageDirectionMove =
    typeof assessment_move === "string" &&
    assessment_move.includes("stage_direction");

  const isSceneMove =
    typeof assessment_move === "string" &&
    (assessment_move.includes("scene") ||
      assessment_move.includes("dramatic_action") ||
      assessment_move.includes("resolution"));

  const skillAwareDramaRule = isGrade8Drama
    ? buildGrade8DramaQuestionFocusRule({
        skill_focus,
        assessment_move,
        isParallelPlotConflict,
        isDramaticAction,
        isKeyDetailRevelation,
        isStageDirectionMove,
        isSceneMove,
      })
    : "";

  switch (question_type) {
    case "multiple_choice":
      return `
${ELA_MULTIPLE_CHOICE_RULES}
${isDramaStandard ? ELA_DRAMA_MULTIPLE_CHOICE_RULES : ""}
${isGrade8Drama ? ELA_GRADE_8_DRAMA_QUESTION_RULES : ""}
${skillAwareDramaRule}
`;

    case "multi_select":
      return `
${ELA_MULTI_SELECT_RULES}
${ELA_MULTI_SELECT_DOK_RULES}
${isDramaStandard ? ELA_DRAMA_MULTI_SELECT_RULES : ""}
${isGrade8Drama ? ELA_GRADE_8_DRAMA_QUESTION_RULES : ""}
${skillAwareDramaRule}
`;

    case "hot_text":
      return `
${ELA_HOT_TEXT_RULES}
${ELA_HOT_TEXT_DOK_RULES}
${ELA_HOT_TEXT_BEST_EVIDENCE_RULES}
${isDramaStandard ? ELA_DRAMA_HOT_TEXT_RULES : ""}
${isGrade8Drama ? ELA_GRADE_8_DRAMA_QUESTION_RULES : ""}
${skillAwareDramaRule}
`;

    case "constructed_response":
      return `
${ELA_CONSTRUCTED_RESPONSE_RULES}
${ELA_CONSTRUCTED_RESPONSE_DOK_RULES}
${isDramaStandard ? ELA_DRAMA_CONSTRUCTED_RESPONSE_RULES : ""}
${isGrade8Drama ? ELA_GRADE_8_DRAMA_QUESTION_RULES : ""}
${skillAwareDramaRule}
`;

    default:
      return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL FOCUS RULE SELECTOR
// ─────────────────────────────────────────────────────────────────────────────

export function getELASkillFocusRules({ skill_focus, teks_standard }) {
  switch (skill_focus) {
    case "inference":
    case "implicit_meaning":
      return `
${ELA_INFERENCE_RULES}
${ELA_IMPLIED_MEANING_PASSAGE_RULES}
${ELA_NO_DIRECT_TRAIT_LABEL_RULES}
`;

    case "text_evidence":
      return `
${ELA_TEXT_EVIDENCE_RULES}
${ELA_NO_DIRECT_TRAIT_LABEL_RULES}
`;

    case "plot_structure":
    case "plot_development":
    case "conflict_resolution":
      return `
${ELA_INFERENCE_RULES}
${ELA_PLOT_ELEMENTS_RULES}
`;

    case "suspense_foreshadowing":
      return `
SUSPENSE / FORESHADOWING RULE:
- The question must focus on how foreshadowing or suspense develops the plot.
- The passage must contain an earlier clue, warning, unusual detail, delay, danger, uncertainty, or unresolved question.
- The clue must connect clearly to a later event.
- The correct answer must explain or identify how that clue builds suspense or prepares the reader for a later event.
${ELA_GRADE_7_PLOT_RULES}
`;

    case "evaluate_best_supported_trait":
      return `
- This is a DOK 3 character-analysis task.
- The stem must explicitly require the student to EVALUATE or JUSTIFY a character trait using multiple details from the passage.
- Do not ask only which trait best describes the character.
- Require the student to consider how the character behaves or changes across multiple moments.

- Preferred stem structures include:
  "Which statement best evaluates how ___'s actions throughout the passage reveal ___?"
  "Which conclusion about ___'s character is best supported by the way ___ responds to both ___ and ___?"
  "Which statement best justifies the conclusion that ___ is ___ based on multiple events in the passage?"

- The correct option must include:
  1. a defensible character trait or conclusion, AND
  2. reasoning that connects that trait to multiple actions, decisions, reactions, or changes in the passage.

- Do not make the correct answer only a trait label such as:
  "responsible"
  "kind"
  "determined"
  "selfish"

- The correct answer should explain WHY the character demonstrates the trait.
`.trim();

    case "nonlinear_plot":
      return `
NONLINEAR PLOT RULE:
- The question must focus on flashback, foreshadowing, subplot, parallel plot structure, or comparison of linear and non-linear plot development.
- If the question asks about flashback, the passage must contain a true shift to an earlier event, not just background information.
- If the question asks about parallel plot, the passage must include two plot threads that can be compared.
- The correct answer must explain how the structure affects the reader's understanding of character, conflict, theme, or plot.
${ELA_GRADE_8_PLOT_RULES}
`;

    case "justify_how_suspense_shapes_plot":
      return `
- Ask the student to connect suspense-building details to a later plot development.
- The correct answer must explain HOW the suspense affects the development of the plot.
- It must connect at least one earlier detail to one later event or decision.
- Do not accept an answer that merely identifies that suspense exists or states the final outcome.
`;

    case "evaluate_how_key_events_shape_plot":
      return `
- Ask the student to evaluate how TWO OR MORE important events work together to develop the plot.
- The stem must require analysis of a relationship among events, not identification of one important event.
- The correct answer must explain how an earlier event contributes to a later conflict, turning point, decision, or resolution.
- Do not ask "Which event is most important?"
- Do not make the task solvable by identifying a single event or detail.
`.trim();

    case "evaluate_how_key_events_shape_plot_structure":
      return `
- Ask the student to evaluate how TWO OR MORE key events work together to shape the plot structure.
- The stem must require analysis of a relationship among events, not identification of one important event.
- The correct answer must explain how an earlier event contributes to a later conflict, turning point, decision, or resolution.
- Do not ask which single event is "most important."
- Do not make the task solvable by identifying one event or detail.
`.trim();

    case "dialogue_analysis":
      return `
DIALOGUE ANALYSIS RULE:
- The question must focus on how dialogue reveals character, advances the plot, builds conflict, or develops theme.
- Do not ask only who said something unless the assessment move is DOK 1.
- The correct answer must be supported by specific dialogue or a character response to dialogue.
- For drama standards, character traits should be inferred from dialogue and staging, not copied from the Characters list.
`;

    case "supporting_details":
      return `
SUPPORTING DETAILS RULE:
- The question must focus on details that support a central idea, thesis, claim, or important interpretation.
- Avoid asking for random details that do not support a larger idea.
- The correct answer must clearly support the stated idea.
${ELA_TEXT_EVIDENCE_RULES}
`;

    case "central_idea":
      return ELA_CENTRAL_IDEA_RULES;

    case "text_structure":
    case "informational_structure":
    case "structure_effect":
      return `
${ELA_TEXT_STRUCTURE_RULES}
`;

    case "author_purpose":
    case "craft_analysis":
    case "tone_mood": {
      const isPoetryStandard = ["6.8B", "7.8B", "8.8B"].includes(teks_standard);

      if (isPoetryStandard) {
        return `
ELA POETRY CRAFT / STRUCTURE RULE:
- Because the TEKS standard is ${teks_standard}, the question must focus on poetry structure or poetic craft.
- Do not turn this into a prose author's craft question.
- The stimulus must be a poem with preserved line breaks.
- The correct answer must explain how the poem's structure, rhythm, rhyme, punctuation, capitalization, line breaks, line length, or graphical elements affect meaning, mood, pacing, emphasis, voice, or message.
`;
      }

      return `
${ELA_AUTHOR_PURPOSE_RULES}
`;
    }

    case "inquiry_reasoning":
      return `
          INQUIRY REASONING RULE:
          - The question must focus on research questions, inquiry planning, source selection, source relevance, or how inquiry deepens understanding.
          - Avoid turning this into a generic comprehension question.
          - The correct answer must connect clearly to the research or inquiry purpose.
          `;

    case "compare_perspectives":
    case "compare_contrast":
      return ELA_COMPARE_TEXTS_RULES;

    case "argument_claim":
    case "claim_evidence":
    case "argument_evidence":
      return ELA_ARGUMENT_RULES;

    case "poetry_structure": {
      const isGrade6Poetry = teks_standard === "6.8B";
      const isGrade7Poetry = teks_standard === "7.8B";
      const isGrade8Poetry = teks_standard === "8.8B";

      return `

POETRY STRUCTURE RULE:
- The question must focus on how poetry structure affects meaning, mood, pacing, emphasis, voice, rhythm, or message.
- The stimulus must be a poem with preserved line breaks.
- Do not generate a prose passage for poetry_structure.
- Do not ask about a poetry feature unless the poem visibly or clearly includes that feature.

${
  isGrade6Poetry
    ? `
GRADE 6 POETRY STRUCTURE FOCUS:
- Focus on meter, rhythm, stanzas, and line breaks.
- Good questions ask how line breaks, repeated structure, or rhythm affect meaning.
`
    : ""
}

${
  isGrade7Poetry
    ? `
GRADE 7 POETRY STRUCTURE FOCUS:
- Focus on rhyme scheme, meter, punctuation, and capitalization.
- Good questions ask how rhyme, punctuation, or capitalization affects pacing, emphasis, mood, or meaning.
`
    : ""
}

${
  isGrade8Poetry
    ? `
GRADE 8 POETRY STRUCTURE FOCUS:
- Focus on graphical elements, punctuation, and line length.
- Good questions ask how visual arrangement, short/long lines, spacing, or punctuation affects meaning, pacing, mood, or voice.
`
    : ""
}
`;
    }

    case "drama_structure":
      return `
DRAMA STRUCTURE RULE:
- The question must focus on character tags, stage directions, acts, scenes, or how drama formatting shapes meaning.
- The stimulus must be a drama excerpt with preserved formatting.
- Do not generate a prose passage or poem for drama_structure.
- The correct answer must explain the purpose or effect of a drama element.
`;

    case "parallel_plot_conflict":
      return `
PARALLEL PLOT CONFLICT RULE:
- Use this skill only when the passage contains two related problems, two pressures, two conflicts, or two plot details that work together.
- The question must focus on how those two related details work together to develop conflict, suspense, tension, or dramatic action.
- The excerpt must include more than one simple reveal.
- Do not use parallel_plot_conflict for a simple sequence like:
  - rumor → reveal → decision
  - clue → explanation → happy resolution
  - secret → surprise → character smiles
- Do not use this skill if the excerpt has only one misunderstanding that is simply explained later.
- Do not use this skill if Scene 2 resolves the question from Scene 1 without creating a second pressure, consequence, or conflict.
- Do not treat a benefit, opportunity, surprise, or extension as a conflict unless it creates a second pressure, misunderstanding, consequence, or competing priorities.
- If the passage centers on one clue, one object, one symbol, or one reveal, use key_detail_revelation instead.
- Do not use the phrase "parallel plot detail" in student-facing stems.

8.8C THREE-SCENE ALIGNMENT:
- For 8.8C, when three scenes are used, the question may connect:
  - the first clue, problem, or pressure in SCENE 1
  - the complication, reveal, or related pressure in SCENE 2
  - the turning point, decision, or partial resolution in SCENE 3
- The first detail should appear in SCENE 1.
- The second related detail or complication should appear in SCENE 2 or SCENE 3.
- If SCENE 3 is used, it should show a reaction, consequence, decision, confrontation, or turning point caused by the first two details.
- The later complication must not simply solve the first problem.
- The two details should create pressure together.

PRECISION RULE:
- Both plot details must be visible in the excerpt.
- The two plot details must be specific enough for students to understand the conflict.
- Avoid vague details such as "she went through with it" unless another line clearly explains what "it" refers to.
- Use the word "problem" only when the excerpt clearly includes an actual problem or conflict.
- If the excerpt centers on a clue, symbol, object, realization, or decision, use wording such as "key detail," "later revelation," "new clue," "changed understanding," or "decision" instead of "parallel plot detail."

QUESTION REQUIREMENT:
- The question may ask students to identify evidence from the beginning and later part of the excerpt.
- The correct answer must connect the two plot details to conflict, suspense, tension, or dramatic action.
- Avoid making SCENE 1 only setup with no specific problem, clue, pressure, or conflict.
- Do not ask a generic character-trait question.
`;

    case "dramatic_action":
      return `
DRAMATIC ACTION RULE:
- The question must focus on how events, scenes, acts, stage directions, dialogue, decisions, or reveals move the drama forward.
- For 8.8C, prioritize how acts and scenes develop conflict, tension, revelation, turning points, decisions, or resolution.
- The correct answer must explain how the dramatic action changes or advances the scene.
- For 8.8C, avoid basic identification of character tags, speaker labels, or simple stage directions.
`;

    case "key_detail_revelation":
      return `
KEY DETAIL REVELATION RULE:
- The question must focus on how a small detail, clue, object, line of dialogue, or stage action becomes important later in the drama.
- The drama excerpt should include an early detail in SCENE 1 and a later revelation, consequence, realization, decision, or action in SCENE 2 or SCENE 3.
- The correct answer must show how the detail changes the audience's understanding, advances dramatic action, or creates a turning point.
- Do not call this a "parallel plot" unless there are truly two related plot threads or conflicts.
- When asking about a key detail, distinguish clearly between:
  - the clue or information itself
  - the character's reaction to the clue
  - the later action caused by the clue
- The stem must make clear which one students should select.
- Good stems may ask:
  - which line introduces the key detail
  - which later line reveals why the detail matters
  - how Scene 3 changes the audience's understanding of the earlier detail
`;

    case "language_conventions":
    case "grammar_usage":
    case "sentence_structure":
    case "revision_editing":
      return ELA_LANGUAGE_GRAMMAR_BOUNDARY_RULES;

    default:
      return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ASSESSMENT MOVE RULE
// ─────────────────────────────────────────────────────────────────────────────

export function getELAAssessmentMoveRules(assessment_move) {
  if (!assessment_move) return "";

  return `
ELA ASSESSMENT MOVE RULE:
- The question must directly match this assessment_move: ${assessment_move}.
- Do not write a generic reading question if the assessment_move requires a specific task.
- If the assessment_move involves evidence, the correct answer must be the strongest support from the passage.
- If the assessment_move involves inference, the correct answer must require interpreting clues.
- If the assessment_move involves author's purpose, author's craft, text structure, or word choice, the correct answer must connect the author's choice to its effect.
- If the assessment_move involves theme or central idea, the correct answer must be supported by multiple details, not a single isolated event.
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIOUS ATTEMPT SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export function buildELAAvoidPreviousAttempts(previous_attempts = []) {
  if (!previous_attempts.length) return "";

  const safeAttempts = previous_attempts
    .map((a) => {
      try {
        const q =
          typeof a.question_json === "string"
            ? JSON.parse(a.question_json)
            : a.question_json;

        let correctTargetText = null;

        if (
          Array.isArray(q?.correct_answer) &&
          Array.isArray(q?.hot_text_targets)
        ) {
          const correctId = q.correct_answer[0];
          const target = q.hot_text_targets.find((t) => t.id === correctId);
          correctTargetText = target?.text ?? null;
        }

        return {
          stem: q?.stem ?? null,
          skill_focus: q?.skill_focus ?? null,
          assessment_move: q?.assessment_move ?? null,
          dok_level: q?.dok_level ?? null,
          question_type: q?.question_type ?? null,
          correct_answer: q?.correct_answer ?? null,
          correct_target_text: correctTargetText,
        };
      } catch {
        return {
          stem: a?.stem ?? null,
        };
      }
    })
    .filter(
      (a) =>
        a.stem ||
        a.skill_focus ||
        a.assessment_move ||
        a.correct_answer ||
        a.correct_target_text,
    );

  if (!safeAttempts.length) return "";

  return `IMPORTANT — Avoid repeating these previous attempts in this session:
${JSON.stringify(safeAttempts, null, 2)}

Do not repeat the same stem, same correct answer, same hot_text target, same evidence line, same scene target, or same dramatic/reading function unless there is no other valid way to assess the TEKS.

STRICT REUSE RULES:
1. Do not reuse the same hot_text correct_target_text.
2. Do not reuse the same assessment_move if it already appeared, unless the passage has no other valid TEKS-aligned target.
3. Do not ask another question with the same stem purpose using different wording.
4. Do not make a previous correct answer become the correct answer again.
5. Do not make a previous correct answer one of the strongest distractors if it could still reasonably answer the new stem.
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export function buildELAOutputSchema({
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
  "passage": "<string — original passage when required; null only when the prompt explicitly allows no passage>",
  "stem": "<the question prompt shown to the student>",
  ${buildAnswerFields(question_type, dok_level)},
  "explanation": "<why the correct answer is correct, referencing TEKS skill and DOK reasoning>",
${question_type === "constructed_response" ? `"scoring_rubric": { "0": "...", "1": "...", "2": "..." },` : ""}  ${buildNextQuestionLogic(dok_level, question_type)}
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSAGE INSTRUCTION / FOCUS NOTE
// ─────────────────────────────────────────────────────────────────────────────

export function buildELAPassageInstruction({
  question_type,
  dok_level,
  content_focus,
  stimulus,
  title = null,
}) {
  const titleNote =
    !stimulus && title
      ? `${ELA_TITLE_CONSISTENCY_RULES}\nRequired Title: "${title}"\n`
      : "";

  const requiresPassage =
    question_type === "hot_text" ||
    question_type === "constructed_response" ||
    question_type === "multi_select";

  if (stimulus) {
    return `${ELA_PROVIDED_STIMULUS_RULES}

CRITICAL — Use this exact passage for this question. Do NOT generate a new passage:
"""
${stimulus}
"""

The passage field in your JSON must be this exact text verbatim.`;
  }

  if (content_focus) {
    return `${titleNote}CRITICAL — A passage IS REQUIRED for this question. Generate an original focused classroom reading selection about: ${content_focus}. The passage field must not be empty.`;
  }

  if (requiresPassage) {
    return `Generate an original passage appropriate for the TEKS standard, skill_focus, assessment_move, and DOK level.`;
  }

  if (Number(dok_level) === 1) {
    return `A passage is optional for this DOK 1 standalone question. If the question requires reading evidence, include a brief passage. Otherwise set "passage": null.`;
  }

  return `${titleNote}Generate an original passage if it helps assess the TEKS standard, skill_focus, assessment_move, and DOK level.`;
}

export function buildELAFocusNote({ content_focus, stimulus }) {
  if (!content_focus) return "";

  if (stimulus) {
    return `Content Focus: "${content_focus}".
A reviewed stimulus has already been provided. Do not rewrite the passage. Use the Content Focus only to guide which evidence, scene, section, idea, or detail the question should emphasize.`;
  }

  return `Content Focus: Anchor all passages and questions in the context of "${content_focus}". Do not use unrelated topics, genres, skills, or themes.`;
}
