// components/Disclaimer.js
import Link from "next/link";
export const dynamic = "force-dynamic";

const variants = {
  default: {
    className:
      "mt-36 text-sm text-black/60 border-t border-black/20 pt-6 text-center px-4",
    text: (
      <>
        ⚠️ <strong>Disclaimer:</strong>
        Always double-check AI-generated content for accuracy. Content may
        contain factual errors or bias. See{" "}
        <Link href="/tos" className="underline hover:text-black">
          Terms
        </Link>
        .
      </>
    ),
  },
  editor: {
    className: "mt-12 text-xs text-red-500 text-left px-0 border-none",
    text: (
      <>
        ⚠️ <strong>AI Notice:</strong>
        This content was generated using artificial intelligence and may not
        meet educational standards. Please review carefully before using in a
        classroom setting. You are solely responsible for ensuring its accuracy,
        appropriateness, and compliance with your institution’s guidelines.
      </>
    ),
  },
};
export default function Disclaimer({ variant = "default" }) {
  const { className, text } = variants[variant];
  return <div className={className}>{text}</div>;
}
