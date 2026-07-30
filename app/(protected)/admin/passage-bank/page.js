// /app/(protected)/admin/passage-bank/page.js
//
// Server-protected admin landing page for passage-bank management.

import Link from "next/link";

import PassageBankManager from "@/components/admin/passage-bank/PassageBankManager";
import { requirePassageBankAdminPage } from "@/libs/v2/passageBank/requirePassageBankAdminPage";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function PassageBankAdminPage() {
await requirePassageBankAdminPage();


  return (
    <main
      className="
        min-h-screen
        bg-gradient-to-b
        from-purple-50
        via-white
        to-purple-50
        px-6
        py-10
        md:px-8
        md:py-14
      "
    >
      <section className="mx-auto max-w-7xl space-y-8">
        <div
          className="
            rounded-[2rem]
            border
            border-purple-100
            bg-white/80
            px-6
            py-8
            shadow-sm
            backdrop-blur-sm
            md:px-8
          "
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 font-semibold text-primary">Admin Tools</p>

              <h1 className="text-3xl font-extrabold text-base-content md:text-4xl">
                Passage Bank
              </h1>

              <p className="mt-3 max-w-3xl text-base-content/70">
                Generate, review, approve, publish, revise, and manage
                TEKS-aligned passage-bank packages.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="
                inline-flex
                items-center
                justify-center
                rounded-full
                border
                border-base-300
                bg-white
                px-5
                py-2.5
                font-semibold
                text-base-content
                transition
                hover:bg-base-200
              "
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/admin/passage-bank/review"
            className="
                group
                rounded-[2rem]
                border
                border-yellow-200
                bg-gradient-to-br
                from-yellow-50
                to-white
                p-6
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-yellow-300
                hover:shadow-md
              "
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Review Queue
            </p>

            <div className="mt-2 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">Review Draft Packages</h2>

              <span className="shrink-0 text-lg font-bold text-primary transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-base-content/70">
              Open drafts awaiting review, inspect returned packages, and manage
              approved drafts and pending revisions.
            </p>
          </Link>

          <div className="rounded-[2rem] border border-base-300 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Published
            </p>

            <h2 className="mt-2 text-xl font-bold">
              Manage Published Packages
            </h2>

            <p className="mt-2 text-sm text-base-content/70">
              View active packages, revision history, question counts, and
              activation status.
            </p>
          </div>

          <Link
            href="/admin/passage-bank/generate"
            className="
              group
              rounded-[2rem]
              border
              border-purple-200
              bg-gradient-to-br
              from-purple-50
              to-white
              p-6
              shadow-sm
              transition
              hover:-translate-y-0.5
              hover:border-purple-300
              hover:shadow-md
            "
          >
            {" "}
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Generation
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold">Generate New Draft</h2>

              <span className="shrink-0 text-lg font-bold text-primary transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
            <p className="mt-2 text-sm text-base-content/70">
              Create a new passage and question-bank draft for human review.
            </p>
          </Link>
        </div>

        <div
          className="
            rounded-[2rem]
            border
            border-base-300
            bg-white
            p-6
            shadow-sm
            md:p-8
               "
        >
          <div className="mb-6 flex flex-col gap-2">
            <h2 className="text-2xl font-bold">Passage-bank packages</h2>

            <p className="text-sm text-base-content/70">
              Review drafts and manage published package versions.
            </p>
          </div>

          <PassageBankManager />
        </div>
      </section>
    </main>
  );
}
