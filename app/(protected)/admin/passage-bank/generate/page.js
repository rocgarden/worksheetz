// /app/(protected)/admin/passage-bank/generate/page.js

import Link from "next/link";
import { requirePassageBankAdminPage } from "@/libs/v2/passageBank/requirePassageBankAdminPage";
import PassageBankGenerateForm from "@/components/admin/passage-bank/PassageBankGenerateForm";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;



export default async function GeneratePassageBankDraftPage() {
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
      <section className="mx-auto max-w-5xl space-y-8">
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
              <p className="mb-2 font-semibold text-primary">
                Passage Bank Admin
              </p>

              <h1 className="text-3xl font-extrabold text-base-content md:text-4xl">
                Generate Draft
              </h1>

              <p className="mt-3 max-w-3xl text-base-content/70">
                Generate a TEKS-aligned passage and question package for
                validation and human review.
              </p>
            </div>

            <Link
              href="/admin/passage-bank"
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
              ← Passage Bank
            </Link>
          </div>
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
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-8 text-center">
            <p className="font-semibold">
              Draft generation form
            </p>

           <PassageBankGenerateForm/>
          </div>
        </div>
      </section>
    </main>
  );
}