import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";
import pkg from "pdfjs-dist/legacy/build/pdf.js";

//Extract text from PDF using pdfjs-dist
// async function extractTextFromPDF(examplePdfPath) {
//   const data = new Uint8Array(fs.readFileSync(examplePdfPath));
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

export async function generateGrammarJson({
  type,
  topic,
  concept,
  gradeLevel,
  count,
  examplePdfPath,
  signal,
}) {
  //const exampleText = await extractTextFromPDF(examplePdfPath);
  // Read example text from pre-processed file
  const exampleText = await fs.readFile(examplePdfPath, "utf-8");
  const MAX_RETRIES = 2;
  const perAttemptTimeout = 90000; // 90s per attempt

  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    const prompt = `
You are an elementary teacher assistant.  
You will create new classroom worksheets modeled on the provided example.

### Example Worksheet (for style and structure):
"""${exampleText}"""

---

### Task
Generate **${count} new worksheets** for **Grade ${gradeLevel}** students.  
Topic: **${topic}**  
Concept: **${concept}**

### Requirements for EACH worksheet:
1. **Concept Introduction** 
- Concept
- Brief explanation of the concept (2–3 sentences, age-appropriate). 
- Include 1 clear example.
2. **Guided Practice** 
- "instructions": short instructions for a task (e.g. "Choose the noun or nouns in each sentence below. Each sentence may have more than 1 choice."). 
- "guided_practice": An array of 7-8 practice items. 
- Each item should include: 
* "sentence": the practice sentence. 
* "choices" as an array of 3–4 possible words of objects with "id" and "text" fields (e.g., {"id": "a", "text": "..."})
* "answer": all the possible correct option words from the choices array.
- Include 1 open-ended question with prompt type about the concept (e.g. "Write your own sentence with at least 2 nouns.")
3. **Independent Practice 1** 
- "instructions": short instructions (e.g. "Read the paragraph and choose the best answer to each question. Some questions may have more than 1 answer."). 
- Write a **short story (150–200 words)** that is age-appropriate and should include examples of the concept. 
- **Number (should be in parentheses) each sentence** in the story for easy reference.
4. **Concept Questions** 
- Always Create **6-7 multiple-choice questions** about the concept (e.g. "Which word in sentence 2 is a proper noun?"). 
- Each question must follow this JSON format:

{
  "question": "Which word in sentence 2 is a proper noun?",
  "choices": [
    { "id": "a", "text": "run" },
    { "id": "b", "text": "out" },
    { "id": "c", "text": "school" },
    { "id": "d", "text": "sunny" }
  ],  
  "answer": ["c"]
}
3. **Independent Practice 2** 
- "instructions": short instructions (e.g. "Read the paragraph and choose the best answer to each question. Some questions may have more than 1 answer."). 
- Write a **short story (150–200 words)** that is age-appropriate and should include examples of the concept. 
- **Number (should be in parentheses) each sentence** in the story for easy reference.
4. **Concept Questions** 
- Always Create **6-7 multiple-choice questions** about the concept (e.g. "Which word in sentence 2 is a proper noun?"). 
- Each question must follow this JSON format:

{
  "question": "Which word in sentence 2 is a proper noun?",
  "choices": [
    { "id": "a", "text": "run" },
    { "id": "b", "text": "out" },
    { "id": "c", "text": "school" },
    { "id": "d", "text": "sunny" }
  ],
  "answer": ["c"]
}

- Rules for independent practice choices:
  * There must be 12-14 multiple choice questions and an extra open-ended question.
  * There must always be **exactly 4 multiple answer choices**.  
  * Choices must always be objects with "id" and "text" fields (e.g., {"id": "a", "text": "..."})  
  * The "answer" array must include the full labeled choice(s), e.g. :["B) run"].  
  * Randomize the correct answer position (not always A).  
- Ensure either 1 correct answer OR (if grammar/meaning allows multiple) clearly mark all correct ones.  
- One question must be an **exception question** (e.g. "Which word is NOT a noun?").  
- Include 1 open-ended question (type: "open-ended") about the concept.


5. Answer key

### Notes 
- Maintain **the same structure and tone as the example worksheet**. 
- Do not repeat content from the example. 
- If the worksheet includes any open-ended questions (e.g., "Write your own sentence..."), include them in the JSON as objects with "type": "open-ended" and a "prompt" string. Do not leave these questions only in the text.

Return **valid JSON** in the following structure:

[
  {
    "gradeLevel" :"gradeLevel",
    "topic": "space",
    "concept": "Nouns",
    "concept_introduction" : "...",
    "example": "...",
    "guided_practice": {
    "instructions": "...",
    "questions" : [
        {
        "type": "multiple-choice",
        "sentence": "...",
        "choices": [
          { "id": "a", "text": "run" },
          { "id": "b", "text": "out" },
          { "id": "c", "text": "school" },
          { "id": "d", "text": "sunny" }
        ],
          "answer": ["c"]
        },
        {
        "type": "open-ended",
        "prompt": "Write your own sentence using at least 2 nouns. Check your work with your partner or teacher."
        }
      ]
     },
    "independent_practice": {
      "instructions": "...",
      "story": "...",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "...",
          "choices": [
            { "id": "a", "text": "run" },
            { "id": "b", "text": "out" },
            { "id": "c", "text": "school" },
            { "id": "d", "text": "sunny" }
          ],
          "answer": ["c"]
        },
        {
        "type": "open-ended",
        "prompt": "Write your own sentence using at least 2 nouns."
        }
      ]
    },
     "independent_practice_2": {
      "instructions": "...",
      "story": "...",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "...",
          "choices": [
            { "id": "a", "text": "run" },
            { "id": "b", "text": "out" },
            { "id": "c", "text": "school" },
            { "id": "d", "text": "sunny" }
          ],
          "answer": ["c"]
        },
        {
        "type": "open-ended",
        "prompt": "Write your own sentence using at least 2 nouns."
        }
      ]
    }
  }
]
`;
    const timeoutByType = {
      grammar: 90000,
      socialStudies: 120000,
      reading: 90000,
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

    // try {
    //   console.time("Ai call duration");
    //   const response = await withTimeout(
    //     client.chat.completions.create({
    //       model: "gpt-4o-mini", // or whichever model
    //       messages: [{ role: "user", content: prompt }],
    //       temperature: 0.7,
    //     }),
    //     30000
    //   );
    //   console.timeEnd(" Call Duration:: ");
    // } catch (err) {
    //   console.error("⚠️ AI call failed or timed out:", err.message);
    //   throw err;
    // }

    // const response = await
    //   client.chat.completions.create({
    //   model: "gpt-4o-mini", // or whichever model
    //   messages: [{ role: "user", content: prompt }],
    //   temperature: 0.7,
    // });

    // function cleanJSON(content) {
    //   return content.replace(/```json|```/g, "").trim();
    // }
    console.log(`🕓 Starting AI call (timeout = ${timeout / 1000}s)`);
    const label = `AI call duration ${attempts + 1}`;
    console.time(label);
    try {
      //-----moved call here
      const opts = {};
      if (signal && !signal.aborted) opts.signal = signal; // 👈 only add if active

      const response = await withTimeout(
        client.chat.completions.create(
          {
            model: "gpt-4o-mini", // or whichever model
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          },
          opts
        ),
        timeout
      );
      console.log("✅ AI response received successfully.");

      function cleanJSON(content) {
        return content.replace(/```json|```/g, "").trim();
      }

      //**************************** */
      const parsed = JSON.parse(cleanJSON(response.choices[0].message.content));

      // Validate each worksheet before returning
      const isValid = parsed.every((ws) => {
        const questions = ws?.independent_practice?.questions || [];
        const mcCount = questions.filter(
          (q) => q.type === "multiple-choice"
        ).length;
        return mcCount >= 6;
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
