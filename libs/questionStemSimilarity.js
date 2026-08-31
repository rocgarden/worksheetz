// /libs/libs/questionStemSimilarity.js

const STEM_STOP_WORDS =
  new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "how",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
  ]);

function normalizeComparableString(
  value,
) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function getMeaningfulStemWords(
  value,
) {
  return new Set(
    normalizeComparableString(value)
      .replace(
        /[^a-z0-9\s]/g,
        " ",
      )
      .split(/\s+/)
      .map((word) =>
        word.trim(),
      )
      .filter(
        (word) =>
          word.length >= 3 &&
          !STEM_STOP_WORDS.has(
            word,
          ),
      ),
  );
}

export function calculateStemSimilarity(
  firstStem,
  secondStem,
) {
  const firstWords =
    getMeaningfulStemWords(
      firstStem,
    );

  const secondWords =
    getMeaningfulStemWords(
      secondStem,
    );

  if (
    firstWords.size < 3 ||
    secondWords.size < 3
  ) {
    return 0;
  }

  let intersectionCount = 0;

  for (const word of firstWords) {
    if (
      secondWords.has(word)
    ) {
      intersectionCount += 1;
    }
  }

  const unionSize =
    new Set([
      ...firstWords,
      ...secondWords,
    ]).size;

  if (!unionSize) {
    return 0;
  }

  return (
    intersectionCount /
    unionSize
  );
}