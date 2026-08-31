// /libs/adaptive/maps/ela/skillFocusByBucket.js
//
// Bucket-level fallback skill_focus options for ELA adaptive generation.
// Used when a TEKS does not have a specific override in skillFocusByTeks.js.
//
// Flow:
// TEKS standard → exact TEKS skill_focus override if present
// otherwise → ELA bucket → these skill_focus options
// otherwise → subject defaultSkillFocus

export const ELA_SKILL_FOCUS_BY_BUCKET = {
  // ── Oral Language ───────────────────────────────────────────────────
  oral_language: [
    "listening_comprehension",
    "discussion_reasoning",
    "presentation_organization",
    "speaker_message",
  ],

  // ── Vocabulary ──────────────────────────────────────────────────────
  vocabulary: [
    "word_meaning",
    "context_clues",
    "word_relationships",
    "academic_vocabulary",
  ],

  // ── Fluency & Independent Reading ───────────────────────────────────
  fluency_independent_reading: [
    "fluency",
    "comprehension_monitoring",
    "reading_stamina",
    "self_selected_reading",
  ],

  // ── Comprehension Skills ────────────────────────────────────────────
  comprehension_skills: [
    "inference",
    "implicit_meaning",
    "central_idea",
    "key_details",
    "summary",
    "text_evidence",
    "synthesis",
    "comprehension_monitoring",
    "theme",
    "character_analysis",
    "cause_effect",
  ],

  // ── Response Skills ─────────────────────────────────────────────────
  response_skills: [
    "text_evidence",
    "reader_response",
    "analysis",
    "short_response_reasoning",
    "evidence_selection",
    "implicit_meaning",
    "summary",
    "paraphrase"
  ],

  // ── Literary Elements ───────────────────────────────────────────────
   literary_elements: [
    "theme",
    "character_analysis",
    "plot_development",
    "plot_structure",
    "conflict_resolution",
    "setting_analysis",
    "cause_effect",
    "suspense_foreshadowing",
    "nonlinear_plot",
  ],

  // ── Genres ──────────────────────────────────────────────────────────
  genres: [
    "genre_features",
    "literary_genre_analysis",
    "poetry_structure",
    "informational_text_structure",
    "argument_analysis",
    "dialogue_analysis",
    "structure_effect",
    "theme",
    "author_claim",
  ],

  // ── Author’s Purpose & Craft ────────────────────────────────────────
  authors_craft: [
    "authors_purpose",
    "craft_analysis",
    "word_choice",
    "structure_effect",
    "figurative_language",
    "tone_mood",
    "point_of_view",
    "poetry_structure",
  ],

  // ── Writing Process ─────────────────────────────────────────────────
   writing_process: [
    "revision",
    "organization",
    "clarity",
    "sentence_effectiveness",
    "development",
    "editing_conventions",
    "word_choice",
    "coherence",
   ],

  // ── Composition ─────────────────────────────────────────────────────
  composition: [
    "development",
    "organization",
    "purpose_audience",
    "evidence_use",
    "genre_writing",
    "coherence",
    "claim_evidence_reasoning",
    "argument_analysis",
  ],

  inquiry_research: [
    "research_question",
    "inquiry_reasoning",
    "source_evaluation",
    "evidence_selection",
    "synthesis",
    "claim_evidence_reasoning",
    "citation_reasoning",
    "paraphrase",
  ],

  // ── Older / future grades 3-5 buckets ───────────────────────────────
  inference_text_evidence: [
    "inference",
    "implicit_meaning",
    "text_evidence",
  ],

  key_idea_central_idea: [
    "central_idea",
    "key_details",
    "supporting_details",
    "summary",
    "text_evidence",
  ],

  summarize_paraphrase_retell: [
    "summary",
    "paraphrase",
    "sequence",
    "key_details",
  ],

  informational_central_idea_supporting: [
    "central_idea",
    "supporting_details",
    "informational_text_structure",
    "text_evidence",
  ],
};