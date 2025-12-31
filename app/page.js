import { createClient } from "@/libs/supabase/server";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import Problem from "@/components/Problem";
import FAQ from "@/components/FAQ";
import FeaturesListicle from "@/components/FeaturesListicle";
import SamplePdfCarousel from "@/components/SamplePdfCarousel";
import CTA from "@/components/CTA";
import { renderFAQSchema } from "@/libs/seo";
import { faqSchemaItems } from "@/data/faq-schema";

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
        <Pricing
          isAuthenticated={!!user}
          hasActiveSubscription={hasActiveSubscription}
        />
        <FAQ />
        <SamplePdfCarousel />
        <CTA isAuthenticated={!!user} />
      </main>
    </>
  );
}
