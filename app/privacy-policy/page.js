//app/privacy-policy/page.js
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

Student Information (Adaptive Assessment & Portfolio)

Teks Portfolio provides an adaptive assessment feature that allows teachers to create assessment sessions for students.

The process works as follows:

A teacher creates an assessment session through their authenticated teacher account.
The platform generates a unique session ID or join code.
The teacher shares the session ID with students so they can access the assigned assessment.
Students enter the session ID and their first name to join the assessment session.

When a student joins a session, Teks Portfolio collects the following limited information:

First Name: Entered by the student when joining the teacher-created assessment session.
Session ID: Used to associate the student with the correct teacher-created assessment session.
Student Code: An identifier generated automatically by the platform to distinguish student records and reduce the use of student names in internal records and reports.
Assessment Responses and Performance Data: Information such as answers, assessment results, and time spent completing questions, used to track progress toward educational standards.

Students do not create accounts, establish passwords, or sign in using Google or other third-party authentication services. Students are not asked to provide email addresses, dates of birth, or other contact information.

Teachers initiate and manage assessment sessions and are responsible for distributing session IDs to their students. Teachers can view, manage, and delete student records associated with their own classrooms.

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

Teks Portfolio uses Supabase as its primary database and authentication provider.

Supabase is used to store and manage information necessary to operate the Service, including:

Teacher account information, including names, email addresses, and authentication identifiers.
Teacher account settings and application activity.
Classroom records and student information entered or generated through the adaptive assessment feature.
Student assessment responses, performance data, and portfolio progress records.
Other information necessary to provide the application's features.

Supabase Authentication manages user authentication and application sessions, including sessions established through Google Sign-In.

We use security measures such as HTTPS encryption, authentication controls, database access restrictions, and security features provided by our infrastructure providers to protect stored information.

Where supported by our providers and enabled in our configuration, data is also encrypted at rest.

Access to stored information is restricted according to the permissions required to operate the Service.

No internet-based storage system can guarantee absolute security.

4. Sharing of Information

We may share limited user data with:
Supabase - Authentication, database storage, and account management

Stripe – Payment processing and subscription billing

Google Analytics – Website traffic and performance analytics

Zenvoice – Invoice creation and billing records

Byedispute – Payment fraud prevention

Vercel – Website hosting and infrastructure

We do not sell or trade personal data, including student data. Student information collected through the adaptive assessment feature is shared only with the hosting and database providers necessary to operate the Service, and is not sent to advertising, analytics, or marketing services.

5. Data Retention and Deletion

Teks Portfolio retains personal information only for as long as necessary to fulfill the purposes described in this Privacy Policy, provide and maintain the Service, comply with applicable legal obligations, resolve disputes, enforce our agreements, and protect the security of our platform.

Teacher Account Information

We retain teacher account information, including names, email addresses, authentication information, and account activity, for as long as the teacher account remains active or as otherwise necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy.

If a teacher requests account deletion, we will delete the associated personal information from our active application records, subject to any information we are legally required or permitted to retain.

Student Information

Student information collected through the adaptive assessment and portfolio features, including first names, student codes, assessment responses, and performance records, is retained only for as long as necessary to provide the educational services associated with the teacher's account and classroom.

Teachers may delete individual student records or remove students from their classroom rosters at any time through the available platform features. When a teacher account is deleted, the student information associated with that teacher's classrooms is also deleted from our active application records.

Data Deletion and Retention Periods

We retain personal information for periods consistent with our business purposes and the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by applicable law.

When the retention period for a particular type of information expires, we will delete or securely destroy that information, or otherwise ensure that it is no longer identifiable, in accordance with our data deletion procedures.

You may request the deletion of your personal information, including your teacher account and associated records, by contacting us at:

**hello@teksportfolio.com**

We will review and process deletion requests in accordance with applicable privacy laws.

Backups and Legal Retention

Following a deletion request, certain information may temporarily remain in encrypted backups, security logs, or records maintained to comply with legal obligations. Such information will be retained only for as long as necessary for those purposes and will not be used for ordinary application functionality.

Once the applicable retention period expires, this information will be permanently deleted or securely destroyed in accordance with our retention and deletion procedures.

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

10. Google User Data and Google OAuth Privacy Disclosure

Teks Portfolio uses Google OAuth to allow teachers and adult educators to securely sign in to their accounts.

Google Information We Collect

When you choose to sign in using Google, Teks Portfolio may access the following information through Google Sign-In:

Your Google account name.
Your Google account email address.
Your Google profile picture.
Your unique Google account identifier.

Our application requests only the following OAuth scopes:

openid
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile

Teks Portfolio does not request access to Gmail messages, Google Drive files, Google Calendar events, Google Contacts, or other Google account content through these scopes.

How We Use Google Information

We use information received from Google exclusively for the following purposes:

-Authenticate your identity when you sign in.
-Create and maintain your Teks Portfolio account.
-Associate your Google identity with your existing account when applicable.
-Display your name, email address, and profile picture within the application.
-Maintain secure account access and prevent unauthorized account access.

We do not use Google user information for advertising, selling personal information, targeted marketing, or building advertising profiles.

How We Store Google Information

Google account information necessary to operate your Teks Portfolio account may be stored in our application database.

We apply reasonable security measures to protect this information, including encrypted connections (HTTPS), access controls, and security measures provided by our hosting and database providers.

Authentication and Token Management

Teks Portfolio uses Supabase Authentication to manage Google Sign-In.

When a user chooses Google Sign-In, Google provides authentication information that is processed through Supabase Authentication to verify the user's identity and establish an authenticated session.

Supabase manages the authentication session and associated session credentials used to maintain access to Teks Portfolio.

Our application uses the authenticated user's Google account information to identify the user and associate the Google identity with their Teks Portfolio account.

Google provider access and refresh tokens, if issued and retained by the authentication integration, are handled according to the Supabase Authentication configuration. They are not used to access Gmail, Google Drive, Google Calendar, or other Google services.

Teks Portfolio does not independently use Google authentication credentials for advertising, marketing, or unrelated purposes.

How We Share Google Information

We do not sell, rent, or trade Google user data.

Google user information is not shared with advertisers, marketing companies, or data brokers.

Information may be processed by our hosting and database service providers only when necessary to operate, maintain, and secure Teks Portfolio. These providers are expected to protect the information they process.

We disclose Google user information when required by applicable law or legal process.

Data Retention and Deletion

We retain Google account information only for as long as necessary to provide your Teks Portfolio account and associated services.

You may request deletion of your account and associated personal information by contacting:

hello@teksportfolio.com

Upon processing an account deletion request, we will delete associated Google account information from our active application records, subject to applicable legal retention requirements.

Google API Services Limited Use Disclosure

Teks Portfolio's use and transfer of information received from Google APIs to any other application will adhere to the Google API Services User Data Policy, including the Limited Use requirements.

Specifically, Teks Portfolio's use of information received from Google APIs will comply with the requirements concerning limited use, including restrictions on transferring, using, or sharing Google user data except as permitted by the Google API Services User Data Policy.

Google user data will only be accessed, used, and shared as necessary to provide the user-facing features and functionality described in this Privacy Policy, and will not be used for advertising, sold to third parties, or used for purposes unrelated to providing the Service.

Google API Services User Data Policy: https://developers.google.com/terms/api-services-user-data-policy

Google Account Authorization

By choosing Google Sign-In, you authorize Teks Portfolio to access the basic Google account information described in this section for the purposes explained above.

You can manage or revoke Teks Portfolio's Google account access through your Google Account security settings.

For questions about Google user data or privacy requests, contact hello@teksportfolio.com.

11. Children's Internet Protection Act (CIPA)
Teks Portfolio complies with the Children's Internet Protection Act by ensuring that no harmful or inappropriate content is accessible through the platform.
Teks Portfolio does not provide access to social networking, messaging, or user-generated content. The worksheet generation feature is intended solely for educators, and no student accounts or student data are collected through it. The adaptive assessment feature collects only the minimal student information described in Section 1 (first name, an auto-generated student code, and assessment results), all under the direction and control of the student's teacher.

12. FERPA and Educational Information

Teks Portfolio is primarily a teacher-facing educational tool. Teachers create and manage accounts, classrooms, and assessment sessions.

Students do not create accounts or authenticate using individual login credentials.

For the worksheet generation feature, Teks Portfolio does not collect or store student personal information.

For the adaptive assessment and portfolio feature, teachers initiate assessment sessions and generate unique session IDs or join codes. Teachers distribute these codes to students, who enter the session ID and their first name to participate.

The platform collects limited student information, including first names, automatically generated student codes, assessment responses, and performance results.

This information is processed solely to provide the educational assessment, track student progress, and generate reports for the teacher who created the session.

Student information is accessible to authorized teachers associated with the relevant classroom and is not sold or used for advertising.

Teks Portfolio is designed to support educational use consistent with applicable student privacy requirements. Schools and teachers are responsible for determining the appropriate authorization for student participation and use of the Service.

13. Children's Online Privacy Protection Act (COPPA)

Teks Portfolio is designed for use by adult educators and does not provide independent student accounts.

The adaptive assessment feature allows teachers to create assessment sessions and distribute unique session IDs or join codes to students.

To participate, a student enters the session ID and their first name. The platform uses this information to associate the student with the teacher-created assessment session.

We collect only the information reasonably necessary to provide the educational assessment functionality, including:

Student first name.
Automatically generated student code.
Assessment responses and performance information.

We do not require students to provide email addresses, passwords, dates of birth, or other contact information to participate.

Student information is used exclusively to provide educational assessment functionality and generate progress information for the responsible teacher. It is not used for targeted advertising or behavioral advertising.

Teks Portfolio does not knowingly collect additional personal information from children beyond what is described in this policy.

Teachers and schools may contact us at hello@teksportfolio.com to request access to, correction of, or deletion of student information.

Where required by applicable law, the appropriate school or parent authorization must be obtained before collecting personal information from children.

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