//app/api/stripe/create-checkout/route.js
import { createCheckout } from "@/libs/stripe";
import { createClient } from "@/libs/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// Users must be authenticated. It will prefill the Checkout data with their email and/or credit card (if any)
export async function POST(req) {
  const body = await req.json();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  if (!body.priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  } else if (!body.successUrl || !body.cancelUrl) {
    return NextResponse.json(
      { error: "Success and cancel URLs are required" },
      { status: 400 }
    );
  } else if (!body.mode) {
    return NextResponse.json(
      {
        error:
          "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)",
      },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { priceId, mode, successUrl, cancelUrl } = body;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();

    //ADDED check
    // If user has no customer_id, try to find one by email
    let customerId = data?.customer_id;
    if (!customerId && data?.email) {
      const existingCustomers = await stripe.customers.list({
        email: data.email,
        limit: 1,
      });
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
        // Save it in Supabase so it’s reused next time
        // await supabase
        //   .from("profiles")
        //   .update({ customer_id: customerId })
        //   .eq("id", user?.id);
      } else {
        // 2️⃣ Create a new Stripe customer
        const customer = await stripe.customers.create({
          email: data.email,
          name: data.name || user.user_metadata.full_name || "Google User",
          metadata: { supabase_user_id: user?.id },
        });
        customerId = customer.id;
      }
      // 3️⃣ Save the customer_id in Supabase
      await supabase
        .from("profiles")
        .update({ customer_id: customerId })
        .eq("id", user?.id);
    }

    // 4️⃣ Pass the linked customer_id to createCheckout
    const stripeSessionURL = await createCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      // If user is logged in, it will pass the user ID to the Stripe Session so it can be retrieved in the webhook later
      clientReferenceId: user?.id,
      user: {
        email: data?.email,
        // If the user has already purchased, it will automatically prefill it's credit card
        //  customerId: data?.customer_id,
        customerId,
      },
      // If you send coupons from the frontend, you can pass it here
      // couponId: body.couponId,
    });

    return NextResponse.json({ url: stripeSessionURL });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

// app/api/stripe/create-checkout/route.js
// import { createCheckout } from "@/libs/stripe";
// import { createClient } from "@/libs/supabase/server";
// import { NextResponse } from "next/server";
// import Stripe from "stripe";

// export async function POST(req) {
//   const body = await req.json();
//   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//     apiVersion: "2025-10-29",
//   });

//   const { priceId, mode, successUrl, cancelUrl } = body;

//   // Basic validations
//   if (!priceId)
//     return NextResponse.json(
//       { error: "Price ID is required" },
//       { status: 400 }
//     );
//   if (!successUrl || !cancelUrl)
//     return NextResponse.json(
//       { error: "Success and cancel URLs are required" },
//       { status: 400 }
//     );
//   if (!mode)
//     return NextResponse.json({ error: "Mode is required" }, { status: 400 });

//   try {
//     const supabase = await createClient();

//     // Get authenticated Supabase user
//     const { data, error } = await supabase.auth.getUser();
//     const user = data?.user;

//     if (!user)
//       return NextResponse.json(
//         { error: "User not authenticated" },
//         { status: 401 }
//       );

//     // Get user profile
//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("*")
//       .eq("id", user.id)
//       .single();

//     if (!profile)
//       return NextResponse.json({ error: "Profile not found" }, { status: 404 });

//     // Find or create Stripe customer
//     let customerId = profile?.customer_id;

//     if (!customerId && profile?.email) {
//       const existingCustomers = await stripe.customers.list({
//         email: profile.email,
//         limit: 1,
//       });

//       if (existingCustomers.data.length > 0) {
//         customerId = existingCustomers.data[0].id;
//       } else {
//         const customer = await stripe.customers.create({
//           email: profile.email,
//           metadata: { supabase_user_id: user.id },
//         });
//         customerId = customer.id;
//       }

//       // Save the customerId in Supabase
//       await supabase
//         .from("profiles")
//         .update({ customer_id: customerId })
//         .eq("id", user.id);
//     }

//     // **Update Stripe customer email to match Supabase**
//     if (customerId && profile.email) {
//       await stripe.customers.update(customerId, { email: profile.email });
//     }

//     // Create Stripe Checkout session
//     const stripeSessionURL = await createCheckout({
//       priceId,
//       mode,
//       successUrl,
//       cancelUrl,
//       clientReferenceId: user.id,
//       user: {
//         customerId, // always pass the linked customer
//       },
//     });

//     return NextResponse.json({ url: stripeSessionURL });
//   } catch (e) {
//     console.error(e);
//     return NextResponse.json(
//       { error: e?.message || "Unknown error" },
//       { status: 500 }
//     );
//   }
// }
