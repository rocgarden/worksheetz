//app/(protected)/generate/layout.js
import { redirect } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import { getUserMonthlyUsage } from "@/libs/usage";
import { getPlanByPriceId } from "@/libs/planutils";
import config from "@/config";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function GenerateLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(config.auth.loginUrl);
  }
  // ✅ 2. Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("price_id")
    .eq("id", user.id)
    .single();

  // ✅ 3. Check plan
  const planInfo = getPlanByPriceId(profile?.price_id);
  // const { generationCount } = await getUserMonthlyUsage(
  //   supabase,
  //   "ai_generations",
  //   user.id
  // );
  const usage = await getUserMonthlyUsage(
    supabase,
    "ai_generations",
    user.id,
    planInfo
  );
  // const limitReached =
  //   usage.generationCount >=
  //   planInfo.monthlyGenerations + usage.generationBonus;

  //const limitReached = generationCount >= planInfo.monthlyGenerations;
  const planLimit = planInfo.monthlyGenerations;
  const bonusLeft = usage.generationBonus || 0;

  // Allow access if user still has plan slots OR bonus credits left
  const limitReached = usage.generationCount >= planLimit && bonusLeft <= 0;

  const isFree = planInfo.isFree;
  // ✅ 4. Enforce access rules
  if (!profile?.price_id) {
    // User never subscribed → redirect to dashboard with message
    redirect("/dashboard?message=no-plan");
  }

  if (limitReached) {
    redirect("/dashboard?message=limit-reached");
  }

  // ✅ Optional: free users can only access generate page if they still have remaining generations
  if (isFree && limitReached) {
    redirect("/dashboard?message=upgrade-needed");
  }

  // ✅ 5. Otherwise, allow access
  return <>{children}</>;
}
