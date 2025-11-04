"use client";

import { useRef, useState } from "react";

// <FAQ> component is a lsit of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList

const faqList = [
  {
    question: "What do I get exactly?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          You get access to AI-powered tools that help you generate customized
          quizzes and worksheets for your classroom. Depending on your plan, you
          can also download PDFs, regenerate content for variation, and access
          priority support.
        </p>
        <ul className="list-disc list-inside">
          <li>
            Starter Plan: 2 worksheet generations + 1 PDF download per month
          </li>
          <li>
            Pro Plan: 10 worksheet generations + 5 PDF downloads per month
          </li>
        </ul>
      </div>
    ),
  },
  {
    question: "Can I get a refund?",
    answer: (
      <p>
        Yes! You can request a refund within 7 days of your purchase. Just reach
        out to our support team by email and we’ll take care of it.
      </p>
    ),
  },
  {
    question: "How do I upgrade my plan?",
    answer: (
      <p>
        You can upgrade anytime by visiting your account dashboard and selecting
        the Pro plan. Billing is handled securely through Stripe.
      </p>
    ),
  },
  {
    question: "What happens if I reach my monthly limit?",
    answer: (
      <p>
        Once you reach your monthly limit for worksheet generations or PDF
        downloads, you’ll need to wait until your usage resets next month or
        upgrade to a higher plan for more access.
      </p>
    ),
  },
  {
    question: "Do unused credits roll over?",
    answer: (
      <p>
        No, unused worksheet generations or PDF downloads do not roll over to
        the next month. Each billing cycle resets your usage.
      </p>
    ),
  },
  {
    question: "Is the Starter plan really free?",
    answer: (
      <p>
        Yes, the Starter plan is free to use and includes limited access to
        worksheet generation and downloads. It’s perfect for small projects or
        trying out the platform.
      </p>
    ),
  },
  {
    question: "Can I cancel anytime?",
    answer: (
      <p>
        Absolutely. You can cancel your subscription at any time through your
        account dashboard. Your access will remain active until the end of your
        billing cycle.
      </p>
    ),
  },
  {
    question: "I have another question",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          No problem! Just reach out to us by email and we’ll be happy to help.
        </p>
      </div>
    ),
  },
];

const Item = ({ item }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
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
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
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
    <section className="bg-base-200" id="faq">
      <div className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
