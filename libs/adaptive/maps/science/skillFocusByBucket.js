// /libs/adaptive/maps/science/skillFocusByBucket.js
//
// Bucket-level fallback skill_focus options for Science adaptive generation.
// These are used when a TEKS does not have a specific override in skillFocusByTeks.js.
//
// Flow:
// TEKS standard → exact TEKS skill_focus override if present
// otherwise → science bucket → these skill_focus options
// otherwise → subject defaultSkillFocus

export const SCIENCE_SKILL_FOCUS_BY_BUCKET = {
  // ── Grade 6: Matter ────────────────────────────────────────────────
  matter_properties: [
    "property_identification",
    "compare_properties",
    "evidence_reasoning",
    "model_reasoning",
  ],

  matter_changes: [
    "physical_chemical_change",
    "cause_effect",
    "evidence_reasoning",
    "model_reasoning",
  ],

  // ── Grade 6 / 8: Force & Motion ────────────────────────────────────
  force_motion: [
    "motion_description",
    "cause_effect",
    "data_interpretation",
    "model_reasoning",
  ],

  force_net: [
    "force_interaction",
    "net_force_reasoning",
    "cause_effect",
    "model_reasoning",
  ],

  force_speed_velocity: [
    "motion_description",
    "data_interpretation",
    "cause_effect",
    "model_reasoning",
  ],

  force_acceleration: [
    "motion_description",
    "force_interaction",
    "cause_effect",
    "data_interpretation",
  ],

  force_newtons_laws: [
    "force_interaction",
    "cause_effect",
    "model_reasoning",
    "evidence_reasoning",
  ],

  // ── Grade 6 / 8: Earth & Space ─────────────────────────────────────
  earth_systems: [
    "system_modeling",
    "cause_effect",
    "evidence_reasoning",
    "process_sequence",
  ],

  earth_space: [
    "system_modeling",
    "pattern_analysis",
    "cause_effect",
    "evidence_reasoning",
  ],

  earth_plate_tectonics: [
    "system_modeling",
    "cause_effect",
    "process_sequence",
    "evidence_reasoning",
  ],

  earth_solar_system: [
    "system_modeling",
    "pattern_analysis",
    "cause_effect",
    "model_reasoning",
  ],

  earth_universe: [
    "system_modeling",
    "pattern_analysis",
    "evidence_reasoning",
    "model_reasoning",
  ],

  // ── Grade 6 / 7: Organisms, Cells, Genetics, Evolution ─────────────
  organisms_structure: [
    "structure_function",
    "system_modeling",
    "compare_structures",
    "evidence_reasoning",
  ],

  cells_structure: [
    "structure_function",
    "system_modeling",
    "compare_structures",
    "model_reasoning",
  ],

  cells_processes: [
    "process_sequence",
    "cause_effect",
    "system_modeling",
    "evidence_reasoning",
  ],

  genetics_heredity: [
    "trait_inheritance",
    "pattern_analysis",
    "cause_effect",
    "evidence_reasoning",
  ],

  genetics_variation: [
    "trait_variation",
    "cause_effect",
    "pattern_analysis",
    "evidence_reasoning",
  ],

  evolution_natural_sel: [
    "adaptation_reasoning",
    "cause_effect",
    "evidence_reasoning",
    "pattern_analysis",
  ],

  evolution_adaptations: [
    "adaptation_reasoning",
    "structure_function",
    "cause_effect",
    "evidence_reasoning",
  ],

  // ── Grade 7: Earth History ─────────────────────────────────────────
  earth_history: [
    "evidence_reasoning",
    "process_sequence",
    "pattern_analysis",
    "cause_effect",
  ],

  earth_geologic_time: [
    "process_sequence",
    "pattern_analysis",
    "evidence_reasoning",
    "model_reasoning",
  ],

  // ── Grade 6 / 7: Ecosystems ────────────────────────────────────────
  ecosystems_interactions: [
    "ecosystem_interactions",
    "energy_flow",
    "matter_cycles",
    "cause_effect",
  ],

  ecosystems_roles: [
    "ecosystem_interactions",
    "energy_flow",
    "matter_cycles",
    "system_modeling",
  ],

  ecosystems_food_webs: [
    "energy_flow",
    "matter_cycles",
    "ecosystem_interactions",
    "system_modeling",
  ],

  ecosystems_biotic_ab: [
    "ecosystem_interactions",
    "biotic_abiotic_factors",
    "cause_effect",
    "evidence_reasoning",
  ],

  // ── Grade 8: Energy ────────────────────────────────────────────────
  energy_types: [
    "energy_identification",
    "energy_transfer",
    "cause_effect",
    "model_reasoning",
  ],

  energy_transformations: [
    "energy_transfer",
    "energy_transformation",
    "cause_effect",
    "model_reasoning",
  ],

  // ── Grade 8: Waves ─────────────────────────────────────────────────
  waves_properties: [
    "wave_properties",
    "pattern_analysis",
    "data_interpretation",
    "model_reasoning",
  ],

  waves_em_spectrum: [
    "wave_properties",
    "pattern_analysis",
    "compare_properties",
    "evidence_reasoning",
  ],

  // ── Grade 8: Matter / Chemistry ────────────────────────────────────
  matter_periodic_table: [
    "property_identification",
    "pattern_analysis",
    "compare_properties",
    "evidence_reasoning",
  ],

  matter_bonding: [
    "physical_chemical_change",
    "cause_effect",
    "model_reasoning",
    "evidence_reasoning",
  ],

  // ── Science Process Skills ─────────────────────────────────────────
  sci_process: [
    "investigation_design",
    "data_interpretation",
    "evidence_reasoning",
    "claim_evidence_reasoning",
  ],

  sci_tools_safety: [
    "tool_selection",
    "safety_reasoning",
    "investigation_design",
    "evidence_reasoning",
  ],
};