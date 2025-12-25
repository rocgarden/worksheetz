// app/api/update-billing/route.js

import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import Stripe from "stripe";
import config from "@/config";

const stripe = new Stripe(config.stripe.secretKey);

export async function POST(req) {
  const supabase = await createClient();

  // 1️⃣ Get the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect("/signin");
  }

  // 2️⃣ Read form data
  const formData = await req.formData();
  const billingName = formData.get("billing_name")?.trim() || "";
  const billingAddress = formData.get("billing_address")?.trim() || "";

  // 3️⃣ Fetch profile to get Stripe customer_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer found for this user." },
      { status: 400 }
    );
  }

  // Server-side validation
  if (billingName && billingName.split(" ").length < 2) {
    return NextResponse.json(
      { error: "Full name must include first and last name." },
      { status: 400 }
    );
  }

  if (billingAddress && billingAddress.length < 5) {
    return NextResponse.json(
      { error: "Billing address looks too short." },
      { status: 400 }
    );
  }

  // 4️⃣ Update Supabase profile
  await supabase
    .from("profiles")
    .update({
      billing_name: billingName,
      billing_address: billingAddress,
    })
    .eq("id", user.id);

  // 5️⃣ Update Stripe customer
  await stripe.customers.update(profile.customer_id, {
    name: billingName || undefined,
    address: billingAddress
      ? {
          line1: billingAddress,
        }
      : undefined,
  });

  // 6️⃣ Redirect back to dashboard
  return NextResponse.redirect("/dashboard");
}
