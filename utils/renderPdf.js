//utils/renderPdf
import { grammarPdfTemplate } from "@/app/api/generate-json/pdfTemplates/grammarPdfTemplate";
import { readingPdfTemplate } from "@/app/api/generate-json/pdfTemplates/readingPdfTemplate";
import { socialStudiesPdfTemplate } from "@/app/api/generate-json/pdfTemplates/socialStudiesTemplate";
import { staarReadingPdfTemplate } from "@/app/api/generate-json/pdfTemplates/staarReadingTemplate";

export async function renderPdf(type, data) {
  console.log("render type received:: ", type);
  if (type === "grammar") return grammarPdfTemplate(data);
  if (type === "reading") return readingPdfTemplate(data);
  if (type === "socialStudies") return socialStudiesPdfTemplate(data);
  if (type === "staarReading" ) return staarReadingPdfTemplate(data);
  throw new Error(`Unsupported worksheet type: ${type}`);
}
