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

Worksheetz AI is designed specifically for K–12 educators who need high‑quality, customizable worksheets that align with TEKS and classroom standards. We do not collect student data, and our platform is built to meet the safety and privacy expectations of school districts nationwide.

---

Why Schools Trust Worksheetz AI

Purpose‑Built for Education
Worksheetz AI is an instructional tool for teachers—not a student‑facing app, social platform, or open AI playground. Every feature is designed to support lesson planning, differentiation, and standards‑aligned practice.

No Student Accounts or Student Data
Teachers generate materials. Students never log in.
Worksheetz AI does not collect, store, or process:
- Student names
- Student emails
- Student identifiers
- Student work
- Student behavioral or usage data

This makes Worksheetz AI inherently low‑risk and FERPA‑friendly.

CIPA‑Aligned and Classroom‑Safe
Worksheetz AI contains no chatrooms, messaging, games, ads, or unsafe content.
All generated materials are academic, age‑appropriate, and aligned to state standards.

Clear Educational Categorization
To support district filtering systems (Lightspeed, Securly, iBoss, Fortinet, ContentKeeper, GoGuardian), Worksheetz AI is categorized as:
- Education / Instructional Tools
- Teacher Resources
- Curriculum Support

---

CIPA Compliance Statement
Worksheetz AI does not provide access to harmful, obscene, or inappropriate material.
The platform contains no chatrooms, social features, or user-generated content.
All materials generated are academic and age-appropriate.
Worksheetz AI is designed for teacher use only and does not collect or store student information.
`}
        </pre>
      </div>
    </main>
  );
};

export default SchoolsPage;
