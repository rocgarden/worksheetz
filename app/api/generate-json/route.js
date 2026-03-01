//app/api/generate-json/route.js
export const runtime = "nodejs";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateGrammarJson } from "./generators/grammarGenerator";
import { generateReadingJson } from "./generators/readingGenerator";
import { generateSocialStudiesJson } from "./generators/socialStudiesGenerator";
import { generateStaarReadingJson } from "./generators/staarReadingGenerator";
import { getUserMonthlyUsage } from "@/libs/usage";
import { generateJsonSchema, staarReadingWorksheetSchema } from "@/libs/zodSchemas";
import { socialStudiesGeneratorSchema } from "@/libs/zodSchemas";
import { readingGeneratorSchema } from "@/libs/zodSchemas";
import { grammarGeneratorSchema } from "@/libs/zodSchemas";
import { staarReadingGenerateRequestSchema} from "@/libs/zodSchemas";
import { getPlanByPriceId } from "@/libs/planutils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const examplePdfMap = {
  reading: path.resolve(
    process.cwd(),
    "pdfExamples/processed/readingExample.txt"
  ),
  grammar: path.resolve(
    process.cwd(),
    "pdfExamples/processed/Nounsexample.txt"
  ),
  socialStudies: path.resolve(
    process.cwd(),
    "pdfExamples/processed/socialStudiesExample.txt"
  ), // 👈 use correct file
  staarReading: path.resolve(
    process.cwd(),
    "pdfExamples/processed/staarReadingExample.txt"
  ),

};

const generatorMap = {
  grammar: generateGrammarJson,
  reading: generateReadingJson,
  socialStudies: generateSocialStudiesJson,
  staarReading: generateStaarReadingJson,
  // writing: generateWritingJson,
  // etc.
};

const schemaMap = {
  grammar: grammarGeneratorSchema,
  reading: readingGeneratorSchema,
  socialStudies: socialStudiesGeneratorSchema,
  staarReading: staarReadingGenerateRequestSchema
};

export async function POST(req) {
  const signal = req.signal; // combine both

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const type = body?.type;
  //validate schema
  const schema = schemaMap[type];
  if (!schema) {
    return NextResponse.json(
      { error: "Unsupported worksheet type" },
      { status: 400 }
    );
  }
console.log("Body received:", body);

  //const result = schema.safeParse(payload);
    const result = schema.safeParse(body);

  if (!result.success) {
        console.log("❌ generate-json invalid input:", result.error.flatten());
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 }
    );
  }
  const payload = result.data;

  //const validated = generateJsonSchema.parse(body);

  const validated = result.data;
  const { topic, gradeLevel, count, genre } = validated;
  const concept = payload.concept ?? "";
  //verify generator and example paths
  const generatorFn = generatorMap[type];
  let examplePdfPath = examplePdfMap[type];

  if (type === "reading") {
    examplePdfPath =
      genre === "fiction"
        ? path.resolve(process.cwd(), "pdfExamples/processed/readingExample_nonfiction.txt")
        : path.resolve(process.cwd(), "pdfExamples/processed/readingExample_nonfiction.txt");
  }
  console.log("Resolved path:", examplePdfPath);
  console.log("Exists:", fs.existsSync(examplePdfPath));

  if (!generatorFn || !fs.existsSync(examplePdfPath)) {
    return NextResponse.json(
      { error: "Invalid type or missing PDF" },
      { status: 400 }
    );
  }
  // ✅ Get the user's plan from 'profiles'
  const { data: profile } = await supabase
    .from("profiles")
    .select("price_id")
    .eq("id", user.id)
    .single();

  // const plan = profile?.price_id || "free";
  const planInfo = getPlanByPriceId(profile?.price_id || "free");
  //get usage and bonus
  // 🧮 Bonus logic:
  // - planLimit: base plan allowance
  // - generationCount: used so far this month
  // - generationBonus: current bonus credits remaining
  // - bonusUsed: how many bonuses already consumed (used past planLimit)
  // - totalAllowed: total lifetime allowance = plan + all bonuses ever granted
  const usage = await getUserMonthlyUsage(
    supabase,
    "ai_generations",
    user.id,
    planInfo
  );
  const planLimit = planInfo.monthlyGenerations;
  const generationCount = usage.generationCount || 0;
  const generationBonus = usage.generationBonus || 0;
  const bonusUsed = Math.max(generationCount - planLimit, 0);
  const totalBonusGranted = generationBonus + bonusUsed;
  const totalAllowed = planLimit + totalBonusGranted;

  //const totalAllowed = planLimit + generationBonus;

  // ⚡ Check only if user EXCEEDS total allowance
  if (generationCount >= totalAllowed) {
    return NextResponse.json(
      { error: "You’ve reached your total (plan + bonus) generation limit." },
      { status: 403 }
    );
  }

  const totalDownloadLimit = planInfo.monthlyPdfs + (usage.pdfBonus || 0);

  // Determine download eligibility
    const canDownload = !!(usage.downloadCount || 0) < totalDownloadLimit;
 // const canDownload = usage.downloadCount < totalDownloadLimit;
 
  console.log(
    `📦 canDownload=${canDownload} (count=${usage.downloadCount}, limit=${totalDownloadLimit})`
  );

  //  const canDownload = (usage.downloadCount || 0) < totalDownloadLimit;

  if (signal?.aborted) {
    console.warn("⚠️ Request signal was already aborted — skipping generation");
    return NextResponse.json({ error: "Aborted early" }, { status: 499 });
  }
  // ✅ Generate worksheet
  let json, worksheets;
  try {
    const result = await generatorFn({
      type,
      topic,
      concept,
      gradeLevel,
      count,
      genre,
      examplePdfPath,
      signal,
    });

    json = result.json;
    worksheets = result.worksheets;
  } catch (err) {
    if (err.name === "AbortError") {
      console.log("🛑 Generation aborted by user (no DB insert).");
      return NextResponse.json({ error: "Aborted" }, { status: 499 });
    }

    // Don’t count this attempt — just return error
    console.error("❌ Worksheet generation failed:", err);
    return NextResponse.json(
      {
        error:
          "Failed to generate worksheet content. Please try again or adjust your topic.",
      },
      { status: 500 }
    );
  }
  // ✅ Only decrement bonus after successful generation
  if (!signal?.aborted) {
    if (generationCount >= planLimit && generationBonus) {
      // decrement bonus because this generation uses one
      const { error: bonusError } = await supabase
        .from("profiles")
        .update({ generation_bonus: generationBonus - 1 })
        .eq("id", user.id);
      if (bonusError) {
        console.error("⚠️ Failed to decrement bonus:", bonusError);
      }
    }
    // ✅ Save the generation
    const { error: insertError } = await supabase
      .from("ai_generations")
      .insert({
        user_id: user.id,
        generation_type: type,
        result_json: json,
      });

    if (insertError) {
      console.error("❌ Failed to insert ai_generation:", insertError);
    }
  }

  return NextResponse.json({
    json,
    worksheets,
    canDownload,
    remainingBonus: usage.generationBonus, // optional for frontend display
  });
}

// // Calculate total allowance
// const totalGenerationLimit =
//   planInfo.monthlyGenerations + (usage.generationBonus || 0);
// const totalDownloadLimit = planInfo.monthlyPdfs + (usage.pdfBonus || 0);
// // Check if user exceeded both plan + bonus
// if (usage.generationCount >= totalGenerationLimit) {
//   return NextResponse.json(
//     { error: "You’ve reached your total (plan + bonus) generation limit." },
//     { status: 403 }
//   );
// }

// if (generationCount >= planInfo.monthlyGenerations) {
//   return NextResponse.json(
//     { error: "You’ve reached your monthly generation limit." },
//     { status: 403 }
//   );
// }
//normalize canDownload to a boolean- handle null or undefined return
//const canDownload = !!(usage.downloadCount < planInfo.monthlyPdfs);

// .eq("pdf_id", pdfId)

// ✅ Generate worksheet
// const { json, worksheets } = await generatorFn({
//   topic,
//   concept,
//   gradeLevel,
//   count,
//   examplePdfPath,
// });
// if (
//   usage.generationCount >= planInfo.monthlyGenerations &&
//   usage.generationBonus > 0
// ) {
//   // decrement bonus because this generation uses one
//   await supabase
//     .from("profiles")
//     .update({ generation_bonus: usage.generationBonus - 1 })
//     .eq("id", user.id);
// }

// ✅ Save the generation
//     const { error: insertError } = await supabase
//       .from("ai_generations")
//       .insert({
//         user_id: user.id,
//         generation_type: type,
//         result_json: json,
//       });

//     if (insertError) {
//       console.error("❌ Failed to insert ai_generation:", insertError);
//     }

//     return NextResponse.json({
//       json,
//       worksheets,
//       canDownload,
//       remainingBonus: usage.generationBonus, // optional for frontend display
//     });
//   } catch (err) {
//     console.error("❌ Error getting user generation count:", err);
//     // Optionally handle this as a failure
//     return NextResponse.json(
//       { error: "Failed to check usage limits" },
//       { status: 500 }
//     );
//   }
// }

// .eq("pdf_id", pdfId)
