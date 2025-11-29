import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: ShipFast
// - Contact information: marc@shipfa.st
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - Ownership: when buying a package, users can download code to create apps. They own the code but they do not have the right to resell it. They can ask for a full refund within 7 day after the purchase.
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://shipfa.st/privacy-policy
// - Governing Law: France
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
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
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Terms and Conditions for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`🧾 TERMS OF SERVICE

Effective Date: October 20, 2025

Welcome to Worksheetz AI (“we,” “us,” or “our”).
By using our website and services (the “Service”), you agree to these Terms of Service.
If you do not agree, please do not use the Service.

1. Eligibility

You must be 18 years or older to use this website.
No children or minors are permitted to register or use the Service.

2. Account and Access
You must use a valid email address and legitimate payment method when subscribing. 
Accounts using fake emails or invalid credit cards may be terminated without notice. Each email address may be associated with only one account at a time. Creating multiple accounts using the same email is not permitted.
Users may not sign up or create accounts on behalf of other individuals. Subscribers may access general information about their account—such as generation count, PDF downloads count, and active subscription plan—through the website. 
Billing details are handled by Stripe and can be managed via your Stripe billing portal. Any violation may result in immediate account deactivation without refund.

3. Acceptable Use

You agree not to:

Upload, generate, or share any lewd, inappropriate, or illegal content.

Abuse or excessively use the Service beyond fair usage.

Enter or share private, confidential, or personal data within prompts or uploaded content.

Any violation may result in immediate account deactivation without refund.

4. AI Content Disclaimer

Our Service uses artificial intelligence (“AI”) to generate content.
AI output may be inaccurate, biased, or incomplete.
You understand and agree that you are responsible for how you use or rely on any generated content.

We make no guarantees about the accuracy, quality, or suitability of generated materials.

5. Payments, Subscriptions, and Refunds

All payments are processed securely through Stripe.
We do not store your credit card information on our servers.
There are no refunds, except where required by law.

If a new subscription plan becomes available, there are no automatic upgrades or partial refunds.

6. Generated Content and Rights

If you upload or generate content using the Service, you are responsible for ensuring that:

You own or have rights to use such content.

The content does not infringe on others’ rights or laws.

By using the Service, you grant Worksheet AI a worldwide, non-exclusive, royalty-free license to use your content to:

Operate and improve the Service.

Train models and enhance features.

This license survives termination of your account.

7. Downloads and File Access

Generated PDFs and materials are available for single download only.
Re-downloads are not supported by the system.
Please ensure you save your files securely after downloading.

8. Termination

We reserve the right to suspend or terminate your account if:

You violate these Terms.

You misuse or abuse the system.

Fraud, chargebacks, or suspicious activity are detected.

Termination may occur without prior notice.

9. External Services

We integrate with third-party tools including:

Stripe (billing and payments)

Google Analytics (site analytics)

Zenvoice (invoicing)

Byedispute (fraud monitoring)

Database and hosting providers (e.g., Vercel, AWS, or similar)

We are not responsible for issues or data handling practices of these services.

10. Limitation of Liability

To the fullest extent allowed by law:

Worksheet AI is not liable for any damages resulting from your use or inability to use the Service.

You use the Service at your own risk.

11. Changes to Terms

We may update these Terms periodically.
The “Effective Date” will indicate the latest version.
Continued use of the Service after updates constitutes acceptance of the revised Terms.

12. Contact

For any questions, contact:
📧 hello@worksheetzai.com`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;

// We may offer an option to switch plans by paying the difference in price.
