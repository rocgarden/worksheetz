//components/UsageStats.jsx
import {
  Sparkles,
  Download,
  Gift,
} from "lucide-react";

export default function UsageStats({
  generationCount,
  downloadCount,
  generationBonus,
  pdfBonus,
  planGenerations,
  planPdfs,
}) {
  const generationPercent =
    (generationCount / Math.max(planGenerations, 1)) * 100;

  const downloadPercent =
    (downloadCount / Math.max(planPdfs, 1)) * 100;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-purple-200 bg-white">
      {/* Header */}
      <div
        className="
          flex items-center gap-3
          px-6 py-4
          bg-gradient-to-r
          from-purple-900
          via-purple-800
          to-purple-700
        "
      >
        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-purple-200">
            Monthly Activity
          </p>

          <h2 className="text-lg font-bold text-white">
            Usage Stats
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">

        {/* Worksheet Generations */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-700" />
              <span className="font-semibold">
                Worksheet Generations
              </span>
            </div>

            <span className="text-sm text-base-content/60">
              {generationCount} / {planGenerations}
            </span>
          </div>

          <div className="h-3 rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
              style={{
                width: `${Math.min(generationPercent, 100)}%`,
              }}
            />
          </div>

          {generationBonus > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-green-700 text-sm">
              <Gift className="w-4 h-4" />
              +{generationBonus} bonus generations
            </div>
          )}
        </div>

        {/* PDF Downloads */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-700" />
              <span className="font-semibold">
                PDF Downloads
              </span>
            </div>

            <span className="text-sm text-base-content/60">
              {downloadCount} / {planPdfs}
            </span>
          </div>

          <div className="h-3 rounded-full bg-purple-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-300"
              style={{
                width: `${Math.min(downloadPercent, 100)}%`,
              }}
            />
          </div>

          {pdfBonus > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-green-700 text-sm">
              <Gift className="w-4 h-4" />
              +{pdfBonus} bonus downloads
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-purple-100">
          <p className="text-sm text-base-content/60">
            Usage resets monthly based on your current plan.
          </p>
        </div>
      </div>
    </div>
  );
}
