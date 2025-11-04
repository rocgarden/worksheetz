const fs = require("fs");
const path = require("path");
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

// Optional: silence worker warning
pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve(
  "pdfjs-dist/legacy/build/pdf.worker.js"
);

const examples = {
  grammar: path.resolve(process.cwd(), "pdfExamples/Nounsexample.pdf"),
  reading: path.resolve(process.cwd(), "pdfExamples/Nounsexample.pdf"),
  // socialStudies: path.resolve(
  //   process.cwd(),
  //   "pdfExamples/socialStudiesPdfExample.pdf"
  // ),
};

async function extractPdfText(name, filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += strings.join(" ") + "\n\n";
  }

  const outputDir = path.resolve(process.cwd(), "pdfExamples/processed");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, `${name}.txt`), fullText);
  console.log(`✅ Processed: ${name}`);
}

(async () => {
  for (const [key, filePath] of Object.entries(examples)) {
    await extractPdfText(key, filePath);
  }
})();
