// /libs/adaptive/maps/index.js
// Branch: v2/student-success-platform
//
// Shared subject adaptive config registry.
// Subject-specific map data lives in:
// /libs/adaptive/maps/ela
// /libs/adaptive/maps/science
// /libs/adaptive/maps/socialStudies
// /libs/adaptive/maps/math
//
// Prompt rules stay inside each subject generator file.
 
import { ELA_ADAPTIVE_CONFIG } from "./ela";
import { SCIENCE_ADAPTIVE_CONFIG } from "./science";
import { SOCIAL_STUDIES_ADAPTIVE_CONFIG } from "./socialStudies";
import { getTeksBucketForSubject } from "@/libs/constants/teksSubjectMap";

export const SUBJECT_ADAPTIVE_CONFIGS = {
  ELA: ELA_ADAPTIVE_CONFIG,
  Science: SCIENCE_ADAPTIVE_CONFIG,
  "Social Studies" : SOCIAL_STUDIES_ADAPTIVE_CONFIG,
};

export function getSubjectAdaptiveConfig(subject) {
  const config = SUBJECT_ADAPTIVE_CONFIGS[subject];

  if (!config) {
    throw new Error(`No adaptive config found for subject: ${subject}`);
  }

  return config;
}

// import { getTeksBucketForSubject } from "@/libs/constants/teksSubjectMap";
// import { SCIENCE_SKILL_FOCUS_BY_TEKS } from "./skillFocusByTeks";
// import { SCIENCE_SKILL_FOCUS_BY_BUCKET } from "./skillFocusByBucket";
// import { SCIENCE_ASSESSMENT_MOVES } from "./assessmentMoves";

// export const SCIENCE_ADAPTIVE_CONFIG = {
//   subject: "Science",

//   skillFocusByTeks: SCIENCE_SKILL_FOCUS_BY_TEKS,
//   skillFocusByBucket: SCIENCE_SKILL_FOCUS_BY_BUCKET,
//   assessmentMoves: SCIENCE_ASSESSMENT_MOVES,

//   getTeksBucket: getTeksBucketForSubject,

//   defaultSkillFocus: [
//     "concept_identification",
//     "cause_effect",
//     "model_reasoning",
//     "evidence_reasoning",
//   ],
// };

// import { getTeksBucketForSubject } from "@/libs/constants/teksSubjectMap";
// import { SS_SKILL_FOCUS_BY_TEKS } from "./skillFocusByTeks";
// import { SS_SKILL_FOCUS_BY_BUCKET } from "./skillFocusByBucket";
// import { SS_ASSESSMENT_MOVES } from "./assessmentMoves";

// export const SOCIAL_STUDIES_ADAPTIVE_CONFIG = {
//   subject: "Social Studies",

//   skillFocusByTeks: SS_SKILL_FOCUS_BY_TEKS,
//   skillFocusByBucket: SS_SKILL_FOCUS_BY_BUCKET,
//   assessmentMoves: SS_ASSESSMENT_MOVES,

//   getTeksBucket: getTeksBucketForSubject,

//   defaultSkillFocus: [
//     "cause_effect",
//     "geographic_influence",
//     "historical_significance",
//     "compare_cultures",
//   ],
// };