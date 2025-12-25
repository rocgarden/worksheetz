//app/api/webhook/stripe/route.js
import config from "@/config";
import { findCheckoutSession } from "@/libs/stripe";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendEmail } from "@/libs/resend";
import { welcomeTemplate } from "@/libs/emails/welcomeTemplate";
// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req) {
  console.log("📩 Stripe webhook received");
  // Check for required environment variables
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing required Stripe environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-08-16",
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  let eventType;
  let event;

  // Create a private supabase client using the secret service_role API key
  // Disable realtime to reduce Edge Runtime warnings
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
      realtime: { disabled: true },
    }
  );

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject = event.data.object;
        const eventId = event.id;
        // ✅ Check if we've already processed this event
        const { data: existingEvent } = await supabase
          .from("stripe_events") // create this table
          .select("id")
          .eq("event_id", eventId)
          .single();

        if (existingEvent) {
          console.log(`⚠️ Event ${eventId} already processed, skipping`);
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const subscriptionId = stripeObject.subscription;

        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        //const userId = stripeObject.client_reference_id;
        // ✅ ALWAYS get current_period_end from subscription
        let currentPeriodEnd = null;
        if (subscriptionId) {
          try {
            const subscription =
              await stripe.subscriptions.retrieve(subscriptionId);
            currentPeriodEnd = new Date(subscription.current_period_end * 1000);
            console.log("✅ Current period end:", currentPeriodEnd);
          } catch (err) {
            console.error("Failed to get subscription period:", err);
          }
        }

        // ✅ NEW: prefer metadata.user_id if present, fallback to client_reference_id
        const userId =
          stripeObject.metadata?.user_id || stripeObject.client_reference_id;
        console.log("🪝 Stripe webhook checkout.session.completed:", {
          userId,
          priceId,
          customerId,
        });

        // ✅ 1️⃣ Cancel any other active subscriptions for this customer
        const activeSubs = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          expand: ["data.items"],
        });

        for (const sub of activeSubs.data) {
          const activePrice = sub.items.data[0]?.price?.id;
          if (activePrice !== priceId) {
            await stripe.subscriptions.update(sub.id, {
              cancel_at_period_end: true, // let current cycle finish
            });
            console.log(
              `⚠️ Scheduled cancellation of old subscription ${sub.id} (${activePrice})`
            );
          }
        }

        const plan = config.stripe.plans.find((p) => p.priceId === priceId);

        const customer = await stripe.customers.retrieve(customerId);

        if (!plan) break;

        let user;
        if (!userId) {
          // check if user already exists
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", customer.email)
            .single();
          if (profile) {
            user = profile;
          } else {
            // create a new user using supabase auth admin
            const { data, error: authError } =
              await supabase.auth.admin.createUser({
                email: customer.email,
              });

            if (authError) {
              console.error("Failed to create auth user:", authError);
              throw authError;
            }

            user = data?.user;
            if (user?.id) {
              await new Promise((resolve) => setTimeout(resolve, 100));

              const { data: existingProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

              if (existingProfile) {
                user = existingProfile;
              }
            }
          }
        } else {
          // find user by ID
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          user = profile;
        }

        if (!user?.id) {
          console.error("User ID is null, cannot create/update profile");
          throw new Error("User ID is required for profile creation");
        }

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        // const currentPeriodEnd = session.subscription
        //   ? new Date(
        //       (await stripe.subscriptions.retrieve(session.subscription))
        //         .current_period_end * 1000
        //     )
        //   : null;

        if (existingProfile) {
          // ✅ update existing user
          const { error } = await supabase
            .from("profiles")
            .update({
              email: customer.email,
              customer_id: customerId,
              price_id: priceId,
              has_access: true,
              stripe_subscription_id: subscriptionId,
              plan_name: plan.name,
              subscription_status: "active",
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: false, // explicitly reset on upgrade
              upgrade_date: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (error) console.error("Failed to update profile:", error);
          else console.log(`✅ Updated profile for upgrade: ${user.id}`);
        } else {
          // 🆕 new user
          const { error } = await supabase.from("profiles").insert({
            id: user.id,
            email: customer.email,
            customer_id: customerId,
            price_id: priceId,
            has_access: true,
            stripe_subscription_id: subscriptionId,
            plan_name: plan.name,
            subscription_status: "active",
            current_period_end: currentPeriodEnd,
          });
          if (error) console.error("Failed to insert new profile:", error);
          else console.log(`🆕 Inserted new profile for ${customer.email}`);
        }

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("welcome_email_sent")
            .eq("id", user.id)
            .single();
          if (!profile?.welcome_email_sent) {
            await sendEmail({
              to: customer.email,
              subject: `🎉 Welcome to ${plan.name}!`,
              text: `Thanks for subscribing to the ${plan.name} plan. We're excited to have you!`,
              html: welcomeTemplate({
                planName: plan.name,
                userName: customer.name || customer.email,
              }),
              replyTo: config.email.replyTo,
            });
            await supabase
              .from("profiles")
              .update({ welcome_email_sent: true })
              .eq("id", user.id);
            console.log(`📧 Welcome email sent to ${customer.email}`);
          }
        } catch (emailError) {
          console.error("⚠️ Failed to send welcome email:", emailError.message);
        }

        // ✅ After successful processing, store the event
        console.log("🔍 About to insert event:", { eventId, eventType });

        const { data: insertedEvent, error: insertError } = await supabase
          .from("stripe_events")
          .insert({ event_id: eventId, event_type: eventType });

        if (insertError) {
          console.error("❌ Failed to insert event:", insertError);
        } else {
          console.log("✅ Event logged:", insertedEvent);
        }
        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        // const session = event.data.object;
        // const email = session.customer_details?.email;
        //console.log(`⚠️ Checkout session expired for ${email}`);
        // Optionally send a reminder email via Resend
        break;
      }
      case "customer.subscription.created": {
        // Subscription created - usually handled by checkout.session.completed
        // But good to have for completeness
        const subscription = event.data.object;
        console.log("✅ Subscription created:", subscription.id);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items.data[0]?.price?.id;
        const status = subscription.status;
        const planName = subscription.items.data[0]?.price?.nickname;

        console.log("🔄 Subscription updated:", {
          customerId,
          priceId,
          status,
        });

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("customer_id", customerId)
          .single();

        if (!profile) break;

        // 🔥 Detect if this is a real upgrade (price changed)
        const oldPriceId =
          event.data.previous_attributes?.items?.data?.[0]?.price?.id;

        const isUpgrade = oldPriceId && oldPriceId !== priceId;

        let upgradeDateUpdate = {};

        if (isUpgrade) {
          upgradeDateUpdate = { upgrade_date: new Date().toISOString() };
          console.log("🚀 Detected plan upgrade — resetting usage window");
        }

        // if (status === "active" || status === "trialing") {
        const { error } = await supabase
          .from("profiles")
          .update({
            price_id: priceId,
            has_access: true,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ),
            subscription_status: status,
            plan_name: planName,
            ...upgradeDateUpdate, // ⭐ only added when upgrading
          })
          .eq("customer_id", customerId);
        if (error) console.error("❌ Supabase update failed:", error);
        else console.log("✅ Updated subscription for", customerId);
        console.log(
          `✅ Updated subscription status for ${profile.email} (cancel_at_period_end=${subscription.cancel_at_period_end})`
        );
        // }

        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id
        );

        await supabase
          .from("profiles")
          .update({
            has_access: false,
            cancel_at_period_end: false,
            current_period_end: null,
            subscription_status: "canceled",
          })
          .eq("customer_id", subscription.customer);
        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        const stripeObject = event.data.object;
        // ✅ Add null checks
        if (!stripeObject.lines?.data?.[0]?.price?.id) {
          console.log("⚠️ Invoice paid but no price found, skipping");
          break;
        }
        const priceId = stripeObject.lines.data[0].price.id;
        const customerId = stripeObject.customer;

        // Find profile where customer_id equals the customerId (in table called 'profiles')
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("customer_id", customerId)
          .single();

        // Make sure the invoice is for the same plan (priceId) the user subscribed to
        if (profile.price_id !== priceId) break;

        // ✅  Add null check
        if (!profile || profile.price_id !== priceId) break;

        // Grant the profile access to your product. It's a boolean in the database, but could be a number of credits, etc...
        await supabase
          .from("profiles")
          .update({ has_access: true, payment_failed: false })
          .eq("customer_id", customerId);

        break;
      }

      case "invoice.payment_failed":
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired
        const invoice = event.data.object;
        const customerId = invoice.customer;

        await supabase
          .from("profiles")
          .update({
            payment_failed: true,
          })
          .eq("customer_id", customerId);

        console.warn(`⚠️ Payment failed for customer ${customerId}`);

        break;

      default: {
        console.warn(`Unhandled Stripe event type: ${eventType}`);
        break;
      }
    }
  } catch (e) {
    console.error("stripe error: ", e.message);
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

export async function GET(req) {
  return new Response("Stripe webhook endpoint - POST only", { status: 200 });
}

// case "customer.subscription.updated": {
//   // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
//   // You don't need to do anything here, because Stripe will let us know when the subscription is canceled for good (at the end of the billing cycle) in the "customer.subscription.deleted" event
//   // You can update the user data to show a "Cancel soon" badge for instance
//   break;
// }

// const { error } = await supabase.from("profiles").upsert({
//   id: user.id,
//   email: customer.email,
//   customer_id: customerId,
//   price_id: priceId,
//   has_access: true,
//   stripe_subscription_id: subscriptionId,
//   current_period_end: new Date(
//     session.subscription
//       ? (await stripe.subscriptions.retrieve(session.subscription))
//           .current_period_end * 1000
//       : null
//   ),
// });
// if (error) {
//   console.error("Failed to upsert profile:", error);
//   throw error;
// }

// Extra: send email with user link, product page, etc...
// try {
//   await sendEmail(...);
// } catch (e) {
//   console.error("Email issue:" + e?.message);
// }

// html: `
//   <h1>Welcome to ${plan.name}!</h1>
//   <p>Hi ${customer.name || customer.email},</p>
//   <p>Thanks for subscribing to the <strong>${plan.name}</strong>. You're all set to start using your new features.</p>
//   <p><a href="https://yourapp.com/dashboard">Go to your dashboard</a></p>
//   <p>— The Your App Team</p>
// `,

// case "checkout.session.completed": {
//   const session = event.data.object;
//   const userId = session.client_reference_id; // ✅ always provided now
//   const customerId = session.customer;
//   const subscriptionId = session.subscription;
//   const priceId =
//     session.metadata?.price_id ||
//     session?.line_items?.data?.[0]?.price?.id;

//   if (!userId) {
//     console.error("Missing client_reference_id in session.");
//     break;
//   }

//   const { error } = await supabase
//     .from("profiles")
//     .update({
//       customer_id: customerId,
//       stripe_subscription_id: subscriptionId,
//       price_id: priceId,
//       has_access: true,
//     })
//     .eq("id", userId);

//   if (error) {
//     console.error("Failed to update profile:", error);
//     throw error;
//   }

//   break;
// }

// case "customer.subscription.updated": {
// The customer might have changed the plan (higher or lower plan, cancel soon etc...)
// You don't need to do anything here, because Stripe will let us know when the subscription is canceled for good (at the end of the billing cycle) in the "customer.subscription.deleted" event
// You can update the user data to show a "Cancel soon" badge for instance
// const subscription = event.data.object;
// const customerId = subscription.customer;
// const priceId = subscription.items.data[0]?.price?.id;
// const status = subscription.status;
// const customer = await stripe.customers.retrieve(customerId);

// console.log("🔄 Subscription updated:", {
//   customerId,
//   priceId,
//   status,
// });

// const { data: profile } = await supabase
//   .from("profiles")
//   .select("id, email")
//   .eq("customer_id", customerId)
//   .single();

// if (!profile) break;
// const { error } = await supabase.from("profiles").upsert({
//   id: user.id,
//   email: customer.email,
//   customer_id: customerId,
//   price_id: priceId,
//   has_access: true,
//   stripe_subscription_id: subscriptionId,
//   current_period_end: new Date(
//     session.subscription
//       ? (await stripe.subscriptions.retrieve(session.subscription))
//           .current_period_end * 1000
//       : null
//   ),
// });
// if (error) {
//   console.error("Failed to upsert profile:", error);
//   throw error;
// }

//  break;
//  }
