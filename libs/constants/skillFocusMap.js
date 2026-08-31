// /libs/constants/skillFocusMap.js
// Branch: v2/student-success-platform
//
// skill_focus is system-generated — never a teacher/student input.
// Maps TEKS standard → array of valid sub-skills the generator can rotate
// through within a session. Distinct from the TEKS_*_MAP category keys
// (those group TEKS for dropdown display); this maps the OPPOSITE direction
// at a finer grain — one TEKS code → multiple thinking-move options.
//
// Vocabulary is intentionally subject-specific and small/closed —
// these are the exact labels injected into generator prompts.

// export const SKILL_FOCUS_VOCAB = {
//   ELA: ["main_idea", "text_evidence", "inference", "theme", "character_analysis", "plot_structure", "authors_purpose", "figurative_language", "vocabulary_context"],
//   "Social Studies": ["cause_effect", "historical_significance", "compare_perspectives", "chronology", "evidence_from_source"],
//   Science: ["claim_evidence_reasoning", "data_interpretation", "cause_effect", "model_analysis"],
//   Math: ["procedural_fluency", "conceptual_reasoning", "error_analysis", "multi_step_application"],
// };

// TEKS code → array of valid skill_focus options for that specific standard.
// Only needs entries for codes actively used in AssignClient dropdowns —
// falls back to a subject-level default if a code isn't listed.
// export const TEKS_SKILL_FOCUS_MAP = {
//   // ELA — Grade 6
//   "6.5F": ["inference", "text_evidence", "implicit_meaning"],
//   "6.5G": ["theme", "main_idea"],
//   "6.5B": ["character_analysis", "inference"],
//   "6.8D": ["main_idea", "text_evidence"],
//   "6.8E": ["authors_purpose"],
//   "6.4A": ["figurative_language"],

//   // ELA — Grade 7
//   "7.5F": ["inference", "text_evidence"],
//   "7.5G": ["theme", "main_idea"],
//   "7.5B": ["character_analysis", "inference"],
//   "7.8D": ["main_idea", "text_evidence"],
//   "7.8E": ["authors_purpose"],
//   "7.4A": ["figurative_language"],

//   // ELA — Grade 8
//   "8.5F": ["inference", "text_evidence"],
//   "8.5G": ["theme", "main_idea"],
//   "8.5B": ["character_analysis", "inference"],
//   "8.9D": ["main_idea", "text_evidence"],
//   "8.9E": ["authors_purpose"],
//   "8.9A": ["authors_purpose", "figurative_language", "inference", "text_evidence"],
//   "8.4A": ["figurative_language"],

//   // Grade 7 Texas History
//   // 7.2A: identify important individuals, events, and issues related to European colonization of Texas
//   "7.2A": [
//   "historical_significance",
//   "geographic_influence",
//   "compare_cultures",
//   "cause_effect",
// ],

//   // 7.3A: trace the development of events that led to the Texas Revolution
//   "7.3A": [
//     "cause_effect",
//     "chronology",
//     "compare_perspectives",
//     "historical_significance",
//   ],

//   // Science — Grade 6/7/8 examples
//   "6.5D": ["cause_effect", "data_interpretation"],
//   "7.12D": ["claim_evidence_reasoning", "model_analysis"],
//   "7.12B": [
//   "energy_flow",
//   "matter_cycles",
//   "ecosystem_interactions",
//   "system_modeling",
// ],
// };

/**
 * Returns the skill_focus rotation pool for a given TEKS standard.
 * Falls back to the subject's full vocab if the code has no specific mapping.
 */
// export function getSkillFocusOptions(teks_standard, subject) {
//   const specific = TEKS_SKILL_FOCUS_MAP[teks_standard];
//   if (specific?.length) return specific;
//   return SKILL_FOCUS_VOCAB[subject] ?? ["general"];
// }

/**
 * Selects the next skill_focus for a question, avoiding immediate repeat
 * of the previous question's skill_focus within the same session.
 */
// export function selectSkillFocus({ teks_standard, subject, previous_attempts = [] }) {
//   const options = getSkillFocusOptions(teks_standard, subject);

//   const recentSkillFocuses = previous_attempts
//     .slice(-3) // look back further than just 1, since pool can be 9 items wide
//     .map(a => {
//       const q = typeof a.question_json === "string"
//         ? JSON.parse(a.question_json)
//         : a.question_json;
//       return q?.skill_focus ?? null;
//     })
//     .filter(Boolean);

//   const filtered = options.filter(s => !recentSkillFocuses.includes(s));
//   const pool = filtered.length > 0 ? filtered : options;
//   return pool[Math.floor(Math.random() * pool.length)];
// }



// export const ASSESSMENT_MOVE_MAP = {
//   // ───────── ELA ─────────

//   authors_purpose: {
//     1: [
//       "identify_author_purpose",
//     ],
//     2: [
//       "connect_detail_to_purpose",
//     ],
//     3: [
//       "evaluate_word_choice_effect",
//       "contrast_stated_vs_implied_purpose",
//     ],
//    },

//     implicit_meaning: {
//     1: [
//         "identify_explicit_clue",
//     ],
//     2: [
//         "connect_clue_to_inference",
//         "infer_meaning_from_context",
//     ],
//     3: [
//         "evaluate_best_supported_inference",
//         "justify_inference_with_evidence",
//     ],
//     },

//   inference: {
//     1: [
//       "infer_explicit_meaning",
//     ],
//     2: [
//       "infer_character_feeling",
//       "infer_cause_from_effect",
//     ],
//     3: [
//       "infer_unstated_motive",
//       "evaluate_implied_message",
//     ],
//   },

//   text_evidence: {
//     1: [
//       "locate_supporting_detail",
//     ],
//     2: [
//       "match_claim_to_evidence",
//       "select_strongest_evidence",
//     ],
//     3: [
//       "identify_evidence_gap",
//       "evaluate_evidence_strength",
//     ],
//   },

//   figurative_language: {
//     1: [
//       "identify_device_used",
//     ],
//     2: [
//       "explain_device_effect",
//     ],
//     3: [
//       "compare_literal_vs_figurative_meaning",
//       "evaluate_author_language_choice",
//     ],
//   },

//   // ───────── Social Studies ─────────

// cause_effect: {
//   1: [
//     "identify_cause",
//     "identify_effect",
//     "match_environment_to_lifestyle",
//     "select_cause_effect_pair",
//   ],
//   2: [
//     "explain_environment_lifestyle_connection",
//     "explain_resource_use_effect",
//     "connect_geography_to_culture",
//   ],
//   3: [
//     "evaluate_most_important_geographic_factor",
//     "justify_cultural_adaptation",
//     "analyze_environmental_influence",
//   ],
// },
//   compare_cultures: {
//   1: [
//     "identify_cultural_feature",
//     "match_group_to_way_of_life",
//     "select_group_comparison",
//     "identify_difference_between_groups",
//   ],
//   2: [
//     "compare_cultural_adaptations",
//     "explain_difference_between_groups",
//     "connect_culture_to_environment",
//   ],
//   3: [
//     "evaluate_most_significant_difference",
//     "analyze_cultural_adaptation",
//   ],
// },
//   chronology: {
//     1: [
//       "identify_sequence",
//       "place_event_in_order",
//       "select_event_before_or_after",
//       "identify_time_period",
//     ],
//     2: [
//       "explain_event_sequence",
//       "connect_event_to_later_development",
//       "interpret_timeline_relationship",
//     ],
//     3: [
//       "evaluate_turning_point",
//       "justify_sequence_importance",
//       "analyze_how_timing_changed_outcome",
//     ],
//   },
// historical_significance: {
//   1: [
//     "identify_important_group",
//     "identify_cultural_practice",
//     "match_group_to_cultural_feature",
//     "select_historical_importance",
//   ],
//   2: [
//     "explain_cultural_importance",
//     "compare_cultural_importance",
//     "connect_group_to_texas_history",
//   ],
//   3: [
//     "evaluate_historical_significance",
//     "justify_cultural_importance",
//     "analyze_cultural_legacy",
//   ],
// },

//   compare_perspectives: {
//     1: [
//       "identify_point_of_view",
//       "match_group_to_perspective",
//       "select_stated_perspective",
//       "identify_agreement_or_disagreement",
//     ],
//     2: [
//       "compare_two_perspectives",
//       "explain_reason_for_perspective",
//       "connect_perspective_to_historical_context",
//     ],
//     3: [
//       "evaluate_perspective_strength",
//       "justify_historical_interpretation",
//       "analyze_conflicting_viewpoints",
//     ],
//   },

//   geographic_influence: {
//   1: [
//     "identify_region",
//     "identify_resource",
//     "match_region_to_group",
//     "select_geographic_factor",
//   ],
//   2: [
//     "explain_geography_lifestyle_connection",
//     "connect_resource_to_way_of_life",
//     "interpret_region_description",
//   ],
//   3: [
//     "evaluate_geographic_influence",
//     "justify_environmental_adaptation",
//     "analyze_geography_culture_connection",
//   ],
// },


//   // ───────── Science ─────────

//   claim_evidence_reasoning: {
//     1: [
//       "identify_claim",
//     ],
//     2: [
//       "match_evidence_to_claim",
//     ],
//     3: [
//       "identify_reasoning_gap",
//       "evaluate_claim_strength",
//     ],
//   },

//   data_interpretation: {
//     1: [
//       "read_value_from_data",
//     ],
//     2: [
//       "identify_trend_in_data",
//     ],
//     3: [
//       "draw_conclusion_from_data",
//       "justify_prediction_from_data",
//     ],
//   },
// energy_flow: {
//   1: [
//     "identify_energy_source",
//     "classify_energy_role",
//     "match_organism_to_energy_role",
//     "select_food_chain_position",
//   ],
//   2: [
//     "trace_energy_transfer",
//     "predict_energy_change",
//   ],
//   3: [
//     "evaluate_energy_disruption",
//     "justify_energy_flow_model",
//   ],
// },

// matter_cycles: {
//   1: [
//     "identify_recycled_material",
//     "match_process_to_material",
//     "classify_cycle_component",
//     "select_decomposer_function",
//   ],
//   2: [
//     "trace_matter_path",
//     "compare_matter_transformations",
//   ],
//   3: [
//     "predict_cycle_disruption",
//     "evaluate_matter_balance",
//   ],
// },

// ecosystem_interactions: {
//   1: [
//     "identify_relationship",
//     "classify_ecosystem_role",
//     "match_organism_to_role",
//     "select_interaction_example",
//   ],
//   2: [
//     "explain_interaction_effect",
//     "predict_system_response",
//   ],
//   3: [
//     "evaluate_ecosystem_stability",
//     "justify_ecosystem_change",
//   ],
// },

// system_modeling: {
//   1: [
//     "read_ecosystem_model",
//     "match_model_part_to_role",
//     "select_model_component",
//     "classify_system_component",
//   ],
//   2: [
//     "interpret_model_change",
//     "compare_model_outputs",
//   ],
//   3: [
//     "evaluate_model_accuracy",
//     "propose_system_revision",
//   ],
// },
// };

/**
 * Selects an assessment_move WITHIN the chosen skill_focus,
 * avoiding repeats from recent attempts that used the same skill_focus.
 */
// export function selectAssessmentMove({
//   skill_focus,
//   dok_level,
//   previous_attempts = [],
// }) {
// const options = ASSESSMENT_MOVE_MAP[skill_focus]?.[Number(dok_level)] ?? [];

//     if (!options.length) {
//     console.warn("[selectAssessmentMove] No options found", {
//         skill_focus,
//         dok_level,
//     });
//     return null;
//     }
//   const recentMoves = previous_attempts
//     .map((a) => {
//       const q =
//         typeof a.question_json === "string"
//           ? JSON.parse(a.question_json)
//           : a.question_json;

//       return q?.skill_focus === skill_focus
//         ? q?.assessment_move
//         : null;
//     })
//     .filter(Boolean);

//   const filtered = options.filter(
//     (m) => !recentMoves.includes(m)
//   );

//   const pool = filtered.length ? filtered : options;

//   return pool[Math.floor(Math.random() * pool.length)];
// }


