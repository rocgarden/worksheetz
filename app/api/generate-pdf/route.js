//app/api/generate-pdf/route.js
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { renderPdf } from "@/utils/renderPdf";
import { cookies } from "next/headers";
import { getUserMonthlyUsage } from "@/libs/usage";
import { generatePdfSchema } from "@/libs/zodSchemas";
import { getPlanByPriceId } from "@/libs/planutils";

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
  // const { fileName, type, worksheetData, worksheetId } = await req.json();
  const body = await req.json();
  const { fileName, type, worksheetData, worksheetId } =
    generatePdfSchema.parse(body);
  //   if (!worksheetData || !type) {
  //     return NextResponse.json(
  //       { error: "Missing worksheet data or type" },
  //       { status: 400 }
  //     );
  //   }
  console.log("🔍 Looking for worksheet:", {
    fileName,
    userId: user.id,
    type,
  });
  // 1. Fetch the worksheet from DB
// 1. Fetch the worksheet from the correct table
const tableName = type === "staarReading" ? "staar_worksheets" : "worksheets";

const { data: worksheet, error: worksheetError } = await supabase
  .from(tableName)
  .select("id, file_name, content")
  .eq("file_name", fileName)
  .eq("user_id", user.id)
  .maybeSingle();

console.log("📦 DB result:", {
  tableName,
  found: !!worksheet,
  error: worksheetError,
  fileName_in_db: worksheet?.file_name,
  fileName_searched: fileName,
  match: worksheet?.file_name === fileName,
});

if (worksheetError) {
  return NextResponse.json(
    { error: "Failed to fetch worksheet", details: worksheetError.message },
    { status: 500 }
  );
}

if (!worksheet?.content) {
  return NextResponse.json(
    {
      error: "Worksheet not found",
      details: { searchedFileName: fileName, tableName },
    },
    { status: 404 }
  );
}

  // 2. Render PDF
  // ✅ Get the user's plan from 'profiles'
  const { data: profile } = await supabase
    .from("profiles")
    .select("price_id")
    .eq("id", user.id)
    .single();

  //const plan = profile?.price_id || "free";
  const planInfo = getPlanByPriceId(profile?.price_id);

  // ✅ Define usage limits
  // const limits = {
  //   free: 3,
  //   pro: 20,
  // };

  // const allowed = limits[plan] ?? 3;
  // const pdfBuffer = await renderPdf(type, worksheet.content);

  // 3. Log download--- abstracted t libs
  // const { count } = await supabase
  //   .from("pdf_downloads")
  //   .select("*", { count: "exact", head: true })
  //   .eq("user_id", user.id)
  //   .eq("pdf_id", worksheetId);
  // const downloadCount = await getUserMonthlyUsage(
  //   supabase,
  //   "pdf_downloads",
  //   user.id
  // );
  // if (downloadCount >= planInfo.monthlyPdfs) {
  //   return NextResponse.json(
  //     { error: "Pdf downloads limit reached" },
  //     { status: 403 }
  //   );
  // }
  // 2️⃣ After fetching planInfo
  const usage = await getUserMonthlyUsage(
    supabase,
    "pdf_downloads",
    user.id,
    planInfo
  );

  const planLimit = planInfo.monthlyPdfs;
  const downloadCount = usage.downloadCount || 0;
  const pdfBonus = usage.pdfBonus || 0;
  // How many bonuses have already been consumed beyond the plan limit (lifetime since effectiveStart)
const bonusUsed = Math.max(downloadCount - planLimit, 0);
// Total bonuses ever granted = remaining wallet + already-used bonuses
const totalBonusGranted = pdfBonus + bonusUsed;
  // Total allowance = plan limit + total bonuses ever granted
const totalAllowed = planLimit + totalBonusGranted;

//const totalAllowed = planLimit + pdfBonus;

  console.log(
    `🧮 Checking PDF limits: count=${downloadCount}, plan=${planLimit}, bonus=${pdfBonus}, totalAllowed=${totalAllowed}`
  );
  //if (downloadCount > planLimit && pdfBonus <= 0) {
  if (downloadCount >= totalAllowed) {
    return NextResponse.json(
      {
        error:
          "You’ve reached your total (plan + bonus) PDF limit. Try upgrading your plan or using bonus credits.",
      },
      { status: 403 }
    );
  }

  // ✅ Render PDF *after* confirming allowance
  let pdfBuffer;
  try {
    pdfBuffer = await renderPdf(type, worksheet.content);
  } catch (err) {
    console.error("❌ PDF rendering failed:", err);
    return NextResponse.json(
      { error: "Failed to render PDF. Please try again later." },
      { status: 500 }
    );
  }

  // ✅ Only decrement bonus after successful render
  if (downloadCount >= planLimit && pdfBonus > 0) {
    await supabase
      .from("profiles")
      .update({ pdf_bonus: pdfBonus - 1 })
      .eq("id", user.id);

    console.log(
      `🟣 Used 1 PDF bonus for ${user.id}. Remaining: ${pdfBonus - 1}`
    );
  }

  // ✅ Log download AFTER success
  const { error: insertError } = await supabase.from("pdf_downloads").insert({
    user_id: user.id,
    pdf_id: worksheetId,
    file_name: fileName,
  });

  if (insertError) {
    console.error("❌ Failed to insert pdf_downloads:", insertError);
  }

  // ✅ 4. Return PDF
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
    },
  });
}

// const usage = await getUserMonthlyUsage(
//       supabase,
//       "pdf_downloads",
//       user.id,
//       planInfo
//     );

//     if (usage.downloadCount >= planInfo.monthlyPdfs && usage.pdfBonus > 0) {
//       await supabase
//         .from("profiles")
//         .update({ pdf_bonus: usage.pdfBonus - 1 })
//         .eq("id", user.id);
//     }

//     if (usage.downloadCount >= planInfo.monthlyPdfs && usage.pdfBonus <= 0) {
//       return NextResponse.json(
//         { error: "PDF downloads limit reached." },
//         { status: 403 }
//       );
//     }
//     //if (count === 0) {
//     const { error: insertError } = await supabase.from("pdf_downloads").insert({
//       user_id: user.id,
//       pdf_id: worksheetId,
//       file_name: fileName,
//     });

//     if (insertError) {
//       console.error("❌ Failed to insert pdf_downloads:", insertError);
//     }
//     // }
//     // 4. Return PDF
//     return new NextResponse(pdfBuffer, {
//       status: 200,
//       headers: {
//         "Content-Type": "application/pdf",
//         "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
//       },
//     });
//   } catch (err) {
//     if (err.name === "ZodError") {
//       return NextResponse.json({ error: err.errors }, { status: 400 });
//     }
//     console.error("❌ PDF generation failed", err);
//     return NextResponse.json(
//       { error: "PDF generation failed" },
//       { status: 500 }
//     );
//   }
// }
