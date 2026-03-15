//utils/renderPdf
import { generatePdfFromHtml } from "@/utils/puppeteerPdf";

// import { grammarPdfTemplate } from "@/app/api/generate-json/pdfTemplates/grammarPdfTemplate";
// import { readingPdfTemplate } from "@/app/api/generate-json/pdfTemplates/readingPdfTemplate";
// import { socialStudiesPdfTemplate } from "@/app/api/generate-json/pdfTemplates/socialStudiesTemplate";
// import { staarReadingPdfTemplate } from "@/app/api/generate-json/pdfTemplates/staarReadingTemplate";
import { staarReadingTemplate } from "@/app/api/generate-json/pdfTemplates/staarReading/template";
import { socialStudiesTemplate } from "@/app/api/generate-json/pdfTemplates/socialStudies/template";
import { readingTemplate } from "@/app/api/generate-json/pdfTemplates/reading/template";
import { grammarTemplate } from "@/app/api/generate-json/pdfTemplates/grammar/template";
export async function renderPdf(type, data) {
    let html;

  console.log("render type received:: ", type);
  if (type === "reading") html = readingTemplate({ worksheet: data });
  else if (type === "grammar") html = grammarTemplate(data);
  // if (type === "reading") return readingPdfTemplate(data);
  else if (type === "socialStudies") html = socialStudiesTemplate(data);
  else if (type === "staarReading" ) html = staarReadingTemplate(data);

  else if (type === "reading") html = readingTemplate({ worksheet: data });

  else throw new Error(`Unsupported worksheet type: ${type}`);
  return await generatePdfFromHtml(html);
}

// import { generatePdfFromHtml } from "@/utils/puppeteerPdf";

// import { readingTemplate } from "@/pdf-templates/readingTemplate";
// import { grammarTemplate } from "@/pdf-templates/grammarTemplate";
// import { socialStudiesTemplate } from "@/pdf-templates/socialStudiesTemplate";
// import { staarReadingTemplate } from "@/pdf-templates/staarReadingTemplate";

// export async function renderPdf(type, data) {
//   let html;

//   if (type === "reading") html = readingTemplate({ worksheet: data });
//   else if (type === "grammar") html = grammarTemplate({ worksheet: data });
//   else if (type === "socialStudies") html = socialStudiesTemplate({ worksheet: data });
//   else if (type === "staarReading") html = staarReadingTemplate({ worksheet: data });
//   else throw new Error(`Unsupported worksheet type: ${type}`);

//   return await generatePdfFromHtml(html);
// }
