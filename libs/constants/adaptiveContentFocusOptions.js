// /libs/constants/adaptiveContentFocusOptions.js
//
// Admin/Teacher-facing content_focus suggestions for adaptive assignments.
// These are optional UI chips. The selected chip simply fills the content_focus textarea.
// Shared content-focus catalogs.
//
// Keyed content-focus options are used by protected admin passage-bank
// generation to create controlled passage inventory.
//
// Plain-text suggestion collections are retained for other generator/admin
// workflows that have not yet been converted to keyed options.
export const ADAPTIVE_CONTENT_FOCUS_BY_SUBJECT = {
  ELA: [
    "Making inferences from character actions in a realistic fiction passage",
    "Using text evidence to support an inference",
    "Identifying the central idea and supporting details in informational text",
    "Explaining how character choices affect the plot",
    "Analyzing how word choice affects tone or mood",
    "Comparing themes across literary texts",
    "Evaluating an author's claim using evidence",
    "Summarizing key events without adding opinions",
  ],

  Science: [
    "Matter and energy flow through food webs, including producers, consumers, and decomposers",
    "How decomposers recycle matter in ecosystems",
    "How organisms depend on biotic and abiotic factors",
    "How inherited traits and environmental factors affect organisms",
    "How forces affect motion",
    "How energy transfers or transforms in a system",
    "How models represent Earth, space, or ecosystem systems",
    "How data supports a scientific explanation",
  ],

  "Social Studies": [
    "Compare Puebloan, Southeastern, Gulf, and Plains American Indian cultures in Texas before European colonization",
    "How geography, resources, food, shelter, and ways of life shaped American Indian cultures in Texas",
    "Causes and effects of European exploration and colonization in Texas",
    "Important events and causes of the Texas Revolution",
    "How geography influenced settlement and economic development in Texas",
    "Comparing perspectives during major historical events",
    "Using primary source evidence to support a historical claim",
    "How government, citizenship, and rights developed over time",
  ],

  Math: [
    "Solving multi-step problems with rational numbers",
    "Representing proportional relationships",
    "Writing and solving equations from real-world situations",
    "Using geometry formulas to solve problems",
    "Interpreting data from tables, graphs, and plots",
  ],
};

export const ADAPTIVE_CONTENT_FOCUS_BY_BUCKET = {
  ELA: {
    comprehension_skills: [
      "Making inferences from character actions in a realistic fiction passage",
      "Using text evidence to support an inference",
      "Identifying central idea and supporting details in an informational text",
      "Summarizing key events and ideas without adding opinions",
    ],

    vocabulary: [
      "Using context clues to determine word meaning",
      "Analyzing how word choice affects meaning",
      "Understanding academic vocabulary in context",
    ],

    literary_elements: [
      "Analyzing character motivation and change",
      "Explaining how conflict develops the plot",
      "Identifying theme using character actions and events",
    ],

    authors_craft: [
      "Analyzing how the author's word choice affects tone",
      "Explaining how text structure supports the author's purpose",
      "Evaluating how the author develops a claim or message",
    ],

    writing_process: [
      "Revising sentences for clarity and organization",
      "Improving transitions and paragraph order",
      "Choosing stronger evidence and examples during revision",
    ],

    inquiry_research: [
      "Evaluating source credibility and relevance",
      "Selecting evidence that supports a research question",
      "Synthesizing information from multiple sources",
    ],
    genres: [
      "Analyze how genre characteristics shape meaning",
      "Analyze how dialogue or staging develops characters",
      "Analyze characteristics of informational or argumentative text",
      "Analyze how poetry structure affects meaning",
      "Analyze how rhyme, meter, line breaks, punctuation, or graphical elements shape meaning",
    ],
  },

  Science: {
    ecosystems_food_webs: [
      "Matter and energy flow through food webs, including producers, consumers, and decomposers",
      "How decomposers recycle matter in ecosystems",
      "How energy moves from producers to consumers",
    ],

    ecosystems_roles: [
      "Roles of producers, consumers, and decomposers in ecosystems",
      "How organism roles affect ecosystem balance",
    ],

    matter_properties: [
      "Comparing physical properties of matter",
      "Using evidence to identify materials based on properties",
    ],

    force_motion: [
      "Describing motion using speed, direction, and changes in position",
      "How forces affect motion in real-world situations",
    ],
  },

  "Social Studies": {
    texas_first_people: [
      "Compare Puebloan, Southeastern, Gulf, and Plains American Indian cultures in Texas before European colonization",
      "How region, resources, food, shelter, and ways of life shaped American Indian cultures in Texas",
      "How geography influenced the way American Indian groups adapted to Texas environments",
    ],

    texas_exploration_colonization: [
      "Causes and effects of European exploration and colonization in Texas",
      "How Spanish missions and settlements affected Texas",
    ],

    texas_revolution: [
      "Important causes and events of the Texas Revolution",
      "How individuals and groups contributed to the Texas Revolution",
    ],

    texas_geography: [
      "How Texas regions and resources influenced settlement and economic activity",
      "Using geographic evidence to explain human activity in Texas",
    ],
  },
};

export const ADAPTIVE_CONTENT_FOCUS_BY_TEKS = {
  ELA: {
    "4.9C": [
    "A short drama scene about two classmates solving a playground problem",
    "A short drama scene about a family preparing for a celebration",
    "A short drama scene about friends deciding how to help a neighbor",
  ],

    "5.9C": [
      "A short drama scene about students preparing for a school performance",
      "A short drama scene about a disagreement during a group project",
      "A short drama scene about siblings solving a problem at home",
    ],
    // ─────────────────────────────────────────────
    // Grade 6 — Literary Elements
    // ─────────────────────────────────────────────
    "6.7A": [
      "Infer multiple themes in a realistic fiction passage using text evidence",
      "Compare how two characters or events reveal different themes",
      "Identify a theme and support it with details from the text",
    ],

    "6.7B": [
      "Analyze how a character’s internal response affects the plot",
      "Analyze how a character’s external actions move the plot forward",
      "Connect a character’s response to the conflict or resolution",
    ],

    "6.7C": [
      "Analyze rising action, climax, falling action, and resolution in a realistic fiction passage",
      "Identify the climax or turning point and explain how it affects the plot",
      "Analyze how a flashback changes the reader’s understanding of the conflict",
      "Connect plot events to the conflict and resolution",
    ],

    "6.7D": [
      "Analyze how historical setting influences a character’s decisions",
      "Analyze how cultural setting affects the plot",
      "Explain how setting shapes character conflict and development",
    ],
      "6.8B": [
      "A poem about waves moving gently toward the shore",
      "A poem about walking through a quiet neighborhood at sunset",
      "A poem about a student practicing before a school performance",
      "A poem about missing a pet and remembering happy moments",
      "A poem about a storm ending and the sky becoming calm",
      "A poem about a garden waking up in the morning",
    ],
      "6.8C": [
      "A short drama scene about two friends disagreeing before a competition",
      "A short drama scene about a student trying to hide nervousness",
      "A short drama scene about a character learning to trust someone",
      "A short drama scene about classmates discovering a surprising project",
    ],

    // ─────────────────────────────────────────────
    // Grade 7 — Literary Elements
    // ─────────────────────────────────────────────
    "7.7A": [
      "Infer multiple themes across a literary passage using text evidence",
      "Compare how events and character choices reveal theme",
      "Support a theme with specific text evidence",
    ],

    "7.7B": [
      "Analyze how a character’s qualities influence events",
      "Analyze how a character’s choices affect conflict resolution",
      "Connect character traits to major plot events",
    ],

    "7.7C": [
      "Analyze how foreshadowing creates suspense and advances the plot",
      "Identify an early clue and connect it to a later event",
      "Explain how suspense builds before the climax",
      "Analyze how a warning, clue, or unresolved question affects the reader’s expectations",
    ],

    "7.7D": [
      "Analyze how setting influences a character’s actions",
      "Explain how setting shapes plot development",
      "Connect details about setting to character conflict",
    ],
    "7.8B": [
      "A poem about a lost pet",
      "A poem about a garden waking up in the morning",
      "A poem about a student preparing for a performance",
      "A poem about walking home as a storm begins",
      "A poem about friendship changing over time",
      "A poem about a family tradition on a quiet evening",
    ],

    "7.8C": [
      "A short drama scene about teammates working through a conflict",
      "A short drama scene about a character revealing a secret through dialogue",
      "A short drama scene about a student standing up for a friend",
    ],


    // ─────────────────────────────────────────────
    // Grade 8 — Literary Elements
    // ─────────────────────────────────────────────
    "8.7A": [
      "Analyze how theme develops through interactions among characters and events",
      "Explain how character conflict develops a theme",
      "Use text evidence to show how events reveal theme",
    ],

    "8.7B": [
      "Analyze how character motivations influence events",
      "Connect character behavior to conflict resolution",
      "Explain how a character’s choices shape the plot",
    ],

    "8.7C": [
      "Analyze how flashback changes the reader’s understanding of the present conflict",
      "Compare linear and non-linear plot development",
      "Analyze how foreshadowing prepares the reader for a later event",
      "Analyze how a subplot connects to the main plot",
      "Compare parallel plot structures and explain how they shape meaning",
    ],

    "8.7D": [
      "Explain how setting influences a character’s values",
      "Analyze how setting shapes a character’s beliefs and decisions",
      "Connect setting details to character development",
    ],
    "8.8B": [
      "A poem about a quiet conversation with a trusted friend",
      "A poem about missing someone who moved away",
      "A poem about standing alone before making a brave choice",
      "A poem about a storm ending and the sky becoming clear",
      "A poem about keeping a secret for someone you trust",
      "A poem about finding calm after a difficult day",
    ],

    "8.8C": [
      "  overheard information that creates a misunderstanding, a second complication, and a difficult choice before a deadline",
      "  two friends discovering that a missing item may affect someone else's opportunity, creating pressure to act",
      "  a small clue that changes how a character understands an earlier scene and reveals a new consequence",
      "  a public event being planned while a private problem threatens to disrupt it, forcing a decision",
      "  two related problems that collide in Scene 2 and force characters to choose what to solve first",
      "  a character misunderstanding an overheard conversation and facing consequences before realizing the truth",
      "  a hidden plan that appears harmful at first but reveals a deeper conflict when discovered",
      "  a character deciding whether to reveal information that could disappoint or hurt someone they care about",
      "  a group forced to change plans when a new complication appears at the last minute",
      "  two classmates facing competing responsibilities before an important meeting",
      "  a secret that creates pressure, misunderstanding, and a difficult decision",
      "  a character discovering a detail that creates both a new opportunity and a new risk",
      "  overheard information that creates a misunderstanding and a later confrontation",
      "  a character realizing that a small detail has a consequence for someone else",
      "  a plan that goes wrong, forcing characters to rethink their next action",
      "  a character trying to hide something while a second problem emerges unexpectedly",
      "  two characters with competing goals that collide in Scene 2",
      "  a character discovering a consequence of a secret they didn’t mean to overhear",
      "  a character who must choose between helping a friend and protecting a responsibility",
      "  a misunderstanding that creates tension until the truth is revealed in Scene 3"
],


    // ─────────────────────────────────────────────
    // Informational / Argumentative examples
    // ─────────────────────────────────────────────
    "6.8D.i": [
      "Identify the controlling idea and supporting evidence in an informational passage",
      "Distinguish the thesis from supporting details",
      "Explain how details support the controlling idea",
    ],

    "7.8D.i": [
      "Identify the controlling idea and supporting evidence in an informational text",
      "Analyze how supporting details develop a thesis",
      "Distinguish key supporting evidence from minor details",
    ],

    "8.8D.i": [
      "Identify the thesis and analyze how supporting evidence develops it",
      "Evaluate which detail best supports the controlling idea",
      "Analyze how evidence supports the central idea of an informational text",
    ],

    "8.8E.ii": [
      "Analyze how a counterargument responds to the author’s claim",
      "Compare the author’s claim with an opposing viewpoint",
      "Explain how evidence strengthens or weakens a counterargument",
    ],

    // ─────────────────────────────────────────────
    // Inquiry / Research examples
    // ─────────────────────────────────────────────
    "6.12A": [
      "Generate focused inquiry questions for a research topic",
      "Choose the best research question for a teacher-guided inquiry",
      "Distinguish broad questions from focused inquiry questions",
    ],

    "7.12A": [
      "Generate focused inquiry questions that guide research",
      "Choose a research question that can be answered with sources",
      "Refine an inquiry question to make it more specific",
    ],

    "8.12A": [
      "Generate research questions that support deeper investigation",
      "Evaluate which inquiry question best guides research",
      "Refine a broad research question into a focused research question",
    ],
  },
};
import { getTeksBucketForSubject } from "@/libs/constants/teksSubjectMap";

export function getAdaptiveContentFocusSuggestions({
  subject,
  gradeLevel,
  teksStandard,
}) {
  const exactSuggestions =
    ADAPTIVE_CONTENT_FOCUS_BY_TEKS?.[subject]?.[teksStandard] ?? [];

  if (exactSuggestions.length) {
    return exactSuggestions;
  }

  const bucket = getTeksBucketForSubject({
    subject,
    gradeLevel,
    teksStandard,
  });

  const bucketSuggestions =
    ADAPTIVE_CONTENT_FOCUS_BY_BUCKET?.[subject]?.[bucket] ?? [];

  if (bucketSuggestions.length) {
    return bucketSuggestions;
  }

  return ADAPTIVE_CONTENT_FOCUS_BY_SUBJECT[subject] ?? [];
}

export const ELA_CONTENT_FOCUS_CHIPS = {
  // ─────────────────────────────────────────────
// 6.7A — Theme, text evidence, inference
// ─────────────────────────────────────────────
"6.7A": [
  {
    key: "small_choice_reveals_responsibility",
    label: "Small choice reveals responsibility",
    prompt:
      "a realistic Grade 6 fiction story in which a student must make a meaningful but age-appropriate choice involving responsibility to another person, with actions and consequences that allow readers to infer a theme without stating the lesson directly",
  },
  {
    key: "kindness_has_unexpected_effect",
    label: "Kindness changes a situation",
    prompt:
      "a realistic Grade 6 fiction story in which a small act of kindness changes how another person responds, with concrete details and consequences that support inference and theme analysis",
  },
  {
    key: "mistake_teaches_lesson",
    label: "Mistake leads to learning",
    prompt:
      "a realistic Grade 6 fiction story in which a student makes an understandable mistake, experiences a clear consequence, and responds in a way that allows readers to infer a lesson or theme",
  },
  {
    key: "assumption_proven_wrong",
    label: "Assumption changes",
    prompt:
      "a realistic Grade 6 fiction story in which a student makes an assumption about another person or situation and later discovers evidence that changes that understanding",
  },
  {
    key: "effort_changes_outcome",
    label: "Effort changes the outcome",
    prompt:
      "a realistic Grade 6 fiction story in which a student struggles with a challenge, continues working despite frustration, and experiences an outcome that supports a theme about effort, patience, or growth",
  },
],

// ─────────────────────────────────────────────
// 6.7B — Character analysis, plot development,
// conflict resolution
// ─────────────────────────────────────────────
"6.7B": [
  {
    key: "promise_competes_with_personal_goal",
    label: "Promise versus personal goal",
    prompt:
      "a realistic Grade 6 fiction story in which a student has made a promise or accepted a responsibility but then receives an opportunity connected to a personal goal, creating a conflict that reveals motivation through choices and leads to a meaningful resolution",
  },
  {
    key: "friendship_conflict_from_misunderstanding",
    label: "Friendship misunderstanding",
    prompt:
      "a realistic Grade 6 fiction story in which a misunderstanding between friends creates conflict, with each character's actions and motivations becoming clearer before the conflict is resolved",
  },
  {
    key: "fear_affects_decision",
    label: "Fear affects a decision",
    prompt:
      "a realistic Grade 6 fiction story in which fear or nervousness influences a student's decision, creates a problem, and later requires the student to respond differently to resolve the conflict",
  },
  {
    key: "competing_goals_between_friends",
    label: "Friends want different things",
    prompt:
      "a realistic Grade 6 fiction story in which two students have understandable but competing goals, causing conflict that develops through their choices and is resolved through communication, compromise, or a clear decision",
  },
  {
    key: "responsibility_changes_behavior",
    label: "Responsibility changes behavior",
    prompt:
      "a realistic Grade 6 fiction story in which a student initially avoids or resists a responsibility but gradually changes behavior as the consequences of that choice become clearer",
  },
],

// ─────────────────────────────────────────────
// 6.7C — Plot development, plot structure,
// conflict resolution, cause-effect
// ─────────────────────────────────────────────
"6.7C": [
  {
    key: "small_mistake_creates_chain_of_events",
    label: "Mistake creates a chain of events",
    prompt:
      "a realistic Grade 6 fiction story in which a student's small but understandable mistake causes a clear chain of increasingly important events, creating a conflict that reaches a recognizable turning point and is resolved through later actions",
  },
  {
    key: "missed_message_causes_problem",
    label: "Missed message causes problems",
    prompt:
      "a realistic Grade 6 fiction story in which a missed, misunderstood, or forgotten message causes a sequence of connected problems that develop toward a clear turning point and resolution",
  },
  {
    key: "one_decision_changes_next_events",
    label: "One decision changes everything",
    prompt:
      "a realistic Grade 6 fiction story in which one early decision directly causes several later events, making the cause-and-effect relationships and plot structure easy to trace",
  },
  {
    key: "attempted_fix_makes_problem_worse",
    label: "A fix makes things worse",
    prompt:
      "a realistic Grade 6 fiction story in which a student tries to solve a small problem without asking for help, but the attempted solution causes a second problem before a later turning point leads to resolution",
  },
  {
    key: "unexpected_event_changes_plan",
    label: "Unexpected event changes the plan",
    prompt:
      "a realistic Grade 6 fiction story in which an unexpected event interrupts an important plan, causing a sequence of decisions and consequences that clearly develop the conflict and resolution",
  },
],

// ─────────────────────────────────────────────
// 6.7D — Setting analysis, character analysis,
// plot development
// ─────────────────────────────────────────────
"6.7D": [
  {
    key: "unfamiliar_setting_changes_decisions",
    label: "New setting changes choices",
    prompt:
      "a realistic Grade 6 fiction story set in an unfamiliar but age-appropriate environment where physical conditions, available resources, and features of the place directly influence a student's decisions, interactions, and the development of the plot",
  },
  {
    key: "weather_changes_the_plan",
    label: "Weather changes the plan",
    prompt:
      "a realistic Grade 6 fiction story in which changing weather conditions directly affect what characters can do, forcing a student to adjust plans and make decisions that move the plot forward",
  },
  {
    key: "crowded_setting_creates_pressure",
    label: "Crowded place creates pressure",
    prompt:
      "a realistic Grade 6 fiction story set in a crowded school, community, or public environment where noise, limited space, or other people affect a student's choices and contribute to the conflict",
  },
  {
    key: "limited_resources_shape_actions",
    label: "Limited resources shape actions",
    prompt:
      "a realistic Grade 6 fiction story in which characters must work within limited supplies, time, or space, and those setting conditions directly influence character behavior and plot development",
  },
  {
    key: "familiar_place_feels_different",
    label: "A familiar place feels different",
    prompt:
      "a realistic Grade 6 fiction story in which a familiar place changes because of weather, time of day, an event, or another condition, causing a student to see the setting differently and make new choices",
  },
],
  // ─────────────────────────────────────────────
  // 8.7A — Theme development
  // ─────────────────────────────────────────────
  "8.7A": [
    {
      key: "loyalty_tested_by_choice",
      label: "Loyalty tested by a choice",
      prompt:
        "a character whose loyalty is tested by a difficult choice, with interactions and consequences that develop a theme about trust or responsibility",
    },
    {
      key: "mistake_leads_to_growth",
      label: "Mistake leads to growth",
      prompt:
        "a character who makes a meaningful mistake, experiences consequences, and changes through later interactions and events",
    },
    {
      key: "success_requires_sacrifice",
      label: "Success requires sacrifice",
      prompt:
        "characters pursuing an important goal while discovering that success requires sacrifice, cooperation, or a change in priorities",
    },
    {
      key: "assumption_changes_through_events",
      label: "Assumption changes",
      prompt:
        "a character who begins with a strong assumption about another person and changes that belief through interactions and unfolding events",
    },
    {
      key: "courage_under_social_pressure",
      label: "Courage under pressure",
      prompt:
        "a character facing social pressure who must decide whether to act courageously, with the decision and its consequences developing a clear theme",
    },
  ],

  // ─────────────────────────────────────────────
  // 8.7B — Character motivation and conflict
  // ─────────────────────────────────────────────
  "8.7B": [
    {
      key: "hidden_motivation_changes_conflict",
      label: "Hidden motivation revealed",
      prompt:
        "a character whose hidden motivation is gradually revealed and changes how other characters respond to the central conflict",
    },
    {
      key: "competing_goals_create_conflict",
      label: "Competing character goals",
      prompt:
        "two characters with understandable but competing goals whose choices intensify the conflict before contributing to its resolution",
    },
    {
      key: "fear_drives_poor_decision",
      label: "Fear drives a decision",
      prompt:
        "a character whose fear or insecurity leads to a poor decision that changes events and creates a need to repair the conflict",
    },
    {
      key: "responsibility_vs_personal_goal",
      label: "Responsibility versus goal",
      prompt:
        "a character forced to choose between a personal goal and a responsibility to others, with the choice shaping later events",
    },
    {
      key: "behavior_misread_by_others",
      label: "Behavior misunderstood",
      prompt:
        "a character whose behavior is misunderstood because others do not know the character's true motivation, creating conflict that is later clarified",
    },
    {
  key: "challenge_tests_motivation",
  label: "Challenge tests motivation",
  prompt:
    "a character whose motivation is tested by a difficult challenge, with the character's response changing events and moving the conflict toward resolution, centered around rock climbing",
},

  ],

  // ─────────────────────────────────────────────
  // 8.7C — Nonlinear plot development
  // ─────────────────────────────────────────────
 "8.7C": [
    {
      key: "flashback_changes_present_conflict",
      label: "Flashback changes the conflict",
      prompt:
        "a realistic fiction story in which a flashback reveals important past information that changes the reader's understanding of the present conflict",
    },
    {
      key: "foreshadowing_later_event",
      label: "Foreshadowing + later event",
      prompt:
        "a realistic fiction story with an early clue or warning that foreshadows a significant later event and becomes important near the climax",
    },
    {
      key: "flashback_and_foreshadowing",
      label: "Flashback + foreshadowing",
      prompt:
        "a realistic fiction story that uses both a meaningful flashback and foreshadowing so earlier details change the reader's understanding of the present conflict and prepare for a later turning point",
    },
    {
      key: "subplot_connects_main_plot",
      label: "Subplot connects to main plot",
      prompt:
        "a realistic fiction story with a secondary problem or subplot that develops separately at first and later affects the main conflict",
    },
    {
      key: "parallel_plot_connections",
      label: "Parallel plot connections",
      prompt:
        "a realistic fiction story with two related plot threads that develop in parallel and connect at a meaningful turning point",
    },
  ],

  // ─────────────────────────────────────────────
  // 8.7D — Setting influences values and beliefs
  // ─────────────────────────────────────────────
  "8.7D": [
    {
      key: "community_tradition_shapes_choice",
      label: "Community tradition shapes choice",
      prompt:
        "a character whose values and decision are influenced by a strong community tradition and the expectations connected to it",
    },
    {
      key: "historical_setting_shapes_beliefs",
      label: "Historical setting shapes beliefs",
      prompt:
        "a character living in a specific historical period whose beliefs and choices are shaped by the opportunities, limits, and attitudes of that time",
    },
    {
      key: "new_environment_challenges_values",
      label: "New environment challenges values",
      prompt:
        "a character entering an unfamiliar environment where different expectations challenge the character's existing values and beliefs",
    },
    {
      key: "isolated_setting_changes_priorities",
      label: "Isolation changes priorities",
      prompt:
        "characters in an isolated or restricted setting where limited resources and distance from help influence their priorities and decisions",
    },
    {
      key: "place_based_identity_conflict",
      label: "Place and identity conflict",
      prompt:
        "a character whose identity is closely tied to a place and who must respond when changes to that setting challenge long-held beliefs",
    },
  ],

  // ─────────────────────────────────────────────
  // 8.8B — Poetry graphical elements
  // ─────────────────────────────────────────────
  "8.8B": [
    {
      key: "shortening_lines_build_tension",
      label: "Shortening lines build tension",
      prompt:
        "a free-verse poem in which line lengths gradually shorten as tension increases, with punctuation and line breaks shaping pace and meaning",
    },
    {
      key: "stanza_shift_changes_perspective",
      label: "Stanza shift changes perspective",
      prompt:
        "a poem with a clear stanza break that marks a change in time, perspective, emotion, or understanding",
    },
    {
      key: "isolated_line_emphasizes_realization",
      label: "Isolated line emphasizes realization",
      prompt:
        "a poem that isolates one important line or phrase to emphasize the speaker's realization or emotional turning point",
    },
    {
      key: "punctuation_controls_pace",
      label: "Punctuation controls pace",
      prompt:
        "a poem using commas, dashes, periods, and purposeful pauses to control pace and reflect the speaker's changing emotions",
    },
    {
      key: "repeated_structure_changes_meaning",
      label: "Repetition changes meaning",
      prompt:
        "a poem with a repeated line or structural pattern whose meaning changes as new images and experiences are introduced",
    },
  ],

  // ─────────────────────────────────────────────
  // 8.8C — Drama
  // ─────────────────────────────────────────────
  "8.8C": [
    {
      key: "misunderstanding_deadline_choice",
      label: "Misunderstanding before a deadline",
      prompt:
        "overheard information that creates a misunderstanding, a second complication, and a difficult choice before a deadline",
    },
    {
      key: "hidden_plan_wrong_impression",
      label: "Hidden plan misunderstood",
      prompt:
        "a hidden plan that seems harmful at first but later reveals a different purpose",
    },
    {
      key: "public_event_private_problem",
      label: "Public event + private problem",
      prompt:
        "a public event being prepared while a private problem threatens the plan",
    },
    {
      key: "two_related_problems_decision",
      label: "Two problems force a decision",
      prompt:
        "two related problems that force characters to choose what to do first",
    },
    {
      key: "small_clue_changes_understanding",
      label: "Small clue changes understanding",
      prompt:
        "a small clue that changes how a character understands an earlier scene",
    },
  ],

  // ─────────────────────────────────────────────
  // 8.8D.i — Thesis/controlling idea and evidence
  // ─────────────────────────────────────────────
  "8.8D.i": [
    {
      key: "community_solution_supported_by_examples",
      label: "Community solution",
      prompt:
        "an informational article presenting a clear controlling idea about a community solution, supported by examples, facts, and results",
    },
    {
      key: "scientific_process_explained_with_evidence",
      label: "Scientific process",
      prompt:
        "an informational text explaining a scientific or environmental process through a clear thesis and multiple pieces of relevant supporting evidence",
    },
    {
      key: "historical_change_causes_effects",
      label: "Historical change",
      prompt:
        "an informational article explaining how a historical development caused lasting change, supported by dates, examples, and cause-and-effect evidence",
    },
    {
      key: "technology_improves_daily_task",
      label: "Technology improves a task",
      prompt:
        "an informational text explaining how a technology changed a familiar task, supported by comparisons, examples, and factual evidence",
    },
    {
      key: "habit_produces_measurable_benefits",
      label: "Habit and benefits",
      prompt:
        "an informational article presenting a controlling idea about the benefits of a practical habit, supported by research findings and concrete examples",
    },
  ],

  // ─────────────────────────────────────────────
  // 8.8D.iii — Multiple organizational patterns
  // ─────────────────────────────────────────────
  "8.8D.iii": [
    {
      key: "problem_solution_with_cause_effect",
      label: "Problem-solution + cause-effect",
      prompt:
        "an informational article that introduces a problem, explains its causes and effects, and evaluates one or more possible solutions",
    },
    {
      key: "chronology_with_comparison",
      label: "Chronology + comparison",
      prompt:
        "an informational text organized chronologically while also comparing how two people, places, or methods changed over time",
    },
    {
      key: "classification_with_examples",
      label: "Classification + examples",
      prompt:
        "an informational article classifying a topic into meaningful categories and developing each category with examples and explanatory details",
    },
    {
      key: "cause_effect_with_process",
      label: "Cause-effect + process",
      prompt:
        "an informational text explaining a process while showing how each stage causes or influences the next stage",
    },
    {
      key: "comparison_leads_to_conclusion",
      label: "Comparison supports conclusion",
      prompt:
        "an informational article comparing two approaches or systems and using the comparison to develop a broader conclusion",
    },
  ],

  // ─────────────────────────────────────────────
  // 8.8E.i — Claim and argument
  // ─────────────────────────────────────────────
  "8.8E.i": [
    {
      key: "school_policy_change_argument",
      label: "School policy change",
      prompt:
        "an argumentative article making a clear claim about changing a school policy and supporting it with logical reasons, relevant evidence, and examples",
    },
    {
      key: "community_project_priority",
      label: "Community project priority",
      prompt:
        "an argumentative text claiming that one community project should receive priority, supported by evidence about cost, impact, and need",
    },
    {
      key: "technology_use_guidelines",
      label: "Technology-use guidelines",
      prompt:
        "an argumentative article proposing guidelines for responsible technology use and supporting the claim with research, examples, and reasoning",
    },
    {
      key: "environmental_action_proposal",
      label: "Environmental action",
      prompt:
        "an argumentative text advocating for a practical environmental action and developing the argument with evidence about benefits and feasibility",
    },
    {
      key: "student_opportunity_expansion",
      label: "Expand student opportunity",
      prompt:
        "an argumentative article claiming that students should receive greater access to a particular program or opportunity, supported by relevant evidence",
    },
  ],

  // ─────────────────────────────────────────────
  // 8.8E.ii — Counterargument
  // ─────────────────────────────────────────────
  "8.8E.ii": [
    {
      key: "later_school_start_counterargument",
      label: "Later school start",
      prompt:
        "an argumentative article supporting later school start times while presenting and responding to a counterargument about schedules or transportation",
    },
    {
      key: "device_policy_counterargument",
      label: "Student device policy",
      prompt:
        "an argumentative text proposing a student device policy while acknowledging and responding to concerns about safety, access, or distraction",
    },
    {
      key: "public_space_improvement_counterargument",
      label: "Improve a public space",
      prompt:
        "an argumentative article advocating for improvements to a public space while addressing a counterargument about cost or competing priorities",
    },
    {
      key: "required_service_counterargument",
      label: "Required service",
      prompt:
        "an argumentative text supporting a student service requirement while responding to concerns about time, fairness, or personal choice",
    },
    {
      key: "single_use_reduction_counterargument",
      label: "Reduce single-use items",
      prompt:
        "an argumentative article proposing reduced use of disposable items while addressing counterarguments about convenience and expense",
    },
  ],
};

/**
 * Returns the configured keyed ELA content-focus options for one TEKS.
 *
 * @param {string} teksStandard
 * @returns {Array<{
 *   key: string,
 *   label: string,
 *   prompt: string
 * }>}
 */
export function getELAContentFocusOptions(
  teksStandard,
) {
  if (
    typeof teksStandard !== "string" ||
    !teksStandard.trim()
  ) {
    return [];
  }

  return (
    ELA_CONTENT_FOCUS_CHIPS[
      teksStandard.trim()
    ] ?? []
  );
}

/**
 * Resolves one configured ELA content-focus option by TEKS and key.
 *
 * @param {string} teksStandard
 * @param {string} contentFocusKey
 * @returns {{
 *   key: string,
 *   label: string,
 *   prompt: string
 * } | null}
 */
export function getELAContentFocusOption(
  teksStandard,
  contentFocusKey,
) {
  if (
    typeof teksStandard !== "string" ||
    typeof contentFocusKey !== "string"
  ) {
    return null;
  }

  const normalizedTeks =
    teksStandard.trim();

  const normalizedKey =
    contentFocusKey.trim();

  if (!normalizedTeks || !normalizedKey) {
    return null;
  }

  return (
    getELAContentFocusOptions(
      normalizedTeks,
    ).find(
      (option) =>
        option.key === normalizedKey,
    ) ?? null
  );
}

/**
 * Returns the canonical backend-owned prompt for one keyed ELA focus.
 *
 * @param {string} teksStandard
 * @param {string} contentFocusKey
 * @returns {string|null}
 */
export function getELAContentFocusPrompt(
  teksStandard,
  contentFocusKey,
) {
  return (
    getELAContentFocusOption(
      teksStandard,
      contentFocusKey,
    )?.prompt ?? null
  );
}