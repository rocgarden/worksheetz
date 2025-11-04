import { createClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { grammarPdfTemplate } from "../pdfTemplates/grammarPdfTemplate";
import { readingPdfTemplate } from "../pdfTemplates/readingPdfTemplate";
import { createPdfSchema } from "@/libs/zodSchemas";
// Add more templates as needed

const templateMap = {
  grammar: grammarPdfTemplate,
  reading: readingPdfTemplate,
  // Add more subjects
};

export async function POST(req) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value;
        },
        getAll() {
          return cookies()
            .getAll()
            .map(({ name, value }) => ({ name, value }));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parseResult = createPdfSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { worksheetData, type, userId } = parseResult.data;

  if (!type || !worksheetData || typeof worksheetData !== "object") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const templateFn = templateMap[type];
  if (!templateFn) {
    return NextResponse.json(
      { error: "Unsupported subject type" },
      { status: 400 }
    );
  }

  try {
    const pdfStream = await templateFn(worksheetData); // returns PassThrough stream

    return new NextResponse(pdfStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="worksheet.pdf"`,
      },
    });
  } catch (err) {
    console.error("❌ PDF generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
