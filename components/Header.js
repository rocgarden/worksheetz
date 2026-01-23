"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import ButtonSignin from "./ButtonSignin";
import logo from "@/app/icon1.png";
import config from "@/config";
import ButtonAccount from "./ButtonAccount";
import ButtonCheckout from "./ButtonCheckout";
import { createClient } from "@/libs/supabase/client";

const Header = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const supabase = createClient();

  const isHome = pathname === "/";

  // 🔐 Listen for auth changes globally
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
        } else {
          getUser();
        }
      }
    );
    return () => listener?.subscription.unsubscribe();
  }, []);

  // For closing mobile menu when route/search changes
  useEffect(() => {
    setIsOpen(false);
  }, [searchParams, pathname]);

  // ✅ Close on click outside or scroll
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    function handleScroll() {
      setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isOpen]);

  // Just show homepage links if on homepage and not authenticated
  const unauthLinks = [
    {
      href: "/#pricing",
      label: "Pricing",
      className: "  ",
    },
    { href: "/#features", label: "Features" },
    { href: "/#faq", label: "FAQ" },
  ];

  // Authenticated routes
  const authLinks = [
    {
      href: "/dashboard",
      label: "Dashboard",
      className:
        "btn text-purple-700 rounded-full  border-purple-700  p-2 hover:bg-purple-700 hover:text-white",
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-base-200/95 backdrop-blur-md shadow-sm border-b border-base-300">
      <nav className="container flex items-center justify-between px-9 py-4 mx-auto">
        {/* Logo */}
        <Link
          className="flex items-center gap-2 shrink-0"
          href="/"
          title={`${config.appName} homepage`}
        >
          <Image
            src={logo}
            alt={`${config.appName} logo`}
            width={40}
            height={40}
            className="rounded-md"
            priority
          />
          <span className="text-lg font-extrabold text-black/70 tracking-tight">
            {config.appName}
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:items-center justify-between px-6 lg:gap-30">
          <ButtonSignin
            extraStyle="hidden"
            // renderLinks={({ user }) => (
            renderLinks={() => (
              <>
                {user && <ButtonAccount />}
                {(user ? authLinks : isHome ? unauthLinks : []).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${
                      link.className ?? ""
                    } text-md gap-20  font-medium rounded-full p-2 hover:text-black/30  transition-colors ${
                      pathname === link.href
                        ? "text-primary"
                        : "text-base-content"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          />
        </div>

        {/* CTA (Sign in/out) */}
        <div className="hidden lg:flex lg:justify-end lg:flex-1">
          <ButtonSignin
            user={user}
            redirectTo={`/dashboard`}
            // redirectTo={`/checkout?priceId=${config.stripe.plans[0].priceId}`}
            extraStyle="btn-primary"
          />
        </div>

        {/* Mobile burger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 rounded-md hover:bg-base-300 transition"
        >
          <svg
            className="w-6 h-6 text-base-content"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div
          ref={menuRef}
          // className="fixed inset-0 z-40 flex justify-end  backdrop-blur-sm lg:hidden"
          className="absolute top-full left-0 w-full bg-gray-900/80 text-white flex flex-col gap-6 p-6 lg:hidden z-40"
        >
          {/* <div className="w-4/5 max-w-sm h-full shadow-xl px-6 py-6 flex flex-col justify-between animate-slideIn"> */}
          {/* <div className="bg-gray-800/50 rounded-sm "> */}
          <div className="flex items-center justify-between mb-6">
            {/* <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Image
                    src={logo}
                    alt="Logo"
                    width={36}
                    height={36}
                    className="rounded-md"
                  />
                  <span className="font-extrabold text-white/70 text-lg">
                    {config.appName}
                  </span>
                </Link> */}
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md hover:bg-base-300 transition"
            >
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile links */}
          <div className="flex flex-col space-y-4">
            <ButtonSignin
              user={user}
              extraStyle="hidden"
              renderLinks={({ user }) => (
                <>
                  {(user ? authLinks : isHome ? unauthLinks : []).map(
                    (link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="block text-lg font-large text-white/70 hover:text-primary m-5 py-5 transition"
                      >
                        {link.label}
                      </Link>
                    )
                  )}

                  {user && (
                    <>
                      <hr className="border-t border-white/30 my-4" />
                      <p>
                        <span>Manage Account</span>
                      </p>
                      <div className="text-white dark:text-black">
                        <ButtonAccount />
                      </div>
                    </>
                  )}
                </>
              )}
            />
          </div>

          {/* CTA button */}
          <div className="m-2">
            <ButtonSignin user={user} extraStyle="btn-primary w-full" />
          </div>
          {/* </div> */}
          {/* </div> */}
        </div>
      )}
    </header>
  );
};

export default Header;

{
  /* <ButtonSignin
              extraStyle="hidden"
              renderLinks={({ user }) => {
                return (
                  <>
                    {user && <ButtonAccount />}
                    {(user ? authLinks : isHome ? unauthLinks : []).map(
                      (link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block link link-hover"
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </>
                );
              }}
            /> */
}

//  const handleManageBilling = async () => {
//    try {
//      const res = await fetch("/api/stripe/create-portal", {
//        method: "POST",
//        headers: {
//          "Content-Type": "application/json",
//        },
//        body: JSON.stringify({
//          returnUrl: window.location.href,
//        }),
//      });

//      const { url, error } = await res.json();

//      if (error) {
//        throw new Error(error);
//      }

//      window.location.href = url;
//    } catch (err) {
//      console.error("⚠️ Billing portal error", err);
//      alert("Could not open billing portal: " + err.message);
//    }
//  };
