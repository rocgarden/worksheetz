import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

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

Your privacy matters to us. This Privacy Policy explains what data we collect, how we use it, and how it's protected.

Definitions
- "Service" refers to Teks Portfolio and all related features, including worksheet generation and adaptive assessment & portfolio tracking.
- "Personal Data" means information that identifies an individual, such as name or email.
- "Usage Data" means information collected automatically, such as device type, browser, or activity on the Service.
- "You" refers to the teacher or adult user accessing the Service.
- "Student" refers to a minor who participates in an adaptive assessment session at a teacher's direction. Students do not create accounts and are not "Users" of the Service.


1. Information We Collect

Teacher / Account Information
When you create an account, we may collect:

Account Information: name, email address, date joined.

Usage Data: generations, PDF downloads, and session activity.

Payment Data: handled by Stripe (we do not store credit card details).

Analytics Data: from Google Analytics and hosting tools (e.g., Vercel).

We may also record general device and browser information for site performance.

Student Information (Adaptive Assessment & Portfolio only)
If a teacher uses the adaptive assessment and portfolio features, a limited amount of information about students in that teacher's classroom is collected:

- Student first name, entered by the student when joining a session with a teacher-issued join code.
- A student code, generated automatically by the platform and used in place of the student's name wherever possible in reports and internal records.
- Assessment responses and performance data (such as which questions were answered correctly and time spent), used to track progress toward Texas standards.

Students do not create accounts, do not set a password, and are not asked for an email address, date of birth, or any other contact or identifying information. Only teachers can view, manage, or delete student records for their own classroom.

2. How We Use Your Information

We use collected information to:

Provide and maintain the Service.

Track teacher account activity and usage limits.

Generate and deliver requested PDFs or adaptive content.

Run adaptive assessment sessions and calculate portfolio/progress results for the teachers who assigned them.

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

We do not sell or trade personal data, including student data. Student information collected through the adaptive assessment feature is shared only with the hosting and database providers necessary to operate the Service, and is not sent to advertising, analytics, or marketing services.

5. Data Retention

We retain teacher account data for as long as the account is active or as needed to:

Provide the Service

Comply with legal obligations

Resolve disputes

You can request deletion of your account and associated data at any time by contacting us.

Student data (first name, student code, and assessment results) is retained only as long as the associated teacher account and classroom roster remain active. A teacher can remove an individual student from their roster at any time, which deletes that student's stored records. Deleting a teacher account also deletes all student data associated with that teacher's classrooms.

6. Cookies and Tracking

We use cookies and analytics tools to track anonymous usage and improve the site experience.
You can disable cookies in your browser, but some features may not function properly.
Cookies and analytics tools are used on teacher-facing pages only and are not used during student assessment sessions.

7. Your Rights

You have the right to:

Access and review your personal data

Request correction or deletion

Withdraw consent for marketing (if any)

Contact us directly for assistance.

8. Age Requirement for Account Holders

Our Service is intended for use by adult educators. Teacher accounts are not available to individuals under 18.
We do not knowingly collect personal data from children through the account creation or worksheet generation features of the Service.

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

Google Sign-In is available to teachers only. Students never use Google Sign-In and do not connect a Google account to the Service.

Data Usage
We use this Google user data solely to:
- Authenticate you and allow secure sign-in to your account
- Create and manage your user account within Teks Portfolio
- Display basic account information (such as your name or profile image) within the application

We do not use Google user data for advertising, marketing, or profiling purposes.

Data Storage
- We store only the minimum information necessary to operate your account (such as your email address, name, and profile image URL).
- Google access tokens, if stored, are secured and used only to maintain your login session.

Data Sharing
- We do not sell, rent, or trade Google user data.
- Google user data is not shared with third parties except as necessary to operate the Service (such as secure hosting or database providers), or if required by law.

Data Deletion
You may request deletion of your account and associated data at any time by contacting us at hello@teksportfolio.com. Upon deletion, any stored Google account information will be permanently removed.

11. Children's Internet Protection Act (CIPA)
Teks Portfolio complies with the Children's Internet Protection Act by ensuring that no harmful or inappropriate content is accessible through the platform.
Teks Portfolio does not provide access to social networking, messaging, or user-generated content. The worksheet generation feature is intended solely for educators, and no student accounts or student data are collected through it. The adaptive assessment feature collects only the minimal student information described in Section 1 (first name, an auto-generated student code, and assessment results), all under the direction and control of the student's teacher.

12. FERPA Alignment
Teks Portfolio is primarily a teacher-facing tool. Students do not create accounts or log in with credentials at any point.

For the worksheet generation feature, we do not collect, store, or process any student personal information, student identifiers, student work, or student behavioral data.

For the adaptive assessment and portfolio feature, a limited amount of student information (first name, an auto-generated student code, and assessment results) is collected at the direction of the student's teacher for educational purposes, consistent with the "school official" exception under FERPA. This data is accessible only to the teacher who created the classroom, is not used for any purpose outside instruction and progress tracking, and is never sold, shared for advertising, or disclosed to third parties beyond the infrastructure providers described in Section 4.

13. Children's Online Privacy Protection Act (COPPA)
Because middle school students may be under the age of 13, the adaptive assessment feature is designed to collect the minimum information necessary — a first name and an auto-generated student code — and only when a teacher has set up a classroom and issued a join code for that purpose. We do not collect student email addresses, dates of birth, or other contact information.

We rely on the school/teacher's authorization to use the Service for a legitimate educational purpose, consistent with FTC guidance permitting schools and teachers to consent on behalf of parents when a service is used solely for education and not for commercial purposes such as advertising or marketing. Student information collected is used only to run the assessment and generate progress results for the teacher, and is never used for advertising or behavioral profiling.

Teachers and schools may contact us at hello@teksportfolio.com to review, request deletion of, or ask questions about student data collected for their classroom.

14. Legal Basis for Processing
We process personal data based on:
- Your consent when creating an account
- A teacher's authorization to collect limited student data for educational purposes
- The need to provide and maintain the Service
- Compliance with legal obligations
- Legitimate interests such as improving performance and preventing fraud

15. Your Data Protection Rights
You have the right to:
- Access your personal data
- Request correction of inaccurate data
- Request deletion of your data
- Request restriction of processing
- Withdraw consent at any time

Teachers may exercise these rights on behalf of students in their classroom by contacting us directly.

16. Data Transfers
Your information may be processed and stored in the United States. By using the Service, you consent to the transfer of your information to U.S.-based service providers that follow industry-standard protections.

17. Security Practices
We use encryption in transit (HTTPS), encryption at rest (where supported by our providers), access controls, and monitoring to protect your data. Only authorized personnel may access user information, and only when necessary to operate the Service.

Contact Us

For privacy-related requests or questions, email:
📧 hello@teksportfolio.com`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;