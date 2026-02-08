//app/api/generate-json/generators/grammarGenerator.js
import OpenAI from "openai";
import fs from "fs/promises";
import { getCachedConcept, setCachedConcept } from "@/libs/redis-cache";

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
  // Read example text from pre-processed file
  const exampleText = await fs.readFile(examplePdfPath, "utf-8");
  const MAX_RETRIES = 2;
  const perAttemptTimeout = 90000; // 90s per attempt
  // ✅ Check cache first
  const cachedConcept = await getCachedConcept("grammar", concept, gradeLevel);

  let attempts = 0;


  function countMC(arr = []) {
  return arr.filter((q) => q?.type === "multiple-choice").length;
}

function hasOpenEnded(arr = []) {
  return arr.some(
    (q) => q?.type === "open-ended" && typeof q?.prompt === "string"
  );
}

function validChoices(q) {
  return (
    Array.isArray(q?.choices) &&
    q.choices.length === 4 &&
    q.choices.every((c) => c?.id && typeof c?.text === "string")
  );
}

function validAnswerIds(q) {
  return (
    Array.isArray(q?.answer) &&
    q.answer.length >= 1 &&
    q.answer.every((id) => typeof id === "string")
  );
}

function validateWorksheet(ws) {
  // Guided practice
  const gp = ws?.guided_practice?.questions || [];
  if (countMC(gp) < 7) return false;
  if (!hasOpenEnded(gp)) return false;
  if (!gp.filter((q) => q.type === "multiple-choice").every(validChoices)) return false;
  if (!gp.filter((q) => q.type === "multiple-choice").every(validAnswerIds)) return false;

  // Independent practice 1
  const ip1 = ws?.independent_practice?.questions || [];
  if (countMC(ip1) < 6) return false;
  if (!hasOpenEnded(ip1)) return false;

  // Independent practice 2
  const ip2 = ws?.independent_practice_2?.questions || [];
  if (countMC(ip2) < 6) return false;
  if (!hasOpenEnded(ip2)) return false;

  return true;
}

function guidedPracticeNeedsRepair(ws) {
  const gp = ws?.guided_practice?.questions || [];
  const mcCount = gp.filter((q) => q?.type === "multiple-choice").length;
  const hasOE = gp.some((q) => q?.type === "open-ended" && typeof q?.prompt === "string");
  return mcCount < 7 || !hasOE;
}

async function repairGuidedPractice({
  client,
  worksheetArray, // parsed (the full array)
  timeout,
  signal,
  type,
}) {
  const repairPrompt = `
You will be given a JSON array of worksheets for an elementary classroom.

TASK:
- ONLY fix and fill in guided_practice.questions for each worksheet.
- guided_practice.questions must contain:
  - 7–8 "multiple-choice" items
  - 1 "open-ended" item
- Each multiple-choice item must include:
  - "type": "multiple-choice"
  - "sentence": string
  - "choices": exactly 4 objects { "id": "a"|"b"|"c"|"d", "text": string }
  - "answer": array of correct choice ids (e.g. ["b"])
- The open-ended item must include:
  - "type": "open-ended"
  - "prompt": string

CRITICAL:
- Do not change any other fields (concept_introduction, example, independent_practice, independent_practice_2, topic, concept, gradeLevel).
- Return valid JSON only (no markdown fences).

INPUT JSON:
${JSON.stringify(worksheetArray)}
`;

  const opts = {};
  if (signal && !signal.aborted) opts.signal = signal;

  const response = await client.chat.completions.create(
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: repairPrompt }],
      temperature: 0.2, // low temp for “surgery”
    },
    opts
  );

  const content = response.choices[0].message.content;
  const cleaned = content.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

  while (attempts < MAX_RETRIES) {
      let didRepairThisAttempt = false;

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
${
  cachedConcept
    ? `Use these EXACT values for the concept introduction (do not modify):
     - Explanation: "${cachedConcept.introduction}"
     - Example: "${cachedConcept.example}"`
    : `- Concept: ${concept}
     - Brief explanation of the concept (2–3 sentences, age-appropriate). 
     - Include 1 clear example.`
}
2. **Guided Practice**
- "instructions": short instructions for the task.
- "questions": MUST be an array with 8–9 items total:
  - 7–8 items of type "multiple-choice"
  - 1 item of type "open-ended"
- For EACH multiple-choice item, include:
  - "type": "multiple-choice"
  - "sentence": the practice sentence
  - "choices": exactly 4 objects with "id" and "text"
  - "answer": an array of correct choice ids (e.g. ["a"] or ["a","c"])
- Include exactly 1 open-ended item with:
  - "type": "open-ended"
  - "prompt": "..."
### Concept-Specific Error Rules (use ONLY these)
The selected concept is "${concept}". Use the matching rule:

- Nouns:
  Create an error involving nouns (choose ONE):
  (a) plural vs singular noun form error ("two dog" instead of "two dogs")
  (b) common vs proper noun capitalization error ONLY if NOT testing punctuation (avoid unless grade >= 3)
  (c) wrong noun used (thing vs person) is NOT allowed (too subjective)
  NOTE: keep punctuation correct.

- Verbs:
  Create an error involving verbs (choose ONE):
  (a) wrong verb tense ("Yesterday I walk" instead of "walked")
  (b) wrong verb form ("is run" instead of "is running")
  Avoid advanced irregulars for grade 2 unless grade >= 3.

- Adjectives:
  Create an error involving adjectives (choose ONE):
  (a) use an adverb where an adjective should be ("She feels happily" instead of "happy")
  (b) comparative/superlative mistake ("more taller" instead of "taller") (grade >= 3)
  Keep the sentence meaning clear.

- Adverbs:
  Create an error involving adverbs (choose ONE):
  (a) use an adjective where an adverb should be ("He ran quick" instead of "quickly")
  (b) wrong adverb placement that changes meaning is NOT allowed (too tricky)

- Pronouns:
  Create an error involving pronouns (choose ONE):
  (a) wrong pronoun case ("Me and Ana went" instead of "Ana and I went")
  (b) pronoun-antecedent agreement ("Each student did their work" → for older grades only; avoid grade 2)
  (c) wrong possessive ("Its" vs "It's") ONLY if grade >= 4

- Prepositions:
  Create an error involving prepositions (choose ONE):
  (a) incorrect preposition choice in a simple, obvious context ("on the bed" vs "in the bed" can be ambiguous—avoid)
  Better: spatial like "under/over/between/behind" with clear picture-like meaning.
  (b) missing preposition ("She went __ the store") is allowed if clear ("to")

- Conjunctions:
  Create an error involving conjunctions (choose ONE):
  (a) missing conjunction in a compound sentence
  (b) wrong conjunction choice that breaks logic ("I wanted to go, but I was excited" should be "and")—keep it very obvious

- Sentence Structure:
  Create a sentence structure error (choose ONE):
  (a) fragment (missing subject or verb)
  (b) run-on (two independent clauses joined without punctuation/conjunction)
  Keep it simple and age-appropriate.

- Subject-Verb Agreement:
  Create exactly one SVA error ("The dogs runs" instead of "run" OR "She run" instead of "runs").

- Punctuation:
  Create exactly one punctuation error (choose ONE):
  (a) missing end punctuation (period/question mark)
  (b) missing comma in a simple list (grade >= 3)
  (c) missing quotation marks around spoken dialogue
  Do not change spelling/capitalization unless it is part of punctuation rules.

- Custom...:
  If concept is "Custom...", follow the user's custom concept text exactly (if provided elsewhere).
  If no custom concept text exists, default to "Subject-Verb Agreement".

3. **Independent Practice 1 (Sentence Correction)**
- "instructions": short instructions (e.g. "Each sentence below has ONE mistake. Choose the best correction.").
- For "story": DO NOT write a 150–200 word story.
  Instead, write exactly 6–7 standalone sentences, each on its own line, numbered in parentheses (1), (2), etc.
  Each sentence must be grade-appropriate for Grade ${gradeLevel} and related to Topic: ${topic}.
  CRITICAL:
  - Each sentence must contain EXACTLY ONE grammar error that matches the selected skill: "${concept}".
  - Do not include any other errors (spelling, punctuation, capitalization) unless the selected skill is that category.
  - Do not include more than one error in any single sentence.

4. **Independent Practice 1 Questions (Correction Questions)**
- Create exactly 6–7 multiple-choice questions.
- Each question must correspond 1-to-1 with a sentence in the "story".
- Each question must reference the sentence number (e.g., "What change should be made to sentence 3?").
- Each question must have exactly 4 choices (a–d).
- Exactly ONE choice is correct.
- Choices should be corrections (best practice: choices are full corrected versions of the sentence, or specific word/phrase replacements).
- The "answer" must be the correct choice id only, e.g. ["b"].
- Add 1 open-ended question object at the end (type: "open-ended") asking the student to write their own sentence using the skill.


5. **Independent Practice 2 (Sentence Correction)**
- "instructions": short instructions (e.g. "Each sentence below has ONE mistake. Choose the best correction.").
- For "story": DO NOT write a 150–200 word story.
  Instead, write exactly 6–7 standalone sentences, each on its own line, numbered in parentheses (1), (2), etc.
  Each sentence must be grade-appropriate for Grade ${gradeLevel} and related to Topic: ${topic}.
  CRITICAL:
  - Each sentence must contain EXACTLY ONE grammar error that matches the selected skill: "${concept}".
  - Do not include any other errors (spelling, punctuation, capitalization) unless the selected skill is that category.
  - Do not include more than one error in any single sentence.

6. **Independent Practice 2 Questions (Correction Questions)**
- Create exactly 6–7 multiple-choice questions.
- Each question must correspond 1-to-1 with a sentence in the "story".
- Each question must reference the sentence number (e.g., "What change should be made to sentence 3?").
- Each question must have exactly 4 choices (a–d).
- Exactly ONE choice is correct.
- Choices should be corrections (best practice: choices are full corrected versions of the sentence, or specific word/phrase replacements).
- The "answer" must be the correct choice id only, e.g. ["b"].
- Add 1 open-ended question object at the end (type: "open-ended") asking the student to write their own sentence using the skill.


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
      "story": "(1) She walk to school yesterday.\n(2) ...",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "What change should be made to sentence 1?",
          "choices": [
        {"id":"a","text":"She walks to school yesterday."},
        {"id":"b","text":"She walked to school yesterday."},
        {"id":"c","text":"She walking to school yesterday."},
        {"id":"d","text":"She walk to school tomorrow."}
          ],
          "answer": ["b"]
        },
        {
        "type": "open-ended",
      "prompt": "Write your own sentence that uses ${concept} correctly."
        }
      ]
    },
     "independent_practice_2": {
      "instructions": "...",
      "story": "(1) She walk to school yesterday.\n(2) ...",
      "questions": [
        {
          "type": "multiple-choice",
          "question": "What change should be made to sentence 1?",
          "choices": [
        {"id":"a","text":"She walks to school yesterday."},
        {"id":"b","text":"She walked to school yesterday."},
        {"id":"c","text":"She walking to school yesterday."},
        {"id":"d","text":"She walk to school tomorrow."}
          ],
          "answer": ["b"]
        },
        {
        "type": "open-ended",
       "prompt": "Write your own sentence that uses ${concept} correctly."
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

      function cleanJSON(content) {
        return content.replace(/```json|```/g, "").trim();
      }
          const temp = attempts === 0 ? 0.4 : 0.5 + attempts * 0.1;


    console.log(`🕓 Starting AI call (timeout = ${timeout / 1000}s)`);
    const label = `AI call attempt=${attempts + 1} ts=${Date.now()}`;
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
            temperature: temp,
          },
          opts
        ),
        timeout
      );
      console.log("✅ AI response received successfully.");

    

      //**************************** */
      const parsed = JSON.parse(cleanJSON(response.choices[0].message.content));

      // Validate each worksheet before returning
      const isValid = parsed.every(validateWorksheet);

      if (isValid) {
        // ✅ Cache the concept intro if we didn't have one
        if (
          !cachedConcept &&
          parsed[0]?.concept_introduction &&
          parsed[0]?.example
        ) {
          await setCachedConcept(
            "grammar",
            parsed[0].concept,
            gradeLevel,
            parsed[0].concept_introduction,
            parsed[0].example
          );
        }
      // Validate each worksheet before returning
        return {
          json: parsed.map((ws) => {
            const conceptKey = ws.concept?.replace(/\s+/g, "_") || "Concept";
            const gradeKey = (ws.gradeLevel || ws.grade_level || "Unknown").replace(/\s+/g, "_");
            const timestamp = Date.now();
            const key = `${conceptKey}-${gradeKey}-${timestamp}.json`;
            return { key };
          }),
          worksheets: parsed,
        };
        }

          // ❌ invalid: try repair (guided practice only)
          console.warn("❌ Worksheet failed validation. Attempting repair...");

          const needsGPRepair = parsed.some(guidedPracticeNeedsRepair);

          if (needsGPRepair && !didRepairThisAttempt) {
            didRepairThisAttempt = true;
            console.warn(`🩹 Attempt ${attempts + 1}: Guided practice invalid. Trying repair pass...`);

            try {
              const repaired = await withTimeout(
                repairGuidedPractice({
                  client,
                  worksheetArray: parsed,
                  timeout,
                  signal,
                  type,
                }),
                timeout
              );

              const repairedValid = repaired.every(validateWorksheet);

              if (repairedValid) {
                console.log("✅ Repair pass succeeded.");

                if (!cachedConcept && repaired[0]?.concept_introduction && repaired[0]?.example) {
                  await setCachedConcept(
                    "grammar",
                    repaired[0].concept,
                    gradeLevel,
                    repaired[0].concept_introduction,
                    repaired[0].example
                  );
                }

                return {
                  json: repaired.map((ws) => {
                    const conceptKey = ws.concept?.replace(/\s+/g, "_") || "Concept";
                    const gradeKey = (ws.gradeLevel || ws.grade_level || "Unknown").replace(/\s+/g, "_");
                    const timestamp = Date.now();
                    const key = `${conceptKey}-${gradeKey}-${timestamp}.json`;
                    return { key };
                  }),
                  worksheets: repaired,
                };
              }

              console.warn("⚠️ Repair output still failed validation. Will retry full generation...");
            } catch (e) {
              console.warn("⚠️ Repair pass failed:", e.message);
            }
        }

      // If we get here, repair didn't happen or didn't work → retry loop continues
         console.warn(`⚠️ Attempt ${attempts + 1}: Validation failed. Retrying full generation...`);
          } catch (err) {
            if (err.name === "AbortError") throw err;
             console.error(`❌ Attempt ${attempts + 1}: failed`, err.message);
          }finally{
            console.timeEnd(label);
          }
          attempts++;
          // await new Promise((res) => setTimeout(res, 300)); // Optional: short delay
        }

  throw new Error(
    "❌ Failed to generate valid worksheet with at least 10 multiple-choice questions after 2 attempts."
  );
}
