// /libs/v2/passageBank/requirePassageBankAdminPage.js
//
// Shared authentication and authorization helper for server-rendered
// passage-bank admin pages.

import { redirect } from "next/navigation";

import config from "@/config";
import { createClient } from "@/libs/supabase/server";

function getAdminEmails() {
  return new Set(
    [
      process.env.ADMIN_EMAIL || "",
      process.env.ADMIN_EMAILS || "",
    ]
      .join(",")
      .split(",")
      .map((email) =>
        email.trim().toLowerCase(),
      )
      .filter(Boolean),
  );
}

/**
 * Requires a signed-in passage-bank administrator.
 *
 * Unauthenticated users are redirected to login.
 * Authenticated non-admin users are redirected to the dashboard.
 *
 * @returns {Promise<{
 *   user: object,
 *   supabase: object
 * }>}
 */
export async function requirePassageBankAdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(config.auth.loginUrl);
  }

  const userEmail =
    typeof user.email === "string"
      ? user.email.trim().toLowerCase()
      : "";

  if (
    !userEmail ||
    !getAdminEmails().has(userEmail)
  ) {
    redirect("/dashboard");
  }

  return {
    user,
    supabase,
  };
}