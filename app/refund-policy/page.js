import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Refund Policy | ${config.appName}`,
  canonicalUrlRelative: "/refund-policy",
});

const RefundPolicy = () => {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-10">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pt-6 pb-8">
          Refund Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap text-base"
          style={{ fontFamily: "sans-serif" }}
        >
          {`

🔒 REFUND POLICY

Effective Date: October 20, 2025

We want you to feel confident using Teks Portfolio. If you're not satisfied with your purchase, we offer a full refund within 7 days of your initial subscription payment — no questions asked.

After 7 days, refunds are only granted in the following situations:

Duplicate charges (you were billed more than once by mistake)

Technical issues that prevent you from accessing or using the service

Billing errors

Unauthorized or fraudulent transactions

Refunds are not provided for:

Failure to cancel before renewal

Change of mind after the 7‐day window

Lack of usage

Dissatisfaction with generated content (results may vary and should be reviewed for accuracy)

To request a refund, contact us at hello@teksportfolio.com and we'll respond within 24–48 hours.

Last updated: October 20, 2025`}
        </pre>
      </div>
    </main>
  );
};

export default RefundPolicy;