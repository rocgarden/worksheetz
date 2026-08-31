// /libs/adaptive/maps/science/skillFocusByTeks.js
// Branch: v2/student-success-platform
//
// TEKS code → valid Science skill_focus options.
// skill_focus is system-generated only.
// These are not teacher/student inputs.
//
// Design rule:
// - skill_focus should represent the science thinking/concept lane.
// - assessment_move should represent the exact DOK task.
// - Keep each TEKS mapped to 2–5 skill_focus values.
// - Do not over-map a TEKS to every possible science skill.
// - Add TEKS-specific guardrails inside the Science generator prompt only when needed.
//
// Tested:
// - 7.12B worked best with:
//   energy_flow
//   matter_cycles
//   ecosystem_interactions
//   system_modeling

export const SCIENCE_SKILL_FOCUS_BY_TEKS = {
  // ─────────────────────────────────────────────
  // Grade 6 Science
  // ─────────────────────────────────────────────

  // Matter and energy / physical properties
  // Use these when the TEKS asks students to identify, compare, or explain
  // matter, materials, properties, changes, or energy interactions.
  "6.5A": [
    "matter_properties",
    "classification",
    "data_interpretation",
  ],

  "6.5B": [
    "matter_properties",
    "physical_change",
    "cause_effect",
  ],

  "6.5C": [
    "energy_transfer",
    "cause_effect",
    "system_modeling",
  ],

  // Already existed in the testing file.
  // Keep this broad because it can support observed changes, cause/effect,
  // and simple data interpretation.
  "6.5D": [
    "cause_effect",
    "data_interpretation",
  ],

  // Force, motion, and energy systems
  "6.7A": [
    "force_motion",
    "cause_effect",
    "data_interpretation",
  ],

  "6.7B": [
    "force_motion",
    "system_modeling",
    "cause_effect",
  ],

  // Earth and space / Earth systems
  "6.10A": [
    "earth_systems",
    "system_modeling",
    "cause_effect",
  ],

  "6.10B": [
    "earth_systems",
    "data_interpretation",
    "cause_effect",
  ],

  // Organisms and environments
  "6.12A": [
    "ecosystem_interactions",
    "classification",
    "cause_effect",
  ],

  "6.12B": [
    "ecosystem_interactions",
    "energy_flow",
    "system_modeling",
  ],

  // ─────────────────────────────────────────────
  // Grade 7 Science
  // ─────────────────────────────────────────────

  // Cells and organisms
  "7.6A": [
    "cell_structure_function",
    "classification",
    "system_modeling",
  ],

  "7.6B": [
    "cell_structure_function",
    "cause_effect",
    "system_modeling",
  ],

  // Genetics / heredity
  "7.13A": [
    "inheritance_patterns",
    "cause_effect",
    "data_interpretation",
  ],

  "7.13B": [
    "inheritance_patterns",
    "claim_evidence_reasoning",
    "data_interpretation",
  ],

  // Evolution / adaptations
  "7.11A": [
    "adaptations",
    "cause_effect",
    "claim_evidence_reasoning",
  ],

  "7.11B": [
    "adaptations",
    "ecosystem_interactions",
    "claim_evidence_reasoning",
  ],

  // Ecosystems
  // Tested successfully with multiple_choice, hot_text,
  // constructed_response, and multi_select.
  //
  // Best tested split:
  // - energy_flow: producers, consumers, food chains/webs, energy transfer
  // - matter_cycles: nutrients, carbon, water, decomposers, recycling matter
  // - ecosystem_interactions: organism relationships and roles
  // - system_modeling: interpreting/revising ecosystem models
  "7.12B": [
    "energy_flow",
    "matter_cycles",
    "ecosystem_interactions",
    "system_modeling",
  ],

  // Existing testing-file standard.
  // Keep claim/evidence and model analysis because this type of TEKS usually
  // needs students to reason from systems, evidence, or diagrams.
  "7.12D": [
    "claim_evidence_reasoning",
    "model_analysis",
  ],

  // Earth history / geologic change
  "7.10A": [
    "earth_history",
    "cause_effect",
    "data_interpretation",
  ],

  "7.10B": [
    "earth_history",
    "claim_evidence_reasoning",
    "data_interpretation",
  ],

  // ─────────────────────────────────────────────
  // Grade 8 Science
  // ─────────────────────────────────────────────

  // Force and motion
  "8.6A": [
    "force_motion",
    "data_interpretation",
    "cause_effect",
  ],

  "8.6B": [
    "force_motion",
    "system_modeling",
    "cause_effect",
  ],

  "8.6C": [
    "force_motion",
    "claim_evidence_reasoning",
    "data_interpretation",
  ],

  // Energy transformations / waves
  "8.8A": [
    "energy_transfer",
    "system_modeling",
    "cause_effect",
  ],

  "8.8B": [
    "waves",
    "data_interpretation",
    "system_modeling",
  ],

  // Matter and periodic table
  "8.5A": [
    "matter_properties",
    "classification",
    "data_interpretation",
  ],

  "8.5B": [
    "matter_properties",
    "classification",
    "claim_evidence_reasoning",
  ],

  "8.5C": [
    "matter_properties",
    "physical_change",
    "cause_effect",
  ],

  // Earth and space
  "8.9A": [
    "earth_space_systems",
    "system_modeling",
    "cause_effect",
  ],

  "8.9B": [
    "earth_space_systems",
    "data_interpretation",
    "claim_evidence_reasoning",
  ],

  "8.9C": [
    "earth_space_systems",
    "system_modeling",
    "data_interpretation",
  ],

  // Organisms and environments / ecological relationships
  "8.11A": [
    "ecosystem_interactions",
    "cause_effect",
    "claim_evidence_reasoning",
  ],

  "8.11B": [
    "ecosystem_interactions",
    "system_modeling",
    "data_interpretation",
  ],
};