/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/libs/supabase/client";
import config from "@/config";

// A simple button to sign in with our providers (Google & Magic Links).
// It automatically redirects user to callbackUrl (config.auth.callbackUrl) after login, which is normally a private page for users to manage their accounts.
// If the user is already logged in, it will show their profile picture & redirect them to callbackUrl immediately.
const ButtonSignin = ({
  text = "Get started",
  extraStyle,
  renderLinks,
  redirectTo,
}) => {
  const supabase = createClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/"; // or use router.push() if you're using next/navigation
  };
  // If renderLinks is passed, use that to render dynamic nav links
  if (renderLinks) {
    return <>{renderLinks({ user })}</>;
  }

  if (user) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:justify-end">
        {/* <Link
          href={config.auth.callbackUrl}
          className={`btn w-full sm:w-auto ${extraStyle ? extraStyle : ""}`}
        >
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user?.user_metadata?.avatar_url}
              alt={user?.user_metadata?.name || "Account"}
              className="w-6 h-6 rounded-full shrink-0"
              referrerPolicy="no-referrer"
              width={24}
              height={24}
            />
          ) : (
            <span className="w-6 h-6 bg-base-300 flex justify-center items-center rounded-full shrink-0">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0)}
            </span>
          )}
          {user?.user_metadata?.name || user?.email || "Account"}
        </Link> */}

        <button
          onClick={handleSignOut}
          className="btn btn-custom rounded-full text-sm w-full sm:w-auto"
        >
          Sign Out
        </button>
      </div>
    );
  }
  // ✅ If not logged in, build the login link dynamically
  const loginUrl = `${config.auth.loginUrl}?redirectTo=${
    redirectTo || config.auth.callbackUrl
  }`;

  return (
    // <Link
    //   className={`btn btn-custom bg-primary rounded-full  ${
    //     extraStyle ? extraStyle : ""
    //   }`}
    //   href={loginUrl}
    // >
    //   {text}
    // </Link>
    <Link
      className={`btn btn-custom bg-primary rounded-full ${extraStyle || ""}`}
      href={`${config.auth.loginUrl}?redirectTo=${encodeURIComponent(
        redirectTo || config.auth.callbackUrl
      )}`}
    >
      {text}
    </Link>
  );
};

export default ButtonSignin;
