// /libs/adaptive/maps/science/index.js
// Branch: v2/student-success-platform
//
// Science adaptive map config.
// Prompt rules stay inside /app/api/v2/generators/science.js.
// This file only exports Science skill_focus vocabulary,
// TEKS → skill_focus mapping, and assessment_move pools.

import { SCIENCE_SKILL_FOCUS_BY_TEKS } from "./skillFocusByTeks";
import { SCIENCE_ASSESSMENT_MOVES } from "./assessmentMoves";
import { SCIENCE_SKILL_FOCUS_BY_BUCKET } from "./skillFocusByBucket";
import { getTeksBucketForSubject } from "@/libs/constants/teksSubjectMap";

export const SCIENCE_SKILL_FOCUS_VOCAB = [
  "cause_effect",
  "data_interpretation",
  "claim_evidence_reasoning",
  "system_modeling",
  "model_analysis",
  "classification",

  "matter_properties",
  "physical_change",
  "energy_transfer",

  "force_motion",

  "earth_systems",
  "earth_history",
  "earth_space_systems",
  "waves",

  "cell_structure_function",
  "inheritance_patterns",
  "adaptations",

  "energy_flow",
  "matter_cycles",
  "ecosystem_interactions",
];

export const SCIENCE_ADAPTIVE_CONFIG = {
  subject: "Science",
  defaultSkillFocus: SCIENCE_SKILL_FOCUS_VOCAB,
  skillFocusByTeks: SCIENCE_SKILL_FOCUS_BY_TEKS,
  skillFocusByBucket : SCIENCE_SKILL_FOCUS_BY_BUCKET,
  assessmentMoves: SCIENCE_ASSESSMENT_MOVES,

  getTeksBucket: getTeksBucketForSubject,
};