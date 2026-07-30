// /libs/v2/passageBank/requirePassageBankAdmin.js
//
// Shared authentication and authorization helper for passage-bank admin routes.

import { NextResponse } from "next/server";

import { createClient } from "@/libs/supabase/server";

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

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

function isAuthorizedAdmin(user) {
  const email =
    normalizeOptionalString(
      user?.email,
    )?.toLowerCase();

  return Boolean(
    email &&
      getAdminEmails().has(email),
  );
}

/**
 * Authenticates and authorizes a passage-bank administrator.
 *
 * @returns {Promise<
 *   | {
 *       success: true,
 *       user: object,
 *       supabase: object
 *     }
 *   | {
 *       success: false,
 *       response: Response
 *     }
 * >}
 */
export async function requirePassageBankAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  if (!isAuthorizedAdmin(user)) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error:
            "Administrator access is required.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    success: true,
    user,
    supabase,
  };
}
