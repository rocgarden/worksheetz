// app/api/stripe/sync/route.js
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  console.log("🔄 Running Stripe → Supabase full sync...");

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // 1️⃣ Fetch all users with Stripe customer IDs
  const { data: profiles, error: fetchError } = await supabase
    .from("profiles")
    .select("id, email, customer_id");

  if (fetchError) {
    console.error("❌ Failed to load profiles:", fetchError);
    return NextResponse.json({ error: "DB fetch failed" }, { status: 500 });
  }

  for (const p of profiles) {
    if (!p.customer_id) continue;

    try {
      const subs = await stripe.subscriptions.list({
        customer: p.customer_id,
        status: "all", // includes canceled, active, past_due
        expand: ["data.items"],
      });

      if (subs.data.length === 0) {
        console.log(`⚠️ No subscriptions found for ${p.email}`);
        await supabase
          .from("profiles")
          .update({
            price_id: null,
            subscription_status: "none",
            has_access: false,
          })
          .eq("id", p.id);
        continue;
      }

      // 2️⃣ Use the *most recent* subscription as the source of truth
      const sub = subs.data[0];
      const priceId = sub.items.data[0]?.price?.id;

      const updateData = {
        price_id: priceId,
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
        current_period_end: new Date(sub.current_period_end * 1000),
        has_access: sub.status === "active" || sub.status === "trialing",
      };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", p.id);

      if (updateError) {
        console.error(
          `❌ Failed updating profile for ${p.email}:`,
          updateError
        );
      } else {
        console.log(`✅ Synced subscription for ${p.email}`);
      }
    } catch (err) {
      console.error(`❌ Stripe sync failed for ${p.email}:`, err.message);
    }
  }

  return NextResponse.json({ success: true });
}
