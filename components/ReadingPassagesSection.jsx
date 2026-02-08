import Image from "next/image";

export default function ReadingPassagesSection() {
  return (
    <section className="w-full py-20 bg-gradient-to-b from-slate-50 to-slate-150">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* TEXT CONTENT */}
          <div>
                      <p className="inline-block font-semibold text-primary mb-4">NEW</p>

            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              STAAR‑Style Reading Passages  
              <span className="block text-purple-600">
                Built for Real Classroom Practice
              </span>
            </h2>

            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Worksheetz AI generates engaging reading passages and comprehension
              question pdf's modeled after STAAR testing formats. Perfect for warm‑ups,
              small‑group instruction, intervention, or test prep.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 mt-2 rounded-full bg-purple-500"></span>
                <p className="text-slate-700">
                  Grade‑appropriate fiction and non-fiction reading passages
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 mt-2 rounded-full bg-purple-500"></span>
                <p className="text-slate-700">
                  STAAR‑aligned question stems and answer choices
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="h-2 w-2 mt-2 rounded-full bg-purple-500"></span>
                <p className="text-slate-700">
                  Printable, shareable, and customizable for any lesson
                </p>
              </li>
                <li className="flex items-start gap-3">
                <span className="h-2 w-2 mt-2 rounded-full bg-purple-500"></span>
                <p className="text-slate-700">
                  Short Constructed Response practice with rubric
                </p>
              </li>
            </ul>
          </div>

          {/* IMAGE / PASSAGE PREVIEW */}
          <div className="relative">
            <div className="rounded-xl border border-slate-200 shadow-md bg-white p-4 transition-transform duration-500 hover:scale-110">
              {/* <div className="aspect-[3/4] w-full rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-sm"> */}
                {/* Replace this with your actual passage image */}
                <Image
                src= "/samples/staarReadingPreview.png"
                alt="STAAR reading sample"
                width={260}
                height={380}
                className=" w-full object-cover  "
                />{" "}
              {/* </div> */}
            </div>

            {/* Subtle glow accent */}
            <div className="absolute -inset-2 -z-10 bg-indigo-200/30 blur-2xl rounded-xl"></div>
          </div>

        </div>
      </div>
    </section>
  );
}
