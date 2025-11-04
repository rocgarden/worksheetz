//app/api/auth/callback/route.js
import { NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import config from "@/config";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirectTo");
  //const next = requestUrl.searchParams.get("next"); // 👈 added

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  // ✅ Prefer redirectTo query param, fallback to dashboard
  let redirectUrl = redirectTo
    ? decodeURIComponent(redirectTo)
    : config.auth.callbackUrl;
  // ✅ Normalize: force relative paths only
  if (!redirectUrl.startsWith("/")) {
    try {
      const parsed = new URL(redirectUrl);
      redirectUrl = parsed.pathname + parsed.search + parsed.hash;
    } catch {
      redirectUrl = config.auth.callbackUrl;
    }
  }

  // ? `${requestUrl.origin}${redirectTo}`
  // : `${requestUrl.origin}${config.auth.callbackUrl}`;

  // 👇 redirect to next (like /checkout?priceId=...) or fallback to dashboard
  // ✅ Redirect to `next` if provided, else fallback to dashboard
  // const redirectUrl = next ? decodeURIComponent(next) : config.auth.callbackUrl;

  return NextResponse.redirect(`${requestUrl.origin}${redirectUrl}`);
  // return NextResponse.redirect(redirectUrl);
}
// URL to redirect to after sign in process completes- signin goes to dasboard
// return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl);
