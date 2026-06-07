//components/InteractivePracticeBeta
// import Image from "next/image";
// import Link from "next/link";
// export default function InteractivePracticeBeta() {
//   return (
// <section className="bg-purple-900 text-white py-16 px-8 text-center">
//   <span className="bg-yellow-400 text-purple-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
//     Free Beta
//   </span>
//  <h2 className="text-3xl font-black mt-4 mb-3">
//   TEKS-Aligned Interactive Reading Practice
// </h2>
//   <p className="text-purple-200 max-w-xl mx-auto mb-6">
//     AI-adaptive ELA reading practice for grades 6–8. 
//     Aligned to Texas STAAR standards. 
//     Free during beta — no credit card needed.
//   </p>
//   <Link href="/dashboard" className="bg-yellow-400 text-purple-900 font-bold px-8 py-3 rounded-full">
//     Try It Free →
//   </Link>
  
//   {/* Coming Soon */}
//   {/* <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
//     {["Grammar Practice", "Math Practice", "Science", "Social Studies"].map(subject => (
//       <div key={subject} className="bg-purple-800 rounded-xl p-4 opacity-60">
//         <p className="text-sm font-semibold">{subject}</p>
//         <p className="text-xs text-purple-300 mt-1">Coming Soon</p>
//       </div>
//     ))}
//   </div> */}
// </section>  
// );
// }

// components/InteractivePracticeBeta.js
import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";

export default function InteractivePracticeBeta({ isAuthenticated = false }) {
  const highlights = [
    {
      label: "Practice Type",
      value: "ELA Reading Practice",
    },
    {
      label: "Standards Focus",
      value: "TEKS + STAAR-style questions",
    },
    {
      label: "Adaptive Rigor",
      value: "DOK 1 → DOK 3 progression",
    },
    {
      label: "Teacher Tools",
      value: "Classroom dashboard included",
    },
  ];

  return (
    <section className="bg-base-100 py-20 px-8">
      <div className="max-w-6xl mx-auto rounded-3xl bg-purple-900 text-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-yellow-400/10" />
        </div>

        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center p-8 md:p-12">
          <div className="text-center lg:text-left">
            <span className="bg-accent text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Free Beta
            </span>

            <h2 className="text-3xl md:text-4xl font-black mt-4 mb-4">
              Assign TEKS-aligned interactive reading practice
            </h2>

            <p className="text-purple-100 text-lg leading-relaxed mb-6">
              Students complete online STAAR-style reading practice that adapts
              from DOK 1 recall to DOK 3 strategic thinking based on their
              responses. Teachers can manage classroom activity from the
              dashboard. Free during beta — no credit card needed.
            </p>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-7">
              {["Adaptive Difficulty", "DOK 1 → DOK 3", "Skill-Based Practice"].map(
                (item) => (
                  <span
                    key={item}
                    className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-purple-100"
                  >
                    {item}
                  </span>
                )
              )}
            </div>

            {isAuthenticated ? (
              <Link
                href="/classroom"
                className="btn bg-yellow-400 hover:bg-yellow-300 text-purple-900 border-none rounded-full btn-wide"
              >
                Go to Classroom →
              </Link>
            ) : (
              <ButtonSignin
                redirectTo="/classroom"
                extraStyle="btn bg-yellow-400 hover:bg-yellow-300 text-purple-900 border-none rounded-full btn-wide"
                text="Try Interactive Practice"
              />
            )}
          </div>

          <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
            <div className="grid gap-3 text-left">
              {highlights.map((item) => (
                <div key={item.label} className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-purple-200">{item.label}</p>
                  <p className="font-bold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}