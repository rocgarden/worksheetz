// /libs/adaptive/maps/socialStudies/skillFocusByBucket.js
//
// Bucket-level fallback skill_focus options for Social Studies adaptive generation.
// Used when a TEKS does not have a specific override in skillFocusByTeks.js.
//
// Flow:
// TEKS standard → exact TEKS skill_focus override if present
// otherwise → Social Studies bucket → these skill_focus options
// otherwise → subject defaultSkillFocus

export const SS_SKILL_FOCUS_BY_BUCKET = {
  // ── Grade 6: World Cultures & Geography ─────────────────────────────

  geography_world_regions: [
    "geographic_influence",
    "region_comparison",
    "human_environment_interaction",
    "map_evidence",
  ],

  geography_physical_features: [
    "geographic_influence",
    "physical_feature_effect",
    "human_environment_interaction",
    "cause_effect",
  ],

  geography_human_environment: [
    "human_environment_interaction",
    "geographic_influence",
    "cause_effect",
    "evidence_reasoning",
  ],

  culture_world_cultures: [
    "compare_cultures",
    "cultural_practices",
    "cultural_diffusion",
    "historical_significance",
  ],

  culture_religion_beliefs: [
    "compare_cultures",
    "cultural_practices",
    "belief_systems",
    "historical_significance",
  ],

  economics_world: [
    "economic_systems",
    "cause_effect",
    "compare_systems",
    "evidence_reasoning",
  ],

  government_world: [
    "government_systems",
    "compare_systems",
    "civic_reasoning",
    "historical_significance",
  ],

  history_world: [
    "chronology",
    "cause_effect",
    "historical_significance",
    "evidence_reasoning",
  ],

  social_studies_skills: [
    "source_analysis",
    "evidence_reasoning",
    "map_evidence",
    "claim_evidence_reasoning",
  ],

  // ── Grade 7: Texas History ──────────────────────────────────────────

  texas_first_people: [
    "compare_cultures",
    "geographic_influence",
    "cause_effect",
    "historical_significance",
  ],

  texas_exploration_colonization: [
    "chronology",
    "cause_effect",
    "historical_significance",
    "geographic_influence",
  ],

  texas_revolution: [
    "chronology",
    "cause_effect",
    "historical_significance",
    "source_analysis",
  ],

  texas_republic_statehood: [
    "chronology",
    "cause_effect",
    "historical_significance",
    "government_systems",
  ],

  texas_civil_war_reconstruction: [
    "cause_effect",
    "historical_significance",
    "compare_perspectives",
    "source_analysis",
  ],

  texas_economic_development: [
    "economic_change",
    "cause_effect",
    "geographic_influence",
    "historical_significance",
  ],

  texas_government_citizenship: [
    "government_systems",
    "civic_reasoning",
    "rights_responsibilities",
    "source_analysis",
  ],

  texas_culture_identity: [
    "compare_cultures",
    "cultural_practices",
    "historical_significance",
    "evidence_reasoning",
  ],

  texas_geography: [
    "geographic_influence",
    "human_environment_interaction",
    "region_comparison",
    "map_evidence",
  ],

  texas_skills: [
    "source_analysis",
    "evidence_reasoning",
    "claim_evidence_reasoning",
    "map_evidence",
  ],

  // ── Grade 8: U.S. History to Reconstruction ─────────────────────────

  us_colonization: [
    "cause_effect",
    "geographic_influence",
    "compare_perspectives",
    "historical_significance",
  ],

  us_revolution: [
    "chronology",
    "cause_effect",
    "historical_significance",
    "source_analysis",
  ],

  us_constitution_government: [
    "government_systems",
    "civic_reasoning",
    "rights_responsibilities",
    "source_analysis",
  ],

  us_early_republic: [
    "chronology",
    "cause_effect",
    "historical_significance",
    "government_systems",
  ],

  us_expansion_reform: [
    "cause_effect",
    "geographic_influence",
    "compare_perspectives",
    "historical_significance",
  ],

  us_civil_war_reconstruction: [
    "cause_effect",
    "compare_perspectives",
    "historical_significance",
    "source_analysis",
  ],

  us_economics: [
    "economic_change",
    "cause_effect",
    "geographic_influence",
    "evidence_reasoning",
  ],

  us_culture_society: [
    "compare_cultures",
    "cultural_practices",
    "historical_significance",
    "compare_perspectives",
  ],

  us_geography: [
    "geographic_influence",
    "human_environment_interaction",
    "region_comparison",
    "map_evidence",
  ],

  us_skills: [
    "source_analysis",
    "evidence_reasoning",
    "claim_evidence_reasoning",
    "chronology",
  ],

  // ── Generic fallback buckets, in case your SS map uses broad names ───

  history: [
    "chronology",
    "cause_effect",
    "historical_significance",
    "source_analysis",
  ],

  geography: [
    "geographic_influence",
    "human_environment_interaction",
    "region_comparison",
    "map_evidence",
  ],

  economics: [
    "economic_systems",
    "economic_change",
    "cause_effect",
    "evidence_reasoning",
  ],

  government: [
    "government_systems",
    "civic_reasoning",
    "rights_responsibilities",
    "source_analysis",
  ],

  citizenship: [
    "civic_reasoning",
    "rights_responsibilities",
    "government_systems",
    "source_analysis",
  ],

  culture: [
    "compare_cultures",
    "cultural_practices",
    "cultural_diffusion",
    "historical_significance",
  ],

  skills: [
    "source_analysis",
    "evidence_reasoning",
    "claim_evidence_reasoning",
    "map_evidence",
  ],
};