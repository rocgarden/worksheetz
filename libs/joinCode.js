// /libs/joinCode.js
// Branch: v2/student-success-platform
//
// Generates a unique 6-digit numeric join code for adaptive_sessions.
// Verifies uniqueness against the DB before returning — retries on collision.

import { createV2ServiceClient } from "@/libs/supabase/server-v2";

const MAX_ATTEMPTS = 10;

function randomSixDigits() {
  // Produces a zero-padded 6-digit string: "000000" – "999999"
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export async function generateJoinCode() {
  const serviceSupabase = await createV2ServiceClient();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = randomSixDigits();

    // Check whether this code is already in use on an active session.
    // We only check in_progress sessions — completed/abandoned codes
    // can be safely recycled once the session is no longer live.
    const { data: existing, error } = await serviceSupabase
      .from("adaptive_sessions")
      .select("id")
      .eq("join_code", code)
      .eq("status", "in_progress")
      .maybeSingle();

    if (error) {
      // Log but don't throw — let the loop try a new code
      console.error("[generateJoinCode] uniqueness check error:", error);
      continue;
    }

    if (!existing) {
      // No active session is using this code — safe to return
      return code;
    }

    // Collision — regenerate
    console.warn(`[generateJoinCode] collision on ${code}, retrying…`);
  }

  // Extremely unlikely with 1M possible codes, but fail loudly if it happens
  throw new Error(
    "[generateJoinCode] Could not generate a unique join code after max attempts."
  );
}