//app/api/generate-json/generators/staarReadingGenerator
import OpenAI from "openai";
import fs from "fs/promises";
import { TEKS_READING_MAP } from "@/libs/constants/teksReadingMap"; // you already added this
//import { staarReadingGenerateResponseSchema} from "@/libs/zodSchemas/staarReadingGeneratorSchema";
import { staarReadingGenerateResponseSchema } from "@/libs/zodSchemas";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function cleanJSON(content) {
  return content.replace(/```json|```/g, "").trim();
}

function defaultScrRubric() {
  return {
    maxPoints: 2,
    anchors: [
      { points: 2, description: "Accurate, uses text evidence, complete." },
      { points: 1, description: "Partially accurate, limited evidence or incomplete." },
      { points: 0, description: "Incorrect/off-topic or no evidence." },
    ],
  };
}


function normalizeChooseALineAnswer(q, worksheet) {
  // Your schema expects: answer: { lineIndex?: number, lineText?: string }
  // If AI returned array like ["b"] or missing, we convert to a safe object.

  if (q?.type !== "choose-a-line") return q;

  // If already correct object, keep it
  if (q.answer && typeof q.answer === "object" && !Array.isArray(q.answer)) {
    // ensure at least one field exists
    if (q.answer.lineIndex !== undefined || q.answer.lineText) return q;
  }

  const lines = worksheet?.passage?.lines || [];

  // If answer is an array or undefined, pick a fallback lineIndex (0) if possible
  const fallbackIndex = lines.length ? 0 : undefined;
  const fallbackLineText = lines.length ? lines[0] : "—";

  return {
    ...q,
    answer: {
      ...(fallbackIndex !== undefined ? { lineIndex: fallbackIndex } : {}),
      ...(fallbackLineText ? { lineText: fallbackLineText } : {}),
    },
  };
}

function normalizeScr(q) {
  if (q?.type !== "scr") return q;

  return {
    ...q,
    rubric: q.rubric?.anchors ? q.rubric : defaultScrRubric(),
  };
}

function normalizeStaarWorksheet(ws) {
  if (!ws || typeof ws !== "object") return ws;

  const questions = Array.isArray(ws.questions) ? ws.questions : [];

  const normalizedQuestions = questions.map((q) => {
    let out = q;

    // Fix choose-a-line shape
    out = normalizeChooseALineAnswer(out, ws);

    // Fix missing SCR rubric anchors
    out = normalizeScr(out);

    return out;
  });

  return { ...ws, questions: normalizedQuestions };
}

function buildTeksOptions(gradeLevel) {
  const key = `grade${gradeLevel}`;
  const m = TEKS_READING_MAP[key];
  return {
    inference: m.inference_text_evidence,
    centralIdea: m.key_idea_central_idea,
    summary: m.summarize_paraphrase_retell,
    informational: m.informational_central_idea_supporting,
  };
}

export async function generateStaarReadingJson({
  type,
  topic,
  gradeLevel,        // "3" | "4" | "5"
  count,  
  genre,           // you can ignore or keep for future
  examplePdfPath,
  signal,
}) {
  const exampleText = await fs.readFile(examplePdfPath, "utf-8");

  const MAX_RETRIES = 2;
  const perAttemptTimeout = 90000;

  const teks = buildTeksOptions(gradeLevel);

  const prompt = `
You generate STAAR-aligned reading comprehension practice for Texas grades 3-5.

GOAL:
Create ONE (1) STAAR-style practice set with:
- a short passage
- 8 objective questions (mixed item types)
- 1 SCR (short constructed response)

Constraints:
- gradeLevel: "${gradeLevel}"
- genre: "${genre}" (must be exactly "nonfiction" OR "fiction")
- Passage length: 200–350 words max (keep it short but maintain STAAR-like rigor)
- Use a fresh topic tied to: "${topic}"
- Output must be VALID JSON only (no markdown)
- Output schema: an ARRAY of 1 worksheet object

PASSAGE REQUIREMENTS:
If genre = "nonfiction":
- informational tone
- clear central idea with supporting details
- include at least 2 paragraphs

If genre = "fiction":
- realistic fiction tone (no fantasy for now)
- clear characters + setting + problem + resolution
- include dialogue sparingly (1–3 short lines max)
- include at least 2 paragraphs
- scr should follow structure of STAAR like questioning such as plot elements or text structure

Question requirements:
- Total questions: 9
- Questions 1-8: mix of:
  - "multiple-choice" (single answer)
  - "multi-select" (exactly TWO answers)
  - "choose-a-line" (student selects the best line as evidence)
- Question 9: "scr" short constructed response
- Each question MUST include a "teks" array using ONLY these TEKS codes for this grade+genre:
  inference: ${JSON.stringify(teks.inference)}
  central idea / key idea: ${JSON.stringify(teks.centralIdea)}
  summarize: ${JSON.stringify(teks.summary)}
  informational structure/central idea: ${JSON.stringify(teks.informational)}
- Each question MUST be answerable from the passage.
- "choose-a-line" must reference the passage lines (either lineIndex or exact lineText).
IMPORTANT ANSWER SHAPES (MUST FOLLOW EXACTLY):
- multiple-choice answer MUST be: "answer": ["a"]  (array of 1 choice id)
- multi-select answer MUST be: "answer": ["a","c"] (array of 2 choice ids)
- choose-a-line answer MUST be:
  "answer": { "lineIndex": 3 }
  OR
  "answer": { "lineText": "(4) ..." }
  (NOT an array)
- scr MUST include rubric.anchors as an array, like:
  "rubric": { "maxPoints": 2, "anchors": [ { "points":2,"description":"..."}, { "points":1,"description":"..."}, { "points":0,"description":"..."} ] }

Passage:
- Provide { title, text, lines[] }.
- lines[] should be the passage split into numbered-style lines or sentences so evidence selection works.

Return JSON in this exact shape:

[
  {
    "type": "staarReading",
    "genre": "${genre}",
    "gradeLevel": "${gradeLevel}",
    "topic": "${topic}",
    "passage": {
      "title": "...",
      "text": "...",
      "lines": ["(1) ...", "(2) ...", "(3) ..."]
    },
    "questions": [
      {
        "id": "q1",
        "type": "multiple-choice",
        "question": "...",
        "choices": [{"id":"a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],
        "answer": ["a"],
        "teks": ["${teks.inference[0]}"]
      }
      // total 9 items; last is SCR:
      // { "id":"q9","type":"scr","prompt":"...","rubric":{...},"teks":[...]}
    ]
  }
]

Example worksheet style reference (not content to copy but maintain tone, style, and STAAR-like phrasing in question stems):
"""${exampleText}"""
`;

  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const timeout = perAttemptTimeout + attempts * 15000;
    const temp = attempts === 0 ? 0.4 : 0.6;

    try {
      const opts = {};
      if (signal && !signal.aborted) opts.signal = signal;

      const response = await client.chat.completions.create(
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: temp,
        },
        opts
      );

      const parsed = JSON.parse(cleanJSON(response.choices[0].message.content));

        // ✅ normalize/repair
        const normalized = Array.isArray(parsed)
        ? parsed.map(normalizeStaarWorksheet)
        : parsed;

        // ✅ now validate
        const validated = staarReadingGenerateResponseSchema.parse(normalized);
      // Extra sanity checks (cheap + useful)
      const ws = validated[0];
      const scr = ws.questions.find((q) => q.type === "scr");
      if (!scr) throw new Error("Missing SCR");
      if ((ws.passage.text || "").length > 2500) {
        // safety cap
        throw new Error("Passage too long");
      }

      return {
        json: validated.map((w) => {
          const topicKey = (w.topic || "staar").replace(/\s+/g, "_");
          const gradeKey = `grade_${w.gradeLevel}`;
          const timestamp = Date.now();
          const key = `STAAR_${topicKey}-${gradeKey}-${timestamp}.json`;
          return { key };
        }),
        worksheets: validated,
      };
    } catch (err) {
      if (err.name === "AbortError") throw err;
        console.error(`❌ STAAR attempt ${attempts + 1} failed:`, err?.errors || err?.message);
    }

    attempts++;
  }

  throw new Error("❌ Failed to generate valid STAAR reading worksheet after retries.");
}
