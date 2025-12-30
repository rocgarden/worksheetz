// app/api/update-billing/route.js

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Stripe from "stripe";

export async function POST(req) {
  // 1️⃣ Create Supabase server client (same as generate-pdf)
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

  // 2️⃣ Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect("/login");
  }

  // 3️⃣ Read form data
  const formData = await req.formData();
  const billingName = formData.get("billing_name")?.trim() || "";
  const billingAddress = formData.get("billing_address")?.trim() || "";

  // 4️⃣ Fetch profile
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

  // 5️⃣ Stripe client using env vars (same as webhook)
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-08-16",
  });

  // 6️⃣ Update Stripe
  await stripe.customers.update(profile.customer_id, {
    name: billingName || undefined,
    address: billingAddress ? { line1: billingAddress } : undefined,
  });

  // 7️⃣ Update Supabase
  await supabase
    .from("profiles")
    .update({
      billing_name: billingName,
      billing_address: billingAddress,
    })
    .eq("id", user.id);

  // 8️⃣ Redirect back to dashboard
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`);

  //  return NextResponse.redirect("/dashboard?billing=success");
}
