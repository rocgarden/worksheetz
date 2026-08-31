// /libs/adaptive/maps/ela/skillFocusByTeks.js
// Branch: v2/student-success-platform
//
// TEKS code → valid ELA skill_focus options.
// skill_focus is system-generated only.
// These are not teacher/student inputs.
//
// Keep this TEKS-specific and small.
// Assessment moves stay reusable in assessmentMoves.js.

// /libs/adaptive/maps/ela/skillFocusByTeks.js

export const ELA_SKILL_FOCUS_BY_TEKS = {
  "4.9C": ["drama_structure", "dialogue_analysis", "structure_effect"],

  "5.9C": ["drama_structure", "dialogue_analysis", "structure_effect"],
  // ─────────────────────────────────────────────
  // Grade 6 — Oral Language
  // ─────────────────────────────────────────────
  "6.1A": [
    "listening_comprehension",
    "speaker_message",
    "discussion_reasoning",
  ],
  "6.1B": ["listening_comprehension", "sequence", "discussion_reasoning"],
  "6.1C": ["presentation_organization", "speaker_message", "purpose_audience"],
  "6.1D": [
    "discussion_reasoning",
    "listening_comprehension",
    "speaker_message",
  ],

  // Vocabulary
  "6.2A": ["word_meaning", "academic_vocabulary", "word_relationships"],
  "6.2B": ["context_clues", "word_meaning", "word_relationships"],
  "6.2C": ["academic_vocabulary", "word_meaning", "word_relationships"],

  // Fluency / Independent Reading
  6.3: ["fluency", "comprehension_monitoring", "reading_stamina"],
  6.4: ["self_selected_reading", "reading_stamina", "comprehension_monitoring"],

  // Comprehension Skills
  "6.5A": ["comprehension_monitoring", "purpose_audience", "analysis"],
  "6.5B": ["research_question", "inference", "text_evidence"],
  "6.5C": ["inference", "genre_features", "text_evidence"],
  "6.5D": ["comprehension_monitoring", "reader_response", "analysis"],
  "6.5E": ["reader_response", "text_evidence", "analysis"],
  "6.5F": ["inference", "implicit_meaning", "text_evidence"],
  "6.5G": ["central_idea", "key_details", "text_evidence"],
  "6.5H": ["synthesis", "central_idea", "text_evidence"],
  "6.5I": ["comprehension_monitoring", "reader_response", "analysis"],

  // Response Skills
  "6.6A": ["reader_response", "text_evidence", "analysis"],
  "6.6B": ["reader_response", "analysis", "text_evidence"],
  "6.6C": ["text_evidence", "evidence_selection", "analysis"],
  "6.6D": ["summary", "paraphrase", "sequence"],
  "6.6E": ["reader_response", "evidence_selection", "analysis"],
  "6.6F": ["academic_vocabulary", "word_meaning", "reader_response"],
  "6.6G": ["implicit_meaning", "text_evidence", "reader_response", "analysis"],
  "6.6H": ["tone_mood", "purpose_audience", "reader_response"],
  "6.6I": ["reader_response", "evidence_selection", "analysis"],

  // Literary Elements
  "6.7A": ["theme", "text_evidence", "inference"],
  "6.7B": ["character_analysis", "plot_development", "conflict_resolution"],
  "6.7C": [
    "plot_development",
    "plot_structure",
    "conflict_resolution",
    "cause_effect",
  ],
  "6.7D": ["setting_analysis", "character_analysis", "plot_development"],

  // Genres
  "6.8A": ["genre_features", "literary_genre_analysis", "theme"],
  "6.8B": ["poetry_structure", "structure_effect", "tone_mood"],
  "6.8C": ["dialogue_analysis", "drama_structure", "character_analysis"],

  "6.8D": ["informational_text_structure", "central_idea", "text_evidence"],
  "6.8D.i": ["central_idea", "supporting_details", "text_evidence"],
  "6.8D.ii": [
    "informational_text_structure",
    "source_evaluation",
    "text_evidence",
  ],
  "6.8D.iii": ["informational_text_structure", "structure_effect", "analysis"],

  "6.8E": ["argument_analysis", "author_claim", "text_evidence"],
  "6.8E.i": ["author_claim", "argument_analysis", "text_evidence"],
  "6.8E.ii": ["evidence_selection", "argument_analysis", "text_evidence"],
  "6.8E.iii": ["purpose_audience", "argument_analysis", "author_claim"],

  "6.8F": ["genre_features", "craft_analysis", "source_evaluation"],

  // Author’s Purpose & Craft
  "6.9A": ["authors_purpose", "craft_analysis", "text_evidence"],
  "6.9B": ["structure_effect", "authors_purpose", "craft_analysis"],
  "6.9C": ["craft_analysis", "structure_effect", "authors_purpose"],
  "6.9D": ["figurative_language", "craft_analysis", "authors_purpose"],
  "6.9E": ["point_of_view", "craft_analysis", "authors_purpose"],
  "6.9F": ["tone_mood", "word_choice", "craft_analysis"],
  "6.9G": ["argument_analysis", "craft_analysis", "claim_evidence_reasoning"],

  // Writing Process
  "6.10A": ["purpose_audience", "organization", "genre_writing"],
  "6.10B": ["development", "organization", "coherence"],
  "6.10B.i": ["organization", "coherence", "sentence_effectiveness"],
  "6.10B.ii": ["development", "evidence_use", "clarity"],
  "6.10C": ["revision", "clarity", "organization", "word_choice"],
  "6.10D": ["editing_conventions", "sentence_effectiveness", "clarity"],
  "6.10D.i": ["editing_conventions", "sentence_effectiveness"],
  "6.10D.ii": ["editing_conventions", "sentence_effectiveness"],
  "6.10D.iii": ["editing_conventions", "sentence_effectiveness"],
  "6.10D.iv": ["editing_conventions", "sentence_effectiveness"],
  "6.10D.v": ["editing_conventions", "sentence_effectiveness"],
  "6.10D.vi": ["editing_conventions", "sentence_effectiveness"],
  "6.10D.vii": ["editing_conventions"],
  "6.10D.viii": ["editing_conventions", "sentence_effectiveness"],
  "6.10D.ix": ["editing_conventions", "word_choice"],
  "6.10E": ["purpose_audience", "genre_writing", "coherence"],

  // Composition
  "6.11A": ["genre_writing", "craft_analysis", "development"],
  "6.11B": ["genre_writing", "central_idea", "development"],
  "6.11C": ["genre_writing", "argument_analysis", "claim_evidence_reasoning"],
  "6.11D": ["purpose_audience", "genre_writing", "tone_mood"],

  // Inquiry & Research
  "6.12A": ["research_question", "source_evaluation", "inquiry_reasoning"],
  "6.12B": ["research_question", "organization", "source_evaluation"],
  "6.12C": ["research_question", "revision", "clarity"],
  "6.12D": ["source_evaluation", "evidence_selection", "research_question"],
  "6.12E": ["source_evaluation", "evidence_selection", "analysis"],
  "6.12F": ["synthesis", "evidence_selection", "claim_evidence_reasoning"],
  "6.12G": ["paraphrase", "citation_reasoning", "source_evaluation"],
  "6.12H": ["source_evaluation", "claim_evidence_reasoning", "analysis"],
  "6.12H.i": ["source_evaluation", "claim_evidence_reasoning", "analysis"],
  "6.12H.ii": [
    "argument_analysis",
    "claim_evidence_reasoning",
    "source_evaluation",
  ],
  "6.12I": ["citation_reasoning", "source_evaluation", "evidence_selection"],
  "6.12J": ["presentation_organization", "purpose_audience", "synthesis"],

  // ─────────────────────────────────────────────
  // Grade 7 — Oral Language
  // ─────────────────────────────────────────────
  "7.1A": [
    "listening_comprehension",
    "speaker_message",
    "discussion_reasoning",
  ],
  "7.1B": ["listening_comprehension", "sequence", "discussion_reasoning"],
  "7.1C": ["presentation_organization", "speaker_message", "purpose_audience"],
  "7.1D": [
    "discussion_reasoning",
    "listening_comprehension",
    "speaker_message",
  ],

  // Vocabulary
  "7.2A": ["word_meaning", "academic_vocabulary", "word_relationships"],
  "7.2B": ["context_clues", "cause_effect", "word_meaning"],
  "7.2C": ["academic_vocabulary", "word_meaning", "word_relationships"],

  // Fluency / Independent Reading
  7.3: ["fluency", "comprehension_monitoring", "reading_stamina"],
  7.4: ["self_selected_reading", "reading_stamina", "comprehension_monitoring"],

  // Comprehension Skills
  "7.5A": ["comprehension_monitoring", "purpose_audience", "analysis"],
  "7.5B": ["research_question", "inference", "text_evidence"],
  "7.5C": ["inference", "genre_features", "text_evidence"],
  "7.5D": ["comprehension_monitoring", "reader_response", "analysis"],
  "7.5E": ["reader_response", "text_evidence", "analysis"],
  "7.5F": ["inference", "implicit_meaning", "text_evidence"],
  "7.5G": ["central_idea", "key_details", "text_evidence"],
  "7.5H": ["synthesis", "central_idea", "text_evidence"],
  "7.5I": ["comprehension_monitoring", "reader_response", "analysis"],

  // Response Skills
  "7.6A": ["reader_response", "text_evidence", "analysis"],
  "7.6B": ["reader_response", "analysis", "text_evidence"],
  "7.6C": ["text_evidence", "evidence_selection", "analysis"],
  "7.6D": ["summary", "paraphrase", "sequence"],
  "7.6E": ["reader_response", "evidence_selection", "analysis"],
  "7.6F": ["academic_vocabulary", "word_meaning", "reader_response"],
  "7.6G": ["implicit_meaning", "text_evidence", "reader_response", "analysis"],
  "7.6H": ["tone_mood", "purpose_audience", "reader_response"],
  "7.6I": ["reader_response", "evidence_selection", "analysis"],

  // Literary Elements
  "7.7A": ["theme", "text_evidence", "inference"],
  "7.7B": ["character_analysis", "conflict_resolution", "plot_development"],
  "7.7C": [
    "plot_development",
    "plot_structure",
    "conflict_resolution",
    "suspense_foreshadowing",
  ],
  "7.7D": ["setting_analysis", "character_analysis", "plot_development"],

  // Genres
  "7.8A": ["genre_features", "literary_genre_analysis", "theme"],
  "7.8B": ["poetry_structure", "structure_effect", "tone_mood"],
  "7.8C": ["character_analysis", "dialogue_analysis", "drama_structure"],

  "7.8D": ["informational_text_structure", "central_idea", "text_evidence"],
  "7.8D.i": ["central_idea", "supporting_details", "text_evidence"],
  "7.8D.ii": [
    "informational_text_structure",
    "source_evaluation",
    "text_evidence",
  ],
  "7.8D.iii": ["informational_text_structure", "structure_effect", "analysis"],

  "7.8E": ["argument_analysis", "author_claim", "text_evidence"],
  "7.8E.i": ["author_claim", "argument_analysis", "text_evidence"],
  "7.8E.ii": [
    "evidence_selection",
    "argument_analysis",
    "claim_evidence_reasoning",
  ],
  "7.8E.iii": ["purpose_audience", "argument_analysis", "author_claim"],

  "7.8F": ["genre_features", "craft_analysis", "source_evaluation"],

  // Author’s Purpose & Craft
  "7.9A": ["authors_purpose", "craft_analysis", "text_evidence"],
  "7.9B": ["structure_effect", "authors_purpose", "craft_analysis"],
  "7.9C": ["craft_analysis", "structure_effect", "authors_purpose"],
  "7.9D": ["figurative_language", "craft_analysis", "authors_purpose"],
  "7.9E": ["point_of_view", "craft_analysis", "authors_purpose"],
  "7.9F": ["tone_mood", "word_choice", "craft_analysis"],
  "7.9G": ["argument_analysis", "craft_analysis", "claim_evidence_reasoning"],

  // Writing Process
  "7.10A": ["purpose_audience", "organization", "genre_writing"],
  "7.10B": ["development", "organization", "coherence"],
  "7.10B.i": ["organization", "coherence", "sentence_effectiveness"],
  "7.10B.ii": ["development", "evidence_use", "clarity"],
  "7.10C": ["revision", "clarity", "organization", "word_choice"],
  "7.10D": ["editing_conventions", "sentence_effectiveness", "clarity"],
  "7.10D.i": ["editing_conventions", "sentence_effectiveness"],
  "7.10D.ii": ["editing_conventions", "sentence_effectiveness"],
  "7.10D.iii": ["editing_conventions", "sentence_effectiveness"],
  "7.10D.iv": ["editing_conventions", "sentence_effectiveness"],
  "7.10D.v": ["editing_conventions", "sentence_effectiveness"],
  "7.10D.vi": ["editing_conventions", "sentence_effectiveness"],
  "7.10D.vii": ["editing_conventions"],
  "7.10D.viii": ["editing_conventions", "sentence_effectiveness"],
  "7.10D.ix": ["editing_conventions", "word_choice"],
  "7.10E": ["purpose_audience", "genre_writing", "coherence"],

  // Composition
  "7.11A": ["genre_writing", "craft_analysis", "development"],
  "7.11B": ["genre_writing", "central_idea", "development"],
  "7.11C": ["genre_writing", "argument_analysis", "claim_evidence_reasoning"],
  "7.11D": ["purpose_audience", "genre_writing", "tone_mood"],

  // Inquiry & Research
  "7.12A": ["research_question", "source_evaluation", "inquiry_reasoning"],
  "7.12B": ["research_question", "organization", "source_evaluation"],
  "7.12C": ["research_question", "revision", "clarity"],
  "7.12D": ["source_evaluation", "evidence_selection", "research_question"],
  "7.12E": ["source_evaluation", "evidence_selection", "analysis"],
  "7.12F": ["synthesis", "evidence_selection", "claim_evidence_reasoning"],
  "7.12G": ["paraphrase", "citation_reasoning", "source_evaluation"],
  "7.12H": ["source_evaluation", "claim_evidence_reasoning", "analysis"],
  "7.12H.i": ["source_evaluation", "claim_evidence_reasoning", "analysis"],
  "7.12H.ii": [
    "argument_analysis",
    "claim_evidence_reasoning",
    "source_evaluation",
  ],
  "7.12I": ["citation_reasoning", "source_evaluation", "evidence_selection"],
  "7.12J": ["presentation_organization", "purpose_audience", "synthesis"],

  // ─────────────────────────────────────────────
  // Grade 8 — Oral Language
  // ─────────────────────────────────────────────
  "8.1A": [
    "listening_comprehension",
    "speaker_message",
    "discussion_reasoning",
  ],
  "8.1B": ["listening_comprehension", "sequence", "discussion_reasoning"],
  "8.1C": ["presentation_organization", "speaker_message", "purpose_audience"],
  "8.1D": [
    "discussion_reasoning",
    "listening_comprehension",
    "speaker_message",
  ],

  // Vocabulary
  "8.2A": ["word_meaning", "academic_vocabulary", "word_relationships"],
  "8.2B": ["context_clues", "word_meaning", "academic_vocabulary"],
  "8.2C": ["academic_vocabulary", "word_meaning", "word_relationships"],

  // Fluency / Independent Reading
  8.3: ["fluency", "comprehension_monitoring", "reading_stamina"],
  8.4: ["self_selected_reading", "reading_stamina", "comprehension_monitoring"],

  // Comprehension Skills
  "8.5A": ["comprehension_monitoring", "purpose_audience", "analysis"],
  "8.5B": ["research_question", "inference", "text_evidence"],
  "8.5C": ["inference", "genre_features", "text_evidence"],
  "8.5D": ["comprehension_monitoring", "reader_response", "analysis"],
  "8.5E": ["reader_response", "text_evidence", "analysis"],
  "8.5F": ["inference", "implicit_meaning", "text_evidence"],
  "8.5G": ["central_idea", "key_details", "text_evidence"],
  "8.5H": ["synthesis", "central_idea", "text_evidence"],
  "8.5I": ["comprehension_monitoring", "reader_response", "analysis"],

  // Response Skills
  "8.6A": ["reader_response", "text_evidence", "analysis"],
  "8.6B": ["reader_response", "analysis", "text_evidence"],
  "8.6C": ["text_evidence", "evidence_selection", "analysis"],
  "8.6D": ["summary", "paraphrase", "sequence"],
  "8.6E": ["reader_response", "evidence_selection", "analysis"],
  "8.6F": ["academic_vocabulary", "word_meaning", "reader_response"],
  "8.6G": ["implicit_meaning", "text_evidence", "reader_response", "analysis"],
  "8.6H": ["tone_mood", "purpose_audience", "reader_response"],
  "8.6I": ["reader_response", "evidence_selection", "analysis"],
  "8.6J": ["author_claim", "text_evidence", "claim_evidence_reasoning"],

  // Literary Elements
  "8.7A": ["theme", "character_analysis", "plot_development"],
  "8.7B": ["character_analysis", "conflict_resolution", "plot_development"],
  "8.7C": [
    "plot_development",
    "plot_structure",
    "nonlinear_plot",
    "suspense_foreshadowing",
  ],
  "8.7D": ["setting_analysis"],
  // Genres
  "8.8A": ["genre_features", "literary_genre_analysis", "theme"],
  "8.8B": ["poetry_structure", "structure_effect", "tone_mood"],
  "8.8C": [
    "dramatic_action",
    "parallel_plot_conflict",
    "key_detail_revelation",
  ],

  "8.8D": ["informational_text_structure", "central_idea", "text_evidence"],
  "8.8D.i": ["central_idea", "supporting_details", "text_evidence"],
  "8.8D.ii": [
    "informational_text_structure",
    "citation_reasoning",
    "source_evaluation",
  ],
  "8.8D.iii": ["informational_text_structure", "structure_effect", "analysis"],

  "8.8E": ["argument_analysis", "author_claim", "claim_evidence_reasoning"],
  "8.8E.i": ["author_claim", "argument_analysis", "text_evidence"],
  "8.8E.ii": [
    "argument_analysis",
    "claim_evidence_reasoning",
    "compare_perspectives",
  ],
  "8.8E.iii": ["purpose_audience", "argument_analysis", "author_claim"],

  "8.8F": ["genre_features", "craft_analysis", "source_evaluation"],

  // Author’s Purpose & Craft
  "8.9A": ["authors_purpose", "craft_analysis", "text_evidence"],
  "8.9B": ["structure_effect", "authors_purpose", "craft_analysis"],
  "8.9C": ["craft_analysis", "structure_effect", "authors_purpose"],
  "8.9D": ["figurative_language", "craft_analysis", "authors_purpose"],
  "8.9E": ["point_of_view", "craft_analysis", "tone_mood"],
  "8.9F": ["tone_mood", "word_choice", "craft_analysis"],
  "8.9G": ["argument_analysis", "craft_analysis", "claim_evidence_reasoning"],

  // Writing Process
  "8.10A": ["purpose_audience", "organization", "genre_writing"],
  "8.10B": ["development", "organization", "coherence"],
  "8.10B.i": ["organization", "coherence", "sentence_effectiveness"],
  "8.10B.ii": ["development", "evidence_use", "clarity"],
  "8.10C": ["revision", "clarity", "organization", "word_choice"],
  "8.10D": ["editing_conventions", "sentence_effectiveness", "clarity"],
  "8.10D.i": ["editing_conventions", "sentence_effectiveness"],
  "8.10D.ii": ["editing_conventions", "sentence_effectiveness"],
  "8.10D.iii": ["editing_conventions", "sentence_effectiveness"],
  "8.10D.iv": ["editing_conventions", "sentence_effectiveness"],
  "8.10D.v": ["editing_conventions"],
  "8.10D.vi": ["editing_conventions", "sentence_effectiveness"],
  "8.10D.vii": ["editing_conventions", "word_choice"],
  "8.10E": ["purpose_audience", "genre_writing", "coherence"],

  // Composition
  "8.11A": ["genre_writing", "craft_analysis", "development"],
  "8.11B": ["genre_writing", "central_idea", "development"],
  "8.11C": ["genre_writing", "argument_analysis", "claim_evidence_reasoning"],
  "8.11D": ["purpose_audience", "genre_writing", "tone_mood"],

  // Inquiry & Research
  "8.12A": ["research_question", "source_evaluation", "inquiry_reasoning"],
  "8.12B": ["research_question", "organization", "source_evaluation"],
  "8.12C": ["research_question", "revision", "clarity"],
  "8.12D": ["source_evaluation", "evidence_selection", "research_question"],
  "8.12E": ["source_evaluation", "evidence_selection", "analysis"],
  "8.12F": ["synthesis", "evidence_selection", "claim_evidence_reasoning"],
  "8.12G": ["paraphrase", "citation_reasoning", "source_evaluation"],
  "8.12H": ["source_evaluation", "claim_evidence_reasoning", "analysis"],
  "8.12H.i": ["source_evaluation", "claim_evidence_reasoning", "analysis"],
  "8.12H.ii": [
    "argument_analysis",
    "claim_evidence_reasoning",
    "source_evaluation",
  ],
  "8.12I": ["citation_reasoning", "source_evaluation", "evidence_selection"],
  "8.12J": ["presentation_organization", "purpose_audience", "synthesis"],
};
