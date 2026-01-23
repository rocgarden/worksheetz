// app/api/assets/download/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ✅ Adjust these
const BUCKET_NAME = "samples"; // Supabase Storage bucket name
const NO_SUB_MONTHLY_LIMIT = 2; // e.g. 1 per month for logged-in non-subs
// const LIFETIME_LIMIT = 1;           // <-- 1 per lifetime for non-subs users
const SIGNED_URL_EXPIRES_IN = 60; // seconds

export async function POST(req) {
  const supabase = await createClient();

  // 1) Auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // 2) Parse input
  const body = await req.json().catch(() => ({}));
  const { assetId } = body;

  if (!assetId) {
    return NextResponse.json({ error: "Missing assetId" }, { status: 400 });
  }

  // 3) Load profile (to know if subscribed)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("has_access")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const isSubscribed = profile.has_access === true;

  // 4) Fetch the asset
  const { data: asset, error: assetError } = await supabase
    .from("sample_assets")
    .select("id, pdf_path, is_active")
    .eq("id", assetId)
    .single();

  if (assetError || !asset?.is_active) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  // 5) Enforce limit only for non-subs users
  if (!isSubscribed) {
    // Monthly window: from first day of month (UTC) to now
    const now = new Date();
    const startOfMonthUtc = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)
    );

    const { count, error: countError } = await supabase
      .from("asset_downloads")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("downloaded_at", startOfMonthUtc.toISOString());

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if ((count || 0) >= NO_SUB_MONTHLY_LIMIT) {
      return NextResponse.json(
        { error: `Download limit reached (${NO_SUB_MONTHLY_LIMIT}/month).` },
        { status: 403 }
      );
    }
  }

  // 6) Log download
  const { data: signed, error: signedError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(asset.pdf_path, SIGNED_URL_EXPIRES_IN);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json(
      { error: signedError?.message || "Failed to sign URL" },
      { status: 500 }
    );
  }

  // 7) Return signed URL
  const { error: logError } = await supabase
    .from("asset_downloads")
    .insert({ user_id: user.id, asset_id: asset.id });

  if (logError) {
    return NextResponse.json({ error: logError.message }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl });
}
