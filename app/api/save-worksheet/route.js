// app/api/save-worksheet/route.js
export const runtime = "nodejs";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import leoProfanity from "leo-profanity";
//import DOMPurify from "isomorphic-dompurify";
import { sanitizeInput, deepSanitize } from "@/libs/sanitize"; // ← Use wrapper
import { saveWorksheetSchema } from "@/libs/zodSchemas";
import { staarReadingWorksheetSchema } from "@/libs/zodSchemas";

leoProfanity.loadDictionary();

// Small helper that handles both HTML sanitization and bad words
// function sanitizeAndFilter(text) {
//   if (!text) return "";
//   //let clean = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
//   let clean = sanitizeInput(text);

//   clean = leoProfanity.clean(clean);
//   return clean.trim();
// }

// 🧠 Recursively sanitize all text values inside an object or array
// function deepSanitize(obj) {
//   if (Array.isArray(obj)) {
//     return obj.map(deepSanitize);
//   } else if (obj && typeof obj === "object") {
//     const sanitized = {};
//     for (const key in obj) {
//       sanitized[key] = deepSanitize(obj[key]);
//     }
//     return sanitized;
//   } else if (typeof obj === "string") {
//     return sanitizeAndFilter(obj);
//   } else {
//     return obj;
//   }
// }

function sanitizeAndFilter(text) {
  if (!text) return "";
  let clean = sanitizeInput(text);
  clean = leoProfanity.clean(clean);
  return clean.trim();
}

export async function POST(req) {
  try {
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
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 Incoming body:", body);

    // ✅ Validate using Zod
    const validated = saveWorksheetSchema.parse({
      userId: user.id,
      fileName: body.fileName,
      worksheet: body.worksheet,
      topic: body.topic,
      gradeLevel: body.gradeLevel,
      type: body.type,
    });
    const { userId, fileName, worksheet, topic, gradeLevel, type } = validated;

    if (!fileName || !worksheet || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    // // ✅ Get the user's plan from 'profiles'
    // const { data: profile } = await supabase
    //   .from("profiles")
    //   .select("price_id")
    //   .eq("id", user.id)
    //   .single();

    // // ✅ Check usage using helper
    // const { downloadCount } = await getUserMonthlyUsage(
    //   supabase,
    //   "pdf_downloads",
    //   user.id
    // );
    // const planInfo = getPlanByPriceId(profile?.price_id);

    // const canDownload = downloadCount < planInfo.monthlyPdfs;

    // ✅ Apply profanity + HTML sanitization
    const safeWorksheet = deepSanitize(worksheet);
    const safeTopic = sanitizeAndFilter(topic);
    const safeGradeLevel = sanitizeAndFilter(gradeLevel);
    console.log("💾 Saving worksheet with file_name:", fileName);

     if (type === "staarReading") {
    const parsed = staarReadingWorksheetSchema.safeParse(safeWorksheet);
      if (!parsed.success) {
        return NextResponse.json(
          console.error("❌ STAAR schema failed:", parsed.error.format()),
          { error: "Invalid STAAR worksheet format", details: parsed.error.format(),  },
          { status: 400 }
        );
      }
    }

    // ✅ Choose table based on type
const tableName = type === "staarReading" ? "staar_worksheets" : "worksheets";
// ✅ Build insert payload
const insertPayload =
  type === "staarReading"
    ? {
        user_id: user.id,
        file_name: fileName,
        topic: safeTopic,
        grade_level: safeGradeLevel,
        subject: "reading",
        version: "3-5",
        content: safeWorksheet,
      }
    : {
        user_id: user.id,
        file_name: fileName,
        topic: safeTopic,
        grade_level: safeGradeLevel,
        type, // keeps your existing behavior
        content: safeWorksheet,
      };


    const { data: worksheetData, error: insertError } = await supabase
    .from(tableName)
    .upsert(insertPayload)
    .select()
    .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError.message);
      return NextResponse.json(
        { error: "Failed to save worksheet" },
        { status: 500 }
      );
    }

    const savedWorksheet = worksheetData;
    const worksheetId = worksheetData?.id;
    if (!worksheetData) {
      return NextResponse.json(
        { error: "Worksheet insert failed"},
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Worksheet saved!",
      worksheetId,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      console.log(err);
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Unexpected error saving worksheet:", err);
    return NextResponse.json(
      { error: "Internal Server Error" ,
      details: err?.message || err},
      { status: 500 }
    );
  }
}
