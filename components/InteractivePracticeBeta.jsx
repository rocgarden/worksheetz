import Image from "next/image";
import Link from "next/link";
export default function InteractivePracticeBeta() {
  return (
<section className="bg-purple-900 text-white py-16 px-8 text-center">
  <span className="bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
    Free Beta
  </span>
  <h2 className="text-3xl font-black mt-4 mb-3">
    Interactive Student Practice
  </h2>
  <p className="text-purple-200 max-w-xl mx-auto mb-6">
    AI-adaptive ELA reading practice for grades 6–8. 
    Aligned to Texas STAAR standards. 
    Free during beta — no credit card needed.
  </p>
  <Link href="/classroom" className="bg-yellow-400 text-purple-900 font-bold px-8 py-3 rounded-full">
    Try It Free →
  </Link>
  
  {/* Coming Soon */}
  {/* <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
    {["Grammar Practice", "Math Practice", "Science", "Social Studies"].map(subject => (
      <div key={subject} className="bg-purple-800 rounded-xl p-4 opacity-60">
        <p className="text-sm font-semibold">{subject}</p>
        <p className="text-xs text-purple-300 mt-1">Coming Soon</p>
      </div>
    ))}
  </div> */}
</section>  
);
}