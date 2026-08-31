// /libs/adaptive/maps/socialStudies/index.js
// Branch: v2/student-success-platform
//
// Social Studies adaptive map config.
// Prompt rules stay inside /app/api/v2/generators/socialStudies.js.
// This file only exports Social Studies skill_focus vocabulary,
// TEKS → skill_focus mapping, and assessment_move pools.

import { SOCIAL_STUDIES_SKILL_FOCUS_BY_TEKS } from "./skillFocusByTeks";
import { SOCIAL_STUDIES_ASSESSMENT_MOVES } from "./assessmentMoves";
import { SS_SKILL_FOCUS_BY_BUCKET } from "./skillFocusByBucket";
import { getTeksBucketForSubject } from "@/libs/constants/teksSubjectMap";

export const SOCIAL_STUDIES_SKILL_FOCUS_VOCAB = [
  "cause_effect",
  "historical_significance",
  "geographic_influence",
  "compare_cultures",
  "compare_perspectives",
  "chronology",
  "evidence_from_source",
  "claim_evidence_reasoning",
  "historical_interpretation",
  "human_environment_interaction",
  "spatial_patterns",
  "compare_regions",
  "culture_traits",
  "government_systems",
  "compare_governments",
  "civic_principles",
  "economic_systems",
];

export const SOCIAL_STUDIES_ADAPTIVE_CONFIG = {
  subject: "Social Studies",
  defaultSkillFocus: SOCIAL_STUDIES_SKILL_FOCUS_VOCAB,
  skillFocusByTeks: SOCIAL_STUDIES_SKILL_FOCUS_BY_TEKS,
  skillFocusByBucket: SS_SKILL_FOCUS_BY_BUCKET,
  assessmentMoves: SOCIAL_STUDIES_ASSESSMENT_MOVES,

  getTeksBucket: getTeksBucketForSubject,

};