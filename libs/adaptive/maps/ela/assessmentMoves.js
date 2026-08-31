// /libs/adaptive/maps/ela/assessmentMoves.js
//
// Maps skill_focus → DOK level → assessment moves.
// The selector chooses one move after selecting skill_focus.
//
// Important:
// - These are NOT TEKS-specific.
// - These should cover the skill_focus values used by:
//   1. skillFocusByTeks.js
//   2. skillFocusByBucket.js
//   3. defaultSkillFocus

export const ELA_ASSESSMENT_MOVES = {
  // ── Core comprehension ──────────────────────────────────────────────

  inference: {
    1: [
      "identify_inference_clue",
      "match_detail_to_inference",
      "identify_character_action",
    ],
    2: [
      "explain_inference_from_evidence",
      "connect_detail_to_meaning",
      "infer_character_feeling",
    ],
    3: [
      "justify_inference_with_multiple_details",
      "evaluate_best_supported_inference",
      "analyze_how_details_imply_meaning",
    ],
  },

  implicit_meaning: {
    1: [
      "identify_implied_detail",
      "match_action_to_implied_feeling",
      "identify_unstated_meaning",
    ],
    2: [
      "explain_implied_meaning",
      "connect_dialogue_to_unstated_idea",
      "interpret_character_motivation",
    ],
    3: [
      "justify_implied_theme_or_message",
      "evaluate_best_supported_implicit_meaning",
      "analyze_how_author_implies_meaning",
    ],
  },

  text_evidence: {
    1: [
      "identify_supporting_detail",
      "match_evidence_to_answer",
      "select_relevant_sentence",
    ],
    2: [
      "explain_how_evidence_supports_answer",
      "connect_evidence_to_inference",
      "choose_best_text_evidence",
    ],
    3: [
      "evaluate_strongest_evidence",
      "justify_answer_with_multiple_details",
      "analyze_evidence_quality",
    ],
  },

  central_idea: {
    1: [
      "identify_central_idea",
      "match_detail_to_central_idea",
      "identify_topic",
    ],
    2: [
      "explain_central_idea_development",
      "connect_details_to_central_idea",
      "distinguish_central_idea_from_detail",
    ],
    3: [
      "evaluate_best_supported_central_idea",
      "analyze_how_details_develop_central_idea",
      "justify_central_idea_with_evidence",
    ],
  },

  key_details: {
    1: [
      "identify_key_detail",
      "match_detail_to_event",
      "locate_important_information",
    ],
    2: [
      "explain_detail_importance",
      "connect_detail_to_main_idea",
      "compare_relevant_details",
    ],
    3: [
      "evaluate_which_detail_best_supports_claim",
      "analyze_detail_relationships",
      "justify_detail_importance",
    ],
  },

  summary: {
    1: [
      "identify_summary_detail",
      "choose_accurate_summary_statement",
      "sequence_major_events",
    ],
    2: [
      "distinguish_summary_from_minor_detail",
      "explain_how_events_develop_summary",
      "select_best_objective_summary",
    ],
    3: [
      "evaluate_best_summary",
      "justify_summary_with_key_events",
      "analyze_how_ideas_build_summary",
    ],
  },

  paraphrase: {
    1: [
      "identify_same_meaning_statement",
      "match_sentence_to_paraphrase",
      "recognize_restated_detail",
    ],
    2: [
      "choose_best_paraphrase",
      "explain_paraphrased_meaning",
      "distinguish_paraphrase_from_inference",
    ],
    3: [
      "evaluate_most_accurate_paraphrase",
      "justify_paraphrase_with_original_text",
      "analyze_how_paraphrase_preserves_meaning",
    ],
  },

  sequence: {
    1: [
      "identify_event_order",
      "match_event_to_sequence",
      "identify_first_or_last_event",
    ],
    2: [
      "explain_sequence_relationship",
      "connect_event_order_to_cause",
      "identify_how_sequence_affects_meaning",
    ],
    3: [
      "analyze_how_sequence_shapes_theme",
      "evaluate_why_order_matters",
      "justify_sequence_effect_with_evidence",
    ],
  },

  cause_effect: {
    1: ["identify_cause", "identify_effect", "match_cause_to_effect"],
    2: [
      "explain_cause_effect_relationship",
      "connect_event_to_result",
      "distinguish_cause_from_effect",
    ],
    3: [
      "evaluate_most_significant_cause",
      "analyze_chain_of_effects",
      "justify_cause_effect_claim",
    ],
  },

  // ── Literary analysis ───────────────────────────────────────────────

  character_analysis: {
    1: [
      "identify_character_trait",
      "match_action_to_character",
      "identify_character_feeling",
    ],
    2: [
      "explain_character_motivation",
      "connect_action_to_trait",
      "analyze_character_change",
    ],
    3: [
      "justify_character_analysis_with_evidence",
      "evaluate_best_supported_trait",
      "analyze_how_character_choices_develop_theme",
    ],
  },

  plot_development: {
    1: [
      "identify_plot_event",
      "match_event_to_conflict",
      "identify_problem_or_solution",
    ],
    2: [
      "explain_how_event_affects_plot",
      "connect_conflict_to_resolution",
      "analyze_turning_point",
    ],
    3: [
      "evaluate_how_key_events_shape_plot",
      "justify_how_plot_develops_theme",
      "analyze_interaction_of_events",
    ],
  },
  plot_structure: {
    1: [
      "identify_plot_event",
      "identify_problem_or_resolution",
      "match_event_to_plot_part",
    ],
    2: [
      "explain_how_event_affects_plot",
      "connect_plot_structure_to_conflict",
      "analyze_how_events_build_tension",
    ],
    3: [
      "evaluate_how_key_events_shape_plot_structure",
      "justify_how_plot_structure_develops_theme",
      "analyze_how_plot_structure_shapes_meaning",
    ],
  },

  theme: {
    1: [
      "identify_theme_clue",
      "match_event_to_theme",
      "identify_lesson_or_message",
    ],
    2: [
      "explain_theme_development",
      "connect_character_action_to_theme",
      "choose_best_supported_theme",
    ],
    3: [
      "justify_theme_with_multiple_details",
      "evaluate_strongest_theme_statement",
      "analyze_how_conflict_develops_theme",
    ],
  },

  setting_analysis: {
    1: [
      "identify_setting_detail",
      "match_setting_to_event",
      "identify_time_or_place",
    ],
    2: [
      "explain_setting_influence",
      "connect_setting_to_character_action",
      "analyze_setting_effect_on_conflict",
    ],
    3: [
      "evaluate_setting_importance",
      "justify_how_setting_shapes_theme",
      "analyze_setting_as_source_of_conflict",
    ],
  },

  conflict_resolution: {
    1: [
      "identify_conflict",
      "identify_resolution",
      "match_problem_to_solution",
    ],
    2: [
      "explain_how_conflict_develops",
      "connect_character_choice_to_resolution",
      "analyze_conflict_effect",
    ],
    3: [
      "evaluate_resolution_effectiveness",
      "justify_how_conflict_shapes_theme",
      "analyze_multiple_conflict_factors",
    ],
  },

  point_of_view: {
    1: [
      "identify_point_of_view",
      "match_narrator_to_detail",
      "identify_speaker_perspective",
    ],
    2: [
      "explain_how_point_of_view_affects_meaning",
      "compare_two_perspectives",
      "connect_point_of_view_to_reader_understanding",
    ],
    3: [
      "evaluate_how_perspective_shapes_theme",
      "analyze_reliability_or_bias",
      "justify_interpretation_of_perspective",
    ],
  },

  dialogue_analysis: {
    1: [
      "identify_dialogue_detail",
      "identify_speaker_response",
      "recognize_dialogue_effect",
    ],
    2: [
      "explain_how_dialogue_reveals_character",
      "connect_dialogue_to_conflict",
      "analyze_dialogue_effect_on_plot",
    ],
    3: [
      "evaluate_most_important_dialogue_exchange",
      "justify_how_dialogue_develops_character",
      "analyze_how_dialogue_advances_theme_or_conflict",
    ],
  },

  supporting_details: {
    1: [
      "identify_supporting_detail",
      "match_detail_to_central_idea",
      "recognize_relevant_detail",
    ],
    2: [
      "explain_how_detail_supports_idea",
      "distinguish_key_detail_from_minor_detail",
      "connect_multiple_details_to_central_idea",
    ],
    3: [
      "evaluate_strongest_supporting_detail",
      "justify_how_details_develop_central_idea",
      "analyze_how_details_shape_reader_understanding",
    ],
  },

  inquiry_reasoning: {
    1: [
      "identify_research_question",
      "recognize_relevant_inquiry_topic",
      "match_question_to_source_need",
    ],
    2: [
      "explain_how_question_guides_research",
      "distinguish_broad_question_from_focused_question",
      "connect_source_to_inquiry_question",
    ],
    3: [
      "evaluate_best_research_question",
      "justify_source_selection_for_inquiry",
      "analyze_how_research_questions_refine_understanding",
    ],
  },

  compare_perspectives: {
    1: [
      "identify_point_of_view",
      "recognize_perspective_difference",
      "match_statement_to_perspective",
    ],
    2: [
      "explain_how_perspectives_differ",
      "compare_responses_to_same_event",
      "connect_perspective_to_evidence",
    ],
    3: [
      "evaluate_most_supported_perspective",
      "justify_comparison_using_text_evidence",
      "analyze_how_different_perspectives_shape_meaning",
    ],
  },

  poetry_structure: {
    1: [
      "identify_line_break_effect",
      "identify_poetry_structure_element",
      "match_poetry_feature_to_effect",
    ],
    2: [
      "explain_how_line_breaks_shape_meaning",
      "analyze_rhythm_or_meter_effect",
      "connect_poetry_structure_to_mood",
    ],
    3: [
      "evaluate_most_effective_poetry_structure_choice",
      "justify_how_poetic_form_shapes_message",
      "analyze_how_poetry_structure_develops_meaning",
    ],
  },

  drama_structure: {
    1: [
      "identify_character_tag",
      "identify_stage_direction",
      "match_drama_element_to_purpose",
    ],
    2: [
      "explain_how_stage_directions_affect_scene",
      "connect_dialogue_to_character_development",
      "explain_how_scene_structure_shapes_meaning",
    ],
    3: [
      "evaluate_most_important_stage_direction",
      "justify_how_drama_structure_develops_character",
      "analyze_how_dialogue_and_staging_work_together",
    ],
  },
  dramatic_action: {
    1: [
      "identify_stage_direction_that_builds_tension",
      "identify_scene_event",
      "identify_key_plot_detail",
    ],
    2: [
      "explain_how_stage_direction_builds_tension",
      "explain_how_scene_advances_action",
      "connect_plot_detail_to_mystery",
    ],
    3: [
      "analyze_how_stage_directions_build_to_climax",
      "justify_how_dramatic_action_develops_conflict",
      "evaluate_how_scene_structure_builds_tension",
      "analyze_how_key_detail_builds_dramatic_action",
      "analyze_how_scene_structure_advances_resolution",
    ],
  },
  parallel_plot_conflict: {
    1: [
      "identify_initial_problem",
      "identify_later_problem",
      "identify_parallel_plot_detail",
    ],
    2: [
      "compare_initial_and_later_problem",
      "explain_how_parallel_plot_creates_conflict",
      "connect_two_plot_details_to_mystery",
    ],
    3: [
      "analyze_how_parallel_plot_builds_tension",
      "justify_how_dual_conflicts_shape_dramatic_action",
      "evaluate_how_key_plot_details_create_mystery",
    ],
  },

  key_detail_revelation: {
    1: [
      "identify_key_detail",
      "identify_detail_that_changes_understanding",
      "identify_scene_revelation",
    ],
    2: [
      "explain_how_detail_advances_action",
      "connect_key_detail_to_later_revelation",
      "explain_how_scene_reveals_importance",
    ],
    3: [
      "analyze_how_key_detail_builds_dramatic_action",
      "justify_how_revelation_changes_understanding",
      "evaluate_how_final_scene_resolves_key_detail",
    ],
  },

  // ── Genre / informational / argument ────────────────────────────────

  genre_features: {
    1: [
      "identify_genre_feature",
      "match_feature_to_genre",
      "recognize_text_type",
    ],
    2: [
      "explain_how_genre_feature_affects_meaning",
      "compare_genre_features",
      "connect_feature_to_author_purpose",
    ],
    3: [
      "evaluate_effect_of_genre_feature",
      "analyze_how_genre_shapes_message",
      "justify_genre_classification",
    ],
  },

  literary_genre_analysis: {
    1: [
      "identify_literary_element",
      "match_element_to_genre",
      "identify_genre_clue",
    ],
    2: [
      "explain_literary_element_effect",
      "connect_genre_feature_to_theme",
      "compare_literary_structures",
    ],
    3: [
      "analyze_how_literary_features_shape_theme",
      "evaluate_author_use_of_genre",
      "justify_literary_interpretation",
    ],
  },

  informational_text_structure: {
    1: [
      "identify_text_structure",
      "match_detail_to_structure",
      "identify_signal_words",
    ],
    2: [
      "explain_how_structure_organizes_ideas",
      "connect_structure_to_central_idea",
      "compare_sections_of_text",
    ],
    3: [
      "evaluate_effectiveness_of_structure",
      "analyze_how_structure_develops_argument",
      "justify_structure_effect_with_evidence",
    ],
  },

  argument_analysis: {
    1: ["identify_claim", "identify_reason", "identify_supporting_evidence"],
    2: [
      "explain_how_evidence_supports_claim",
      "distinguish_claim_from_reason",
      "analyze_argument_component",
    ],
    3: [
      "evaluate_strength_of_argument",
      "justify_best_supported_claim",
      "analyze_author_reasoning",
    ],
  },

  author_claim: {
    1: [
      "identify_author_claim",
      "match_claim_to_evidence",
      "identify_reason_for_claim",
    ],
    2: [
      "explain_how_reason_supports_claim",
      "connect_evidence_to_author_claim",
      "distinguish_claim_from_detail",
    ],
    3: [
      "evaluate_best_supported_claim",
      "analyze_claim_evidence_reasoning",
      "justify_author_claim_with_multiple_details",
    ],
  },

  // ── Author’s craft ─────────────────────────────────────────────────

  authors_purpose: {
    1: [
      "identify_author_purpose",
      "match_detail_to_purpose",
      "identify_intended_audience",
    ],
    2: [
      "explain_how_detail_supports_purpose",
      "connect_purpose_to_structure",
      "analyze_purpose_effect",
    ],
    3: [
      "evaluate_author_purpose",
      "justify_purpose_with_multiple_details",
      "analyze_how_purpose_shapes_message",
    ],
  },

  craft_analysis: {
    1: [
      "identify_craft_choice",
      "match_craft_to_effect",
      "identify_repeated_detail",
    ],
    2: [
      "explain_effect_of_craft_choice",
      "connect_craft_to_meaning",
      "analyze_author_choice",
    ],
    3: [
      "evaluate_effectiveness_of_craft_choice",
      "justify_craft_analysis_with_evidence",
      "analyze_how_craft_develops_theme_or_claim",
    ],
  },

  word_choice: {
    1: [
      "identify_word_meaning",
      "match_word_to_effect",
      "identify_descriptive_word",
    ],
    2: [
      "explain_word_choice_effect",
      "connect_word_choice_to_tone",
      "analyze_connotation",
    ],
    3: [
      "evaluate_author_word_choice",
      "justify_word_choice_effect",
      "analyze_how_word_choice_shapes_meaning",
    ],
  },

  structure_effect: {
    1: [
      "identify_structure_feature",
      "match_structure_to_section",
      "identify_order_of_ideas",
    ],
    2: [
      "explain_structure_effect",
      "connect_structure_to_purpose",
      "analyze_section_relationship",
    ],
    3: [
      "evaluate_structure_effectiveness",
      "justify_how_structure_shapes_meaning",
      "analyze_how_structure_builds_theme_or_claim",
    ],
  },

  figurative_language: {
    1: [
      "identify_figurative_language",
      "match_phrase_to_meaning",
      "identify_comparison",
    ],
    2: [
      "explain_figurative_meaning",
      "connect_figurative_language_to_tone",
      "analyze_image_or_comparison",
    ],
    3: [
      "evaluate_effect_of_figurative_language",
      "justify_interpretation_of_phrase",
      "analyze_how_language_develops_theme",
    ],
  },

  tone_mood: {
    1: [
      "identify_tone_or_mood",
      "match_detail_to_mood",
      "identify_feeling_created",
    ],
    2: [
      "explain_how_words_create_tone",
      "connect_setting_to_mood",
      "analyze_tone_shift",
    ],
    3: [
      "evaluate_how_tone_shapes_meaning",
      "justify_tone_analysis_with_evidence",
      "analyze_how_mood_develops_theme",
    ],
  },

  // ── Vocabulary ─────────────────────────────────────────────────────

  word_meaning: {
    1: [
      "identify_word_meaning",
      "match_word_to_definition",
      "select_context_meaning",
    ],
    2: [
      "use_context_to_determine_meaning",
      "explain_word_relationship",
      "distinguish_shades_of_meaning",
    ],
    3: [
      "evaluate_best_context_meaning",
      "justify_word_meaning_with_context",
      "analyze_word_choice_in_context",
    ],
  },

  context_clues: {
    1: [
      "identify_context_clue",
      "match_clue_to_word_meaning",
      "select_sentence_clue",
    ],
    2: [
      "explain_how_context_reveals_meaning",
      "connect_surrounding_details_to_word_meaning",
      "distinguish_relevant_from_irrelevant_clues",
    ],
    3: [
      "evaluate_best_context_clue",
      "justify_word_meaning_with_multiple_clues",
      "analyze_how_context_changes_meaning",
    ],
  },

  word_relationships: {
    1: [
      "identify_word_relationship",
      "match_synonym_or_antonym",
      "identify_related_word",
    ],
    2: [
      "explain_word_relationship",
      "connect_word_parts_to_meaning",
      "analyze_relationship_between_words",
    ],
    3: [
      "evaluate_best_word_relationship",
      "justify_word_relationship_in_context",
      "analyze_how_word_relationship_affects_meaning",
    ],
  },

  academic_vocabulary: {
    1: [
      "identify_academic_word_meaning",
      "match_term_to_definition",
      "recognize_domain_specific_word",
    ],
    2: [
      "explain_academic_word_in_context",
      "connect_term_to_concept",
      "distinguish_academic_word_use",
    ],
    3: [
      "evaluate_best_academic_word_use",
      "justify_term_meaning_with_context",
      "analyze_academic_language_effect",
    ],
  },
  suspense_foreshadowing: {
    1: [
      "identify_foreshadowing_clue",
      "identify_suspense_detail",
      "match_clue_to_later_event",
    ],
    2: [
      "explain_how_foreshadowing_builds_suspense",
      "connect_clue_to_later_plot_event",
      "analyze_suspense_effect",
    ],
    3: [
      "evaluate_most_effective_foreshadowing",
      "justify_how_suspense_shapes_plot",
      "analyze_how_foreshadowing_develops_theme_or_conflict",
    ],
  },

  nonlinear_plot: {
    1: [
      "identify_flashback",
      "identify_parallel_plot_event",
      "match_subplot_to_main_plot",
    ],
    2: [
      "explain_flashback_effect",
      "connect_subplot_to_main_conflict",
      "analyze_parallel_plot_relationship",
    ],
    3: [
      "evaluate_effect_of_nonlinear_structure",
      "justify_how_flashback_changes_understanding",
      "analyze_how_parallel_plots_shape_meaning",
    ],
  },

  // ── Writing / revision / composition ───────────────────────────────

  revision: {
    1: [
      "identify_revision_needed",
      "select_clearer_sentence",
      "recognize_unnecessary_detail",
    ],
    2: [
      "explain_revision_choice",
      "improve_sentence_clarity",
      "connect_revision_to_purpose",
    ],
    3: [
      "evaluate_best_revision",
      "justify_revision_with_audience_or_purpose",
      "analyze_revision_effect_on_coherence",
    ],
  },

  organization: {
    1: [
      "identify_organizational_order",
      "match_sentence_to_paragraph",
      "identify_transition",
    ],
    2: [
      "explain_organizational_choice",
      "connect_transition_to_relationship",
      "improve_paragraph_order",
    ],
    3: [
      "evaluate_best_organization",
      "justify_sentence_placement",
      "analyze_how_organization_develops_idea",
    ],
  },

  clarity: {
    1: [
      "identify_unclear_sentence",
      "select_clear_wording",
      "recognize_redundancy",
    ],
    2: [
      "explain_clarity_improvement",
      "revise_for_precision",
      "connect_wording_to_meaning",
    ],
    3: [
      "evaluate_best_clarity_revision",
      "justify_revision_for_reader_understanding",
      "analyze_effect_of_clear_language",
    ],
  },

  sentence_effectiveness: {
    1: [
      "identify_sentence_problem",
      "select_effective_sentence",
      "recognize_sentence_combining_opportunity",
    ],
    2: [
      "explain_sentence_combining_choice",
      "revise_sentence_for_effect",
      "connect_sentence_structure_to_meaning",
    ],
    3: [
      "evaluate_best_sentence_revision",
      "justify_sentence_effectiveness",
      "analyze_structure_effect_on_style",
    ],
  },

  editing_conventions: {
    1: [
      "identify_convention_error",
      "select_correct_punctuation",
      "recognize_subject_verb_agreement",
    ],
    2: [
      "explain_convention_correction",
      "apply_rule_in_context",
      "distinguish_correct_from_incorrect_usage",
    ],
    3: [
      "evaluate_best_edit_in_context",
      "justify_editing_choice",
      "analyze_how_convention_affects_clarity",
    ],
  },

  development: {
    1: [
      "identify_supporting_detail",
      "match_detail_to_main_idea",
      "recognize_relevant_example",
    ],
    2: [
      "explain_detail_development",
      "add_relevant_support",
      "connect_example_to_claim",
    ],
    3: [
      "evaluate_best_development",
      "justify_evidence_selection",
      "analyze_how_details_strengthen_response",
    ],
  },

  purpose_audience: {
    1: ["identify_audience", "identify_purpose", "match_detail_to_audience"],
    2: [
      "explain_purpose_audience_choice",
      "revise_for_audience",
      "connect_tone_to_purpose",
    ],
    3: [
      "evaluate_best_revision_for_audience",
      "justify_purpose_audience_alignment",
      "analyze_how_audience_shapes_writing",
    ],
  },

  evidence_use: {
    1: [
      "identify_relevant_evidence",
      "match_evidence_to_claim",
      "select_supporting_example",
    ],
    2: [
      "explain_evidence_connection",
      "integrate_evidence_effectively",
      "distinguish_strong_from_weak_evidence",
    ],
    3: [
      "evaluate_best_evidence",
      "justify_evidence_selection",
      "analyze_how_evidence_strengthens_claim",
    ],
  },

  genre_writing: {
    1: [
      "identify_genre_feature",
      "match_writing_to_genre",
      "recognize_genre_purpose",
    ],
    2: [
      "explain_genre_choice",
      "revise_to_match_genre",
      "connect_genre_feature_to_effect",
    ],
    3: [
      "evaluate_genre_effectiveness",
      "justify_genre-based_revision",
      "analyze_how_genre_shapes_response",
    ],
  },

  coherence: {
    1: [
      "identify_unrelated_sentence",
      "match_sentence_to_topic",
      "select_transition",
    ],
    2: [
      "explain_coherence_problem",
      "revise_for_coherence",
      "connect_ideas_with_transition",
    ],
    3: [
      "evaluate_best_coherence_revision",
      "justify_sentence_order",
      "analyze_how_coherence_improves_argument",
    ],
  },

  // ── Research / inquiry ──────────────────────────────────────────────

  source_evaluation: {
    1: [
      "identify_source_type",
      "recognize_relevant_source",
      "match_source_to_question",
    ],
    2: [
      "explain_source_relevance",
      "distinguish_reliable_from_unreliable_source",
      "connect_source_to_research_question",
    ],
    3: [
      "evaluate_best_source",
      "justify_source_reliability",
      "analyze_source_bias_or_limitations",
    ],
  },

  research_question: {
    1: [
      "identify_research_question",
      "match_question_to_topic",
      "recognize_focused_question",
    ],
    2: [
      "explain_why_question_is_focused",
      "revise_broad_question",
      "connect_question_to_research_goal",
    ],
    3: [
      "evaluate_best_research_question",
      "justify_question_scope",
      "analyze_how_question_guides_research",
    ],
  },

  evidence_selection: {
    1: [
      "identify_relevant_evidence",
      "match_evidence_to_question",
      "select_best_fact",
    ],
    2: [
      "explain_evidence_relevance",
      "connect_evidence_to_research_question",
      "distinguish_relevant_from_irrelevant_evidence",
    ],
    3: [
      "evaluate_strongest_research_evidence",
      "justify_evidence_selection",
      "analyze_evidence_quality",
    ],
  },

  synthesis: {
    1: [
      "identify_related_information",
      "match_two_related_details",
      "recognize_combined_idea",
    ],
    2: [
      "combine_information_from_sources",
      "explain_connection_between_sources",
      "connect_multiple_details_to_claim",
    ],
    3: [
      "synthesize_multiple_sources",
      "justify_synthesized_conclusion",
      "analyze_how_sources_work_together",
    ],
  },

  claim_evidence_reasoning: {
    1: [
      "identify_claim_evidence_pair",
      "match_claim_to_evidence",
      "recognize_reasoning_statement",
    ],
    2: [
      "explain_how_evidence_supports_claim",
      "connect_claim_evidence_reasoning",
      "distinguish_claim_evidence_reasoning",
    ],
    3: [
      "evaluate_claim_evidence_reasoning",
      "justify_claim_with_multiple_evidence_points",
      "analyze_strength_of_reasoning",
    ],
  },

  citation_reasoning: {
    1: [
      "identify_source_credit",
      "recognize_citation_detail",
      "match_information_to_source",
    ],
    2: [
      "explain_why_citation_is_needed",
      "connect_source_information_to_citation",
      "distinguish_quoted_from_paraphrased_information",
    ],
    3: [
      "evaluate_best_citation_choice",
      "justify_source_credit",
      "analyze_how_citation_supports_research_integrity",
    ],
  },

  // ── Oral language / presentation ───────────────────────────────────

  listening_comprehension: {
    1: [
      "identify_speaker_message",
      "recall_spoken_detail",
      "match_detail_to_speaker_point",
    ],
    2: [
      "explain_speaker_message",
      "connect_detail_to_speaker_purpose",
      "distinguish_main_point_from_detail",
    ],
    3: [
      "evaluate_speaker_message",
      "justify_interpretation_of_spoken_information",
      "analyze_speaker_reasoning",
    ],
  },

  discussion_reasoning: {
    1: [
      "identify_discussion_norm",
      "recognize_relevant_response",
      "match_response_to_topic",
    ],
    2: [
      "explain_effective_discussion_response",
      "connect_comment_to_prior_speaker",
      "analyze_discussion_contribution",
    ],
    3: [
      "evaluate_discussion_contribution",
      "justify_best_response_in_discussion",
      "analyze_how_response_advances_discussion",
    ],
  },

  presentation_organization: {
    1: [
      "identify_presentation_order",
      "match_detail_to_presentation_section",
      "recognize_intro_or_conclusion",
    ],
    2: [
      "explain_organization_of_presentation",
      "connect_transition_to_presentation_structure",
      "analyze_order_of_points",
    ],
    3: [
      "evaluate_presentation_organization",
      "justify_best_organization_choice",
      "analyze_how_organization_supports_message",
    ],
  },

  speaker_message: {
    1: [
      "identify_speaker_claim",
      "match_detail_to_message",
      "recognize_speaker_purpose",
    ],
    2: [
      "explain_speaker_message",
      "connect_evidence_to_speaker_claim",
      "analyze_speaker_purpose",
    ],
    3: [
      "evaluate_speaker_message",
      "justify_interpretation_with_evidence",
      "analyze_speaker_strategy",
    ],
  },

  fluency: {
    1: [
      "identify_fluency_feature",
      "recognize_accurate_reading",
      "match_expression_to_meaning",
    ],
    2: [
      "explain_how_fluency_supports_understanding",
      "connect_pacing_to_meaning",
      "analyze_expression_effect",
    ],
    3: [
      "evaluate_reading_fluency_effect",
      "justify_fluency_choice",
      "analyze_how_fluency_changes_interpretation",
    ],
  },

  comprehension_monitoring: {
    1: [
      "identify_confusing_detail",
      "recognize_question_to_ask",
      "match_strategy_to_problem",
    ],
    2: [
      "explain_monitoring_strategy",
      "connect_strategy_to_understanding",
      "analyze_fix_up_strategy",
    ],
    3: [
      "evaluate_best_comprehension_strategy",
      "justify_monitoring_choice",
      "analyze_how_strategy_improves_understanding",
    ],
  },

  reading_stamina: {
    1: [
      "identify_reading_goal",
      "recognize_independent_reading_behavior",
      "match_strategy_to_reading_task",
    ],
    2: [
      "explain_reading_strategy",
      "connect_goal_to_reading_behavior",
      "analyze_independent_reading_choice",
    ],
    3: [
      "evaluate_independent_reading_strategy",
      "justify_reading_goal",
      "analyze_how_strategy_supports_growth",
    ],
  },

  self_selected_reading: {
    1: [
      "identify_book_selection_reason",
      "match_text_to_interest",
      "recognize_reading_preference",
    ],
    2: [
      "explain_text_selection",
      "connect_text_choice_to_goal",
      "analyze_reader_preference",
    ],
    3: [
      "evaluate_best_text_choice",
      "justify_selection_with_goal",
      "analyze_how_selection_supports_reading_growth",
    ],
  },

  // ── Generic fallback ────────────────────────────────────────────────

  analysis: {
    1: [
      "identify_relevant_detail",
      "match_detail_to_question",
      "recognize_basic_relationship",
    ],
    2: [
      "explain_relationship",
      "connect_evidence_to_answer",
      "analyze_text_detail",
    ],
    3: [
      "evaluate_best_supported_answer",
      "justify_analysis_with_evidence",
      "analyze_multiple_text_details",
    ],
  },

  reader_response: {
    1: [
      "identify_response_detail",
      "match_response_to_text",
      "recognize_personal_connection",
    ],
    2: [
      "explain_response_with_evidence",
      "connect_response_to_text_detail",
      "analyze_reader_reaction",
    ],
    3: [
      "justify_response_with_multiple_details",
      "evaluate_response_quality",
      "analyze_how_text_shapes_response",
    ],
  },

  short_response_reasoning: {
    1: [
      "identify_short_response_evidence",
      "match_answer_to_text_detail",
      "recognize_complete_response",
    ],
    2: [
      "explain_answer_with_evidence",
      "connect_claim_to_text_evidence",
      "develop_short_response",
    ],
    3: [
      "evaluate_short_response_strength",
      "justify_response_with_multiple_details",
      "analyze_response_reasoning",
    ],
  },
};

/**
 * Optional passage-feature requirements for assessment moves.
 *
 * Moves not listed here remain universally available.
 * These requirements only filter moves that depend on a specific
 * passage feature being present.
 */
export const ELA_ASSESSMENT_MOVE_REQUIREMENTS = {
  // Drama: mystery-specific moves
  connect_plot_detail_to_mystery: {
    requiresAll: ["has_mystery"],
  },

  connect_two_plot_details_to_mystery: {
    requiresAll: ["has_mystery"],
  },

  evaluate_how_key_plot_details_create_mystery: {
    requiresAll: ["has_mystery"],
  },

  // Drama: stage-direction-specific moves
  identify_stage_direction_that_builds_tension: {
    requiresAll: [
      "has_stage_directions",
      "has_tension",
    ],
  },

  explain_how_stage_direction_builds_tension: {
    requiresAll: [
      "has_stage_directions",
      "has_tension",
    ],
  },

  analyze_how_stage_directions_build_to_climax: {
    requiresAll: [
      "has_stage_directions",
      "has_climax",
    ],
  },

  // Drama: parallel or competing conflict
  identify_parallel_plot_detail: {
    requiresAll: [
      "has_parallel_conflict",
    ],
  },

  compare_initial_and_later_problem: {
    requiresAll: [
      "has_initial_problem",
      "has_later_problem",
    ],
  },

  explain_how_parallel_plot_creates_conflict: {
    requiresAll: [
      "has_parallel_conflict",
    ],
  },

  analyze_how_parallel_plot_builds_tension: {
    requiresAll: [
      "has_parallel_conflict",
      "has_tension",
    ],
  },

  justify_how_dual_conflicts_shape_dramatic_action: {
    requiresAll: [
      "has_parallel_conflict",
    ],
  },

  // Drama: revelation-specific moves
  identify_detail_that_changes_understanding: {
    requiresAll: [
      "has_revelation",
    ],
  },

  identify_scene_revelation: {
    requiresAll: [
      "has_revelation",
    ],
  },

  connect_key_detail_to_later_revelation: {
    requiresAll: [
      "has_revelation",
    ],
  },

  justify_how_revelation_changes_understanding: {
    requiresAll: [
      "has_revelation",
    ],
  },

  evaluate_how_final_scene_resolves_key_detail: {
    requiresAll: [
      "has_final_resolution",
    ],
  },
    // ─────────────────────────────────────────────
  // 8.7C nonlinear plot / fiction structure
  // ─────────────────────────────────────────────

  identify_flashback: {
    requiresAll: ["has_flashback"],
  },

  explain_flashback_effect: {
    requiresAll: ["has_flashback"],
  },

  justify_how_flashback_changes_understanding: {
    requiresAll: ["has_flashback"],
  },

  identify_parallel_plot_event: {
    requiresAll: ["has_parallel_plot"],
  },

  analyze_parallel_plot_relationship: {
    requiresAll: ["has_parallel_plot"],
  },

  analyze_how_parallel_plots_shape_meaning: {
    requiresAll: ["has_parallel_plot"],
  },

  match_subplot_to_main_plot: {
    requiresAll: ["has_subplot"],
  },

  connect_subplot_to_main_conflict: {
    requiresAll: ["has_subplot"],
  },
};