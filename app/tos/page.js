import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
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
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pt-6 pb-8">
          Terms and Conditions for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap text-base"
          style={{ fontFamily: "sans-serif" }}
        >
          {`🧾 TERMS OF SERVICE

Effective Date: October 20, 2025

Welcome to Teks Portfolio ("we," "us," or "our").
By using our website and services (the "Service"), you agree to these Terms of Service.
If you do not agree, please do not use the Service.

1. Eligibility

Teacher and account holder eligibility: You must be 18 years or older to create an account or subscribe to the Service.

Student participation: Students under 18, including middle school students, may use the adaptive assessment feature solely at the direction of, and under the supervision of, a teacher or school with an active account. Students do not register for accounts, do not agree to these Terms themselves, and their participation is governed by the school's or teacher's own policies and consent obtained from parents/guardians as applicable. See our Privacy Policy for details on what limited student information is collected.

2. Account and Access
You must use a valid email address and legitimate payment method when subscribing. 
Accounts using fake emails or invalid credit cards may be terminated without notice. Each email address may be associated with only one account at a time. Creating multiple accounts using the same email is not permitted.
Users may not sign up or create accounts on behalf of other individuals. Subscribers may access general information about their account—such as generation count, PDF downloads count, and active subscription plan—through the website. 
Billing details are handled by Stripe and can be managed via your Stripe billing portal. Any violation may result in immediate account deactivation without refund.

3. Acceptable Use

You agree not to:

Upload, generate, or share any lewd, inappropriate, or illegal content.

Abuse or excessively use the Service beyond fair usage.

Enter or share private, confidential, or personal data within prompts or uploaded content, beyond the limited student information (first name and teacher-issued join code) the adaptive assessment feature is designed to collect.

Any violation may result in immediate account deactivation without refund.

4. Teacher and School Responsibility

If you use the adaptive assessment feature with students, you represent and warrant that:

You are authorized by your school or district to use the Service with your students.

You have obtained any consent required under your school's or district's policies, including under FERPA or COPPA, for students to participate.

You will only collect and use student information through the Service for legitimate educational purposes.

5. Content Generation Disclaimer

Our Service uses adaptive content generation technology to create worksheets, passages, and assessment questions.
Generated output may be inaccurate, biased, or incomplete.
You understand and agree that you are responsible for reviewing generated content before assigning it to students and for how you use or rely on any generated content.

We make no guarantees about the accuracy, quality, or suitability of generated materials.

6. Payments, Subscriptions, and Refunds

All payments are processed securely through Stripe.
We do not store your credit card information on our servers.
There are no refunds, except where required by law.

If a new subscription plan becomes available, there are no automatic upgrades or partial refunds.

7. Generated Content and Rights

If you upload or generate content using the Service, you are responsible for ensuring that:

You own or have rights to use such content.

The content does not infringe on others' rights or laws.

By using the Service, you grant Teks Portfolio a worldwide, non-exclusive, royalty-free license to use content you upload or generate (such as worksheet topics, prompts, or customizations) to:

Operate and improve the Service.

Train and improve our content generation systems.

This license does not extend to student assessment responses or other student information, which we use solely to operate the Service and provide results to the teacher, as described in our Privacy Policy. This license survives termination of your account.

8. Downloads and File Access

Generated PDFs and materials are available for single download only.
Re-downloads are not supported by the system.
Please ensure you save your files securely after downloading.

9. Termination

We reserve the right to suspend or terminate your account if:

You violate these Terms.

You misuse or abuse the system.

Fraud, chargebacks, or suspicious activity are detected.

Termination may occur without prior notice.

10. External Services

We integrate with third-party tools including:

Stripe (billing and payments)

Google Analytics (site analytics)

Zenvoice (invoicing)

Byedispute (fraud monitoring)

Database and hosting providers (e.g., Vercel, AWS, or similar)

We are not responsible for issues or data handling practices of these services.

11. Limitation of Liability

To the fullest extent allowed by law:

Teks Portfolio is not liable for any damages resulting from your use or inability to use the Service.

You use the Service at your own risk.

12. Changes to Terms

We may update these Terms periodically.
The "Effective Date" will indicate the latest version.
Continued use of the Service after updates constitutes acceptance of the revised Terms.

13. Contact

For any questions, contact:
📧 hello@teksportfolio.com`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;

// We may offer an option to switch plans by paying the difference in price.