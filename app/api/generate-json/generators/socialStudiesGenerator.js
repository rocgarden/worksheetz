import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import pkg from "pdfjs-dist/legacy/build/pdf.js";

// Extract text from PDF using pdfjs-dist
// async function extractTextFromPDF(filePath) {
//   const data = new Uint8Array(fs.readFileSync(filePath));
//   const pdf = await getDocument({ data }).promise;
//   let fullText = "";
//   for (let i = 1; i <= pdf.numPages; i++) {
//     const page = await pdf.getPage(i);
//     const content = await page.getTextContent();
//     const strings = content.items.map((item) => item.str);
//     fullText += strings.join(" ") + "\n";
//   }
//   return fullText;
// }

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSocialStudiesJson({
  topic,
  gradeLevel,
  examplePdfPath,
}) {
  const exampleText = await fs.readFile(examplePdfPath, "utf-8");
  const MAX_RETRIES = 3;

  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const prompt = `
You are a Social Studies curriculum designer specializing in STAAR-style comprehension worksheets for Grades ${gradeLevel}.  
Your task is to generate structured, standards-aligned content in valid JSON format for the topic: **${topic}**.
### Example Worksheet (for tone, formatting, and voice):
"""${exampleText}"""
---

### Worksheet Structure

Each worksheet must include the following five components:

---

#### 1. Concept Introduction
- Define the Social Studies concept clearly (e.g., causes of the American Revolution, civic responsibility, geography terms).
- Use **4–5 age-appropriate sentences**.
- Include **1 brief example** to illustrate the concept (e.g., “Paying taxes is one way citizens contribute to society.”).

---

#### 2. Interactive Concept Reinforcement Activity
Choose ONE of the following formats to reinforce the concept:
- "fill-in-the-blank" : Fill-in-the-blank with word bank with exactly 5 words and 5 sentences
- "cloze-paragraph"  : Cloze paragraph with exactly 5 sentences
- "timeline_ordering" : Timeline_ordering with exactly 5 events
- "question" : Question: Reflection question

Each activity must include:
- Clear instructions
- Content formatted per type
- Correct answers listed

---

#### 3. Guided Practice

- **Instructions**: "Read each source and answer the question."
- Include **8 STAAR-style multiple-choice questions** using short historical sources (quotes, tables, maps).
- Each item must include:
  - A source (1–3 sentences or brief data)
  - A question
  - 4 answer choices (A–D)
  - 1 correct answer clearly listed
- Include **at least 1 timeline-based item**.
- Include **1 open-ended question**, e.g., “Explain why the Bill of Rights is important in your own words.”

---

#### 4. Independent Practice
- **Instructions**: "Read the passage and answer the questions below."
- Write a **nonfiction Social Studies passage (450–550 words)** appropriate for Grade ${gradeLevel}.
- Number paragraphs like (1), (2), etc.
- Include **6 multiple-choice questions**.
- Include **1–2 open-ended analysis questions**, such as:
  - "How did this event change American society?"
  - "Explain one cause and one effect from the passage."

---

#### 5. Answer Key
- Include a section listing correct multiple-choice answers.
- Include scoring rubrics for open-ended questions.
- Ensure answers match each question clearly.

---

### Design Requirements
- Align questions to **TEKS-aligned cognitive skills**: cause/effect, inference, chronology, geography, civic analysis.
- Use **authentic historical sources** when possible.
- Ensure **grade-level readability** using age-appropriate vocabulary and sentence structure.
- Do not fabricate historical facts.
- Mix question styles: quote analysis, timeline, geography, document-based, etc.
- Use 4 answer options: A), B), C), D)
- Shuffle timeline events when used.
- For Multiple-choice questions: Use "choices" as an array of objects with "id" and "text" fields (e.g., {"id": "a", "text": "..."})
- Use "answer" as an array of correct "id" values (e.g., ["b"])
- Output must be valid **JSON array**, structured like the example below.

---

### JSON Output Format

Return worksheets as a valid JSON array like:

\`\`\`json
[
  {
    "gradeLevel": "5",
    "topic": "Early American Government",
    "concept": "Founding Documents",
    "concept_introduction": "The U.S. Constitution is a document that explains how our government works. It gives power to three branches: legislative, executive, and judicial.",
    "example": "For example, the President is part of the executive branch and enforces laws.",
    "intro_activity": {
      "type": "fill-in-the-blank",
      "instructions": "Fill in the blanks using words from the word bank.",
      "word_bank": ["Revolution", "Taxes", "Independence"],
      "sentences": [
        "The ___ required colonists to pay for paper goods.",
        "They wanted ___ from British rule.",
        "A _____ was started against British rule."
      ],
      "answers": [
        "Stamp Act",
        "Independence",
        "Revolution"
      ]
    },
    "guided_practice": {
      "instructions": "Read each quote or source and answer the question.",
      "questions": [
        {
          "type": "multiple-choice",
          "source": "We the People of the United States... establish Justice, ensure domestic Tranquility..." — Preamble to the Constitution",
          "question": "What is the purpose of this quote?",
          "choices": [{"id": "a", "text": "To end the war"}, { "id" : "b","text" : "To elect a president"}, {"id": "c", "text": "To create a stronger government."}, {"id": "d", "text": "To change state laws."}],
          "answer": ["c"]
        },
        {
          "type": "multiple-choice",
          "source": "1781 - Articles of Confederation ratified, 1775 - Battles of Lexington and Concord, 1776 - Declaration of Independence",
          "question": "Which event happened second?",
          "choices": [{"id": "a", "text": "To end the war"}, { "id" : "b","text" : "To elect a president"}, {"id": "c", "text": "To create a stronger government."}, {"id": "d", "text": "To change state laws."}],
          "answer": ["c"]
        },
        {
          "type": "open-ended",
          "prompt": "Explain why the Bill of Rights is important to citizens today."
        }
      ]
    },
    "independent_practice": {
      "instructions": "Read the passage and answer the questions below.",
      "story": "(1) After the American Revolution, the United States needed a strong government. (2) In 1787, leaders met in Philadelphia to write the Constitution...",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "What was the main goal of the Constitutional Convention?",
          "choices": [{"id": "a", "text": "To end the war"}, { "id" : "b","text" : "To elect a president"}, {"id": "c", "text": "To create a stronger government."}, {"id": "d", "text": "To change state laws."}],
          "answer": ["c"]
        },
        {
          "type": "open-ended",
          "prompt": "What change did the Constitution bring to the United States government? Use evidence from the passage."
        }
      ]
    },
    "answer_key": {
      "multiple_choice": {
        "guided_practice": ["B", "B"],
        "independent_practice": ["C"]
      },
      "open_ended": {
        "guided_practice": "Rubric: 2 points for identifying a right, 2 points for explaining its importance.",
        "independent_practice": "Rubric: 2 points for identifying a change, 2 points for citing evidence."
      }
    }
  }
]
\`\`\`

---

### Notes
- Do not ask the user for a “concept” — choose one that best fits the topic.
- Only return valid JSON as shown above.
`;

    // - If `{ includeGuidedPractice = false }`, skip section 3 entirely.

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    function cleanJSON(content) {
      return content.replace(/```json|```/g, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanJSON(response.choices[0].message.content));

      // Validate each worksheet before returning
      const isValid = parsed.every((ws) => {
        const questions = ws?.independent_practice?.questions || [];
        const mcCount = questions.filter(
          (q) => q.type === "multiple-choice"
        ).length;
        console.log("count:: ", mcCount);
        return mcCount >= 6;
      });

      if (isValid) {
        return {
          json: parsed.map((ws) => {
            const conceptKey = ws.topic?.replace(/\s+/g, "_") || "Concept";
            const gradeKey = (
              ws.gradeLevel ||
              ws.grade_level ||
              "Unknown"
            ).replace(/\s+/g, "_");
            const key = `${conceptKey}-${gradeKey}.json`;
            return { key };
          }),
          worksheets: parsed,
        };
      } else {
        console.warn(
          `⚠️ Attempt ${attempts + 1}: Not enough MC questions. Retrying...`
        );
      }
    } catch (err) {
      if (err.status === 429) {
        console.error("Rate limit exceeded or quota exhausted.");
      } else if (err.code === "ETIMEDOUT") {
        console.error("The request timed out.");
      } else
        console.error(
          `❌ Attempt ${attempts + 1}: JSON parse failed`,
          err.message
        );
    }
    attempts++;
    await new Promise((res) => setTimeout(res, 300)); // Optional: short delay
  }

  throw new Error(
    "❌ Failed to generate valid worksheet with at least 6 multiple-choice questions after 3 attempts."
  );
}

// - "vocabulary_matching" : Vocabulary_matching with exactly 5 terms
