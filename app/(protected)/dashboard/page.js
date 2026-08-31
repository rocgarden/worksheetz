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
import NoSubLibrarySection from "@/components/NoSubLibrarySection";
import AdminPublishPanel from "@/components/AdminPublishPanel";

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
  const adminEmail = process.env.ADMIN_EMAIL;
  const isAdmin =
    (user.email || "").toLowerCase() === adminEmail?.toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from("profiles") // or 'profiles' depending on your schema
    .select(
      "id, name, email, created_at, customer_id, price_id, has_access, cancel_at_period_end, current_period_end, payment_failed, upgrade_date, billing_name, billing_address",
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
    planInfo,
  );

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
    (plan) => plan.priceId === profile?.price_id,
  );
  const freePlan = config.stripe.plans[0];
  const proPlan = config.stripe.plans[1];

  const hasNoPlan = !profile.price_id;
  const isFreePlan = profile.price_id === freePlan.priceId;
  const isProPlan = profile.price_id === proPlan.priceId;
  const isSubscribed = !planInfo.isFree;

  return (
    <main
      className="
      min-h-screen
      px-6
      py-10
      md:px-8
      md:py-14

      bg-gradient-to-b
      from-purple-50
      via-white
      to-purple-50
    "
    >
      <section className="max-w-5xl mx-auto space-y-8">
        {/* Messages */}
        <div className="space-y-3">
          {message === "limit-reached" && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
              🚫 You’ve reached your monthly generation limit. Upgrade your plan
              to continue.
            </p>
          )}

          {message === "no-plan" && (
            <p className="rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-yellow-700">
              ⚠️ You don’t have an active plan. Please choose one to start
              generating worksheets.
            </p>
          )}

          {message === "upgrade-needed" && (
            <p className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-700">
              💡 Upgrade to Pro to unlock more worksheet generations.
            </p>
          )}
        </div>

        {/* Header */}
        <div
          className="
          rounded-[2rem]
          border
          border-purple-100
          bg-white/80
          backdrop-blur-sm
          shadow-sm
          px-6
          py-8
          md:px-8
        "
        >
          <p className="text-primary font-semibold mb-2">Teacher Dashboard</p>

          <h1 className="text-3xl md:text-4xl font-extrabold text-base-content">
            Welcome back!
          </h1>

          <p className="text-base-content/70 mt-3 max-w-2xl">
            Manage your worksheet access, usage, classroom tools, and account
            details from one place.
          </p>
        </div>

        {/* Main dashboard grid */}
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
          {/* Left column */}
          <div className="space-y-6">
            {/* <div className="rounded-[2rem] border border-base-300 bg-white shadow-sm p-6"> */}
            <ProfileCard profile={profile} planInfo={planInfo.name} />
            {/* </div> */}

            {/* <div className="rounded-[2rem] border border-base-300 bg-white shadow-sm p-6"> */}
            <UsageStats
              generationCount={usage.generationCount || 0}
              downloadCount={usage.downloadCount || 0}
              generationBonus={usage.generationBonus || 0}
              pdfBonus={usage.pdfBonus || 0}
              planGenerations={planInfo.monthlyGenerations}
              planPdfs={planInfo.monthlyPdfs}
            />
            {/* </div> */}

            <div className="rounded-[2rem] border border-base-300 bg-white shadow-sm p-6">
              <BillingDetailsForm profile={profile} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Plan actions */}
            <div className="rounded-[2rem] border border-base-300 bg-white shadow-sm p-6">
              {hasNoPlan && (
                <ButtonCheckout
                  mode="subscription"
                  priceId={freePlan.priceId}
                  text="Get Started for Free"
                />
              )}

              {isFreePlan && <ButtonAccount text="Upgrade to Pro" />}

              {isProPlan && (
                <p className="text-sm text-gray-500">You’re on the Pro plan.</p>
              )}

              {isSubscribed && !hasNoPlan ? (
                canGenerate ? (
                  <>
                    <Link
                      href="/generate"
                      className="
                      inline-flex
                      items-center
                      justify-center
                      mt-4
                      bg-primary
                      text-white
                      px-5
                      py-2.5
                      rounded-full
                      font-semibold
                      hover:opacity-90
                      transition
                    "
                    >
                      Generate Worksheet
                    </Link>

                    {!canDownload && usage.pdfBonus === 0 && (
                      <p className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-yellow-700 text-sm mt-4">
                        ⚠️ You’ve reached your monthly PDF download limit (
                        {planInfo.monthlyPdfs}). You can still generate
                        worksheets but won’t be able to download them.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm mt-4">
                    You’ve reached your total generation limit. Upgrade or wait
                    until next month.
                  </p>
                )
              ) : (
                <div>
                  <p className="text-gray-500 text-sm mt-2">
                    Upgrade to the free Start plan to unlock more worksheet
                    generations.
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Practice */}
            <div
              className="
              relative
              overflow-hidden
              rounded-[2rem]
              border-2
              border-purple-900/30
              bg-purple-500
              text-white
              shadow-[0_24px_80px_rgba(88,28,135,0.18)]
              p-6
            "
            >
              <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-white text-purple-700 text-xs font-bold px-3 py-1 rounded-full">
                    FREE BETA
                  </span>
                </div>

                <h2 className="text-lg font-bold text-white">
                  Interactive Student Practice
                </h2>

                <p className="text-sm text-white/85 mt-2 mb-5">
                  Adaptive ELA practice for grades 6–8. Assign sessions, track
                  progress, and view skill gaps.
                </p>

                <Link
                  href="/classroom"
                  className="
                  inline-flex
                  items-center
                  justify-center
                  bg-white
                  text-purple-800
                  font-semibold
                  px-5
                  py-2.5
                  rounded-full
                  hover:bg-purple-50
                  transition
                "
                >
                  Go to My Classrooms →
                </Link>
              </div>
            </div>
            <div className="rounded-[2rem] border border-base-300 bg-white shadow-sm p-6">
              <NoSubLibrarySection />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-purple-200 bg-white p-8 shadow-sm">
              <p className="mb-2 font-semibold text-primary">
                Passage Bank Admin
              </p>

              <h2 className="text-xl font-bold">Manage adaptive content</h2>

              <p className="mt-2 mb-5 text-sm text-base-content/70">
                Generate, review, publish, revise, and activate passage-bank
                packages.
              </p>

              <Link
                href="/admin/passage-bank"
                className="
          inline-flex
          items-center
          justify-center
          rounded-full
          bg-primary
          px-5
          py-2.5
          font-semibold
          text-white
          transition
          hover:opacity-90
        "
              >
                Manage Passage Bank →
              </Link>
            </div>
            <div className="border rounded-xl p-8 m-20 bg-white">
              <h2 className="text-xl font-bold">
                Admin: Publish Giveaway PDFs
              </h2>
              <p className="text-sm opacity-70">
                Select a worksheet and publish it to the samples bucket.
              </p>

              <AdminPublishPanel />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

