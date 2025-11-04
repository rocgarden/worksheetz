// app/api/save-worksheet/route.js
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { saveWorksheetSchema } from "@/libs/zodSchemas";
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

    const { data: worksheetData, error: insertError } = await supabase
      .from("worksheets")
      .insert({
        user_id: user.id,
        file_name: fileName,
        topic,
        grade_level: gradeLevel,
        type,
        content: worksheet,
      })
      .select();
    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save worksheet" },
        { status: 500 }
      );
    }

    const savedWorksheet = worksheetData?.[0];
    const worksheetId = savedWorksheet?.id;
    if (!savedWorksheet) {
      return NextResponse.json(
        { error: "Worksheet insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Worksheet saved!",
      worksheetId,
    });
  } catch (err) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("Unexpected error saving worksheet:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
