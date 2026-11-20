//app/privacy-policy/page.js
import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const EFFECTIVE_DATE = "November 19, 2026";

const Section = ({ number, title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold mb-4 border-b pb-2">
      {number}. {title}
    </h2>
    <div className="space-y-4 leading-7 text-base">{children}</div>
  </section>
);

const Subsection = ({ title, children }) => (
  <div className="mb-5">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="space-y-3 leading-7">{children}</div>
  </div>
);

const P = ({ children }) => <p>{children}</p>;

const BulletList = ({ items }) => (
  <ul className="list-disc pl-6 space-y-2">
    {items.map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
);

const ContactEmail = () => (
  <a
    href="mailto:hello@teksportfolio.com"
    className="text-blue-600 underline font-medium"
  >
    hello@teksportfolio.com
  </a>
);

const PrivacyPolicy = () => {
  return (
    <main className="max-w-3xl mx-auto px-5 py-8">
      <Link href="/" className="btn btn-ghost mb-6 inline-flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </Link>

      <article className="text-base leading-7">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold mb-4">
            Privacy Policy for {config.appName}
          </h1>

          <p className="font-semibold mb-3">Effective Date: {EFFECTIVE_DATE}</p>

          <p>
            Your privacy matters to us. This Privacy Policy explains what
            information we collect, how we use it, how it is stored and
            protected, and the choices and rights available to you.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Definitions</h2>

          <BulletList
            items={[
              '"Service" refers to Teks Portfolio and all related features, including worksheet generation, adaptive assessment, and portfolio tracking.',
              '"Personal Data" means information that identifies or can reasonably be associated with an individual, such as a name or email address.',
              '"Usage Data" means information collected automatically, such as device type, browser information, or activity on the Service.',
              '"You" refers to the teacher or adult user accessing the Service.',
              '"Student" refers to a minor who participates in an adaptive assessment session at a teacher’s direction. Students do not create accounts and are not independent account holders of the Service.',
            ]}
          />
        </section>

        <Section number="1" title="Information We Collect">
          <Subsection title="Teacher / Account Information">
            <P>When you create an account, we may collect:</P>
            <BulletList
              items={[
                "Account Information: name, email address, and date joined.",
                "Usage Data: generations, PDF downloads, and session activity.",
                "Payment Data: handled by Stripe. We do not store credit card details.",
                "Analytics Data: information from Google Analytics and hosting tools such as Vercel.",
              ]}
            />
            <P>
              We may also record general device and browser information for
              site performance and security.
            </P>
          </Subsection>

          <Subsection title="Student Information (Adaptive Assessment & Portfolio)">
            <P>
              Teks Portfolio provides an adaptive assessment feature that
              allows teachers to create assessment sessions for students.
            </P>

            <P>The process works as follows:</P>

            <ol className="list-decimal pl-6 space-y-2">
              <li>
                A teacher creates an assessment session through their
                authenticated teacher account.
              </li>
              <li>The platform generates a unique session ID or join code.</li>
              <li>
                The teacher shares the session ID with students so they can
                access the assigned assessment.
              </li>
              <li>
                Students enter the session ID and their first name to join
                the assessment session.
              </li>
            </ol>

            <P>
              When a student joins a session, Teks Portfolio collects the
              following limited information:
            </P>

            <BulletList
              items={[
                "First Name: entered by the student when joining the teacher-created assessment session.",
                "Session ID: used to associate the student with the correct teacher-created assessment session.",
                "Student Code: an identifier generated automatically by the platform to distinguish student records and reduce the use of student names in internal records and reports.",
                "Assessment Responses and Performance Data: information such as answers, assessment results, and time spent completing questions, used to track progress toward educational standards.",
              ]}
            />

            <P>
              Students do not create accounts, establish passwords, or sign in
              using Google or other third-party authentication services.
              Students are not asked to provide email addresses, dates of
              birth, or other contact information.
            </P>

            <P>
              Teachers initiate and manage assessment sessions and are
              responsible for distributing session IDs to their students.
              Teachers can view, manage, and delete student records associated
              with their own classrooms.
            </P>
          </Subsection>
        </Section>

        <Section number="2" title="How We Use Your Information">
          <P>We use collected information to:</P>
          <BulletList
            items={[
              "Provide and maintain the Service.",
              "Track teacher account activity and usage limits.",
              "Generate and deliver requested PDFs or adaptive content.",
              "Run adaptive assessment sessions and calculate portfolio and progress results for the teachers who assigned them.",
              "Manage subscriptions, invoices, and billing through Stripe or Zenvoice.",
              "Detect fraud through services such as Byedispute.",
              "Analyze traffic and improve performance.",
              "Maintain the security and functionality of the platform.",
            ]}
          />
        </Section>

        <Section number="3" title="Data Storage and Security">
          <P>
            Teks Portfolio uses Supabase as its primary database and
            authentication provider.
          </P>

          <P>
            Supabase is used to store and manage information necessary to
            operate the Service, including:
          </P>

          <BulletList
            items={[
              "Teacher account information, including names, email addresses, and authentication identifiers.",
              "Teacher account settings and application activity.",
              "Classroom records and student information entered or generated through the adaptive assessment feature.",
              "Student assessment responses, performance data, and portfolio progress records.",
              "Other information necessary to provide the application's features.",
            ]}
          />

          <P>
            Supabase Authentication manages user authentication and
            application sessions, including sessions established through
            Google Sign-In.
          </P>

          <P>
            We use security measures such as HTTPS encryption, authentication
            controls, database access restrictions, and security features
            provided by our infrastructure providers to protect stored
            information.
          </P>

          <P>
            Where supported by our providers and enabled in our configuration,
            data is also encrypted at rest.
          </P>

          <P>
            Access to stored information is restricted according to the
            permissions required to operate the Service.
          </P>

          <P>No internet-based storage system can guarantee absolute security.</P>
        </Section>

        <Section number="4" title="Sharing of Information">
          <P>We may share limited user data with the following providers:</P>

          <BulletList
            items={[
              "Supabase – Authentication, database storage, and account management.",
              "Stripe – Payment processing and subscription billing.",
              "Google Analytics – Website traffic and performance analytics.",
              "Zenvoice – Invoice creation and billing records.",
              "Byedispute – Payment fraud prevention.",
              "Vercel – Website hosting and infrastructure.",
            ]}
          />

          <P>
            We do not sell or trade personal data, including student data.
            Student information collected through the adaptive assessment
            feature is shared only with the hosting and database providers
            necessary to operate the Service, and is not sent to advertising,
            analytics, or marketing services.
          </P>
        </Section>

        <Section number="5" title="Data Retention and Deletion">
          <P>
            Teks Portfolio retains personal information only for as long as
            necessary to fulfill the purposes described in this Privacy
            Policy, provide and maintain the Service, comply with applicable
            legal obligations, resolve disputes, enforce our agreements, and
            protect the security of our platform.
          </P>

          <Subsection title="Teacher Account Information">
            <P>
              We retain teacher account information, including names, email
              addresses, authentication information, and account activity, for
              as long as the teacher account remains active or as otherwise
              necessary to provide the Service and fulfill the purposes
              outlined in this Privacy Policy.
            </P>

            <P>
              You can permanently delete your account at any time from your
              dashboard. Deleting your account also deletes your classrooms,
              student records, and assessment data, and cancels any active
              subscription. This action cannot be undone.
            </P>

            <P>
              When a teacher account is deleted, we delete the associated
              personal information from our active application records,
              subject to any information we are legally required or permitted
              to retain.
            </P>
          </Subsection>

          <Subsection title="Student Information">
            <P>
              Student information collected through the adaptive assessment
              and portfolio features, including first names, student codes,
              assessment responses, and performance records, is retained only
              for as long as necessary to provide the educational services
              associated with the teacher’s account and classroom.
            </P>

            <P>
              Teachers may delete individual student records or remove
              students from their classroom rosters through the available
              platform features. When a teacher account is deleted, the
              student information associated with that teacher’s classrooms
              is also deleted from our active application records, subject to
              applicable legal retention requirements.
            </P>
          </Subsection>

          <Subsection title="Data Deletion and Retention Periods">
            <P>
              We retain personal information for periods consistent with our
              business purposes and the purposes described in this Privacy
              Policy, unless a longer retention period is required or
              permitted by applicable law.
            </P>

            <P>
              When the retention period for a particular type of information
              expires, we will delete or securely destroy that information, or
              otherwise ensure that it is no longer identifiable, in
              accordance with our data deletion procedures.
            </P>

            <P>
              In addition to deleting your account from your dashboard, you
              may request the deletion of your personal information, including
              your teacher account and associated records, by contacting us
              at:
            </P>

            <P>
              <ContactEmail />
            </P>

            <P>
              We will review and process deletion requests in accordance with
              applicable privacy laws. We may need to verify your identity or
              authority before processing a request.
            </P>
          </Subsection>

          <Subsection title="Backups and Legal Retention">
            <P>
              Following a deletion request, certain information may
              temporarily remain in backups, security logs, or records
              maintained to comply with legal obligations. Such information
              will be retained only for as long as necessary for those
              purposes and will not be used for ordinary application
              functionality.
            </P>

            <P>
              Once the applicable retention period expires, this information
              will be permanently deleted or securely destroyed in accordance
              with our retention and deletion procedures.
            </P>
          </Subsection>
        </Section>

        <Section number="6" title="Cookies and Tracking">
          <P>
            We use cookies and analytics tools to track usage and improve the
            site experience.
          </P>

          <P>
            You can disable cookies in your browser, but some features may not
            function properly.
          </P>

          <P>
            Cookies and analytics tools are used on teacher-facing pages only
            and are not used during student assessment sessions.
          </P>
        </Section>

        <Section number="7" title="Your Rights">
          <P>You have the right to:</P>

          <BulletList
            items={[
              "Access and review your personal data.",
              "Request correction of inaccurate personal data.",
              "Request deletion of your personal data, or delete your account yourself from your dashboard.",
              "Withdraw consent for marketing, if applicable.",
              "Contact us directly for assistance with privacy requests.",
            ]}
          />
        </Section>

        <Section number="8" title="Age Requirement for Account Holders">
          <P>
            Our Service is intended for use by adult educators. Teacher
            accounts are not available to individuals under 18.
          </P>

          <P>
            We do not knowingly collect personal data from children through
            the account creation or worksheet generation features of the
            Service.
          </P>
        </Section>

        <Section number="9" title="Updates">
          <P>
            We may revise this Privacy Policy from time to time to reflect
            changes to our practices, technology, services, or legal
            obligations.
          </P>

          <P>
            The latest version will always be available on our website. The
            effective date at the beginning of this policy indicates when it
            was last updated.
          </P>
        </Section>

        <Section number="10" title="Google User Data and Google OAuth Privacy Disclosure">
          <P>
            Teks Portfolio uses Google OAuth to allow teachers and adult
            educators to securely sign in to their accounts.
          </P>

          <Subsection title="Google Information We Collect">
            <P>
              When you choose to sign in using Google, Teks Portfolio may
              access the following information through Google Sign-In:
            </P>

            <BulletList
              items={[
                "Your Google account name.",
                "Your Google account email address.",
                "Your Google profile picture.",
                "Your unique Google account identifier.",
              ]}
            />

            <P>Our application requests only the following OAuth scopes:</P>

            <ul className="list-disc pl-6 space-y-2 break-all">
              <li>openid</li>
              <li>https://www.googleapis.com/auth/userinfo.email</li>
              <li>https://www.googleapis.com/auth/userinfo.profile</li>
            </ul>

            <P>
              Teks Portfolio does not request access to Gmail messages, Google
              Drive files, Google Calendar events, Google Contacts, or other
              Google account content through these scopes.
            </P>
          </Subsection>

          <Subsection title="How We Use Google Information">
            <P>
              We use information received from Google exclusively for the
              following purposes:
            </P>

            <BulletList
              items={[
                "Authenticate your identity when you sign in.",
                "Create and maintain your Teks Portfolio account.",
                "Associate your Google identity with your existing account when applicable.",
                "Display your name, email address, and profile picture within the application.",
                "Maintain secure account access and prevent unauthorized account access.",
              ]}
            />

            <P>
              We do not use Google user information for advertising, selling
              personal information, targeted marketing, or building
              advertising profiles.
            </P>
          </Subsection>

          <Subsection title="How We Store Google Information">
            <P>
              Google account information necessary to operate your Teks
              Portfolio account may be stored in our application database.
            </P>

            <P>
              We apply reasonable security measures to protect this
              information, including encrypted connections (HTTPS), access
              controls, and security measures provided by our hosting and
              database providers.
            </P>
          </Subsection>

          <Subsection title="Authentication and Token Management">
            <P>Teks Portfolio uses Supabase Authentication to manage Google Sign-In.</P>

            <P>
              When a user chooses Google Sign-In, Google provides
              authentication information that is processed through Supabase
              Authentication to verify the user's identity and establish an
              authenticated session.
            </P>

            <P>
              Supabase manages the authentication session and associated
              session credentials used to maintain access to Teks Portfolio.
            </P>

            <P>
              Our application uses the authenticated user's Google account
              information to identify the user and associate the Google
              identity with their Teks Portfolio account.
            </P>

            <P>
              Google provider access and refresh tokens, if issued and
              retained by the authentication integration, are handled
              according to the Supabase Authentication configuration. They are
              not used to access Gmail, Google Drive, Google Calendar, or
              other Google services.
            </P>

            <P>
              Teks Portfolio does not independently use Google authentication
              credentials for advertising, marketing, or unrelated purposes.
            </P>
          </Subsection>

          <Subsection title="How We Share Google Information">
            <P>We do not sell, rent, or trade Google user data.</P>

            <P>
              Google user information is not shared with advertisers,
              marketing companies, or data brokers.
            </P>

            <P>
              Information may be processed by our hosting and database service
              providers only when necessary to operate, maintain, and secure
              Teks Portfolio. These providers are expected to protect the
              information they process.
            </P>

            <P>
              We disclose Google user information when required by applicable
              law or legal process.
            </P>
          </Subsection>

          <Subsection title="Google Data Retention and Deletion">
            <P>
              We retain Google account information only for as long as
              necessary to provide your Teks Portfolio account and associated
              services.
            </P>

            <P>
              You can delete your account and associated personal information
              at any time from your dashboard, or request deletion by
              contacting:
            </P>

            <P>
              <ContactEmail />
            </P>

            <P>
              When an account is deleted, we delete associated Google account
              information from our active application records, subject to
              applicable legal retention requirements.
            </P>

            <P>
              Information that remains temporarily in backups or records
              maintained for legal or security purposes will be handled
              according to the retention and deletion practices described in
              Section 5 of this Privacy Policy.
            </P>
          </Subsection>

          <Subsection title="Google API Services Limited Use Disclosure">
            <P>
              Teks Portfolio's use and transfer of information received from
              Google APIs to any other application will adhere to the Google
              API Services User Data Policy, including the Limited Use
              requirements.
            </P>

            <P>
              Specifically, Teks Portfolio's use of information received from
              Google APIs will comply with the requirements concerning limited
              use, including restrictions on transferring, using, or sharing
              Google user data except as permitted by the Google API Services
              User Data Policy.
            </P>

            <P>
              Google user data will only be accessed, used, and shared as
              necessary to provide the user-facing features and functionality
              described in this Privacy Policy, and will not be used for
              advertising, sold to third parties, or used for purposes
              unrelated to providing the Service.
            </P>

            <P>
              Google API Services User Data Policy:{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                https://developers.google.com/terms/api-services-user-data-policy
              </a>
            </P>
          </Subsection>

          <Subsection title="Google Account Authorization">
            <P>
              By choosing Google Sign-In, you authorize Teks Portfolio to
              access the basic Google account information described in this
              section for the purposes explained above.
            </P>

            <P>
              You can manage or revoke Teks Portfolio's Google account access
              through your Google Account security settings.
            </P>

            <P>
              For questions about Google user data or privacy requests,
              contact <ContactEmail />.
            </P>
          </Subsection>
        </Section>

        <Section number="11" title="Children's Internet Protection Act (CIPA)">
          <P>
            Teks Portfolio is designed to support educational use and does not
            provide access to social networking, messaging, or user-generated
            content.
          </P>

          <P>
            The worksheet generation feature is intended solely for educators,
            and no student accounts or student data are collected through it.
            The adaptive assessment feature collects only the minimal student
            information described in Section 1 (first name, an automatically
            generated student code, and assessment results), under the
            direction and control of the student's teacher.
          </P>
        </Section>

        <Section number="12" title="FERPA and Educational Information">
          <P>
            Teks Portfolio is primarily a teacher-facing educational tool.
            Teachers create and manage accounts, classrooms, and assessment
            sessions.
          </P>

          <P>
            Students do not create accounts or authenticate using individual
            login credentials.
          </P>

          <P>
            For the worksheet generation feature, Teks Portfolio does not
            collect or store student personal information.
          </P>

          <P>
            For the adaptive assessment and portfolio feature, teachers
            initiate assessment sessions and generate unique session IDs or
            join codes. Teachers distribute these codes to students, who enter
            the session ID and their first name to participate.
          </P>

          <P>
            The platform collects limited student information, including first
            names, automatically generated student codes, assessment
            responses, and performance results.
          </P>

          <P>
            This information is processed solely to provide the educational
            assessment, track student progress, and generate reports for the
            teacher who created the session.
          </P>

          <P>
            Student information is accessible to authorized teachers
            associated with the relevant classroom and is not sold or used for
            advertising.
          </P>

          <P>
            Teks Portfolio is designed to support educational use consistent
            with applicable student privacy requirements. Schools and teachers
            are responsible for determining the appropriate authorization for
            student participation and use of the Service.
          </P>
        </Section>

        <Section number="13" title="Children's Online Privacy Protection Act (COPPA)">
          <P>
            Teks Portfolio is designed for use by adult educators and does not
            provide independent student accounts.
          </P>

          <P>
            The adaptive assessment feature allows teachers to create
            assessment sessions and distribute unique session IDs or join
            codes to students.
          </P>

          <P>
            To participate, a student enters the session ID and their first
            name. The platform uses this information to associate the student
            with the teacher-created assessment session.
          </P>

          <P>
            We collect only the information reasonably necessary to provide
            the educational assessment functionality, including:
          </P>

          <BulletList
            items={[
              "Student first name.",
              "Automatically generated student code.",
              "Assessment responses and performance information.",
            ]}
          />

          <P>
            We do not require students to provide email addresses, passwords,
            dates of birth, or other contact information to participate.
          </P>

          <P>
            Student information is used exclusively to provide educational
            assessment functionality and generate progress information for
            the responsible teacher. It is not used for targeted advertising
            or behavioral advertising.
          </P>

          <P>
            Teks Portfolio does not knowingly collect additional personal
            information from children beyond what is described in this policy.
          </P>

          <P>
            Teachers and schools may contact us at <ContactEmail /> to request
            access to, correction of, or deletion of student information.
          </P>

          <P>
            Where required by applicable law, the appropriate school or parent
            authorization must be obtained before collecting personal
            information from children.
          </P>
        </Section>

        <Section number="14" title="Legal Basis for Processing">
          <P>We process personal data based on:</P>

          <BulletList
            items={[
              "Your consent when creating an account.",
              "A teacher's authorization to collect limited student data for educational purposes.",
              "The need to provide and maintain the Service.",
              "Compliance with legal obligations.",
              "Legitimate interests such as improving performance and preventing fraud.",
            ]}
          />
        </Section>

        <Section number="15" title="Your Data Protection Rights">
          <P>Depending on applicable law, you may have the right to:</P>

          <BulletList
            items={[
              "Access your personal data.",
              "Request correction of inaccurate data.",
              "Request deletion of your data.",
              "Request restriction of processing.",
              "Withdraw consent at any time where processing is based on consent.",
            ]}
          />

          <P>
            Teachers may exercise applicable rights on behalf of students in
            their classroom by contacting us directly, subject to applicable
            legal requirements.
          </P>

          <P>
            To submit a privacy request, contact <ContactEmail />.
          </P>
        </Section>

        <Section number="16" title="Data Transfers">
          <P>
            Your information may be processed and stored in the United States.
            By using the Service, you acknowledge that your information may be
            transferred to and processed by U.S.-based service providers that
            follow applicable data protection requirements.
          </P>
        </Section>

        <Section number="17" title="Security Practices">
          <P>
            We use security measures such as encryption in transit (HTTPS),
            encryption at rest where supported by our providers, access
            controls, and monitoring to protect your data.
          </P>

          <P>
            Access to user information is restricted to authorized personnel
            and service providers when necessary to operate, maintain, and
            secure the Service.
          </P>

          <P>
            Although we take reasonable steps to protect personal information,
            no method of electronic storage or transmission is completely
            secure.
          </P>
        </Section>

        <section className="mt-12 border-t pt-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Contact Us</h2>

          <P>
            For privacy-related questions, requests to access or correct
            information, or requests to delete personal information, please
            contact us:
          </P>

          <p className="mt-4">
            <span className="font-semibold">Email: </span>
            <ContactEmail />
          </p>

          <P>
            We will review and respond to privacy requests in accordance with
            applicable laws and the procedures described in this Privacy
            Policy.
          </P>
        </section>

        <footer className="border-t pt-5 text-sm text-gray-500">
          <p>Privacy Policy for {config.appName}</p>
          <p>Effective Date: {EFFECTIVE_DATE}</p>
        </footer>
      </article>
    </main>
  );
};

export default PrivacyPolicy;