// lib/zodSchemas.js
import { z } from "zod";

// 🧩 Common shared fields
const topicSchema = z.string().min(1, "Topic is required");
const conceptSchema = z.string().min(1, "Concept is required");
const gradeSchema = z.string().min(1, "Grade level is required");

// 🧠 Main schema for worksheet generation
export const generateJsonSchema = z.object({
  type: z.enum(["reading", "grammar", "socialStudies", "staarReading"]),
  topic: topicSchema,
  concept: conceptSchema,
  gradeLevel: gradeSchema,
  count: z.number().int().positive().max(10),
});

// 📰 Schema for reading-specific generator
export const readingGeneratorSchema = z.object({
  topic: topicSchema,
  concept: conceptSchema,
  gradeLevel: gradeSchema,
  count: z.number().int().positive(),
});

// ✏️ Grammar-specific generator
export const grammarGeneratorSchema = z.object({
  topic: topicSchema,
  concept: conceptSchema,
  gradeLevel: gradeSchema,
  count: z.number().int().positive(),
});

// 🗺️ Social studies generator
export const socialStudiesGeneratorSchema = z.object({
  topic: topicSchema,
  // concept: conceptSchema,
  gradeLevel: gradeSchema,
  count: z.number().int().positive(),
});

// 🧾 PDF creation schema
export const createPdfSchema = z.object({
  type: z.enum(["grammar", "reading", "socialStudies", "staarReading"]), // add more as needed
  worksheetData: z.any(), // or stricter if you know structure
  filename: z.string().min(3, "Filename required"),
  userId: z.string().optional(), // optional for authenticated user
});

// 👤 Schema for saving worksheet JSON to Supabase
export const saveJsonSchema = z.object({
  userId: z.string(),
  filename: z.string(),
  jsonData: z.any(),
  subjectType: z.enum(["reading", "grammar", "socialStudies", "staarReading"]),
  createdAt: z.date().optional(),
});

// 📊 Schema for tracking usage limits (for subscribers)
export const userUsageSchema = z.object({
  userId: z.string(),
  month: z.string(), // e.g. "2025-10"
  jsonGenerations: z.number().int().nonnegative(),
  pdfDownloads: z.number().int().nonnegative(),
  limitReached: z.boolean().default(false),
});

// 🧩 Common nested question shapes (optional fields, safe to evolve)
const questionSchema = z.object({
  type: z.string().optional(),
  paragraph: z.string().max(2000).optional(),
  question: z.string().max(1000).optional(),
  prompt: z.string().max(1000).optional(),
  choices: z.array(z.string().max(300)).optional(),
  answer: z
    .union([z.string().max(500), z.array(z.string().max(300))])
    .optional(),
});

// ✅ Save Worksheet Schema
export const saveWorksheetSchema = z.object({
  userId: z.string(),
  fileName: z.string().min(1, "File name is required").max(200), //added max
  worksheet: z.any(), // or use z.record(...) if you know structure
  // worksheet: z
  //   .object({
  //     topic: z.string().max(200).optional(),
  //     gradeLevel: z.string().max(100).optional(),
  //     questions: z.array(questionSchema).optional(),
  //     instructions: z.string().max(2000).optional(),
  //   })
  //   .passthrough() // 👈 allows extra AI-generated fields you haven’t modeled yet
  //   .optional(),
  topic: z.string().max(200).optional(), //added max
  gradeLevel: z.string().optional(),
  type: z.enum(["reading", "grammar", "socialStudies", "staarReading"]),
});

// Common nested question shapes
// const questionSchema = z.object({
//   type: z.string().optional(),
//   paragraph: z.string().optional(),
//   question: z.string().optional(),
//   prompt: z.string().optional(),
//   choices: z.array(z.string()).optional(),
//   answer: z.union([z.string(), z.array(z.string())]).optional(),
// });

const practiceSchema = z.object({
  instructions: z.string().optional(),
  story: z.string().optional(),
  questions: z.array(questionSchema).optional(),
});
// The main worksheet data shape
const worksheetDataSchema = z.object({
  concept: z.string().optional(),
  concept_introduction: z.string().optional(),
  example: z.string().optional(),
  guided_practice: practiceSchema.optional(),
  independent_practice: practiceSchema.optional(),
});

// ✅ The schema used in /api/generate-pdf
export const generatePdfSchema = z.object({
  fileName: z.string().min(1, "Filename is required"),
  type: z
    .enum(["reading", "socialStudies", "math", "grammar", "worksheet", "quiz", "staarReading"])
    .optional(),
  worksheetData: worksheetDataSchema.optional(),
  worksheetId: z.union([z.string(), z.number()]).optional(),
});
const choiceSchema = z.object({
  id: z.string().min(1),   // "a" "b" "c" "d"
  text: z.string().min(1),
});

// Keep passage simple + add optional "lines" for choose-a-line
const passageSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(50),
  // for later interactive: you can store an array of line strings
  lines: z.array(z.string().min(1)).min(6).optional(),
});

const teksArraySchema = z.preprocess((val) => {
  if (Array.isArray(val)) return val;

  if (typeof val === "string") {
    // allow "4.6G" or "4.6G,4.9D"
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return val;
}, z.array(z.string().min(1)).min(1));

const baseQuestionSchema = z.object({
  id: z.string().min(1),
  teks: teksArraySchema,
});

const staarMcSingleSchema = baseQuestionSchema.extend({
  type: z.literal("multiple-choice"),
  question: z.string().min(1),
  choices: z.array(choiceSchema).length(4),
  answer: z.array(z.string().min(1)).length(1), // ["b"]
});

const staarMcMultiSchema = baseQuestionSchema.extend({
  type: z.literal("multi-select"),
  question: z.string().min(1),
  choices: z.array(choiceSchema).length(4),
  answer: z.array(z.string().min(1)).min(2).max(2), // ["a","c"]
});

const staarChooseALineSchema = baseQuestionSchema.extend({
  type: z.literal("choose-a-line"),
  question: z.string().min(1),
  // answer references either a lineIndex or the exact line text
  answer: z.object({
    lineIndex: z.number().int().nonnegative().optional(),
    lineText: z.string().min(1).optional(),
  }).refine((v) => v.lineIndex !== undefined || !!v.lineText, {
    message: "choose-a-line answer must include lineIndex or lineText",
  }),
});

const staarScrSchema = baseQuestionSchema.extend({
  type: z.literal("scr"),
  prompt: z.string().min(1),
  rubric: z.object({
    maxPoints: z.number().int().min(1).max(4).default(2),
    anchors: z.array(
      z.object({
        points: z.number().int().min(0).max(4),
        description: z.string().min(1),
      })
    ).min(2),
  }),
  sampleAnswer: z.string().min(1).optional(),
});

export const staarReadingQuestionSchema = z.discriminatedUnion("type", [
  staarMcSingleSchema,
  staarMcMultiSchema,
  staarChooseALineSchema,
  staarScrSchema,
]);

export const staarReadingWorksheetSchema = z.object({
  type: z.literal("staarReading"),
  gradeLevel: z.enum(["3", "4", "5", "6", "7", "8"]),
  genre: z.enum(["nonfiction", "fiction", "poetry"]).default("nonfiction"),
  topic: z.string().min(1),
  passage: passageSchema,
  // 8 objective items + 1 SCR = 9 total
  questions: z.array(staarReadingQuestionSchema).length(9),
});


//export const staarReadingGeneratorSchema = z.array(staarReadingWorksheetSchema).min(1).max(3);

export const staarReadingGenerateRequestSchema = z.object({
  topic: z.string().min(2).max(200),
  gradeLevel: z.enum(["3", "4", "5", "6", "7,", "8"]),
  count: z.number().int().min(1).max(1).default(1), // keep 1 for STAAR
  type: z.literal("staarReading"),
  genre: z.enum(["nonfiction", "fiction"]).default("nonfiction")
});
//export const staarReadingGenerateResponseSchema = staarReadingWorksheetSchema;
export const staarReadingGenerateResponseSchema = z
  .array(staarReadingWorksheetSchema)
  .min(1)
  .max(1);
