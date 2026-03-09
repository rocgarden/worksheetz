//utils/renderPdf
import { generatePdfFromHtml } from "@/utils/puppeteerPdf";

// import { grammarPdfTemplate } from "@/app/api/generate-json/pdfTemplates/grammarPdfTemplate";
// import { readingPdfTemplate } from "@/app/api/generate-json/pdfTemplates/readingPdfTemplate";
import { socialStudiesPdfTemplate } from "@/app/api/generate-json/pdfTemplates/socialStudiesTemplate";
import { staarReadingPdfTemplate } from "@/app/api/generate-json/pdfTemplates/staarReadingTemplate";
import { readingTemplate } from "@/app/api/generate-json/pdf-templates/readingTemplate";
import { grammarTemplate } from "@/app/api/generate-json/pdf-templates/grammarTemplate";

export async function renderPdf(type, data) {
    let html;

  console.log("render type received:: ", type);
  if (type === "reading") html = readingTemplate({ worksheet: data });
  else if (type === "grammar") html = grammarTemplate(data);
  // if (type === "reading") return readingPdfTemplate(data);
  else if (type === "socialStudies") return socialStudiesPdfTemplate(data);
  else if (type === "staarReading" ) return staarReadingPdfTemplate(data);

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
