// /libs/adaptive/maps/socialStudies/skillFocusByTeks.js
// Branch: v2/student-success-platform
//
// TEKS code → valid Social Studies skill_focus options.
// skill_focus is system-generated only.
// These are not teacher/student inputs.
//
// Design rule:
// - skill_focus should represent the historical/geographic thinking lane.
// - assessment_move should represent the exact DOK task.
// - Keep each TEKS mapped to 2–5 skill_focus values.
// - Do not over-map a TEKS to every possible Social Studies skill.
//
// Tested:
// - 7.2A worked best with:
//   historical_significance
//   geographic_influence
//   compare_cultures
//   cause_effect
//
// Important:
// - Avoid chronology for 7.2A.
// - 7.2A is about how geographic factors influenced Indigenous groups
//   and ways of life in Texas, not sequencing events.

export const SOCIAL_STUDIES_SKILL_FOCUS_BY_TEKS = {
  // ─────────────────────────────────────────────
  // Grade 6 Social Studies
  // World Cultures / Geography
  // ─────────────────────────────────────────────

  // Geography and culture
  "6.3A": [
    "geographic_influence",
    "human_environment_interaction",
    "cause_effect",
  ],

  "6.3B": [
    "geographic_influence",
    "spatial_patterns",
    "compare_regions",
  ],

  "6.4A": [
    "human_environment_interaction",
    "geographic_influence",
    "cause_effect",
  ],

  "6.4B": [
    "compare_regions",
    "geographic_influence",
    "human_environment_interaction",
  ],

  // Culture
  "6.15A": [
    "culture_traits",
    "compare_cultures",
    "historical_significance",
  ],

  "6.15B": [
    "compare_cultures",
    "culture_traits",
    "human_environment_interaction",
  ],

  "6.16A": [
    "culture_traits",
    "historical_significance",
    "compare_cultures",
  ],

  // Government / citizenship
  "6.10A": [
    "government_systems",
    "compare_governments",
    "civic_principles",
  ],

  "6.11A": [
    "civic_principles",
    "government_systems",
    "cause_effect",
  ],

  // Economics
  "6.7A": [
    "economic_systems",
    "cause_effect",
    "compare_regions",
  ],

  "6.8A": [
    "economic_systems",
    "human_environment_interaction",
    "geographic_influence",
  ],

  // Sources / skills
  "6.21A": [
    "evidence_from_source",
    "claim_evidence_reasoning",
    "historical_interpretation",
  ],

  "6.21B": [
    "evidence_from_source",
    "compare_perspectives",
    "claim_evidence_reasoning",
  ],

  // ─────────────────────────────────────────────
  // Grade 7 Social Studies
  // Texas History
  // ─────────────────────────────────────────────

  // 7.2A — compare ways of life of American Indian groups in Texas
  // Tested successfully with multiple_choice, hot_text,
  // constructed_response, and multi_select.
  //
  // Best tested split:
  // - historical_significance: why a group/practice mattered
  // - geographic_influence: how region/resources shaped life
  // - compare_cultures: compare Indigenous groups and ways of life
  // - cause_effect: how environment/resources caused lifestyle patterns
  //
  // Do NOT include chronology here.
  "7.2A": [
    "historical_significance",
    "geographic_influence",
    "compare_cultures",
    "cause_effect",
  ],

  // Early Texas history / exploration / colonization
  "7.2B": [
    "geographic_influence",
    "cause_effect",
    "historical_significance",
    "compare_perspectives",
  ],

  "7.2C": [
    "cause_effect",
    "historical_significance",
    "compare_perspectives",
    "geographic_influence",
  ],

  // Spanish colonial Texas / Mexican National Era
  "7.3A": [
    "cause_effect",
    "chronology",
    "compare_perspectives",
    "historical_significance",
  ],

  "7.3B": [
    "historical_significance",
    "cause_effect",
    "compare_perspectives",
    "evidence_from_source",
  ],

  "7.3C": [
    "cause_effect",
    "geographic_influence",
    "historical_significance",
    "chronology",
  ],

  // Texas Revolution
  "7.4A": [
    "cause_effect",
    "chronology",
    "historical_significance",
    "compare_perspectives",
  ],

  "7.4B": [
    "historical_significance",
    "cause_effect",
    "evidence_from_source",
    "compare_perspectives",
  ],

  "7.4C": [
    "chronology",
    "cause_effect",
    "historical_significance",
    "evidence_from_source",
  ],

  // Republic of Texas / annexation
  "7.5A": [
    "cause_effect",
    "historical_significance",
    "compare_perspectives",
    "chronology",
  ],

  "7.5B": [
    "cause_effect",
    "geographic_influence",
    "historical_significance",
    "economic_systems",
  ],

  "7.5C": [
    "cause_effect",
    "compare_perspectives",
    "historical_significance",
    "evidence_from_source",
  ],

  // Statehood / Civil War / Reconstruction
  "7.6A": [
    "cause_effect",
    "chronology",
    "historical_significance",
    "compare_perspectives",
  ],

  "7.6B": [
    "cause_effect",
    "economic_systems",
    "historical_significance",
    "compare_perspectives",
  ],

  "7.6C": [
    "cause_effect",
    "historical_significance",
    "evidence_from_source",
    "chronology",
  ],

  // Cotton, cattle, railroads, and frontier
  "7.7A": [
    "economic_systems",
    "geographic_influence",
    "cause_effect",
    "historical_significance",
  ],

  "7.7B": [
    "economic_systems",
    "cause_effect",
    "geographic_influence",
    "human_environment_interaction",
  ],

  "7.7C": [
    "cause_effect",
    "historical_significance",
    "compare_perspectives",
    "human_environment_interaction",
  ],

  // Oil, urbanization, reform, modern Texas
  "7.8A": [
    "economic_systems",
    "cause_effect",
    "historical_significance",
    "geographic_influence",
  ],

  "7.8B": [
    "cause_effect",
    "economic_systems",
    "human_environment_interaction",
    "historical_significance",
  ],

  "7.8C": [
    "cause_effect",
    "historical_significance",
    "compare_perspectives",
    "civic_principles",
  ],

  // Government and citizenship
  "7.14A": [
    "government_systems",
    "civic_principles",
    "historical_significance",
  ],

  "7.14B": [
    "government_systems",
    "civic_principles",
    "cause_effect",
  ],

  "7.15A": [
    "civic_principles",
    "government_systems",
    "compare_perspectives",
  ],

  "7.16A": [
    "civic_principles",
    "historical_significance",
    "cause_effect",
  ],

  // Economics
  "7.12A": [
    "economic_systems",
    "cause_effect",
    "geographic_influence",
  ],

  "7.12B": [
    "economic_systems",
    "cause_effect",
    "human_environment_interaction",
  ],

  "7.13A": [
    "economic_systems",
    "cause_effect",
    "historical_significance",
  ],

  // Culture
  "7.19A": [
    "culture_traits",
    "historical_significance",
    "compare_cultures",
  ],

  "7.19B": [
    "compare_cultures",
    "culture_traits",
    "historical_significance",
  ],

  "7.19C": [
    "culture_traits",
    "historical_significance",
    "cause_effect",
  ],

  // Social Studies skills / sources
  "7.21A": [
    "evidence_from_source",
    "claim_evidence_reasoning",
    "historical_interpretation",
  ],

  "7.21B": [
    "evidence_from_source",
    "compare_perspectives",
    "claim_evidence_reasoning",
  ],

  "7.21C": [
    "evidence_from_source",
    "chronology",
    "historical_interpretation",
  ],

  // ─────────────────────────────────────────────
  // Grade 8 Social Studies
  // U.S. History through Reconstruction
  // ─────────────────────────────────────────────

  // Exploration / colonization
  "8.2A": [
    "cause_effect",
    "geographic_influence",
    "historical_significance",
    "compare_perspectives",
  ],

  "8.2B": [
    "compare_cultures",
    "geographic_influence",
    "cause_effect",
    "historical_significance",
  ],

  "8.2C": [
    "economic_systems",
    "geographic_influence",
    "cause_effect",
    "compare_perspectives",
  ],

  // Revolution and founding
  "8.4A": [
    "cause_effect",
    "historical_significance",
    "compare_perspectives",
    "evidence_from_source",
  ],

  "8.4B": [
    "historical_significance",
    "cause_effect",
    "chronology",
    "evidence_from_source",
  ],

  "8.4C": [
    "historical_significance",
    "compare_perspectives",
    "civic_principles",
    "claim_evidence_reasoning",
  ],

  // Constitution / early republic
  "8.15A": [
    "government_systems",
    "civic_principles",
    "historical_significance",
  ],

  "8.15B": [
    "government_systems",
    "compare_governments",
    "civic_principles",
  ],

  "8.17A": [
    "civic_principles",
    "government_systems",
    "historical_significance",
  ],

  // Westward expansion / reform / sectionalism
  "8.6A": [
    "cause_effect",
    "geographic_influence",
    "historical_significance",
    "economic_systems",
  ],

  "8.6B": [
    "cause_effect",
    "human_environment_interaction",
    "geographic_influence",
    "compare_perspectives",
  ],

  "8.7A": [
    "cause_effect",
    "historical_significance",
    "compare_perspectives",
    "economic_systems",
  ],

  "8.7B": [
    "cause_effect",
    "compare_perspectives",
    "historical_significance",
    "evidence_from_source",
  ],

  // Civil War / Reconstruction
  "8.8A": [
    "cause_effect",
    "compare_perspectives",
    "historical_significance",
    "chronology",
  ],

  "8.8B": [
    "cause_effect",
    "historical_significance",
    "evidence_from_source",
    "compare_perspectives",
  ],

  "8.9A": [
    "cause_effect",
    "chronology",
    "historical_significance",
    "compare_perspectives",
  ],

  "8.9B": [
    "cause_effect",
    "historical_significance",
    "civic_principles",
    "compare_perspectives",
  ],

  // Economics
  "8.12A": [
    "economic_systems",
    "cause_effect",
    "geographic_influence",
  ],

  "8.12B": [
    "economic_systems",
    "cause_effect",
    "human_environment_interaction",
  ],

  // Culture / reform / society
  "8.22A": [
    "culture_traits",
    "historical_significance",
    "cause_effect",
    "compare_perspectives",
  ],

  "8.22B": [
    "compare_cultures",
    "culture_traits",
    "historical_significance",
  ],

  "8.23A": [
    "historical_significance",
    "compare_perspectives",
    "cause_effect",
    "civic_principles",
  ],

  // Social Studies skills / sources
  "8.29A": [
    "evidence_from_source",
    "claim_evidence_reasoning",
    "historical_interpretation",
  ],

  "8.29B": [
    "evidence_from_source",
    "compare_perspectives",
    "claim_evidence_reasoning",
  ],

  "8.29C": [
    "evidence_from_source",
    "chronology",
    "historical_interpretation",
  ],
};