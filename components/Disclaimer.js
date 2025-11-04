//components/Disclaimer.js
import Link from "next/link";
export const dynamic = "force-dynamic";

export default function Disclaimer() {
  return (
    <div className="mt-36 text-sm text-black/60 border-t border-black/20 pt-6 text-center px-4">
      ⚠️ <strong>Disclaimer:</strong> Always double-check AI-generated content
      for accuracy. Content may contain factual errors or bias. See{" "}
      <Link href="/tos" className="underline hover:text-black">
        Terms
      </Link>
      .
    </div>
  );
}
