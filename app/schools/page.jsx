// app/schools/page.jsx
import Link from "next/link";
import config from "@/config";
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: `For Schools | ${config.appName}`,
  canonicalUrlRelative: "/schools",
});

const SchoolsPage = () => {
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
          For Schools & District IT
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: "sans-serif" }}
        >
{`
Trusted by Teachers. Built for Classrooms. Safe for Schools.

Teks Portfolio is designed specifically for Texas K–12 educators who need standards-aligned worksheets and adaptive practice tools. Teks Portfolio has no chatrooms, social features, or open-ended content, and student data collection is minimized wherever the product allows it.

---

Why Schools Trust Teks Portfolio

Purpose-Built for Education
Teks Portfolio is an instructional tool for teachers, not a student-facing social platform or open-ended chat tool. Every feature supports lesson planning, differentiation, and standards-aligned practice or assessment.

Worksheet Generator: No Student Data at All
Worksheet generation is entirely teacher-facing. Students never interact with this part of the platform in any way.
Teks Portfolio does not collect, store, or process any of the following through the worksheet generator:
- Student names
- Student emails
- Student identifiers
- Student work
- Student behavioral or usage data

Adaptive Assessment & Portfolio: Minimal, Teacher-Controlled Data Only
For classrooms using adaptive assessments and portfolio tracking, a small amount of data is required to make the tool work — and we keep it as limited as possible:
- Teachers build the class roster manually. There is no public sign-up for students.
- Students never create an account or set a password. To start a session, a student enters a teacher-provided join code and their first name only.
- No student emails, addresses, or other contact information are ever collected.
- Each student is also assigned a student code, generated automatically, which is used in place of their name wherever possible in reporting and internal records.
- The platform stores assessment responses and performance results (e.g. which questions were answered correctly) so teachers can see growth over time. This data is not sold or rented. It is shared only with the infrastructure and service providers needed to operate the platform (such as hosting and database providers), consistent with our Privacy Policy.

CIPA-Aligned and Classroom-Safe
Teks Portfolio contains no chatrooms, messaging, games, ads, or unsafe content.
All generated and assigned materials are academic, age-appropriate, and aligned to state standards.

Clear Educational Categorization
To support district filtering systems (Lightspeed, Securly, iBoss, Fortinet, ContentKeeper, GoGuardian), Teks Portfolio is categorized as:
- Education / Instructional Tools
- Teacher Resources
- Curriculum Support

---

CIPA Compliance Statement
Teks Portfolio does not provide access to harmful, obscene, or inappropriate material.
The platform contains no chatrooms, social features, or user-generated content.
All materials generated or assigned are academic and age-appropriate.
Teks Portfolio's worksheet generator is designed for teacher use only and does not collect or store any student information.
Teks Portfolio's adaptive assessment feature collects only the minimum information needed to run a classroom session — first name and a teacher-issued join code — and does not require student accounts, passwords, or contact information.
`}
        </pre>
      </div>
    </main>
  );
};

export default SchoolsPage;