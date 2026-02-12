//components/SubjectCard
import Link from "next/link";
export default function SubjectCard({ title, href, icon }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:shadow-md transition-all duration-200 bg-white"
    >
      <span className="text-4xl mb-3">{icon}</span>
      <h3 className="font-semibold text-lg text-gray-800 text-center">{title}</h3>
      <span className="text-indigo-600 text-sm mt-2">Browse Worksheets →</span>
    </Link>
  );
}