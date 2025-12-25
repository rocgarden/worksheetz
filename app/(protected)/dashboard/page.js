//app/(protected)/dashboard/page.js

import { createClient } from "@/libs/supabase/server";
import ProfileCard from "@/components/ProfileCard"; // your UI component
import UsageStats from "@/components/UsageStats";
import { getUserMonthlyUsage } from "@/libs/usage";
import { getPlanByPriceId } from "@/libs/planutils";
import ButtonAccount from "@/components/ButtonAccount";
import ButtonCheckout from "@/components/ButtonCheckout";
import BillingDetailsForm from "@/components/BillingDetailsForm";
import config from "@/config";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams; // ✅ Await it once
  const message = params?.message;
  const supabase = await createClient();
  // console.log("Supabase client:", supabase);
  // console.log("auth:", supabase.auth);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    console.error("Auth error:", userError.message);
  }
  if (!user) {
    redirect(config.auth.loginUrl); // 👈 force redirect instead of rendering fallback
    // return <p>Not signed in</p>; // or redirect
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles") // or 'profiles' depending on your schema
    .select(
      "id, name, email, created_at, customer_id, price_id, has_access, cancel_at_period_end, current_period_end, payment_failed, upgrade_date"
    )
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return <p>Failed to load profile</p>;
  }

  const planInfo = getPlanByPriceId(profile?.price_id || "free");
  // Fetch usage and bonuses once
  const usage = await getUserMonthlyUsage(
    supabase,
    "ai_generations",
    user.id,
    planInfo
  );
  // Add this right after getting the profile
  console.log("🔍 Dashboard Debug:");
  console.log("User ID:", user.id);
  console.log("Profile price_id:", profile?.price_id);
  console.log("Plan Info:", planInfo);
  console.log("Timestamp:", new Date().toISOString());

  // ✅ Determine limits
  const totalGenerationLimit =
    planInfo.monthlyGenerations + (usage.generationBonus || 0);
  const totalDownloadLimit = planInfo.monthlyPdfs + (usage.pdfBonus || 0);

  // ✅ Compare usage to total limits (plan + bonus)
  const limitReached = usage.generationCount >= totalGenerationLimit;
  const downloadLimitReached = usage.downloadCount >= totalDownloadLimit;

  // ✅ Booleans for UI controls
  // const canGenerate = usage.generationCount < totalGenerationLimit;

  const canDownload = usage.downloadCount < totalDownloadLimit;
  const canGenerate =
    usage.generationCount < planInfo.monthlyGenerations ||
    usage.generationBonus > 0;

  // const canGenerate =
  //   usage.generationCount < planInfo.monthlyGenerations ||
  //   (usage.generationCount < totalGenerationLimit && usage.generationBonus > 0);

  // const canDownload =
  //   usage.downloadCount < planInfo.monthlyPdfs ||
  //   (usage.downloadCount < totalDownloadLimit && usage.pdfBonus > 0);
  // ✅ Determine plan type
  const activePlan = config.stripe.plans.find(
    (plan) => plan.priceId === profile?.price_id
  );
  const freePlan = config.stripe.plans[0];
  const proPlan = config.stripe.plans[1];

  const hasNoPlan = !profile.price_id;
  const isFreePlan = profile.price_id === freePlan.priceId;
  const isProPlan = profile.price_id === proPlan.priceId;
  const isSubscribed = !planInfo.isFree;

  return (
    <main className="min-h-screen p-8 pb-24">
      {message === "limit-reached" && (
        <p className="text-red-500 mb-4">
          🚫 You’ve reached your monthly generation limit. Upgrade your plan to
          continue.
        </p>
      )}
      {message === "no-plan" && (
        <p className="text-yellow-600 mb-4">
          ⚠️ You don’t have an active plan. Please choose one to start
          generating worksheets.
        </p>
      )}
      {message === "upgrade-needed" && (
        <p className="text-blue-600 mb-4">
          💡 Upgrade to Pro to unlock more worksheet generations.
        </p>
      )}

      <section className="max-w-xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <ProfileCard profile={profile} planInfo={planInfo.name} />
        <BillingDetailsForm profile={profile} />
        <UsageStats
          generationCount={usage.generationCount || 0}
          downloadCount={usage.downloadCount || 0}
          generationBonus={usage.generationBonus || 0}
          pdfBonus={usage.pdfBonus || 0}
          planGenerations={planInfo.monthlyGenerations}
          planPdfs={planInfo.monthlyPdfs}
        />

        {/* ✅ CASE 1: No plan at all → offer free plan */}
        {hasNoPlan && (
          <ButtonCheckout
            mode="subscription"
            priceId={freePlan.priceId}
            text="Get Started for Free"
          />
        )}

        {/* ✅ CASE 2: Free plan → offer upgrade to Pro */}
        {isFreePlan && (
          // <ButtonCheckout
          //   mode="subscription"
          //   priceId={proPlan.priceId}
          //   text="Upgrade to Pro"
          // />
          <ButtonAccount text="Upgrade to Pro" />
        )}

        {/* ✅ CASE 3: Pro plan → no upgrade button */}
        {isProPlan && (
          <p className="text-sm text-gray-500">You’re on the Pro plan.</p>
        )}

        {/* ✅ Conditional UI for worksheet generation */}
        {isSubscribed && !hasNoPlan ? (
          canGenerate ? (
            <>
              <Link
                href="/generate"
                className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700"
              >
                Generate Worksheet
              </Link>
              {!canDownload && usage.pdfBonus === 0 && (
                <p className="text-yellow-600 text-sm mt-2">
                  ⚠️ You’ve reached your monthly PDF download limit (
                  {planInfo.monthlyPdfs}). You can still generate worksheets but
                  won’t be able to download them.
                </p>
              )}
            </>
          ) : (
            <p className="text-red-500 text-sm mt-2">
              You’ve reached your total generation limit. Upgrade or wait until
              next month.
            </p>
          )
        ) : (
          <div>
            <p className="text-gray-500 text-sm mt-2">
              Upgrade your plan to unlock more worksheet generations.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

{
  /* {!isSubscribed && (
          <ButtonCheckout
            mode="subscription"
            priceId={config.stripe.plans[1].priceId}
          />
        )} */
}

{
  /* ✅ Only show “Generate Worksheet” if user is subscribed */
}
{
  /* {isSubscribed ? (
          <Link
            href="/generate"
            className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate Worksheet
          </Link>
        ) : (
          <p className="text-gray-500 text-sm mt-2">
            Upgrade your plan to unlock worksheet generation.
          </p>
        )} */
}
{
  /* ✅ Conditional UI logic for worksheet generation */
}
