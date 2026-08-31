// /libs/adaptive/passageFormat.js

export function getPassageFormatForTEKS(teksStandard) {
  const teks = String(teksStandard || "").trim();

  // Poetry
  if (["6.8B", "7.8B", "8.8B"].includes(teks)) {
    return "poetry";
  }

  // Drama
  if (
    ["4.9C", "5.9C", "6.8C", "7.8C", "8.8C"].includes(teks)
  ) {
    return "drama";
  }

  // Informational
  if (
    [
      "6.8D",
      "6.8D.i",
      "6.8D.ii",
      "6.8D.iii",

      "7.8D",
      "7.8D.i",
      "7.8D.ii",
      "7.8D.iii",

      "8.8D",
      "8.8D.i",
      "8.8D.ii",
      "8.8D.iii",
    ].includes(teks)
  ) {
    return "informational";
  }

  // Argumentative
  if (
    [
      "6.8E",
      "6.8E.i",
      "6.8E.ii",

      "7.8E",
      "7.8E.i",
      "7.8E.ii",

      "8.8E",
      "8.8E.i",
      "8.8E.ii",
    ].includes(teks)
  ) {
    return "argumentative";
  }

  // Narrative / general prose fallback
  return "fiction";
}