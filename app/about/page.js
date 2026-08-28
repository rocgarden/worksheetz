//app/about/page.js
import Link from "next/link";
export const metadata = {
  title:
    "About Teks Portfolio - Adaptive Assessment & Worksheets for Texas Teachers",
  description:
    "Learn about Teks Portfolio and how we're helping Texas teachers track student growth with adaptive, TEKS-aligned assessments — plus fast, standards-based worksheet generation.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-6">
          About Teks Portfolio
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          We're on a mission to help Texas teachers understand exactly where
          each student stands — and give them the tools to close the gap, fast.
        </p>
      </section>
      {/* Our Story */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-purple-900 mb-6">Our Story</h2>
        <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
          <p>
            Teks Portfolio was born from a simple observation: teachers often
            don't find out a student is behind until it's too late to catch up —
            and even when they do know, building the right practice material to
            close that specific gap takes time most teachers don't have.
          </p>
          <p>
            With Texas moving to the Student Success Tool and three testing
            windows a year, teachers need to see exactly where each student
            stands — right after Beginning, Middle, and End of Year checks — not
            months later. Teks Portfolio tracks that growth automatically and
            shows you precisely which TEKS standards a student needs to revisit.
          </p>
          <p>
            From there, closing the gap is fast. Whether it's an adaptive
            reading assessment or a targeted worksheet for extra practice, Teks
            Portfolio generates grade-appropriate, standards-aligned content in
            seconds — built for Texas classrooms, grades 6-8 and growing.
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
              <span className="text-3xl mr-3">🎯</span>
              <h3 className="text-xl font-semibold text-primary mb-3">
                Every Student's Gaps Are Different
              </h3>
            </div>
            <p className="text-gray-600">
              A class average hides who actually needs help, and with what. We
              believe teachers should see student growth clearly, standard by
              standard, so support goes exactly where it's needed.
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
              Great educational tools shouldn&apos;t break the bank. We keep our
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
              We respect your privacy and your students&apos; privacy. We
              don&apos;t sell data, and we keep your information secure.
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
              <strong className="text-gray-900">Adaptive by Design:</strong>{" "}
              Teks Portfolio adjusts to each student in real time — as a student
              answers, the difficulty and focus of the next question adapt to
              what they've shown they know, so every session targets exactly
              where a student needs support.
            </p>
            <p>
              <strong className="text-gray-900">
                Built on TEKS, Reviewed by Teachers:
              </strong>{" "}
              Every passage and question is generated, checked, and approved
              before it ever reaches a student — aligned to specific TEKS
              standards and DOK levels, not just generic grade-level content.
            </p>
            <p>
              <strong className="text-gray-900">Continuously Improving:</strong>{" "}
              Our content bank grows every week, and we're constantly refining
              how sessions adapt based on real classroom results. When you use
              Teks Portfolio, the experience gets sharper over time.
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
            <strong>Two ways to help students grow:</strong> track progress with
            adaptive, TEKS-aligned assessments, and generate targeted worksheets
            whenever a student needs extra practice.
          </p>
        </div>

        <h3 className="text-xl font-semibold text-purple-800 mb-4">
          Adaptive Assessment & Portfolio
        </h3>
        <div className="space-y-6 mb-10">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Set Up Your Classroom
              </h4>
              <p className="text-gray-600">
                Add your roster and assign a testing window — Beginning, Middle,
                or End of Year.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Students Take Adaptive Sessions
              </h4>
              <p className="text-gray-600">
                Questions adjust in real time to each student, targeting the
                TEKS standards and DOK levels they need most.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                See Growth & Gaps Instantly
              </h4>
              <p className="text-gray-600">
                Your portfolio view updates automatically, showing exactly which
                standards each student has mastered — and which need more
                support.
              </p>
            </div>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-purple-800 mb-4">
          Worksheet Generation
        </h3>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Choose Your Subject & Grade
              </h4>
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
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Customize Your Worksheet
              </h4>
              <p className="text-gray-600">
                Add specific topics, themes, or learning objectives, and the
                worksheet adapts to your needs.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Generate & Download
              </h4>
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
            What&apos;s Available (And Coming Soon)
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Adaptive Assessment - Beta */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Available in Beta
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Adaptive Assessment & Portfolio
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-600 mr-2">✓</span>
                  <div>
                    <strong>Reading / ELA, Grades 6-8</strong>
                    <p className="text-sm text-gray-600">
                      TEKS-aligned adaptive sessions and portfolio tracking
                      across BOY, MOY, and EOY windows
                    </p>
                  </div>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-4 italic">
                More subjects and grades are being added as the beta grows.
              </p>
            </div>

            {/* Worksheet Generation */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Available Now
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Worksheet Generation
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
              <p className="text-sm text-gray-500 mt-4 italic">
                Included in every package.
              </p>
            </div>

            {/* Coming Soon */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                More Subjects & Grades
              </h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="mr-2">🧮</span>
                  <span>Math Adaptive Assessments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🔬</span>
                  <span>Science Adaptive Assessments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🏛️</span>
                  <span>Social Studies Adaptive Assessments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📈</span>
                  <span>Grades 3-5 Expansion</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-4 italic">
                Have a subject or grade request?{" "}
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
          <p className="text-gray-700 mb-4">Teks Portfolio is designed for:</p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>Texas Grades 6-8 Teachers</strong> who want a clear,
                standards-aligned picture of student growth all year
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>Special Education Teachers</strong> needing
                differentiated, standards-aligned materials
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>ESL/ELL Instructors</strong> requiring
                grade-appropriate, targeted practice
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>K-8 Teachers &amp; Tutors</strong> who want fast,
                standards-based worksheets for any subject
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span>
                <strong>Homeschool Parents</strong> looking for quality,
                grade-appropriate practice materials
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
                <strong>Always Improving:</strong> We&apos;re constantly
                refining how sessions adapt and expanding our content bank to
                cover more standards and grade levels.
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
                <strong>Student Data Stays Protected:</strong> We never sell
                student data, and student records use teacher-assigned codes
                instead of personal information wherever possible.
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
          <h2 className="text-3xl font-bold mb-4">Ready to See Every Student's Growth?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Join Texas teachers using Teks Portfolio to track student progress
            and close skill gaps faster — worksheets included.
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
          We&apos;d love to hear from you. Reach out anytime.
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
