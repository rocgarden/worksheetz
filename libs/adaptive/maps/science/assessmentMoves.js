// /libs/adaptive/maps/science/assessmentMoves.js
// Branch: v2/student-success-platform
//
// skill_focus → DOK level → assessment_move options.
//
// This file is intentionally organized by reusable Science skill_focus,
// not by TEKS code.
//
// TEKS-specific mapping lives in:
// /libs/adaptive/maps/science/skillFocusByTeks.js
//
// Example:
// "7.12B" maps to:
//   energy_flow
//   matter_cycles
//   ecosystem_interactions
//   system_modeling
//
// Then this file provides the DOK-specific moves for each skill_focus.
//
// Design rule:
// - skill_focus = the science concept/thinking lane
// - assessment_move = the exact student task for that DOK level
//
// Keep labels stable because they are injected into generator prompts
// and saved in question_json.

export const SCIENCE_ASSESSMENT_MOVES = {
  // ─────────────────────────────────────────────
  // General Science Reasoning
  // ─────────────────────────────────────────────

  cause_effect: {
    1: [
      "identify_cause",
      "identify_effect",
      "match_cause_to_effect",
      "select_cause_effect_pair",
    ],
    2: [
      "explain_cause_effect_relationship",
      "predict_effect_from_cause",
      "compare_causes_or_effects",
      "connect_process_to_result",
    ],
    3: [
      "analyze_chain_of_effects",
      "evaluate_most_likely_cause",
      "justify_cause_effect_explanation",
      "predict_system_outcome_from_change",
    ],
  },

  data_interpretation: {
    1: [
      "read_value_from_data",
      "identify_largest_or_smallest_value",
      "match_data_point_to_description",
      "identify_pattern_in_data",
    ],
    2: [
      "identify_trend_in_data",
      "compare_data_sets",
      "interpret_table_or_graph",
      "connect_data_to_science_concept",
    ],
    3: [
      "draw_conclusion_from_data",
      "justify_prediction_from_data",
      "evaluate_data_support_for_claim",
      "analyze_unusual_data_pattern",
    ],
  },

  claim_evidence_reasoning: {
    1: [
      "identify_claim",
      "identify_evidence",
      "match_evidence_to_observation",
      "select_statement_supported_by_evidence",
    ],
    2: [
      "match_evidence_to_claim",
      "explain_how_evidence_supports_claim",
      "distinguish_claim_from_evidence",
      "connect_reasoning_to_science_concept",
    ],
    3: [
      "identify_reasoning_gap",
      "evaluate_claim_strength",
      "justify_claim_with_evidence",
      "revise_claim_based_on_evidence",
    ],
  },

  system_modeling: {
    1: [
      "read_system_model",
      "identify_model_component",
      "match_model_part_to_function",
      "select_model_relationship",
    ],
    2: [
      "interpret_model_change",
      "compare_model_outputs",
      "explain_relationship_in_model",
      "predict_change_using_model",
    ],
    3: [
      "evaluate_model_accuracy",
      "identify_model_limitation",
      "propose_system_revision",
      "justify_model_improvement",
    ],
  },

  model_reasoning: {
    1: [
      "identify_model_part",
      "match_model_part_to_role",
      "select_observation_from_model",
      "identify_model_variable",
    ],
    2: [
      "interpret_model_relationship",
      "explain_model_prediction",
      "compare_two_models",
      "connect_model_to_real_system",
    ],
    3: [
      "evaluate_model_strength",
      "identify_missing_model_component",
      "revise_model_for_accuracy",
      "justify_best_model",
    ],
  },

  classification: {
    1: [
      "classify_object_or_organism",
      "identify_shared_property",
      "match_item_to_category",
      "select_correct_group",
    ],
    2: [
      "explain_classification_choice",
      "compare_classification_groups",
      "connect_property_to_category",
      "distinguish_similar_categories",
    ],
    3: [
      "justify_classification_system",
      "evaluate_best_classification",
      "analyze_classification_exception",
      "revise_classification_based_on_evidence",
    ],
  },

  // ─────────────────────────────────────────────
  // Matter and Energy
  // ─────────────────────────────────────────────

  matter_properties: {
    1: [
      "identify_physical_property",
      "match_property_to_material",
      "classify_material_by_property",
      "select_observable_property",
    ],
    2: [
      "compare_material_properties",
      "explain_property_use_connection",
      "interpret_property_data",
      "connect_property_to_behavior",
    ],
    3: [
      "justify_material_selection",
      "evaluate_property_evidence",
      "analyze_property_change",
      "predict_material_behavior_from_properties",
    ],
  },

  physical_change: {
    1: [
      "identify_physical_change",
      "match_change_to_observation",
      "classify_change_type",
      "select_evidence_of_physical_change",
    ],
    2: [
      "explain_physical_change",
      "compare_before_after_properties",
      "connect_energy_to_physical_change",
      "interpret_change_observation",
    ],
    3: [
      "justify_change_classification",
      "evaluate_evidence_of_change",
      "predict_result_of_physical_change",
      "analyze_change_process",
    ],
  },

  energy_transfer: {
    1: [
      "identify_energy_type",
      "identify_energy_transfer",
      "match_energy_source_to_effect",
      "select_energy_change",
    ],
    2: [
      "trace_energy_transfer",
      "explain_energy_transformation",
      "compare_energy_transfer_paths",
      "predict_energy_change",
    ],
    3: [
      "evaluate_energy_transfer_model",
      "justify_energy_transformation",
      "analyze_energy_loss_or_gain",
      "predict_system_effect_from_energy_change",
    ],
  },

  // ─────────────────────────────────────────────
  // Force, Motion, and Interactions
  // ─────────────────────────────────────────────

  force_motion: {
    1: [
      "identify_force",
      "identify_motion_change",
      "match_force_to_motion",
      "select_example_of_force",
    ],
    2: [
      "explain_force_motion_relationship",
      "compare_motion_scenarios",
      "interpret_motion_data",
      "predict_motion_from_force",
    ],
    3: [
      "analyze_force_motion_system",
      "justify_motion_prediction",
      "evaluate_force_explanation",
      "revise_motion_model",
    ],
  },

  // ─────────────────────────────────────────────
  // Earth and Space
  // ─────────────────────────────────────────────

  earth_systems: {
    1: [
      "identify_earth_system",
      "match_process_to_earth_system",
      "select_earth_system_interaction",
      "identify_observable_earth_change",
    ],
    2: [
      "explain_earth_system_interaction",
      "trace_matter_or_energy_in_earth_system",
      "compare_earth_processes",
      "interpret_earth_system_data",
    ],
    3: [
      "analyze_earth_system_change",
      "evaluate_earth_system_model",
      "justify_prediction_about_earth_process",
      "predict_effect_of_system_disruption",
    ],
  },

  earth_history: {
    1: [
      "identify_geologic_evidence",
      "match_fossil_to_environment",
      "identify_relative_age_clue",
      "select_evidence_of_past_environment",
    ],
    2: [
      "interpret_geologic_evidence",
      "compare_rock_or_fossil_layers",
      "explain_environmental_change_over_time",
      "connect_evidence_to_earth_history",
    ],
    3: [
      "justify_conclusion_about_past_environment",
      "evaluate_fossil_or_rock_evidence",
      "analyze_geologic_timeline",
      "predict_past_conditions_from_evidence",
    ],
  },

  earth_space_systems: {
    1: [
      "identify_space_system_component",
      "match_pattern_to_space_event",
      "select_observation_about_space_system",
      "identify_earth_sun_moon_relationship",
    ],
    2: [
      "explain_space_system_pattern",
      "interpret_space_model",
      "compare_space_system_positions",
      "predict_observable_space_pattern",
    ],
    3: [
      "evaluate_space_system_model",
      "justify_prediction_using_space_pattern",
      "analyze_earth_space_relationship",
      "revise_space_model_for_accuracy",
    ],
  },

  waves: {
    1: [
      "identify_wave_property",
      "match_wave_property_to_description",
      "select_wave_behavior",
      "identify_example_of_wave_transfer",
    ],
    2: [
      "compare_wave_properties",
      "interpret_wave_data",
      "explain_wave_behavior",
      "connect_wave_property_to_observation",
    ],
    3: [
      "analyze_wave_interaction",
      "evaluate_wave_model",
      "justify_wave_prediction",
      "predict_effect_of_wave_property_change",
    ],
  },

  // ─────────────────────────────────────────────
  // Life Science: Cells, Genetics, Adaptation
  // ─────────────────────────────────────────────

  cell_structure_function: {
    1: [
      "identify_cell_structure",
      "match_structure_to_function",
      "select_cell_part_role",
      "classify_cell_component",
    ],
    2: [
      "explain_structure_function_relationship",
      "compare_cell_structures",
      "predict_effect_of_missing_structure",
      "connect_cell_function_to_system_need",
    ],
    3: [
      "evaluate_cell_model",
      "justify_structure_function_claim",
      "analyze_cell_system_disruption",
      "revise_cell_model",
    ],
  },

  inheritance_patterns: {
    1: [
      "identify_inherited_trait",
      "match_parent_trait_to_offspring",
      "select_genetic_pattern",
      "classify_trait_as_inherited_or_learned",
    ],
    2: [
      "interpret_inheritance_pattern",
      "compare_inherited_and_acquired_traits",
      "explain_trait_pattern",
      "connect_trait_evidence_to_inheritance",
    ],
    3: [
      "justify_inheritance_claim",
      "evaluate_trait_evidence",
      "analyze_pattern_across_generations",
      "predict_offspring_trait_pattern",
    ],
  },

  adaptations: {
    1: [
      "identify_adaptation",
      "match_adaptation_to_environment",
      "select_survival_advantage",
      "classify_structural_or_behavioral_adaptation",
    ],
    2: [
      "explain_adaptation_advantage",
      "compare_adaptations",
      "connect_environment_to_adaptation",
      "predict_effect_of_environmental_change",
    ],
    3: [
      "evaluate_adaptation_effectiveness",
      "justify_survival_advantage",
      "analyze_adaptation_over_time",
      "predict_population_effect_from_adaptation",
    ],
  },

  // ─────────────────────────────────────────────
  // Ecosystems
  // Tested heavily with 7.12B.
  // ─────────────────────────────────────────────

  energy_flow: {
    1: [
      "identify_energy_source",
      "classify_energy_role",
      "match_organism_to_energy_role",
      "select_food_chain_position",
    ],
    2: [
      "trace_energy_transfer",
      "explain_energy_role_relationship",
      "compare_energy_paths",
      "predict_energy_change",
    ],
    3: [
      "evaluate_energy_disruption",
      "justify_energy_flow_model",
      "analyze_food_web_change",
      "predict_effect_of_energy_role_loss",
    ],
  },

  matter_cycles: {
    1: [
      "identify_recycled_material",
      "match_process_to_material",
      "classify_cycle_component",
      "select_decomposer_function",
    ],
    2: [
      "trace_matter_path",
      "compare_matter_transformations",
      "explain_role_in_matter_cycle",
      "connect_organism_to_matter_recycling",
    ],
    3: [
      "predict_cycle_disruption",
      "evaluate_matter_balance",
      "justify_matter_cycle_model",
      "analyze_effect_of_decomposer_loss",
    ],
  },

  ecosystem_interactions: {
    1: [
      "identify_relationship",
      "classify_ecosystem_role",
      "match_organism_to_role",
      "select_interaction_example",
    ],
    2: [
      "explain_interaction_effect",
      "compare_ecosystem_relationships",
      "predict_system_response",
      "connect_role_to_ecosystem_function",
    ],
    3: [
      "evaluate_ecosystem_stability",
      "justify_ecosystem_change",
      "analyze_interdependence",
      "predict_effect_of_population_change",
    ],
  },
};