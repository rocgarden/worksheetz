// components/Problem.js
import { ClipboardCheck, Users, BarChart3 } from "lucide-react";

const Step = ({ icon: Icon, title, subtitle }) => {
  return (
    <div className="w-full md:w-56 flex flex-col items-center text-center">
      <div
        className="
          w-20 h-20
          rounded-full
          bg-white/10
          border border-white/20
          backdrop-blur
          flex items-center justify-center
          mb-5
        "
      >
        <Icon className="w-9 h-9 text-white" />
      </div>

      <h3 className="font-bold text-lg text-white">{title}</h3>

      <p className="text-white/80 text-sm mt-2">{subtitle}</p>
    </div>
  );
};

const Problem = () => {
  return (
<section
className="
px-8
py-20
md:py-28

bg-gradient-to-b
from-purple-50
via-white
to-purple-50
"
>      <div className="max-w-7xl mx-auto">
        {/* Title outside purple box */}
        <div className="text-center mb-10">
          <p className="text-primary font-semibold mb-3">
            The Classroom Challenge
          </p>

          <h2 className="max-w-3xl mx-auto font-extrabold text-4xl md:text-5xl tracking-tight text-base-content">
            Identifying skill gaps is easy — fixing them is not
          </h2>

          <p className="max-w-2xl mx-auto text-lg text-base-content/70 leading-relaxed mt-6">
            After practice, quizzes, or benchmark testing, teachers are left
            sorting through results, grouping students, and creating
            individualized instruction — often with very little time.
          </p>
        </div>

        {/* Purple problem box */}
<div
className="
relative
overflow-hidden

rounded-[2rem]

bg-purple-500

border-2
border-purple-900/40

shadow-[0_24px_80px_rgba(88,28,135,0.18)]

text-white

px-8
py-14
md:px-12
md:py-20
"
>          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,0.75), rgba(255,255,255,0.08) 75%)",
                opacity: 0.28,
              }}
            />

            <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-28 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row justify-center items-center md:items-start gap-10 md:gap-14">
            <Step
              icon={BarChart3}
              title="Skill Gaps, Surfaced Automatically"
              subtitle="Every session updates each student's TEKS skill profile — no manual sorting"
            />

            <div className="hidden md:block w-16 h-px bg-white/30 mt-10" />

            <Step
              icon={Users}
              title="Students Grouped for You"
              subtitle="See who needs support on the same standard, instantly"
            />

            <div className="hidden md:block w-16 h-px bg-white/30 mt-10" />

            <Step
              icon={ClipboardCheck}
              title="Practice Assigned in a Click"
              subtitle="Targeted intervention generated and ready to assign"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Problem;