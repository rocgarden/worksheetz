// app/worksheets/[subject]/[grade]/page.jsx

import Link from 'next/link';

const subjectData = {
  'reading-comprehension': {
    title: 'Reading Comprehension',
    description: 'Improve reading skills with AI-generated comprehension passages and questions',
    benefits: [
      'Fiction and non-fiction passages',
      'Aligned to state standards',
      'Multiple difficulty levels',
      'Instant PDF download'
    ]
  },
  'grammar': {
    title: 'Grammar',
    description: 'Master grammar concepts with targeted practice worksheets',
    benefits: [
      'Parts of speech practice',
      'Sentence structure exercises',
      'Punctuation and mechanics',
      'Age-appropriate examples'
    ]
  },
  'social-studies': {
    title: 'Social Studies',
    description: 'Explore history, geography, and civics with engaging worksheets',
    benefits: [
      'Primary source analysis',
      'Map reading skills',
      'Historical thinking',
      'Current events connections'
    ]
  },
  'staar-reading': {
    title: 'STAAR Reading Practice',
    description: 'Prepare students for the STAAR reading test with targeted practice',
    benefits: [
      'TEKS-aligned content',
      'Test format familiarity',
      'Multiple question types',
      'Built-in answer keys'
    ]
  }
};

const gradeData = {
  'grade-k': { num: 0, display: 'Kindergarten' },
  'grade-1': { num: 1, display: '1st Grade' },
  'grade-2': { num: 2, display: '2nd Grade' },
  'grade-3': { num: 3, display: '3rd Grade' },
  'grade-4': { num: 4, display: '4th Grade' },
  'grade-5': { num: 5, display: '5th Grade' },
  'grade-6': { num: 6, display: '6th Grade' },
  'grade-7': { num: 7, display: '7th Grade' },
  'grade-8': { num: 8, display: '8th Grade' },
};

function getPopularConcepts(subject, grade) {
  const concepts = {
    'reading-comprehension': {
      'k-2': ['Main Idea', 'Story Sequence', 'Character Traits', 'Picture Clues', 'Rhyming Words', 'Beginning Sounds'],
      '3-5': ['Theme', 'Point of View', 'Making Inferences', 'Text Evidence', 'Compare & Contrast', 'Cause & Effect'],
      '6-8': ["Author's Purpose", 'Figurative Language', 'Text Structure', 'Argument Analysis', 'Multiple Perspectives', 'Literary Devices']
    },
    'grammar': {
      'k-2': ['Nouns', 'Verbs', 'Adjectives', 'Capital Letters', 'Periods', 'Sentences'],
      '3-5': ['Subject-Verb Agreement', 'Verb Tenses', 'Commas', 'Quotation Marks', 'Conjunctions', 'Prepositions'],
      '6-8': ['Complex Sentences', 'Active/Passive Voice', 'Semicolons', 'Clauses', 'Sentence Variety', 'Parallel Structure']
    },
    'social-studies': {
      'k-2': ['Community Helpers', 'Map Skills', 'American Symbols', 'Seasons & Calendar', 'Family & Traditions', 'Rules & Laws'],
      '3-5': ['U.S. Regions', 'American History', 'Government Basics', 'Economics', 'World Geography', 'Cultural Diversity'],
      '6-8': ['World History', 'Civics & Government', 'Economics', 'Geography', 'Primary Sources', 'Current Events']
    },
    'staar-reading': {
      'k-2': ['Story Elements', 'Main Idea', 'Retelling', 'Author\'s Purpose', 'Text Features', 'Vocabulary'],
      '3-5': ['STAAR Format Practice', 'Multiple Choice Strategies', 'Short Answer Responses', 'Genre Recognition', 'Test-Taking Tips', 'Paired Passages'],
      '6-8': ['Literary Analysis', 'Informational Text', 'Poetry Interpretation', 'Extended Response', 'Cross-Text Synthesis', 'Evidence Selection']
    }
  };

  const gradeRange = grade <= 2 ? 'k-2' : grade <= 5 ? '3-5' : '6-8';
  return concepts[subject]?.[gradeRange] || [];
}

function FAQItem({ question, answer }) {
  return (
    <div className="border-b pb-6">
      <h3 className="font-semibold text-lg mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}

export async function generateMetadata({ params }) {
  const subject = subjectData[params.subject];
  const grade = gradeData[params.grade];

  if (!subject || !grade) return {};

  return {
    title: `${subject.title} Worksheets for ${grade.display} | WorksheetzAI`,
    description: `Free AI-powered ${subject.title.toLowerCase()} worksheets for ${grade.display}. ${subject.description}. Generate unlimited practice materials in seconds.`,
  };
}

export default function SubjectGradePage({ params }) {
  const subject = subjectData[params.subject];
  const grade = gradeData[params.grade];

  // Handle invalid routes gracefully
  if (!subject || !grade) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <Link href="/" className="text-blue-600 underline">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-bold mb-4">
            {subject.title} Worksheets for {grade.display}
          </h1>
          <p className="text-xl mb-8">
            {subject.description}. Generate unlimited worksheets in seconds with AI.
          </p>
          <div className="flex gap-4">
            <Link
              href="/signin"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200"
            >
              Try Free Sample
            </Link>
            <Link
              href="/#pricing"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8">
          Why Teachers Love Our {subject.title} Worksheets
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {subject.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="text-green-600 text-2xl">✓</div>
              <p className="text-lg">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">
            Generate Your Worksheet in 3 Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Choose Your Concept', desc: 'Select the specific skill or topic you want to practice' },
              { step: 2, title: 'AI Generates Content', desc: 'Our AI creates a customized worksheet in seconds' },
              { step: 3, title: 'Download & Print', desc: 'Get your PDF instantly, ready for your classroom' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="bg-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Concepts */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8">
          Popular {subject.title} Topics for {grade.display}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {getPopularConcepts(params.subject, grade.num).map((concept, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:border-purple-600 cursor-pointer">
              <p className="font-medium">{concept}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Start Creating Worksheets Today</h2>
          <p className="text-xl mb-8">Try one free sample worksheet. No credit card required.</p>
          <Link
            href="/signin"
            className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-200 inline-block"
          >
            Get Your Free Sample
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <FAQItem
            question={`Are the ${subject.title.toLowerCase()} worksheets aligned to standards?`}
            answer="Yes! All worksheets are designed to align with state and national education standards for your grade level."
          />
          <FAQItem
            question="Can I customize the topic?"
            answer="Absolutely. You can customize the topic and choose specific concepts to target your students' needs."
          />
          <FAQItem
            question="How many worksheets can I generate?"
            answer="Free accounts get one sample download. Pro accounts ($5/month) get additional worksheet generations and downloads."
          />
        </div>
      </section>
    </div>
  );
}

export function generateStaticParams() {
  const subjects = ['reading-comprehension', 'grammar', 'social-studies', 'staar-reading'];
  const grades = ['grade-k', 'grade-1', 'grade-2', 'grade-3', 'grade-4', 'grade-5', 'grade-6', 'grade-7', 'grade-8'];

  return subjects.flatMap(subject =>
    grades.map(grade => ({ subject, grade }))
  );
}