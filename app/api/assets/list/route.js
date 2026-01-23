// app/api/assets/list/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error: dbError } = await supabase
      .from("sample_assets")
      .select(
        "id, title, subject, grade, pdf_path, is_public, is_active, created_at"
      )
      .eq("is_active", true)
      // show BOTH public + private if you want signed-in users to see private ones:
      // .in("is_public", [true, false])
      // or ONLY those intended for this library:
      .eq("is_public", false)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("assets/list db error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ assets: data || [] });
  } catch (err) {
    console.error("assets/list fatal:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
