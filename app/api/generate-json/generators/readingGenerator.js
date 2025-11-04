import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import pkg from "pdfjs-dist/legacy/build/pdf.js";
//import { uploadJSONToS3 } from './utils/s3Client.js';

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

export async function generateReadingJson({
  topic,
  concept,
  gradeLevel,
  count,
  examplePdfPath,
}) {
  const exampleText = await fs.readFile(examplePdfPath, "utf-8");
  const MAX_RETRIES = 3;

  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const prompt = `
You are an elementary reading teacher assistant.  
You will create reading comprehension worksheets based on the provided example and structure.

### Example Worksheet (for tone, formatting, and voice):
"""${exampleText}"""

---

### Task
Generate **${count} new reading comprehension worksheets** for **Grade ${gradeLevel}** students.  
Topic: **${topic}**  
Focus Concept: **${concept}**

---

### Requirements for EACH worksheet:

1. **Concept Introduction**  
- Clearly define the reading concept (e.g., main idea, theme, inference, author’s purpose).  
- Explain it in **2–3 age-appropriate sentences**.  
- Include **1 simple example** demonstrating the concept in action.

2. **Guided Practice**  
- **Instructions**: e.g., "Read the short paragraph and answer the question."
- Include **7-9 multiple-choice questions that must be relating to the concept**, following **STAAR-style stems**, each item should include:
  - Provide **2–3 short paragraphs** (2–4 sentences each, with numbered lines).  
  - After each paragraph, ask **1 multiple-choice comprehension question** related to the concept.  
- Include **1 open-ended question** asking the student to write their own example (e.g., "Write your own paragraph with a clear main idea and 2 supporting details.").

3. **Independent Practice**  
- **Instructions**: "Read the passage and answer the questions below."  
- Write a **short story or nonfiction passage (350–450 words)** appropriate for Grade ${gradeLevel}.  
- **Number each paragraph** for reference (e.g., (1), (2), (3)...).  
- Include **12-15 multiple-choice questions relating to the concept**, following **STAAR-style stems**, such as:
  - "What is the best summary of paragraph 2?"
  - "What is the author’s purpose for writing this passage?"
  - "What can the reader infer about the main character?"
  - "Which sentence best supports the theme?"
  - "Which sentence shows a change in the character's actions?"
- Include **1 open-ended question** requiring a short written response, like:
  - "Explain how the main character changed in the story. Use evidence from the text."

4. **Answer Key**  
- Include a section listing the correct multiple-choice answers and expected open-ended answer components.  
- Format the answers clearly and match them to the question index.

---
### Notes  
-Do not repeat any content from the example.
-Questions should follow the structure and tone of standardized reading comprehension tests.
-Ensure the JSON is clean, valid, and machine-readable.
-For multiple-choice questions:
 - Use "choices" as an array of objects with "id" and "text" fields (e.g., {"id": "a", "text": "..."})
 - Use "answer" as an array of correct "id" values (e.g., ["b"])
-Each question must have the correct answer(s) specified in a list (even if only one correct).

### Formatting and JSON Output

Return the worksheets as a **valid JSON array**.  
Each worksheet must match this structure:

\`\`\`json
[
  {
    "gradeLevel": "4",
    "topic": "Reading Comprehension",
    "concept": "Main Idea and Supporting Details",
    "concept_introduction": "...",
    "example": "...",
    "guided_practice": {
      "instructions": "...",
      "questions": [
        {
          "type": "multiple-choice",
          "paragraph": "(1) The rain poured down all morning. (2) Finally, the sun came out in the afternoon.",
          "question": "What is the main idea of the paragraph?",
          "choices": [
            { "id": "a", "text": "It rained." },
            { "id": "b", "text": "The sun came out." },
            { "id": "c", "text": "The weather changed." },
            { "id": "d", "text": "It was sunny." }
          ],
          "answer": ["c"]
        },
        {
          "type": "open-ended",
          "prompt": "Write your own paragraph that has a clear main idea and at least 2 supporting details."
        }
      ]
    },
    "independent_practice": {
      "instructions": "Read the passage and answer the following questions.",
      "story": "(1) Maya stood at the edge of the stage, her hands shaking. (2) It was her first time performing...",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "What is the best summary of paragraph 1?",
          "choices": [
            { "id": "a", "text": "Maya stood quietly." },
            { "id": "b", "text": "Maya was excited." },
            { "id": "c", "text": "Maya was nervous before performing." },
            { "id": "d", "text": "Maya liked the stage." }
          ],
          "answer": ["c"]
        },
        {
          "type": "open-ended",
          "prompt": "Explain how Maya changed from the beginning to the end of the passage. Use evidence from the text."
        }
      ]
    }
  }
]
  \`\`\`

Return only valid JSON as shown above.
`;

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
        return mcCount >= 10;
      });

      if (isValid) {
        return {
          json: parsed.map((ws) => {
            const conceptKey = ws.concept?.replace(/\s+/g, "_") || "Concept";
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
      console.error(
        `❌ Attempt ${attempts + 1}: JSON parse failed`,
        err.message
      );
    }
    attempts++;
    await new Promise((res) => setTimeout(res, 300)); // Optional: short delay
  }

  throw new Error(
    "❌ Failed to generate valid worksheet with at least 10 multiple-choice questions after 3 attempts."
  );
}
