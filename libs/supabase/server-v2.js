// /libs/supabase/server-v2.js

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export async function createV2Client() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_V2_URL,
    process.env.NEXT_PUBLIC_SUPABASE_V2_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignore from Server Components
          }
        },
      },
    }
  );
}

// Bypasses RLS — use only for server-side trusted operations
export function createV2ServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_V2_URL,
    process.env.SUPABASE_V2_SERVICE_ROLE_KEY
  );
}