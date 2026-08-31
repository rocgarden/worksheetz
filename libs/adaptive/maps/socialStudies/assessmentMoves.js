// /libs/adaptive/maps/socialStudies/assessmentMoves.js
// Branch: v2/student-success-platform
//
// skill_focus → DOK level → assessment_move options.
//
// This file is intentionally organized by reusable Social Studies skill_focus,
// not by TEKS code.
//
// TEKS-specific mapping lives in:
// /libs/adaptive/maps/socialStudies/skillFocusByTeks.js
//
// Design rule:
// - skill_focus = historical/geographic/civic/economic thinking lane
// - assessment_move = exact student task for that DOK level
//
// Keep labels stable because they are injected into generator prompts
// and saved in question_json.

export const SOCIAL_STUDIES_ASSESSMENT_MOVES = {
  // ─────────────────────────────────────────────
  // Cause / Effect
  // Tested with 7.2A.
  // ─────────────────────────────────────────────

  cause_effect: {
    1: [
      "identify_cause",
      "identify_effect",
      "match_environment_to_lifestyle",
      "select_cause_effect_pair",
    ],
    2: [
      "explain_environment_lifestyle_connection",
      "explain_resource_use_effect",
      "connect_geography_to_culture",
      "explain_cause_effect_relationship",
    ],
    3: [
      "evaluate_most_important_geographic_factor",
      "justify_cultural_adaptation",
      "analyze_environmental_influence",
      "evaluate_most_significant_cause",
    ],
  },

  // ─────────────────────────────────────────────
  // Historical Significance
  // Tested with 7.2A.
  // ─────────────────────────────────────────────

  historical_significance: {
    1: [
      "identify_important_group",
      "identify_cultural_practice",
      "match_group_to_cultural_feature",
      "select_historical_importance",
    ],
    2: [
      "explain_cultural_importance",
      "compare_cultural_importance",
      "connect_group_to_texas_history",
      "explain_historical_importance",
    ],
    3: [
      "evaluate_historical_significance",
      "justify_cultural_importance",
      "analyze_cultural_legacy",
      "evaluate_long_term_importance",
    ],
  },

  // ─────────────────────────────────────────────
  // Geographic Influence
  // Tested with 7.2A.
  // ─────────────────────────────────────────────

  geographic_influence: {
    1: [
      "identify_region",
      "identify_resource",
      "match_region_to_group",
      "select_geographic_factor",
    ],
    2: [
      "explain_geography_lifestyle_connection",
      "connect_resource_to_way_of_life",
      "interpret_region_description",
      "compare_geographic_influences",
    ],
    3: [
      "evaluate_geographic_influence",
      "justify_environmental_adaptation",
      "analyze_geography_culture_connection",
      "evaluate_geographic_advantage",
    ],
  },

  // ─────────────────────────────────────────────
  // Compare Cultures
  // Tested with 7.2A.
  // ─────────────────────────────────────────────

  compare_cultures: {
    1: [
      "identify_cultural_feature",
      "match_group_to_way_of_life",
      "select_group_comparison",
      "identify_difference_between_groups",
    ],
    2: [
      "compare_cultural_adaptations",
      "explain_difference_between_groups",
      "connect_culture_to_environment",
      "compare_ways_of_life",
    ],
    3: [
      "evaluate_most_significant_difference",
      "analyze_cultural_adaptation",
      "justify_cultural_comparison",
      "evaluate_cultural_response_to_environment",
    ],
  },

  // ─────────────────────────────────────────────
  // Compare Perspectives
  // ─────────────────────────────────────────────

  compare_perspectives: {
    1: [
      "identify_point_of_view",
      "match_group_to_perspective",
      "select_stated_perspective",
      "identify_agreement_or_disagreement",
    ],
    2: [
      "compare_two_perspectives",
      "explain_reason_for_perspective",
      "connect_perspective_to_historical_context",
      "distinguish_perspective_from_fact",
    ],
    3: [
      "evaluate_perspective_strength",
      "justify_historical_interpretation",
      "analyze_conflicting_viewpoints",
      "evaluate_how_perspective_shapes_account",
    ],
  },

  // ─────────────────────────────────────────────
  // Chronology
  // Do not use for 7.2A.
  // ─────────────────────────────────────────────

  chronology: {
    1: [
      "identify_sequence",
      "place_event_in_order",
      "select_event_before_or_after",
      "identify_time_period",
    ],
    2: [
      "explain_event_sequence",
      "connect_event_to_later_development",
      "interpret_timeline_relationship",
      "explain_before_after_relationship",
    ],
    3: [
      "evaluate_turning_point",
      "justify_sequence_importance",
      "analyze_how_timing_changed_outcome",
      "evaluate_long_term_sequence_effect",
    ],
  },

  // ─────────────────────────────────────────────
  // Evidence From Source
  // ─────────────────────────────────────────────

  evidence_from_source: {
    1: [
      "identify_source_detail",
      "locate_supporting_evidence",
      "identify_stated_claim",
      "match_detail_to_source",
    ],
    2: [
      "match_evidence_to_claim",
      "interpret_source_evidence",
      "compare_source_details",
      "connect_source_detail_to_context",
    ],
    3: [
      "evaluate_source_reliability",
      "justify_claim_with_source_evidence",
      "analyze_source_perspective",
      "evaluate_best_source_support",
    ],
  },

  // ─────────────────────────────────────────────
  // Claim / Evidence / Reasoning
  // ─────────────────────────────────────────────

  claim_evidence_reasoning: {
    1: [
      "identify_claim",
      "identify_evidence",
      "match_evidence_to_claim",
      "select_supported_statement",
    ],
    2: [
      "explain_how_evidence_supports_claim",
      "distinguish_claim_from_evidence",
      "connect_reasoning_to_context",
      "compare_evidence_for_claims",
    ],
    3: [
      "evaluate_claim_strength",
      "identify_reasoning_gap",
      "justify_claim_with_multiple_sources",
      "revise_claim_based_on_evidence",
    ],
  },

  // ─────────────────────────────────────────────
  // Historical Interpretation
  // ─────────────────────────────────────────────

  historical_interpretation: {
    1: [
      "identify_historical_claim",
      "identify_author_viewpoint",
      "select_interpretation_from_source",
      "match_event_to_interpretation",
    ],
    2: [
      "explain_historical_interpretation",
      "compare_historical_interpretations",
      "connect_interpretation_to_evidence",
      "distinguish_fact_from_interpretation",
    ],
    3: [
      "evaluate_historical_interpretation",
      "justify_best_interpretation",
      "analyze_how_evidence_shapes_interpretation",
      "evaluate_competing_interpretations",
    ],
  },

  // ─────────────────────────────────────────────
  // Human / Environment Interaction
  // ─────────────────────────────────────────────

  human_environment_interaction: {
    1: [
      "identify_environmental_feature",
      "identify_human_adaptation",
      "match_human_activity_to_environment",
      "select_environmental_influence",
    ],
    2: [
      "explain_human_environment_relationship",
      "connect_environment_to_settlement",
      "compare_environmental_adaptations",
      "explain_how_people_modified_environment",
    ],
    3: [
      "evaluate_human_environment_impact",
      "justify_adaptation_to_environment",
      "analyze_environmental_consequences",
      "evaluate_best_response_to_environment",
    ],
  },

  // ─────────────────────────────────────────────
  // Spatial Patterns
  // ─────────────────────────────────────────────

  spatial_patterns: {
    1: [
      "identify_location_pattern",
      "match_place_to_region",
      "select_map_pattern",
      "identify_distribution_pattern",
    ],
    2: [
      "explain_location_pattern",
      "compare_spatial_patterns",
      "connect_pattern_to_geographic_factor",
      "interpret_map_distribution",
    ],
    3: [
      "analyze_spatial_pattern",
      "evaluate_geographic_pattern",
      "justify_explanation_for_distribution",
      "predict_effect_of_location_pattern",
    ],
  },

  map_evidence: {
  1: [
    "identify_map_feature",
    "locate_place_on_map",
    "match_symbol_to_feature",
    "select_map_evidence",
  ],
  2: [
    "interpret_map_information",
    "compare_map_features",
    "connect_map_feature_to_geographic_factor",
    "explain_map_pattern",
  ],
  3: [
    "analyze_map_evidence",
    "evaluate_geographic_pattern_from_map",
    "justify_conclusion_using_map",
    "predict_outcome_from_map_change",
  ],
},


  // ─────────────────────────────────────────────
  // Compare Regions
  // ─────────────────────────────────────────────

  compare_regions: {
    1: [
      "identify_region_feature",
      "match_region_to_description",
      "select_region_comparison",
      "identify_difference_between_regions",
    ],
    2: [
      "compare_region_characteristics",
      "explain_regional_difference",
      "connect_region_to_way_of_life",
      "compare_resources_across_regions",
    ],
    3: [
      "evaluate_most_significant_regional_difference",
      "analyze_how_region_shapes_activity",
      "justify_regional_comparison",
      "evaluate_regional_advantage",
    ],
  },

  // ─────────────────────────────────────────────
  // Culture Traits
  // ─────────────────────────────────────────────

  culture_traits: {
    1: [
      "identify_culture_trait",
      "match_trait_to_group",
      "select_example_of_culture",
      "identify_cultural_practice",
    ],
    2: [
      "explain_cultural_trait",
      "compare_cultural_traits",
      "connect_trait_to_group_identity",
      "explain_cultural_change",
    ],
    3: [
      "evaluate_cultural_significance",
      "justify_importance_of_culture_trait",
      "analyze_cultural_continuity_and_change",
      "evaluate_cultural_influence",
    ],
  },

  // ─────────────────────────────────────────────
  // Government Systems
  // ─────────────────────────────────────────────

  government_systems: {
    1: [
      "identify_government_feature",
      "match_power_to_branch_or_level",
      "select_government_function",
      "identify_governing_document",
    ],
    2: [
      "explain_government_function",
      "compare_government_structures",
      "connect_government_power_to_purpose",
      "interpret_government_principle",
    ],
    3: [
      "evaluate_government_structure",
      "justify_government_principle",
      "analyze_balance_of_power",
      "evaluate_effectiveness_of_government_action",
    ],
  },

  // ─────────────────────────────────────────────
  // Compare Governments
  // ─────────────────────────────────────────────

  compare_governments: {
    1: [
      "identify_government_type",
      "match_government_to_feature",
      "select_government_comparison",
      "identify_difference_between_governments",
    ],
    2: [
      "compare_government_systems",
      "explain_government_difference",
      "connect_government_structure_to_citizen_role",
      "compare_distribution_of_power",
    ],
    3: [
      "evaluate_government_system",
      "justify_government_comparison",
      "analyze_effect_of_government_structure",
      "evaluate_best_government_response",
    ],
  },

  // ─────────────────────────────────────────────
  // Civic Principles
  // ─────────────────────────────────────────────

  civic_principles: {
    1: [
      "identify_civic_principle",
      "match_right_or_responsibility",
      "select_example_of_citizenship",
      "identify_constitutional_principle",
    ],
    2: [
      "explain_civic_principle",
      "connect_right_to_responsibility",
      "compare_civic_responsibilities",
      "interpret_principle_in_context",
    ],
    3: [
      "evaluate_civic_action",
      "justify_importance_of_principle",
      "analyze_effect_of_civic_participation",
      "evaluate_conflict_between_principles",
    ],
  },

  // ─────────────────────────────────────────────
  // Economic Systems
  // ─────────────────────────────────────────────

  economic_systems: {
    1: [
      "identify_economic_activity",
      "match_resource_to_economic_use",
      "select_economic_factor",
      "identify_supply_or_demand_example",
    ],
    2: [
      "explain_economic_cause_effect",
      "connect_resource_to_economy",
      "compare_economic_activities",
      "interpret_economic_change",
    ],
    3: [
      "evaluate_economic_impact",
      "justify_economic_decision",
      "analyze_long_term_economic_effect",
      "evaluate_role_of_resources_in_growth",
    ],
  },
};