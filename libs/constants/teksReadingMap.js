//libs/constants/teksReadingMap.js
export const TEKS_READING_MAP = {
  grade3: {
    inference_text_evidence: ["3.6F", "3.7C"],          // infer + support response with evidence
    key_idea_central_idea: ["3.6G"],                        // evaluate details to determine key ideas
    summarize_paraphrase_retell: ["3.7D"],               // retell/paraphrase maintaining meaning/order
    informational_central_idea_supporting: ["3.9D"],     // informational: central idea + support, org patterns
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
  grade6: {
    inference_text_evidence: ["6.5F", "6.6C"],          // make inferences + use text evidence to support response
    key_idea_central_idea: ["6.5G"],                    // evaluate details to determine key ideas
    summarize_paraphrase_retell: ["6.6D"],              // paraphrase and summarize texts maintaining meaning/order
    informational_central_idea_supporting: ["6.8D(i)"], // informational: controlling/central idea with supporting evidence
  },

  grade7: {
    inference_text_evidence: ["7.5F", "7.6C"],          // make inferences + support with text evidence
    key_idea_central_idea: ["7.5G"],                    // evaluate details to determine key ideas
    summarize_paraphrase_retell: ["7.6D"],              // paraphrase and summarize texts maintaining meaning/order
    informational_central_idea_supporting: ["7.8D(i)"], // informational: controlling idea with supporting evidence
  },

  grade8: {
    inference_text_evidence: ["8.5F", "8.6C"],          // make inferences + support with text evidence
    key_idea_central_idea: ["8.5G"],                    // evaluate details to determine key ideas
    summarize_paraphrase_retell: ["8.6D"],              // paraphrase and summarize texts maintaining meaning/order
    informational_central_idea_supporting: ["8.9D(i)"], // informational: controlling idea with supporting evidence
  },

};

function buildTeksAllowed(gradeLevel) {
  const key = `grade${gradeLevel}`;
  const m = TEKS_READING_MAP[key];

  // Use exactly your existing buckets
  const buckets = [
    ...(m?.inference_text_evidence || []),
    ...(m?.key_idea_central_idea || []),
    ...(m?.summarize_paraphrase_retell || []),
    ...(m?.informational_central_idea_supporting || []),
  ];

  // unique + truthy
  return [...new Set(buckets.filter(Boolean))];
}
