// app/api/admin/samples/publish/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { renderPdf } from "@/utils/renderPdf";
import { createClient as createServiceClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

const BUCKET = "samples";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function safeSlug(input = "") {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}

export async function POST(req) {
  const supabase = await createClient();

  // 1) Auth (basic)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Optional: add an admin gate later (recommended)
  // e.g. check user.email against your email, or a role in profiles
  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL?.toLocaleLowerCase()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Service-role client (bypasses RLS for storage.objects + sample_assets insert)
  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // 2) Parse input
  const body = await req.json().catch(() => ({}));
  const { worksheetId, title, subject, grade = null, isPublic = false } = body;

  if (!worksheetId || !title || !subject) {
    return NextResponse.json(
      { error: "Missing required fields: worksheetId, title, subject" },
      { status: 400 }
    );
  }

  // 3) Fetch worksheet JSON + type
  const { data: ws, error: wsError } = await supabaseAdmin
    .from("worksheets")
    .select("id, content, type")
    .eq("id", worksheetId)
    .single();

  if (wsError || !ws?.content || !ws?.type) {
    return NextResponse.json(
      { error: "Worksheet not found or missing content/type" },
      { status: 404 }
    );
  }

  // 4) Render PDF
  let pdfBuffer;
  try {
    pdfBuffer = await renderPdf(ws.type, ws.content);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to render PDF", details: e?.message },
      { status: 500 }
    );
  }

  // 5) Upload to Storage
  const slugTitle = safeSlug(title);
  const slugSubject = safeSlug(subject);
  const timestamp = Date.now();

  // Keep paths predictable
  const pdfPath = `library/${slugSubject}/${slugTitle}-${timestamp}.pdf`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pdfPath, pdfBuffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Upload failed", details: uploadError.message },
      { status: 500 }
    );
  }

  // 6) Insert into sample_assets
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("sample_assets")
    .insert({
      title,
      subject,
      grade: grade || null,
      pdf_path: pdfPath,
      is_active: true,
      is_public: !!isPublic,
    })
    .select("id, title, subject, grade, pdf_path, is_public, is_active")
    .single();

  if (insertError) {
    // If DB insert fails, you might want to delete the uploaded file (optional)
    return NextResponse.json(
      { error: "DB insert failed", details: insertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ asset: inserted });
}
