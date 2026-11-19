// app/api/account/route.js
// Permanently deletes the signed-in teacher's account and all their data.

import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { cancelAllSubscriptions } from "@/libs/stripe";

export async function DELETE() {
  // ── 1. Auth ─────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── 2. Block admin account (passage bank review history is RESTRICT) ────
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && (user.email || "").toLowerCase() === adminEmail.toLowerCase()) {
    return NextResponse.json(
      { error: "The admin account can't be deleted from the dashboard." },
      { status: 403 },
    );
  }

  // ── 3. Cancel Stripe first — abort if it fails, before touching data ────
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .single();

  if (profile?.customer_id) {
    try {
      await cancelAllSubscriptions(profile.customer_id);
    } catch (err) {
      console.error("[account/delete] Stripe cancel failed:", err.message);
      return NextResponse.json(
        { error: "We couldn't cancel your subscription, so nothing was deleted. Please try again." },
        { status: 502 },
      );
    }
  }

  // ── 4. Delete all teacher data in one transaction ───────────────────────
  const serviceSupabase = await createV2ServiceClient();

  const { error: rpcError } = await serviceSupabase.rpc("delete_teacher_account", {
    p_teacher_id: user.id,
  });

  if (rpcError) {
    console.error("[account/delete] data delete failed:", rpcError.message);
    return NextResponse.json(
      { error: "Account deletion failed. No data was deleted." },
      { status: 500 },
    );
  }

  // ── 5. Delete auth user — cascades profiles, ai_generations,
  //       pdf_downloads, asset_downloads, staar_worksheets ─────────────────
  const { error: deleteUserError } = await serviceSupabase.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    console.error("[account/delete] auth user delete failed:", deleteUserError.message);
    return NextResponse.json(
      { error: "Your data was deleted, but we couldn't close the account. Please contact support." },
      { status: 500 },
    );
  }

  return NextResponse.json({ deleted: true }, { status: 200 });
}