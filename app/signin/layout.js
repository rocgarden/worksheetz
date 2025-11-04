import config from "@/config";
import { getSEOTags } from "@/libs/seo";
import { Suspense } from "react";
export const metadata = getSEOTags({
  title: `Sign-in to ${config.appName}`,
  canonicalUrlRelative: "/auth/signin",
});

export default function Layout({ children }) {
  return (
    <>
      <Suspense fallback={<div />}>{children}</Suspense>
    </>
  );
}
