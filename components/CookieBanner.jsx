"use client";

import CookieConsent from "react-cookie-consent";
import Link from "next/link";

export default function CookieBanner() {
  return (
    <CookieConsent
      location="bottom"
      cookieName="worksheetz_cookie_consent"
      style={{
        background: "#4c1d95",
        color: "white",
        fontSize: "14px",
        padding: "16px",
      }}
      buttonText="Accept"
      buttonStyle={{
        background: "#7c3aed",
        color: "white",
        fontSize: "14px",
        borderRadius: "6px",
        padding: "8px 16px",
        marginRight: "8px",
      }}
      enableDeclineButton
      declineButtonText="Reject"
      declineButtonStyle={{
        background: "#6b7280",
        color: "white",
        fontSize: "14px",
        borderRadius: "6px",
        padding: "8px 16px",
      }}
      expires={365}
    >
      We use cookies to improve your experience. Read our{" "}
      <Link href="/privacy-policy" className="underline text-purple-200">
        Privacy Policy
      </Link>{" "}
      {/* or{" "}
      <Link href="/cookies" className="underline text-purple-200">
        Manage Cookies
      </Link> */}
      .
    </CookieConsent>
  );
}
