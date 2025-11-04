// // app/checkout/page.js
// import { redirect } from "next/navigation";
// import { createClient } from "@/libs/supabase/server";
// import apiClient from "@/libs/api";

// export default async function CheckoutPage({ searchParams }) {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) redirect("/"); // if unauthenticated, go home

//   const params = await searchParams;
//   const priceId = params.priceId;
//   if (!priceId) redirect("/#pricing");

//   // Call API to create Stripe Checkout session
//   const res = await apiClient.post("/stripe/create-checkout", {
//     priceId,
//     mode: "subscription",
//     successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
//     cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
//   });

//   if (res?.url) redirect(res.url);

//   return null;
// }

// // app/checkout/page.js
import CheckoutLoader from "@/components/CheckoutLoader";
import { createClient } from "@/libs/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // const priceId = await searchParams.priceId;
  // if (!priceId) return redirect("/#pricing");

  // ✅ Check if user already has a subscription
  const { data: profile } = await supabase
    .from("profiles")
    .select("price_id, has_access")
    .eq("id", user.id)
    .single();

  const alreadySubscribed = !!(profile?.price_id && profile?.has_access);

  if (alreadySubscribed) {
    return redirect("/dashboard");
  }

  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      {" "}
      <CheckoutLoader />
    </Suspense>
  );
}
