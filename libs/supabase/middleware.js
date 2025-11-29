//app/libs/supabase/middleware.js
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  // Skip auth refresh for API routes that don't need authentication
  const { pathname } = request.nextUrl;
  const skipAuthRoutes = ["/api/webhook", "/api/lead"];

  if (skipAuthRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next({
      request,
    });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // refreshing the auth token
  //await supabase.auth.getUser();
  // Refresh the auth token and get user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if route requires authentication
  // const protectedPaths = ["/dashboard", "/generate", "/Worksheet-Editor"];
  // const isProtectedRoute = protectedPaths.some((path) =>
  //   pathname.startsWith(path)
  // );

  // Redirect to signin if not authenticated and accessing protected route
  // if (isProtectedRoute && !user) {
  //   const url = request.nextUrl.clone();
  //   url.pathname = "/signin";
  //   return NextResponse.redirect(url);
  // }
  // NEW - add this instead
  const aggressiveNoCachePaths = ["/generate", "/Worksheet-Editor"];
  const needsAggressiveNoCache = aggressiveNoCachePaths.some((path) =>
    pathname.startsWith(path)
  );

  if (needsAggressiveNoCache) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private, max-age=0"
    );
    supabaseResponse.headers.set("Pragma", "no-cache");
    supabaseResponse.headers.set("Expires", "0");
  }
  return supabaseResponse;
}
