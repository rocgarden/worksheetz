export default function UsageStats({
  generationCount,
  downloadCount,
  generationBonus,
  pdfBonus,
  planGenerations,
  planPdfs,
}) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-4"> 📋 Your Usage This Month</h2>
      <ul className="space-y-2 font-medium">
        <li>
          <p>
            ⚡️ Generations used: {generationCount} /{" "}
            {/* {planGenerations + generationBonus} */}
            {planGenerations}
            {/* {generationBonus > 0 && (
              <span className="ml-2 text-green-500">
                (+{generationBonus} bonus)
              </span>
            )} */}
          </p>
        </li>
        <li>
          <p>
            ⬇️ PDF downloads: {downloadCount} / {planPdfs}
            {/* {pdfBonus > 0 && (
              <span className="ml-2 text-green-500">(+{pdfBonus} bonus)</span>
            )} */}
          </p>{" "}
        </li>
        <ul className="space-y-2">
          {generationBonus > 0 && (
            <li className="flex items-center text-green-600">
              <span className="text-lg">⚡ Generation Bonus:</span>
              <span className="ml-2 font-semibold">+{generationBonus}</span>
            </li>
          )}
          {pdfBonus > 0 && (
            <li className="flex items-center text-green-600">
              <span className="text-lg">📄 Downloads Bonus:</span>
              <span className="ml-2 font-semibold">+{pdfBonus}</span>
            </li>
          )}
        </ul>
      </ul>
    </div>
  );
}
