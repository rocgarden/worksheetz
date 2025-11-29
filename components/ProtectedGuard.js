// components/ProtectedGuard.js
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// //import { createClient } from "@/libs/supabase/client";
// import { createBrowserClient } from "@supabase/ssr";

// const supabase = createBrowserClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// );

// export default function ProtectedGuard({ children }) {
//   //   const [isChecking, setIsChecking] = useState(true);
//   const [isAuthorized, setIsAuthorized] = useState(false);

//   const router = useRouter();

//   useEffect(() => {
//     let mounted = true;

//     const checkAuth = async () => {
//       const {
//         data: { session },
//       } = await supabase.auth.getSession();

//       if (!mounted) return;

//       if (!session) {
//         // Use replace to prevent back button issues
//         router.replace("/signin");
//       } else {
//         setIsAuthorized(true);
//       }
//     };

//     // Check immediately on mount
//     checkAuth();

//     // Handle browser back/forward from cache
//     const handleVisibilityChange = () => {
//       if (document.visibilityState === "visible") {
//         checkAuth();
//       }
//     };

//     const handlePageShow = (event) => {
//       // If page loaded from bfcache, recheck auth
//       if (event.persisted) {
//         checkAuth();
//       }
//     };

//     // Listen for auth changes (logout, session expiry)
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((event, session) => {
//       if (!mounted) return;

//       if (event === "SIGNED_OUT" || !session) {
//         setIsAuthorized(false);
//         router.replace("/signin");
//       } else if (event === "SIGNED_IN") {
//         setIsAuthorized(true);
//       }
//     });

//     document.addEventListener("visibilitychange", handleVisibilityChange);
//     window.addEventListener("pageshow", handlePageShow);

//     return () => {
//       mounted = false;
//       subscription?.unsubscribe();
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//       window.removeEventListener("pageshow", handlePageShow);
//     };
//   }, [router]);

//   // Show nothing until authorized
//   if (!isAuthorized) {
//     return null;
//   }

//   return <>{children}</>;
// }

// components/ProtectedGuard.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAX_SESSION_AGE = 30 * 60 * 1000; // 30 minutes (change to 60000 for 1-min testing)
//const MAX_SESSION_AGE = 60000;
export default function ProtectedGuard({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/signin");
        return;
      }

      // Check session age
      const sessionStart = localStorage.getItem("session_start");
      const now = Date.now();

      if (sessionStart) {
        const age = now - parseInt(sessionStart);
        if (age > MAX_SESSION_AGE) {
          console.log("⏰ Session expired (30+ minutes)");
          localStorage.removeItem("session_start");
          await supabase.auth.signOut();
          router.replace("/signin");
          return;
        }
      } else {
        localStorage.setItem("session_start", now.toString());
      }

      setIsAuthorized(true);
    };

    checkAuth();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAuth(); // Re-check when tab becomes visible
      }
    };

    const handleFocus = () => {
      checkAuth(); // Re-check when tab gains focus
    };

    const handlePageShow = (event) => {
      if (event.persisted) {
        checkAuth();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session) {
        localStorage.removeItem("session_start");
        setIsAuthorized(false);
        router.replace("/signin");
      } else if (event === "SIGNED_IN") {
        localStorage.setItem("session_start", Date.now().toString());
        setIsAuthorized(true);
      }
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus); // ← New

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus); // ← New

      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [router]);

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
