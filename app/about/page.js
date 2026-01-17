import Link from "next/link";
import BetterIcon from "@/components/BetterIcon";
export const metadata = {
  title: "About WorksheetzAI - AI-Powered Worksheets for Teachers",
  description:
    "Learn about WorksheetzAI and how we're helping teachers create engaging, customized worksheets in seconds using AI technology.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-6">
          About WorksheetzAI
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          We're on a mission to save teachers time and help students learn
          better with AI-powered, customized educational worksheets.
        </p>
      </section>

      {/* Our Story */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-purple-900 mb-6">Our Story</h2>
        <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
          <p>
            WorksheetzAI was born from a simple observation: teachers spend
            countless hours creating worksheets, often late into the night, when
            they could be spending that time with their families or taking care
            of themselves.
          </p>
          <p>
            We built WorksheetzAI to give teachers their time back. Using
            advanced AI technology, we can generate high-quality,
            grade-appropriate worksheets in seconds—worksheets that would
            normally take 30-60 minutes to create from scratch.
          </p>
          <p>
            Whether you need reading comprehension exercises, grammar practice,
            or social studies worksheets, WorksheetzAI creates engaging,
            educational content tailored to your specific needs and grade level.
          </p>
        </div>
      </section>

      {/* What We Believe */}
      <section className="max-w-4xl mx-auto px-6 py-12  rounded-xl">
        <h2 className="text-3xl font-bold text-purple-900 mb-6">
          What We Believe
        </h2>
        <div className="grid md:grid-cols-2 gap-8  px-6 py-12 rounded-xl bg-gradient-to-br from-gray-50 to-purple-50">
          <div className=" bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition hover:shadow-md hover:-translate-y-1">
            <div className="flex mb-3">
              {" "}
              <span className="text-3xl mr-3">✨</span>
              <h3 className="text-xl font-semibold text-secondary mb-3">
                Teachers Deserve Better Tools
              </h3>
            </div>
            <p className="text-gray-600">
              Teaching is one of the most important jobs in the world. Teachers
              deserve modern tools that make their work easier, not harder.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition hover:shadow-md hover:-translate-y-1">
            <div className="flex mb-3">
              {" "}
              <span className="text-3xl mr-3">✅</span>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Quality Matters
              </h3>
            </div>
            <p className="text-gray-600">
              Every worksheet we generate is designed to be engaging,
              educational, and aligned with learning standards. We don't cut
              corners on quality.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition hover:shadow-md hover:-translate-y-1">
            <div className="flex mb-3">
              {" "}
              <span className="text-3xl mr-3">💳</span>
              <h3 className="text-xl font-semibold text-accent mb-3">
                Affordable for Everyone
              </h3>
            </div>
            <p className="text-gray-600">
              Great educational tools shouldn't break the bank. We keep our
              pricing accessible so every teacher can benefit.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 transition hover:shadow-md hover:-translate-y-1">
            <div className="flex mb-3">
              {" "}
              <span className="text-3xl mr-3">🔐</span>
              <h3 className="text-xl font-semibold text-error mb-3">
                Privacy First
              </h3>
            </div>
            <p className="text-gray-600">
              We respect your privacy and your students' privacy. We don't sell
              data, and we keep your information secure.
            </p>
          </div>
        </div>
      </section>

      {/* Our Technology */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-purple-900 mb-6">
          Our Technology
        </h2>
        <div className="bg-gradient-to-br from-pink-50 to-indigo-50 p-8 rounded-lg border border-blue-100">
          <div className="space-y-4 text-gray-700">
            <p>
              <strong className="text-gray-900">
                Powered by Top AI Models:
              </strong>{" "}
              We use the latest generation of AI language models to understand
              context, adapt to grade levels, and generate educational content
              that feels natural and engaging.
            </p>
            <p>
              <strong className="text-gray-900">
                Teacher-Tailored Prompts:
              </strong>{" "}
              Our AI isn't just general-purpose. We've crafted specialized
              prompts developed with input from real teachers to ensure every
              worksheet meets educational standards and classroom needs.
            </p>
            <p>
              <strong className="text-gray-900">Continuously Improving:</strong>{" "}
              We're always refining our AI prompts and adding new capabilities
              based on teacher feedback. When you use WorksheetzAI, you're
              getting worksheets that get better every month.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-purple-900 mb-6">
          How It Works
        </h2>
        <div className="bg-pink-50 p-6 rounded-lg border border-blue-100 mb-8">
          <p className="text-gray-700">
            <strong>Powered by Advanced AI:</strong> We use cutting-edge AI
            technology combined with teacher-tailored prompts to generate
            high-quality, grade-appropriate worksheets that actually work in
            real classrooms.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Choose Your Subject & Grade
              </h3>
              <p className="text-gray-600">
                Select from Reading, Grammar, or Social Studies, and pick the
                appropriate grade level (K-8).
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Customize Your Worksheet
              </h3>
              <p className="text-gray-600">
                Add specific topics, themes, or learning objectives. Our AI
                adapts to your needs.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generate & Download
              </h3>
              <p className="text-gray-600">
                Get your professionally formatted worksheet in seconds. Download
                as PDF and print or share digitally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Available */}
      <section className="max-w-4xl mx-auto px-6 py-12 bg-gray-50 -mx-6">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-purple-900 mb-6">
            What's Available (And Coming Soon)
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Subjects */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Available Now
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Current Subjects
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <div>
                    <strong>Reading Comprehension</strong>
                    <p className="text-sm text-gray-600">
                      Passages with questions for grades K-8
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <div>
                    <strong>Grammar Practice</strong>
                    <p className="text-sm text-gray-600">
                      Parts of speech, sentence structure, and more
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <div>
                    <strong>Social Studies</strong>
                    <p className="text-sm text-gray-600">
                      History, geography, civics topics
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Coming Soon */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                More Subjects & Templates
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">📐</span>
                  <span>Math Practice Worksheets</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🔬</span>
                  <span>Science Experiments & Activities</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✍️</span>
                  <span>Creative Writing Prompts</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📚</span>
                  <span>Vocabulary Builders</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🎨</span>
                  <span>Art & Music Integration</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🌟</span>
                  <span>Custom Template Builder</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-4 italic">
                Have a subject request?{" "}
                <Link href="/contact" className="text-blue-600 hover:underline">
                  Let us know!
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-purple-900 mb-6">
          Who We Serve
        </h2>
        <div className="bg-purple-50 p-8 rounded-lg border border-blue-100">
          <p className="text-gray-700 mb-4">WorksheetzAI is designed for:</p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>K-8 Teachers</strong> looking to save time on worksheet
                creation
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>Homeschool Parents</strong> who need quality educational
                materials
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>Tutors</strong> creating customized practice for
                students
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>Special Education Teachers</strong> needing
                differentiated materials
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>ESL/ELL Instructors</strong> requiring grade-appropriate
                content
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-purple-900 mb-6">
          Our Commitment to You
        </h2>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <ul className="space-y-4 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <span>
                <strong>Always Improving:</strong> We're constantly updating our
                AI to generate better, more relevant worksheets.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <span>
                <strong>Responsive Support:</strong> Have a question or issue?
                We respond to every email within 24 hours.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <span>
                <strong>Fair Pricing:</strong> No hidden fees, no surprise
                charges. Just honest, affordable pricing.
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 text-xl mr-3">✓</span>
              <span>
                <strong>Your Feedback Matters:</strong> We listen to teachers
                and build features you actually need.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 ">
        <div className="bg-gradient-to-br from-purple-800 to-pink-100 opacity-80 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Save Time?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Join teachers who are already using WorksheetzAI to create better
            worksheets in less time.
          </p>
          <Link
            href="/#pricing"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Contact */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-purple-900 mb-4">Questions?</h2>
        <p className="text-gray-600 mb-6">
          We'd love to hear from you. Reach out anytime.
        </p>
        <Link
          href="/contact"
          className="text-gray-600 hover:text-purple-700 font-semibold"
        >
          Contact Us →
        </Link>
      </section>
    </main>
  );
}
