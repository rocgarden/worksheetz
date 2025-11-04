//app/api/generate-json/route.js
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateGrammarJson } from "./generators/grammarGenerator";
import { generateReadingJson } from "./generators/readingGenerator";
import { generateSocialStudiesJson } from "./generators/socialStudiesGenerator";
import { getUserMonthlyUsage } from "@/libs/usage";
import { generateJsonSchema } from "@/libs/zodSchemas";
import { socialStudiesGeneratorSchema } from "@/libs/zodSchemas";
import { readingGeneratorSchema } from "@/libs/zodSchemas";
import { grammarGeneratorSchema } from "@/libs/zodSchemas";
import { getPlanByPriceId } from "@/libs/planutils";
import { ca } from "zod/v4/locales";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const examplePdfMap = {
  reading: path.resolve(
    process.cwd(),
    "pdfExamples/processed/Nounsexample.txt"
  ),
  grammar: path.resolve(
    process.cwd(),
    "pdfExamples/processed/Nounsexample.txt"
  ),
  socialStudies: path.resolve(
    process.cwd(),
    "pdfExamples/processed/Nounsexample.txt"
  ), // 👈 use correct file
  // Add more subjects if needed
};

const generatorMap = {
  grammar: generateGrammarJson,
  reading: generateReadingJson,
  socialStudies: generateSocialStudiesJson,
  // writing: generateWritingJson,
  // etc.
};

const schemaMap = {
  grammar: grammarGeneratorSchema,
  reading: readingGeneratorSchema,
  socialStudies: socialStudiesGeneratorSchema,
};

export async function POST(req) {
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
  const { type, ...payload } = body;
  //validate schema
  const schema = schemaMap[type];
  if (!schema) {
    return NextResponse.json(
      { error: "Unsupported worksheet type" },
      { status: 400 }
    );
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten() },
      { status: 400 }
    );
  }
  //const validated = generateJsonSchema.parse(body);

  const validated = result.data;
  const { topic, concept, gradeLevel, count } = validated;
  //verify generator and example paths
  const generatorFn = generatorMap[type];
  const examplePdfPath = examplePdfMap[type];

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

  console.log(
    `🧮 Checking generation limits: count=${generationCount}, plan=${planLimit}, bonus=${generationBonus}, totalAllowed=${totalAllowed}`
  );

  // ⚡ Check only if user EXCEEDS total allowance
  if (generationCount >= totalAllowed) {
    return NextResponse.json(
      { error: "You’ve reached your total (plan + bonus) generation limit." },
      { status: 403 }
    );
  }

  console.log(
    `📊 User ${user.id} has generated ${usage.generationCount} and downloads ${usage.downloadCount} items this month`
  );
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
  const totalDownloadLimit = planInfo.monthlyPdfs + (usage.pdfBonus || 0);

  // Determine download eligibility
  const canDownload = !!(usage.downloadCount || 0) < totalDownloadLimit;
  // ✅ Generate worksheet
  let json, worksheets;
  try {
    const result = await generatorFn({
      topic,
      concept,
      gradeLevel,
      count,
      examplePdfPath,
    });

    json = result.json;
    worksheets = result.worksheets;
  } catch (err) {
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

  if (generationCount >= planLimit && generationBonus) {
    // decrement bonus because this generation uses one
    await supabase
      .from("profiles")
      .update({ generation_bonus: generationBonus - 1 })
      .eq("id", user.id);
  }

  // ✅ Save the generation
  const { error: insertError } = await supabase.from("ai_generations").insert({
    user_id: user.id,
    generation_type: type,
    result_json: json,
  });

  if (insertError) {
    console.error("❌ Failed to insert ai_generation:", insertError);
  }

  return NextResponse.json({
    json,
    worksheets,
    canDownload,
    remainingBonus: usage.generationBonus, // optional for frontend display
  });
}

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
