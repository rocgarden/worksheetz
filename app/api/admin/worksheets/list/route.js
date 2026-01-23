import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "rgarcia646@gmail.com";
// Optional: if you want to hard-lock to a specific user_id, use this too:
const ADMIN_USER_ID = "e2c77f91-bbc2-4390-9876-161075e63be0";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error: dbError } = await supabase
    .from("worksheets")
    .select("id, file_name, topic, grade_level, type, created_at")
    // If you want to ensure only admin-owned rows appear, uncomment:
    .eq("user_id", ADMIN_USER_ID)
    .order("created_at", { ascending: false })
    .limit(50);

  if (dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ worksheets: data || [] });
}
