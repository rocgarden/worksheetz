"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";

export default function GoogleAnalytics() {
  //   useEffect(() => {
  //     const consent = Cookies.get("worksheetz_cookie_consent");

  //     if (consent !== "true") return;

  //     // Inject GA script dynamically
  //     const script1 = document.createElement("script");
  //     script1.src = `https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX`;
  //     script1.async = true;

  //     const script2 = document.createElement("script");
  //     script2.innerHTML = `
  //       window.dataLayer = window.dataLayer || [];
  //       function gtag(){dataLayer.push(arguments);}
  //       gtag('js', new Date());
  //       gtag('config', 'G-XXXXXXX');
  //     `;

  //     document.head.appendChild(script1);
  //     document.head.appendChild(script2);
  //   }, []);

  return null;
}
