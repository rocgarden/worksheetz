//utils/puppeteerPdf.js
import puppeteer from "puppeteer";

export async function generatePdfFromHtml(html) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const page = await browser.newPage();

  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  const pdfBuffer = await page.pdf({
    format: "Letter",
    printBackground: true,
    margin: {
      top: "1in",
      bottom: "1in",
      left: "0.75in",
      right: "0.75in",
    },
  });

  await browser.close();
  return pdfBuffer;
}
