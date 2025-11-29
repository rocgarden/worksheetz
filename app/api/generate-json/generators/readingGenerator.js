import OpenAI from "openai";
import fs from "fs/promises";
import { getCachedConcept, setCachedConcept } from "@/libs/redis-cache";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateReadingJson({
  type,
  topic,
  concept,
  gradeLevel,
  count,
  examplePdfPath,
  signal,
}) {
  const exampleText = await fs.readFile(examplePdfPath, "utf-8");
  const MAX_RETRIES = 3;

  // ✅ Check cache first
  const cachedConcept = await getCachedConcept("reading", concept, gradeLevel);
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const prompt = `
You are a reading teacher assistant.  
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
${
  cachedConcept
    ? `Use these EXACT values (do not modify):
     - concept_introduction: "${cachedConcept.introduction}"
     - example: "${cachedConcept.example}"`
    : `- Clearly define the reading concept (e.g., main idea, theme, inference, author's purpose). 
    - concept_introduction: Explain it in **2–3 age-appropriate sentences**.  
     - example: Include 1 simple example demonstrating the concept in action.`
}
2. **Guided Practice**  
- **Instructions**: e.g., "Read the short paragraph and answer the question."
- CRITICAL: You MUST include EXACTLY **5 multiple-choice questions** and **1 open-ended question**.
-  The questions must be relating to the concept**, following **STAAR-style stems**, each item should include:
  - Provide **2–3 short paragraphs** (2–4 sentences each, with numbered lines).  
  - After each paragraph, ask **1 multiple-choice comprehension question** related to the concept.  
  - Each question MUST have EXACTLY 4 answer choices (a, b, c, d).
- Include **1 open-ended question** asking the student to write their own example (e.g., "Write your own paragraph with a clear main idea and 2 supporting details.").

3. **Independent Practice**  
- **Instructions**: "Read the passage and answer the questions below."  
- Write a **short story or nonfiction passage (350–450 words)** appropriate for Grade ${gradeLevel}.  
- **Number each paragraph** for reference (e.g., (1), (2), (3)...).  
- CRITICAL: You MUST include EXACTLY **11 multiple-choice questions** and **1 open-ended question**.
- Multiple-choice questions MUST follow **STAAR-style stems**, such as:
  **For Fiction passages (stories with characters):**
    - "What is the best summary of paragraph X?"
    - "What can the reader infer about the main character?"
    - "Which sentence shows a change in the character's actions?"
    - "What is the main character's problem in this story?"
    - "How does the character feel at the end of the story?"
    
    **For Nonfiction passages (informational text):**
    - "What is the best summary of paragraph X?"
    - "What is the author's purpose for writing this passage?"
    - "Which sentence best supports the main idea?"
    - "According to the passage, what causes [topic]?"
    - "Based on the text, what can the reader conclude about [topic]?"
    - "Which detail from the passage shows [concept]?"
- Each multiple-choice question MUST have EXACTLY 4 answer choices (a, b, c, d).
- Questions MUST relate directly to the actual content you wrote - don't ask about characters if there are none, don't ask about plot if it's informational.
- Include **1 open-ended question** requiring a short written response, like:
    - **Fiction:** "Explain how [character] changed from the beginning to the end. Use evidence from the text."
    - **Nonfiction:** "Explain the main idea of the passage. Use at least two details from the text to support your answer."

4. **Answer Key**  
- Include a section listing the correct multiple-choice answers and expected open-ended answer components.  
- Format the answers clearly and match them to the question index.

---
### CRITICAL REQUIREMENTS (DO NOT SKIP)
- **MATCH QUESTIONS TO GENRE:** If you write fiction, ask about characters/plot. If you write nonfiction, ask about main ideas/facts. NEVER ask about characters in nonfiction or ask about author's purpose in fiction stories.
-Guided Practice: EXACTLY 5 multiple-choice + 1 open-ended = 6 questions total
-Independent Practice: EXACTLY 11 multiple-choice + 1 open-ended = 12 questions total
-Every multiple-choice question MUST have EXACTLY 4 choices (a, b, c, d)
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
    "genre": "nonfiction",
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
          "type": "multiple-choice",
          "paragraph": "...",
          "question": "...",
          "choices": [
            { "id": "a", "text": "..." },
            { "id": "b", "text": "..." },
            { "id": "c", "text": "..." },
            { "id": "d", "text": "..." }
          ],
          "answer": ["a"]
        },
        {
          "type": "multiple-choice",
          "paragraph": "...",
          "question": "...",
          "choices": [
            { "id": "a", "text": "..." },
            { "id": "b", "text": "..." },
            { "id": "c", "text": "..." },
            { "id": "d", "text": "..." }
          ],
          "answer": ["d"]
        },
           {
          "type": "multiple-choice",
          "paragraph": "...",
          "question": "...",
          "choices": [
            { "id": "a", "text": "..." },
            { "id": "b", "text": "..." },
            { "id": "c", "text": "..." },
            { "id": "d", "text": "..." }
          ],
          "answer": ["b"]
        },
          {
          "type": "multiple-choice",
          "paragraph": "...",
          "question": "...",
          "choices": [
            { "id": "a", "text": "..." },
            { "id": "b", "text": "..." },
            { "id": "c", "text": "..." },
            { "id": "d", "text": "..." }
          ],
          "answer": ["b"]
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

Return only valid JSON as shown above. Remember: 5 MC + 1 OE for guided, 11 MC + 1 OE for independent.
`;

    // const response = await client.chat.completions.create({
    //   model: "gpt-4o",
    //   messages: [{ role: "user", content: prompt }],
    //   temperature: 0.7,
    // });

    function cleanJSON(content) {
      return content.replace(/```json|```/g, "").trim();
    }

    const timeoutByType = {
      grammar: 90000,
      socialStudies: 120000,
      reading: 150000,
    };
    async function withTimeout(promise, ms = 60000) {
      return Promise.race([
        promise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("⏰ Timeout")), ms)
        ),
      ]);
    }

    const timeout = timeoutByType[type] || 90000;
    console.log(`🕓 Starting AI call (timeout = ${timeout / 1000}s)`);
    const label = `AI call duration ${attempts + 1}`;
    console.time(label);
    const temp = attempts === 0 ? 0.4 : 0.5 + attempts * 0.1;

    try {
      const opts = {};
      if (signal && !signal.aborted) opts.signal = signal; // 👈 only add if active

      const response = await withTimeout(
        client.chat.completions.create(
          {
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            temperature: temp,
          },
          opts
        ),
        timeout
      );

      const parsed = JSON.parse(cleanJSON(response.choices[0].message.content));
      // ✅ Cache the generated intro if we didn't have one
      if (!cachedConcept && parsed[0]?.concept_introduction) {
        await setCachedConcept(
          "reading",
          parsed[0].concept,
          gradeLevel,
          parsed[0].concept_introduction,
          parsed[0].example
        );
      }
      // Validate each worksheet before returning
      // const isValid = parsed.every((ws) => {
      //   const questions = ws?.independent_practice?.questions || [];
      //   const mcCount = questions.filter(
      //     (q) => q.type === "multiple-choice"
      //   ).length;
      //   return mcCount >= 10;
      // });
      // ✅ STRICT VALIDATION - checks BOTH guided and independent
      const isValid = parsed.every((ws) => {
        const guidedQuestions = ws?.guided_practice?.questions || [];
        const independentQuestions = ws?.independent_practice?.questions || [];

        const guidedMC = guidedQuestions.filter(
          (q) => q.type === "multiple-choice"
        ).length;
        const guidedOE = guidedQuestions.filter(
          (q) => q.type === "open-ended"
        ).length;

        const independentMC = independentQuestions.filter(
          (q) => q.type === "multiple-choice"
        ).length;
        const independentOE = independentQuestions.filter(
          (q) => q.type === "open-ended"
        ).length;

        // Check all MC questions have exactly 4 choices
        const allQuestionsHave4Choices = [
          ...guidedQuestions.filter((q) => q.type === "multiple-choice"),
          ...independentQuestions.filter((q) => q.type === "multiple-choice"),
        ].every((q) => q.choices?.length === 4);

        const isGuidedValid = guidedMC === 5 && guidedOE === 1;
        const isIndependentValid = independentMC === 11 && independentOE === 1;

        if (!isGuidedValid) {
          console.warn(
            `⚠️ Guided practice invalid: ${guidedMC} MC, ${guidedOE} OE (need 5 MC + 1 OE)`
          );
        }
        if (!isIndependentValid) {
          console.warn(
            `⚠️ Independent practice invalid: ${independentMC} MC, ${independentOE} OE (need 11 MC + 1 OE)`
          );
        }
        if (!allQuestionsHave4Choices) {
          console.warn(`⚠️ Some MC questions don't have exactly 4 choices`);
        }

        return isGuidedValid && isIndependentValid && allQuestionsHave4Choices;
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
            const timestamp = Date.now(); // ← Add this
            const key = `${conceptKey}-${gradeKey}-${timestamp}.json`; // ← Add timestamp
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
      console.timeEnd(label);
      if (err.name === "AbortError") {
        console.warn("🛑 AI generation aborted by user.");
        throw err; // rethrow to let route handle cleanly
      }
      console.error(
        `❌ Attempt ${attempts + 1}: JSON parse failed`,
        err.message
      );
    }
    attempts++;
    // await new Promise((res) => setTimeout(res, 300)); // Optional: short delay
  }

  throw new Error(
    "❌ Failed to generate valid worksheet with at least 10 multiple-choice questions after 2 attempts."
  );
}
