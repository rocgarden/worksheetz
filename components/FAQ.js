//components/FAQ.js
"use client";

import { useRef, useState } from "react";

// <FAQ> component is a list of <Item> component

const faqList = [
  {
    question: "What is this platform for?",
    answer: (
      <p>
        It helps teachers create TEKS-aligned practice, remediation materials,
        and printable worksheet resources. The platform currently supports
        interactive reading practice, teacher classroom tools, and AI-generated
        worksheets.
      </p>
    ),
  },
  {
    question: "Is interactive practice free?",
    answer: (
      <p>
        Yes. Interactive student practice is currently free during beta. Teachers
        can use it to assign online reading practice and support TEKS-based skill
        review.
      </p>
    ),
  },
  {
    question: "Are worksheets free or paid?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Worksheet generation includes limited free usage. Paid plans unlock
          more worksheet generations and PDF downloads.
        </p>
        <ul className="list-disc list-inside">
          <li>Free plan: limited worksheet generation/download access</li>
          <li>Pro plan: more monthly generations and PDF downloads</li>
        </ul>
      </div>
    ),
  },
  {
    question: "What grades and subjects are supported?",
    answer: (
      <p>
        The platform is starting with TEKS and STAAR-focused support, especially
        for grades 6–8 reading. It is being built to expand across more grades,
        subjects, and eventually standards beyond Texas.
      </p>
    ),
  },
  {
    question: "Does this support STAAR-style practice?",
    answer: (
      <p>
        Yes. The platform is designed around TEKS-aligned practice and
        STAAR-style preparation, including online practice and printable
        remediation materials.
      </p>
    ),
  },
  {
    question: "Do I need a credit card to start?",
    answer: (
      <p>
        No. Teachers can start with free access. A paid plan is only needed when
        you want more worksheet generations or PDF downloads.
      </p>
    ),
  },
  {
    question: "Is student data required?",
    answer: (
      <p>
        No student data is required to generate worksheets. Interactive practice
        and classroom tools should only collect the information needed to support
        teacher-managed practice and progress tracking.
      </p>
    ),
  },
  {
    question: "Can I cancel anytime?",
    answer: (
      <p>
        Yes. Paid subscriptions can be managed through your account dashboard,
        and billing is handled securely through Stripe.
      </p>
    ),
  },
  {
    question: "What happens if I reach my worksheet limit?",
    answer: (
      <p>
        You can continue using available free tools, but additional worksheet
        generations or PDF downloads may require waiting until your monthly reset
        or upgrading your plan.
      </p>
    ),
  },
];

const Item = ({ item }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-b border-base-content/10 hover:text-primary transition-colors"        
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-[max-height,opacity] duration-300 ease-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="bg-base-200 relative overflow-hidden" id="faq">
<div className="absolute inset-0 pointer-events-none">
  
      </div>

      <div className="relative z-10 py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">
            Questions teachers ask
          </p>

          <h2 className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently asked questions from teachers
          </h2>

          <p className="text-base-content/70 mt-4 max-w-md leading-relaxed">
            Learn what is free, what is paid, and how the platform supports
            TEKS-aligned practice, worksheets, and remediation.
          </p>
        </div>

        <ul className="basis-1/2 bg-base-100 rounded-3xl shadow-xl border border-base-content/5 px-6 py-2 md:px-8">          {faqList.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
