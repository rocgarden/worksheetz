// // lib/usage.ts
// export async function getUserMonthlyUsage(supabase, tableName, userId) {
//   const startOfMonth = new Date();
//   startOfMonth.setDate(1);
//   startOfMonth.setHours(0, 0, 0, 0);

//   const { count, error } = await supabase
//     .from(tableName)
//     .select("*", { count: "exact", head: true })
//     .eq("user_id", userId)
//     .gte("created_at", startOfMonth.toISOString());

//   const { count: generationCount } = await supabase
//     .from("ai_generations")
//     .select("*", { count: "exact", head: true })
//     .eq("user_id", userId)
//     .gte("created_at", startOfMonth.toISOString());

//   const { count: downloadCount } = await supabase
//     .from("pdf_downloads")
//     .select("*", { count: "exact", head: true })
//     .eq("user_id", userId)
//     .gte("created_at", startOfMonth.toISOString());

//   if (error) {
//     console.error(`❌ Error counting ${tableName} for user ${userId}`, error);
//     return 0;
//   }

//   //return count ?? 0;
//   return {
//     count: count ?? 0,
//     generationCount: generationCount || 0,
//     downloadCount: downloadCount || 0,
//   };
// }

// lib/usage.ts

/**
 * Tracks user usage and manages plan + bonus credits for AI generations and PDF downloads.
 * Works for both API routes, layout checks, and dashboard display.
 */

// lib/usage.ts

/**
 * Returns a user's current monthly usage and manages plan + bonus credits.
 * Works for both generations and downloads.
 */
export async function getUserMonthlyUsage(supabase, tableName, userId) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // 1️⃣ Fetch the user's bonus from profiles
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("generation_bonus, pdf_bonus, upgrade_date")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("❌ Failed to fetch profile bonuses:", profileError);
  }
  // 2️⃣ Determine effective start date
  const effectiveStart = profile?.upgrade_date
    ? new Date(profile.upgrade_date)
    : startOfMonth;

  // 3️⃣ Count usage since effectiveStart for both types
  const { count: generationCount } = await supabase
    .from("ai_generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", effectiveStart.toISOString());

  const { count: downloadCount } = await supabase
    .from("pdf_downloads")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", effectiveStart.toISOString());

  let generationBonus = profile?.generation_bonus ?? 0;
  let pdfBonus = profile?.pdf_bonus ?? 0;
  console.log(
    `📊 2nd log:: User has generated ${profile.generation_bonus}generation bonus this month`
  );
  // 4️⃣ Return unified data for all usage checks
  return {
    generationCount: generationCount || 0,
    downloadCount: downloadCount || 0,
    generationBonus,
    pdfBonus,
  };
}

// 3️⃣ Automatically decrement bonus if user is over plan
// if (planInfo) {
//   if (tableName === "ai_generations") {
//     const planLimit = planInfo.monthlyGenerations;
//     if (generationCount >= planLimit && generationBonus > 0) {
//       generationBonus -= 1;
//       await supabase
//         .from("profiles")
//         .update({ generation_bonus: generationBonus })
//         .eq("id", userId);
//       console.log(
//         `🟡 Used 1 AI bonus for ${userId}, remaining: ${generationBonus}`
//       );
//     }
//   }

//   if (tableName === "pdf_downloads") {
//     const planLimit = planInfo.monthlyPdfs;
//     if (downloadCount >= planLimit && pdfBonus > 0) {
//       pdfBonus -= 1;
//       await supabase
//         .from("profiles")
//         .update({ pdf_bonus: pdfBonus })
//         .eq("id", userId);
//       console.log(
//         `🟣 Used 1 PDF bonus for ${userId}, remaining: ${pdfBonus}`
//       );
//     }
//   }
// }
