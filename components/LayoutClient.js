//components/LayoutClient.js
"use client";

import { createClient } from "@/libs/supabase/client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Crisp } from "crisp-sdk-web";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "react-hot-toast";
import { Tooltip } from "react-tooltip";
import config from "@/config";
import { useRouter } from "next/navigation";
// Crisp customer chat support:
// This component is separated from ClientLayout because it needs to be wrapped with <SessionProvider> to use useSession() hook
const CrispChat = () => {
  const pathname = usePathname();
  const [data, setData] = useState(null);

  // This is used to get the user data from Supabase Auth (if logged in) => user ID is used to identify users in Crisp
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setData({ user });
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (config?.crisp?.id) {
      // Set up Crisp
      Crisp.configure(config.crisp.id);

      // (Optional) If onlyShowOnRoutes array is not empty in config.js file, Crisp will be hidden on the routes in the array.
      // Use <AppButtonSupport> instead to show it (user clicks on the button to show Crisp—it cleans the UI)
      if (
        config.crisp.onlyShowOnRoutes &&
        !config.crisp.onlyShowOnRoutes?.includes(pathname)
      ) {
        Crisp.chat.hide();
        Crisp.chat.onChatClosed(() => {
          Crisp.chat.hide();
        });
      }
    }
  }, [pathname]);

  // Add User Unique ID to Crisp to easily identify users when reaching support (optional)
  useEffect(() => {
    if (data?.user && config?.crisp?.id) {
      Crisp.session.setData({ userId: data.user?.id });
    }
  }, [data]);

  return null;
};

//****************************commented out the original client code here and added the client code to use auth auto sign out */

// All the client wrappers are here (they can't be in server components)
// 1. NextTopLoader: Show a progress bar at the top when navigating between pages
// 2. Toaster: Show Success/Error messages anywhere from the app with toast()
// 3. Tooltip: Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content=""
// 4. CrispChat: Set Crisp customer chat support (see above)
// const ClientLayout = ({ children }) => {
//   return (
//     <>
//       {/* Show a progress bar at the top when navigating between pages */}
//       <NextTopLoader color={config.colors.main} showSpinner={false} />

//       {/* Content inside app/page.js files  */}
//       {children}

//       {/* Show Success/Error messages anywhere from the app with toast() */}
//       <Toaster
//         toastOptions={{
//           duration: 3000,
//         }}
//       />

//       {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
//       <Tooltip
//         id="tooltip"
//         className="z-[60] !opacity-100 max-w-sm shadow-lg"
//       />

//       {/* Set Crisp customer chat support */}
//       <CrispChat />
//     </>
//   );
// };

// export default ClientLayout;

const ClientLayout = ({ children }) => {
  const router = useRouter();
  const supabase = createClient();

  // 🔒 SIGN OUT LISTENER (always keep this)
  // useEffect(() => {
  //   const { data: listener } = supabase.auth.onAuthStateChange(
  //     (event, session) => {
  //       if (event === "SIGNED_OUT" || !session) {
  //         router.replace("/"); // or "/"
  //       }
  //     }
  //   );

  //   return () => {
  //     listener?.subscription.unsubscribe();
  //   };
  // }, [supabase, router]);
  //SIGN OUT LISTENER ADDED ABOVE- sign out on other tabs
  // components/LayoutClient.js

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          // If this is a secondary tab (has opener), close it
          if (window.opener) {
            window.close();
          } else {
            router.replace("/");
          }
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [supabase, router]);

  // 🕒 AUTO LOGOUT ON USER INACTIVITY (IDLE LOGOUT)
  useEffect(() => {
    let idleTimer;

    const logout = async () => {
      console.log("⏳ Idle timeout — signing out user");
      await supabase.auth.signOut();
      router.replace("/");
    };

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      //idleTimer = setTimeout(logout, 10000); // 10 minutes
      idleTimer = setTimeout(logout, 30 * 60 * 1000); // 30 minutes
    };

    // Listen to activity
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetIdleTimer));

    resetIdleTimer(); // start timer

    return () => {
      clearTimeout(idleTimer);
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
    };
  }, [supabase, router]);

  // Optional: auto sign-out after 12 hours
  // useEffect(() => {
  //   const timeout = setTimeout(
  //     async () => {
  //       console.log(
  //         "⏰ Auto sign-out triggered after 30 minutes of session time."
  //       );
  //       await supabase.auth.signOut();
  //     },
  //     30 * 60 * 1000
  //     // 12 * 60 * 60 * 1000
  //   ); // 12 hours

  //   return () => clearTimeout(timeout);
  // }, [supabase]);
  return (
    <>
      {/* Show a progress bar at the top when navigating between pages */}
      <NextTopLoader color={config.colors.main} showSpinner={false} />

      {/* Content inside app/page.js files  */}
      {children}

      {/* Show Success/Error messages anywhere from the app with toast() */}
      <Toaster
        toastOptions={{
          duration: 3000,
        }}
      />

      {/* Show tooltips if any JSX elements has these 2 attributes: data-tooltip-id="tooltip" data-tooltip-content="" */}
      <Tooltip
        id="tooltip"
        className="z-[60] !opacity-100 max-w-sm shadow-lg"
      />

      {/* Set Crisp customer chat support */}
      <CrispChat />
    </>
  );
};
export default ClientLayout;
