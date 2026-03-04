import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR PRIVACY POLICY — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple privacy policy for my website. Here is some context:
// - Website: https://shipfa.st
// - Name: ShipFast
// - Description: A JavaScript code boilerplate to help entrepreneurs launch their startups faster
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Purpose of Data Collection: Order processing
// - Data sharing: we do not share the data with any other parties
// - Children's Privacy: we do not collect any data from children
// - Updates to the Privacy Policy: users will be updated by email
// - Contact information: marc@shipfa.st

// Please write a simple privacy policy for my site. Add the current date.  Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
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
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
          {`

🔒 PRIVACY POLICY

Effective Date: October 20, 2025

Your privacy matters to us. This Privacy Policy explains what data we collect, how we use it, and how it’s protected.

Definitions
- “Service” refers to Worksheetz AI and all related features.
- “Personal Data” means information that identifies an individual, such as name or email.
- “Usage Data” means anonymized information collected automatically, such as device type or browser.
- “You” refers to the teacher or adult user accessing the Service.


1. Information We Collect

When you use Worksheetz AI, we may collect:

Account Information: name, email address, date joined.

Usage Data: AI generations, PDF downloads, and session activity.

Payment Data: handled by Stripe (we do not store credit card details).

Analytics Data: from Google Analytics and hosting tools (e.g., Vercel).

We may also record general device and browser information for site performance.

2. How We Use Your Information

We use collected information to:

Provide and maintain the Service.

Track user activity and usage limits.

Generate and deliver requested PDFs or AI content.

Manage subscriptions, invoices, and billing through Stripe or Zenvoice.

Detect fraud via services like Byedispute.

Analyze traffic and improve performance.

3. Data Storage and Security

Data is stored securely using managed services (e.g., MongoDB, Supabase, or equivalent).
We use SSL encryption and industry-standard measures to protect user information.

However, no online system is 100% secure, and you use the Service at your own risk.

4. Sharing of Information

We may share limited user data with:

Stripe – payment and billing processing

Google Analytics – website performance metrics

Zenvoice – invoice creation

Byedispute – fraud prevention

Hosting and database providers – infrastructure support

We do not sell or trade your personal data.

5. Data Retention

We retain your data for as long as your account is active or as needed to:

Provide the Service

Comply with legal obligations

Resolve disputes

You can request deletion of your account and associated data at any time by contacting us.

6. Cookies and Tracking

We use cookies and analytics tools to track anonymous usage and improve the site experience.
You can disable cookies in your browser, but some features may not function properly.

7. Your Rights

You have the right to:

Access and review your personal data

Request correction or deletion

Withdraw consent for marketing (if any)

Contact us directly for assistance.

8. Children’s Privacy

Our Service is not intended for children under 18.
We do not knowingly collect personal data from minors.

9. Updates

We may revise this Privacy Policy from time to time.
The latest version will always be available on our website.

10. Google User Data

Our application supports sign-in using Google OAuth. When you choose to sign in with Google, we request access only to the following non-sensitive Google account information:

Data Accessed
- Basic account information associated with your Google account, including:
  - Your email address
  - Your name
  - Your profile picture
- A unique Google account identifier used for authentication purposes

These permissions correspond to the following Google OAuth scopes:
- openid
- https://www.googleapis.com/auth/userinfo.email
- https://www.googleapis.com/auth/userinfo.profile

Data Usage
We use this Google user data solely to:
- Authenticate you and allow secure sign-in to your account
- Create and manage your user account within Worksheetz AI
- Display basic account information (such as your name or profile image) within the application

We do not use Google user data for advertising, marketing, or profiling purposes.

Data Storage
- We store only the minimum information necessary to operate your account (such as your email address, name, and profile image URL).
- Google access tokens, if stored, are secured and used only to maintain your login session.

Data Sharing
- We do not sell, rent, or trade Google user data.
- Google user data is not shared with third parties except as necessary to operate the Service (such as secure hosting or database providers), or if required by law.

Data Deletion
You may request deletion of your account and associated data at any time by contacting us at hello@worksheetzai.com. Upon deletion, any stored Google account information will be permanently removed.

11. Children’s Internet Protection Act (CIPA)
Worksheetz AI complies with the Children’s Internet Protection Act by ensuring that no harmful or inappropriate content is accessible through the platform. 
Worksheetz AI does not provide access to social networking, messaging, or user-generated content. The service is intended solely for educators, and no student accounts or student data are collected, stored, or processed.

12.FERPA Alignment and No Student Data
Worksheetz AI is designed for teacher use only. Students do not create accounts and do not interact with the Service. We do not collect, store, or process any student personal information, student identifiers, student work, or student behavioral data. Because no student data is collected, Worksheetz AI is inherently low‑risk and aligned with FERPA expectations.

13.Children’s Online Privacy Protection Act (COPPA)
Worksheetz AI is not directed to children under the age of 13. We do not knowingly collect personal information from children. If we become aware that a child has provided personal information, we will delete it promptly.

14.Legal Basis for Processing
We process personal data based on:
- Your consent when creating an account
- The need to provide and maintain the Service
- Compliance with legal obligations
- Legitimate interests such as improving performance and preventing fraud

15.Your Data Protection Rights
You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Request restriction of processing
- Withdraw consent at any time

16. Data Transfers
Your information may be processed and stored in the United States. By using the Service, you consent to the transfer of your information to U.S.-based service providers that follow industry-standard protections.

17. Security Practices
We use encryption in transit (HTTPS), encryption at rest (where supported by our providers), access controls, and monitoring to protect your data. Only authorized personnel may access user information, and only when necessary to operate the Service.

Contact Us

For privacy-related requests or questions, email:
📧 hello@worksheetzai.com`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
