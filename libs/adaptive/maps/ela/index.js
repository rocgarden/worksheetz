// /libs/adaptive/maps/ela/index.js
// Branch: v2/student-success-platform
//
// ELA adaptive map config.
// Prompt rules stay inside /app/api/v2/generators/ela.js.
// This file only exports ELA skill_focus vocabulary,
// TEKS → skill_focus mapping, and assessment_move pools.

import { ELA_SKILL_FOCUS_BY_TEKS } from "./skillFocusByTeks";
import {  ELA_ASSESSMENT_MOVES, ELA_ASSESSMENT_MOVE_REQUIREMENTS,} from "./assessmentMoves";import { ELA_SKILL_FOCUS_BY_BUCKET } from "./skillFocusByBucket";
import { getTeksBucketForSubject } from "@/libs/constants/teksSubjectMap";

export const ELA_SKILL_FOCUS_VOCAB = [
  "text_evidence",
  "inference",
  "implicit_meaning",
  "central_idea",
  "analysis",
];

export const ELA_ADAPTIVE_CONFIG = {
  subject: "ELA",
  defaultSkillFocus: ELA_SKILL_FOCUS_VOCAB,
  skillFocusByTeks: ELA_SKILL_FOCUS_BY_TEKS,
  skillFocusByBucket: ELA_SKILL_FOCUS_BY_BUCKET,
  assessmentMoves: ELA_ASSESSMENT_MOVES,
  assessmentMoveRequirements: ELA_ASSESSMENT_MOVE_REQUIREMENTS,

  getTeksBucket: getTeksBucketForSubject,

  //   defaultSkillFocus: [
  //   "text_evidence",
  //   "inference",
  //   "central_idea",
  //   "analysis",
  // ],
};

