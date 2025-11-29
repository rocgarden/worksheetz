// lib/zodSchemas.js
import { z } from "zod";

// 🧩 Common shared fields
const topicSchema = z.string().min(1, "Topic is required");
const conceptSchema = z.string().min(1, "Concept is required");
const gradeSchema = z.string().min(1, "Grade level is required");

// 🧠 Main schema for worksheet generation
export const generateJsonSchema = z.object({
  type: z.enum(["reading", "grammar", "socialStudies"]),
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
  type: z.enum(["grammar", "reading", "socialStudies"]), // add more as needed
  worksheetData: z.any(), // or stricter if you know structure
  filename: z.string().min(3, "Filename required"),
  userId: z.string().optional(), // optional for authenticated user
});

// 👤 Schema for saving worksheet JSON to Supabase
export const saveJsonSchema = z.object({
  userId: z.string(),
  filename: z.string(),
  jsonData: z.any(),
  subjectType: z.enum(["reading", "grammar", "socialStudies"]),
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
  // worksheet: z.any(), // or use z.record(...) if you know structure
  worksheet: z
    .object({
      topic: z.string().max(200).optional(),
      gradeLevel: z.string().max(100).optional(),
      questions: z.array(questionSchema).optional(),
      instructions: z.string().max(2000).optional(),
    })
    .passthrough() // 👈 allows extra AI-generated fields you haven’t modeled yet
    .optional(),
  topic: z.string().max(200).optional(), //added max
  gradeLevel: z.string().optional(),
  type: z.enum(["reading", "grammar", "socialStudies"]),
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
    .enum(["reading", "socialStudies", "math", "grammar", "worksheet", "quiz"])
    .optional(),
  worksheetData: worksheetDataSchema.optional(),
  worksheetId: z.union([z.string(), z.number()]).optional(),
});
