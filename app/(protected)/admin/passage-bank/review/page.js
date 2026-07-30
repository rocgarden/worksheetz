// /app/(protected)/admin/passage-bank/review/page.js
//
// Server-protected passage-bank review queue.

import Link from "next/link";

import PassageBankManager from "@/components/admin/passage-bank/PassageBankManager";
import { requirePassageBankAdminPage } from "@/libs/v2/passageBank/requirePassageBankAdminPage";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;



export default async function PassageBankReviewPage() {
  
await requirePassageBankAdminPage();


  return (
    <main
      className="
        min-h-screen
        bg-gradient-to-b
        from-yellow-50
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
            border-yellow-200
            bg-white/90
            px-6
            py-8
            shadow-sm
            backdrop-blur-sm
            md:px-8
          "
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 font-semibold text-primary">
                Passage Bank Review
              </p>

              <h1 className="text-3xl font-extrabold text-base-content md:text-4xl">
                Review Queue
              </h1>

              <p className="mt-3 max-w-3xl text-base-content/70">
                Focus on drafts awaiting review,
                packages returned for changes, approved
                drafts awaiting publication, and open
                revisions.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/passage-bank"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-purple-200
                  bg-purple-50
                  px-5
                  py-2.5
                  font-semibold
                  text-purple-800
                  transition
                  hover:bg-purple-100
                "
              >
                ← Passage Bank
              </Link>

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
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div
          className="
            rounded-[2rem]
            border
            border-yellow-200
            bg-white
            p-6
            shadow-sm
            md:p-8
          "
        >
          <div className="mb-6 flex flex-col gap-2">
            <h2 className="text-2xl font-bold">
              Actionable packages
            </h2>

            <p className="text-sm text-base-content/70">
              Use the review overview and filters to
              locate packages that require an admin
              decision.
            </p>
          </div>

          <PassageBankManager mode="review" />
        </div>
      </section>
    </main>
  );
}