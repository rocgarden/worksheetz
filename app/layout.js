import { Inter } from "next/font/google";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Disclaimer from "@/components/Disclaimer";
import { Suspense } from "react";
import ConditionalAnalytics from "@/components/ConditionalAnalytics";
import CookieBanner from "@/components/CookieBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AnalyticsRouteTracker from "@/components/AnalyticsRouteTracker";
// import GoogleAnalytics from "@/components/GoogleAnalytics";
const font = Inter({ subsets: ["latin"] });

export const viewport = {
  // Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className={font.className}>
      <body>
        {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        {/* ✅ Required because AnalyticsRouteTracker uses useSearchParams */}
        <Suspense fallback={null}>
          <AnalyticsRouteTracker />
        </Suspense>{" "}
        <ClientLayout>
          <Suspense fallback={<div />}>
            <Header />
          </Suspense>
          {children}
          <Disclaimer />
          <Footer />
          <ConditionalAnalytics />
          <CookieBanner />
        </ClientLayout>
      </body>
    </html>
  );
}
