"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Analytics } from "@vercel/analytics/react"; // or your analytics provider

export default function ConditionalAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const consent = Cookies.get("worksheetz_cookie_consent");
    if (consent === "true") {
      setAllowed(true);
    }
  }, []);

  if (!allowed) return null;

  return <Analytics />;
}
