// /libs/constants/teksSubjectMap.js
// Branch: v2/student-success-platform
//
// Central dispatcher — maps classroom.subject → the correct TEKS map
// and its human-readable bucket labels.
//
// Adding a new subject is constants-only:
//   1. Create the map file (e.g. teksMathMap.js) following the same
//      { gradeN: { bucketKey: ["X.YZ", ...] } } shape as teksReadingMap.js
//   2. Import it here and add one entry to TEKS_MAP_BY_SUBJECT
//   3. Add its bucket labels to TEKS_BUCKET_LABELS_BY_SUBJECT
//
// Nothing else in the codebase needs to change.
import { PASSAGE_BANK_PRIMARY_TEKS_BY_SUBJECT, PASSAGE_BANK_FAMILY_LABELS } from "./passageBankPrimaryTeks";

import { TEKS_READING_MAP, TEKS_READING_BUCKET_LABELS ,TEKS_LABELS } from "./teksReadingMap";
import { TEKS_SOCIAL_STUDIES_MAP, TEKS_SS_BUCKET_LABELS, TEKS_SS_LABELS } from "./teksSocialStudiesMap";
import { TEKS_SCIENCE_MAP, TEKS_SCIENCE_BUCKET_LABELS, TEKS_SCIENCE_LABELS } from "./teksScienceMap";

// ── Placeholder maps for upcoming subjects ────────────────────────────────────
// Replace each with a real import once the map file exists.
// Shape must match teksReadingMap: { gradeN: { bucketKey: ["X.YZ"] } }

const TEKS_MATH_MAP = {};         // TODO: import from "./teksMathMap"

// ── Subject → TEKS map ────────────────────────────────────────────────────────
// Keys must match the values stored in classrooms.subject exactly.

export const TEKS_MAP_BY_SUBJECT = {
  ELA: TEKS_READING_MAP,
  Math: TEKS_MATH_MAP,
  Science: TEKS_SCIENCE_MAP,
  "Social Studies": TEKS_SOCIAL_STUDIES_MAP,
};

// ── Subject → bucket label map ────────────────────────────────────────────────
// Each subject has its own bucket keys and human-readable names.
// ELA bucket keys come from teksReadingMap.js; other subjects will define theirs.

export const TEKS_BUCKET_LABELS_BY_SUBJECT = {
  // Add Math bucket labels here when teksMathMap.js is created, e.g.:
  // Math: {
  //   number_operations: "Number & Operations",
  //   algebraic_reasoning: "Algebraic Reasoning",
  //   geometry: "Geometry",
  //   data_analysis: "Data Analysis",
  //   financial_literacy: "Personal Financial Literacy",
  // },
  ELA: TEKS_READING_BUCKET_LABELS,
  Math: {},
  Science: TEKS_SCIENCE_BUCKET_LABELS,
  "Social Studies": TEKS_SS_BUCKET_LABELS,
};

// Per-code label maps — used to give each individual standard a specific description.
// Falls back to bucket label when a code isn't listed here.
const CODE_LABELS_BY_SUBJECT = {
  ELA: TEKS_LABELS,
  "Social Studies": TEKS_SS_LABELS,
  Math: {},
  Science: TEKS_SCIENCE_LABELS,
};

// ── Builder ───────────────────────────────────────────────────────────────────
// Returns a sorted array of { code, label } for the given subject + grade.
// Per-code label takes priority over bucket label — each standard gets a
// unique, readable description instead of the bucket name repeated for A/B/C.
 
export function buildTeksOptions(subject, gradeLevel) {
  if (!subject || !gradeLevel) return [];
 
  const subjectMap = TEKS_MAP_BY_SUBJECT[subject];
  if (!subjectMap) return [];
 
  const buckets = subjectMap[`grade${gradeLevel}`];
  if (!buckets) return [];
 
  const bucketLabelMap = TEKS_BUCKET_LABELS_BY_SUBJECT[subject] ?? {};
  const codeLabelMap = CODE_LABELS_BY_SUBJECT[subject] ?? {};
  const options = [];
  const seen = new Set();
 
  for (const [bucketKey, codes] of Object.entries(buckets)) {
    const bucketLabel = bucketLabelMap[bucketKey] ?? bucketKey;
    for (const code of codes) {
      if (!seen.has(code)) {
        seen.add(code);
        // Per-code label wins; bucket label is the fallback
        const label = codeLabelMap[code] ?? `${code} — ${bucketLabel}`;
        //const label = codeLabelMap[code] ?? code;
        options.push({ code, label });
      }
    }
  }
 
  return options.sort((a, b) => a.code.localeCompare(b.code));
}

export function getTeksBucketForSubject({ subject, gradeLevel, teksStandard }) {
  if (!subject || !gradeLevel || !teksStandard) return null;

  const subjectMap = TEKS_MAP_BY_SUBJECT[subject];
  if (!subjectMap) return null;

  const gradeBuckets = subjectMap[`grade${gradeLevel}`];
  if (!gradeBuckets) return null;

  for (const [bucketKey, codes] of Object.entries(gradeBuckets)) {
    if (codes.includes(teksStandard)) {
      return bucketKey;
    }
  }

  return null;
}

export function getTeksLabelForSubject({ subject, teksStandard }) {
  if (!subject || !teksStandard) return null;

  const codeLabelMap = CODE_LABELS_BY_SUBJECT[subject] ?? {};

  return codeLabelMap[teksStandard] ?? null;
}

export function buildPassageBankTeksOptions(
  subject,
  gradeLevel,
) {
  if (!subject || !gradeLevel) return [];

  const gradeMap =
    PASSAGE_BANK_PRIMARY_TEKS_BY_SUBJECT?.[
      subject
    ]?.[`grade${gradeLevel}`];

  if (!gradeMap) return [];

  const codeLabelMap =
    CODE_LABELS_BY_SUBJECT[subject] ?? {};

  const options = [];
  const seen = new Set();

  for (const [family, codes] of Object.entries(
    gradeMap,
  )) {
    for (const code of codes) {
      if (seen.has(code)) continue;

      seen.add(code);

      options.push({
        code,
        label: codeLabelMap[code] ?? code,
        family,
        family_label:
          PASSAGE_BANK_FAMILY_LABELS[family] ??
          family,
      });
    }
  }

  return options;
}