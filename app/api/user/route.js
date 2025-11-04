// /app/api/user/route.js
import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch your profile" },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile }, { status: 200 });
}
