//app/api/webhook/stripe/route.js
//app/api/webhook/stripe/route.js
import config from "@/config";
import { findCheckoutSession } from "@/libs/stripe";
import { createClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { sendEmail } from "@/libs/resend";
import { welcomeTemplate } from "@/libs/emails/welcomeTemplate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- Helpers: read fields that moved in newer Stripe API versions ----

// current_period_end moved from the subscription to its items (2025 versions)
function getPeriodEnd(subscription) {
  const end =
    subscription?.items?.data?.[0]?.current_period_end ??
    subscription?.current_period_end;
  return end ? new Date(end * 1000).toISOString() : null;
}

// invoice line price moved to pricing.price_details.price (2025 versions)
function getInvoiceLinePriceId(line) {
  return line?.price?.id ?? line?.pricing?.price_details?.price ?? null;
}

function findPlan(priceId) {
  return config.stripe.plans.find((p) => p.priceId === priceId) || null;
}

export async function POST(req) {
  console.log("📩 Stripe webhook received");

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing required Stripe environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Must match the API version on your Stripe webhook endpoint
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-11-17.clover",
  });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
      realtime: { disabled: true },
    }
  );

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const eventType = event.type;
  const eventId = event.id;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const stripeObject = event.data.object;

        // Idempotency: skip events already processed successfully
        const { data: existingEvent } = await supabase
          .from("stripe_events")
          .select("id")
          .eq("event_id", eventId)
          .maybeSingle();

        if (existingEvent) {
          console.log(`⚠️ Event ${eventId} already processed, skipping`);
          return NextResponse.json(
            { received: true, skipped: "already processed" },
            { status: 200 }
          );
        }

        const subscriptionId = stripeObject.subscription;
        const session = await findCheckoutSession(stripeObject.id);
        const customerId = session?.customer;
        const priceId = session?.line_items?.data?.[0]?.price?.id;
        const userId =
          stripeObject.metadata?.user_id || stripeObject.client_reference_id;

        console.log("🪝 checkout.session.completed:", {
          userId,
          priceId,
          customerId,
          subscriptionId,
        });

        if (!customerId) throw new Error("No customer on checkout session");

        const plan = findPlan(priceId);
        if (!plan) {
          throw new Error(
            `No plan for priceId "${priceId}". Config has: ${config.stripe.plans
              .map((p) => `"${p.priceId}"`)
              .join(", ")}`
          );
        }

        let currentPeriodEnd = null;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId
          );
          currentPeriodEnd = getPeriodEnd(subscription);
        }

        // Schedule cancellation of any other active subscription (e.g. old Starter)
        const activeSubs = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
        });

        for (const sub of activeSubs.data) {
          if (sub.id !== subscriptionId) {
            await stripe.subscriptions.update(sub.id, {
              cancel_at_period_end: true,
            });
            console.log(`⚠️ Scheduled cancellation of old subscription ${sub.id}`);
          }
        }

        const customer = await stripe.customers.retrieve(customerId);

        // Resolve the user
        let user;
        if (userId) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
          user = profile;
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", customer.email)
            .maybeSingle();

          if (profile) {
            user = profile;
          } else {
            const { data, error: authError } =
              await supabase.auth.admin.createUser({ email: customer.email });
            if (authError) throw authError;
            user = data?.user;
          }
        }

        if (!user?.id) {
          throw new Error(`No user found for userId=${userId}`);
        }

        const profileFields = {
          email: customer.email,
          customer_id: customerId,
          price_id: priceId,
          has_access: true,
          payment_failed: false,
          stripe_subscription_id: subscriptionId,
          plan_name: plan.name,
          subscription_status: "active",
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: false,
          upgrade_date: new Date().toISOString(),
        };

        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        const { error: profileError } = existingProfile
          ? await supabase.from("profiles").update(profileFields).eq("id", user.id)
          : await supabase.from("profiles").insert({ id: user.id, ...profileFields });

        // Throw so the event is NOT recorded as processed and can be resent
        if (profileError) {
          throw new Error(`Profile write failed: ${profileError.message}`);
        }
        console.log(`✅ Profile updated for ${user.id}`);

        // Welcome email (a failure here should not block access)
        let emailStatus = "skipped (already sent)";
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
              replyTo: config.resend.replyTo,
            });
            await supabase
              .from("profiles")
              .update({ welcome_email_sent: true })
              .eq("id", user.id);
            emailStatus = "sent";
            console.log(`📧 Welcome email sent to ${customer.email}`);
          }
        } catch (emailError) {
          emailStatus = `failed: ${emailError.message}`;
          console.error("⚠️ Failed to send welcome email:", emailError.message);
        }

        // Record the event only after the profile was written successfully
        const { error: insertError } = await supabase
          .from("stripe_events")
          .insert({ event_id: eventId, event_type: eventType });
        if (insertError) console.error("❌ Failed to log event:", insertError);

        return NextResponse.json(
          { received: true, eventType, userId: user.id, emailStatus },
          { status: 200 }
        );
      }

      case "checkout.session.expired": {
        break;
      }

      case "customer.subscription.created": {
        console.log("✅ Subscription created:", event.data.object.id);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items.data[0]?.price?.id;
        const status = subscription.status;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, stripe_subscription_id")
          .eq("customer_id", customerId)
          .maybeSingle();

        if (!profile) break;

        // Ignore events for an old subscription being wound down after an upgrade
        if (
          profile.stripe_subscription_id &&
          profile.stripe_subscription_id !== subscription.id
        ) {
          console.log(
            `↪️ Ignoring update for non-current subscription ${subscription.id}`
          );
          break;
        }

        const oldPriceId =
          event.data.previous_attributes?.items?.data?.[0]?.price?.id;
        const isUpgrade = oldPriceId && oldPriceId !== priceId;

        const updates = {
          price_id: priceId,
          stripe_subscription_id: subscription.id,
          subscription_status: status,
          has_access: ["active", "trialing"].includes(status),
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: getPeriodEnd(subscription),
        };

        const plan = findPlan(priceId);
        if (plan) updates.plan_name = plan.name; // never overwrite with null
        if (isUpgrade) updates.upgrade_date = new Date().toISOString();

        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", profile.id);

        if (error) throw new Error(`subscription.updated failed: ${error.message}`);
        console.log(`✅ Subscription updated for ${profile.email} (${status})`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, stripe_subscription_id")
          .eq("customer_id", subscription.customer)
          .maybeSingle();

        if (!profile) break;

        // Only revoke access if the CURRENT subscription ended,
        // not the old one canceled after an upgrade
        if (
          profile.stripe_subscription_id &&
          profile.stripe_subscription_id !== subscription.id
        ) {
          console.log(
            `↪️ Old subscription ${subscription.id} ended; current plan unaffected`
          );
          break;
        }

        const { error } = await supabase
          .from("profiles")
          .update({
            has_access: false,
            cancel_at_period_end: false,
            current_period_end: null,
            subscription_status: "canceled",
          })
          .eq("id", profile.id);

        if (error) throw new Error(`subscription.deleted failed: ${error.message}`);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const priceId = getInvoiceLinePriceId(invoice.lines?.data?.[0]);
        const customerId = invoice.customer;

        if (!priceId) {
          console.log("⚠️ Invoice paid but no price found, skipping");
          break;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, price_id")
          .eq("customer_id", customerId)
          .maybeSingle();

        if (!profile || profile.price_id !== priceId) break;

        const { error } = await supabase
          .from("profiles")
          .update({ has_access: true, payment_failed: false })
          .eq("id", profile.id);

        if (error) throw new Error(`invoice.paid failed: ${error.message}`);
        break;
      }

      case "invoice.payment_failed": {
        // Stripe retries automatically; subscription.deleted fires if all retries fail
        const invoice = event.data.object;

        const { error } = await supabase
          .from("profiles")
          .update({ payment_failed: true })
          .eq("customer_id", invoice.customer);

        if (error) throw new Error(`payment_failed update failed: ${error.message}`);
        console.warn(`⚠️ Payment failed for customer ${invoice.customer}`);
        break;
      }

      default: {
        console.warn(`Unhandled Stripe event type: ${eventType}`);
        break;
      }
    }
  } catch (e) {
    console.error(`stripe error (${eventType}): `, e.message);
    // 500 tells Stripe to retry, and the body shows in Event deliveries
    return NextResponse.json(
      { received: false, eventType, error: e.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true, eventType }, { status: 200 });
}

export async function GET() {
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
