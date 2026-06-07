//components/SubjectCard
import Link from "next/link";

export default function SubjectCard({ title, href, icon: Icon, description, label }) {
  return (
    <Link
      href={href}
      className="
        group relative overflow-hidden
        flex flex-col items-start
        min-h-[230px]
        p-7
        bg-base-100
        rounded-3xl
        border border-base-300
        shadow-sm
        hover:border-primary/40
        hover:shadow-xl
        hover:-translate-y-1
        transition-all duration-300
      "
    >
      {/* <div className="absolute -top-14 -right-14 w-32 h-32 rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors" /> */}
      {/* <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-secondary/10" /> */}
{/* bg-primary/10 text-primary */}
      <div className="relative z-10 w-full flex items-center justify-between mb-6">
        <div className="w-12 h-12 rounded-2xl text-base-content/70 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>

        {label && (
          <span className="text-xs font-bold uppercase tracking-wide bg-accent/10 text-accent px-3 py-1 rounded-full">
            {label}
          </span>
        )}
      </div>

      <div className="relative z-10 text-left">
        <h3 className="font-bold text-lg text-base-content">
          {title}
        </h3>

        <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
          {description}
        </p>

        <span className="inline-flex items-center text-primary font-semibold text-sm mt-6">
          Browse practice <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
        </span>
      </div>
    </Link>
  );
}