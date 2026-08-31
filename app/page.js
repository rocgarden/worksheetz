import { createClient } from "@/libs/supabase/server";
import { BookOpen, NotebookPen, BookCheck, Globe } from "lucide-react";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import Problem from "@/components/Problem";
import FAQ from "@/components/FAQ";
import FeaturesListicle from "@/components/FeaturesListicle";
import SamplePdfCarousel from "@/components/SamplePdfCarousel";
import CTA from "@/components/CTA";
import { renderFAQSchema } from "@/libs/seo";
import { faqSchemaItems } from "@/data/faq-schema";
import ReadingPassagesSection from "@/components/ReadingPassagesSection";
import SubjectCard from "@/components/SubjectCard";
import InteractivePracticeBeta from "@/components/InteractivePracticeBeta";
export default async function Page() {
  const supabase = await createClient();
  let hasActiveSubscription = false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 🧩 Query the user's profile for their plan/subscription info
    const { data: profile } = await supabase
      .from("profiles")
      .select("price_id, has_access")
      .eq("id", user.id)
      .single();

    // ✅ Check if user has an active subscription
    hasActiveSubscription = !!(profile?.price_id && profile?.has_access);
  }

  return (
    <>
      {/* <Suspense>
        <Header />
      </Suspense> */}
      <main>
        {/* <section className="flex flex-col items-center justify-center text-center gap-12 px-8 py-24">
          <h1 className="text-3xl font-extrabold">Ship Fast ⚡️</h1>

          <p className="text-lg opacity-80">
            The start of your new startup... What are you gonna build?
          </p>

          <a
            className="btn btn-primary"
            href="https://shipfa.st/docs"
            target="_blank"
          >
            Documentation & tutorials{" "}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                clipRule="evenodd"
              />
            </svg>
          </a>

          <Link href="/blog" className="link link-hover text-sm">
            Fancy a blog?
          </Link>
        </section> */}
        {renderFAQSchema(faqSchemaItems)}
        <Hero isAuthenticated={!!user} />
        <Problem /> 
        <FeaturesListicle />
        <InteractivePracticeBeta />
        <SamplePdfCarousel />
        {/* <ReadingPassagesSection/> */}
<section className="bg-base-100 py-20 px-6">
  <div className="max-w-6xl mx-auto text-center">
    <p className="text-primary font-semibold mb-3">
      Browse by Subject
    </p>

    <h2 className="text-3xl md:text-4xl font-extrabold text-base-content mb-4">
      Explore TEKS-aligned practice by subject
    </h2>

    <p className="text-base-content/70 max-w-2xl mx-auto mb-12">
      Start with classroom-ready reading, grammar, social studies, and
      STAAR-style practice. More subjects and grade levels will continue to
      expand.
    </p>

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SubjectCard
        title="Reading Comprehension"
        description="Practice passages, text evidence, inference, and comprehension skills."
        href="/worksheets/reading-comprehension/grade-3"
        icon={BookOpen}
        label="Reading"
      />

      <SubjectCard
        title="Grammar"
        description="Editing, sentence structure, punctuation, and language conventions."
        href="/worksheets/grammar/grade-4"
        icon={NotebookPen}
        label="ELA"
      />

      <SubjectCard
        title="Social Studies"
        description="History, civics, geography, and standards-based content practice."
        href="/worksheets/social-studies/grade-5"
        icon={Globe}
        label="Social Studies"
      />

      <SubjectCard
        title="STAAR Reading"
        description="STAAR-style reading review with skill-focused practice materials."
        href="/worksheets/staar-reading/grade-3"
        icon={BookCheck}
        label="STAAR"
      />
    </div>
  </div>
</section>
        <Pricing
          isAuthenticated={!!user}
          hasActiveSubscription={hasActiveSubscription}
        />
        <FAQ />
        <CTA isAuthenticated={!!user} />
       
      </main>
    </>
  );
}
