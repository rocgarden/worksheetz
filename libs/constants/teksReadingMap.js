//libs/constants/teksReadingMap.js
// Complete Grade 6-8 ELA TEKS map for STAAR/Student Success Tool
// Organized by skill category → TEKS standard per grade

export const TEKS_READING_MAP = {
  grade6: {
    // ── Literary Text ─────────────────────────────────────────────────────
    inference_text_evidence: ["6.5F"],
    key_idea_theme: ["6.5G"],
    character_analysis: ["6.5B"],
    plot_story_elements: ["6.5A"],
    point_of_view_perspective: ["6.5D"],
    figurative_language: ["6.4A"],
    literary_devices_authors_craft: ["6.4B", "6.5E"],
    text_structure_literary: ["6.5C"],

    // ── Informational Text ────────────────────────────────────────────────
    central_idea_supporting_details: ["6.8D"],
    text_structure_informational: ["6.8C"],
    authors_purpose_informational: ["6.8E"],
    summarize_paraphrase: ["6.6D"],
    synthesize_across_texts: ["6.6F"],
    argumentative_text: ["6.9B", "6.9C"],
    text_evidence_response: ["6.6C"],

    // ── Vocabulary ────────────────────────────────────────────────────────
    vocabulary_context_clues: ["6.3A", "6.3B"],
    vocabulary_figurative_meaning: ["6.3C"],
    vocabulary_connotation_denotation: ["6.3D"],

    // ── Media Literacy ────────────────────────────────────────────────────
    media_literacy: ["6.10A", "6.10B"],
  },

  grade7: {
    // ── Literary Text ─────────────────────────────────────────────────────
    inference_text_evidence: ["7.5F"],
    key_idea_theme: ["7.5G"],
    character_analysis: ["7.5B"],
    plot_story_elements: ["7.5A"],
    point_of_view_perspective: ["7.5D"],
    figurative_language: ["7.4A"],
    literary_devices_authors_craft: ["7.4B", "7.5E"],
    text_structure_literary: ["7.5C"],

    // ── Informational Text ────────────────────────────────────────────────
    central_idea_supporting_details: ["7.8D"],
    text_structure_informational: ["7.8C"],
    authors_purpose_informational: ["7.8E"],
    summarize_paraphrase: ["7.6D"],
    synthesize_across_texts: ["7.6F"],
    argumentative_text: ["7.9B", "7.9C"],
    text_evidence_response: ["7.6C"],

    // ── Vocabulary ────────────────────────────────────────────────────────
    vocabulary_context_clues: ["7.3A", "7.3B"],
    vocabulary_figurative_meaning: ["7.3C"],
    vocabulary_connotation_denotation: ["7.3D"],

    // ── Media Literacy ────────────────────────────────────────────────────
    media_literacy: ["7.10A", "7.10B"],
  },

  grade8: {
    // ── Literary Text ─────────────────────────────────────────────────────
    inference_text_evidence: ["8.5F"],
    key_idea_theme: ["8.5G"],
    character_analysis: ["8.5B"],
    plot_story_elements: ["8.5A"],
    point_of_view_perspective: ["8.5D"],
    figurative_language: ["8.4A"],
    literary_devices_authors_craft: ["8.4B", "8.5E"],
    text_structure_literary: ["8.5C"],

    // ── Informational Text ────────────────────────────────────────────────
    central_idea_supporting_details: ["8.9D"],
    text_structure_informational: ["8.9C"],
    authors_purpose_informational: ["8.9E"],
    summarize_paraphrase: ["8.6D"],
    synthesize_across_texts: ["8.6F"],
    argumentative_text: ["8.10B", "8.10C"],
    text_evidence_response: ["8.6C"],

    // ── Vocabulary ────────────────────────────────────────────────────────
    vocabulary_context_clues: ["8.3A", "8.3B"],
    vocabulary_figurative_meaning: ["8.3C"],
    vocabulary_connotation_denotation: ["8.3D"],

    // ── Media Literacy ────────────────────────────────────────────────────
    media_literacy: ["8.10A", "8.10B"],
  },

  // Keep grades 3-5 for future expansion
  grade3: {
    inference_text_evidence: ["3.6F", "3.7C"],
    key_idea_central_idea: ["3.6G"],
    summarize_paraphrase_retell: ["3.7D"],
    informational_central_idea_supporting: ["3.9D"],
  },
  grade4: {
    inference_text_evidence: ["4.6F", "4.7C"],
    key_idea_central_idea: ["4.6G"],
    summarize_paraphrase_retell: ["4.7D"],
    informational_central_idea_supporting: ["4.9D"],
  },
  grade5: {
    inference_text_evidence: ["5.6F", "5.7C"],
    key_idea_central_idea: ["5.6G"],
    summarize_paraphrase_retell: ["5.7D"],
    informational_central_idea_supporting: ["5.9D"],
  },
};

// function buildTeksAllowed(gradeLevel) {
//   const key = `grade${gradeLevel}`;
//   const m = TEKS_READING_MAP[key];

//   // Use exactly your existing buckets
//   const buckets = [
//     ...(m?.inference_text_evidence || []),
//     ...(m?.key_idea_central_idea || []),
//     ...(m?.summarize_paraphrase_retell || []),
//     ...(m?.informational_central_idea_supporting || []),
//   ];

//   // unique + truthy
//   return [...new Set(buckets.filter(Boolean))];
// }

// ── Flat list builder for dropdown ────────────────────────────────────────────
export function buildTeksAllowed(gradeLevel) {
  const key = `grade${gradeLevel}`;
  const m = TEKS_READING_MAP[key];
  if (!m) return [];
  const allTeks = Object.values(m).flat();
  return [...new Set(allTeks.filter(Boolean))];
}

// ── Label map for dropdown display ────────────────────────────────────────────
// Maps TEKS code → human readable label for AssignClient dropdown
export const TEKS_LABELS = {
  // Grade 6
  "6.5F": "6.5F — Make inferences using text evidence",
  "6.5G": "6.5G — Evaluate details to determine theme/key idea",
  "6.5B": "6.5B — Analyze character development",
  "6.5A": "6.5A — Analyze plot and story elements",
  "6.5D": "6.5D — Identify point of view and perspective",
  "6.4A": "6.4A — Identify figurative language",
  "6.4B": "6.4B — Analyze author's craft and literary devices",
  "6.5E": "6.5E — Analyze structure of literary text",
  "6.5C": "6.5C — Analyze text structure in literary texts",
  "6.8D": "6.8D — Identify central idea with supporting details",
  "6.8C": "6.8C — Analyze text structure in informational texts",
  "6.8E": "6.8E — Identify author's purpose",
  "6.6D": "6.6D — Summarize and paraphrase texts",
  "6.6F": "6.6F — Synthesize information across texts",
  "6.9B": "6.9B — Analyze argumentative text",
  "6.9C": "6.9C — Evaluate persuasive techniques",
  "6.6C": "6.6C — Support responses with text evidence",
  "6.3A": "6.3A — Determine meaning using context clues",
  "6.3B": "6.3B — Use Greek/Latin roots to determine meaning",
  "6.3C": "6.3C — Identify figurative meaning of words",
  "6.3D": "6.3D — Analyze connotation and denotation",
  "6.10A": "6.10A — Analyze media messages and techniques",
  "6.10B": "6.10B — Evaluate credibility of media sources",

  // Grade 7
  "7.5F": "7.5F — Make inferences using text evidence",
  "7.5G": "7.5G — Evaluate details to determine theme/key idea",
  "7.5B": "7.5B — Analyze character development",
  "7.5A": "7.5A — Analyze plot and story elements",
  "7.5D": "7.5D — Identify point of view and perspective",
  "7.4A": "7.4A — Identify figurative language",
  "7.4B": "7.4B — Analyze author's craft and literary devices",
  "7.5E": "7.5E — Analyze structure of literary text",
  "7.5C": "7.5C — Analyze text structure in literary texts",
  "7.8D": "7.8D — Identify central idea with supporting details",
  "7.8C": "7.8C — Analyze text structure in informational texts",
  "7.8E": "7.8E — Identify author's purpose",
  "7.6D": "7.6D — Summarize and paraphrase texts",
  "7.6F": "7.6F — Synthesize information across texts",
  "7.9B": "7.9B — Analyze argumentative text",
  "7.9C": "7.9C — Evaluate persuasive techniques",
  "7.6C": "7.6C — Support responses with text evidence",
  "7.3A": "7.3A — Determine meaning using context clues",
  "7.3B": "7.3B — Use Greek/Latin roots to determine meaning",
  "7.3C": "7.3C — Identify figurative meaning of words",
  "7.3D": "7.3D — Analyze connotation and denotation",
  "7.10A": "7.10A — Analyze media messages and techniques",
  "7.10B": "7.10B — Evaluate credibility of media sources",

  // Grade 8
  "8.5F": "8.5F — Make inferences using text evidence",
  "8.5G": "8.5G — Evaluate details to determine theme/key idea",
  "8.5B": "8.5B — Analyze character development",
  "8.5A": "8.5A — Analyze plot and story elements",
  "8.5D": "8.5D — Identify point of view and perspective",
  "8.4A": "8.4A — Identify figurative language",
  "8.4B": "8.4B — Analyze author's craft and literary devices",
  "8.5E": "8.5E — Analyze structure of literary text",
  "8.5C": "8.5C — Analyze text structure in literary texts",
  "8.9D": "8.9D — Identify central idea with supporting details",
  "8.9C": "8.9C — Analyze text structure in informational texts",
  "8.9E": "8.9E — Identify author's purpose",
  "8.6D": "8.6D — Summarize and paraphrase texts",
  "8.6F": "8.6F — Synthesize information across texts",
  "8.10B": "8.10B — Analyze argumentative text",
  "8.10C": "8.10C — Evaluate persuasive techniques",
  "8.6C": "8.6C — Support responses with text evidence",
  "8.3A": "8.3A — Determine meaning using context clues",
  "8.3B": "8.3B — Use Greek/Latin roots to determine meaning",
  "8.3C": "8.3C — Identify figurative meaning of words",
  "8.3D": "8.3D — Analyze connotation and denotation",
  "8.10A": "8.10A — Analyze media messages and techniques",
};