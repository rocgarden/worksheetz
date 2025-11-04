// api/generate-json/pdfTemplates/grammarPdfTemplate.js
import fs from "fs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname since you're using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Point to the public directory in a Next.js app
const publicDir = path.resolve(process.cwd(), "public");

// Absolute paths to images
const iconSize = 16;
const pencilIcon = path.join(publicDir, "images/pencil.png");
const starIcon = path.join(publicDir, "images/star.png");
const paperIcon = path.join(publicDir, "images/paper.png");
const handRight = path.join(publicDir, "images/handRight.png");

const margin = 50;

function capitalizeFirstLetter(string) {
  if (typeof string !== "string" || string.length === 0) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function grammarPdfTemplate(data) {
  console.log("📄 grammarPdfTemplate called with data:", data);

  return new Promise((resolve, reject) => {
    console.log("🔧 Creating PDFDocument...");

    const stream = new PassThrough();
    const doc = new PDFDocument({ margin });
    const chunks = [];

    // ✅ Use absolute paths to fonts in public directory
    const fontsPath = path.resolve(process.cwd(), "public", "fonts");

    doc.registerFont("Regular", path.join(fontsPath, "Roboto-Regular.ttf"));
    doc.registerFont("Italic", path.join(fontsPath, "Roboto-Italic.ttf"));
    doc.registerFont("Bold", path.join(fontsPath, "Roboto-Bold.ttf"));

    doc.font("Regular");
    console.log("🔧 Setting up listeners...");

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => {
      console.log("✅ PDF generation completed");
      resolve(Buffer.concat(chunks));
    });
    stream.on("error", (err) => {
      console.error("❌ Stream error:", err);
      reject(err);
    });

    console.log("🔧 Starting PDF stream...");

    doc.pipe(stream);

    // --- HEADER ---
    console.log("📝 Writing header...");

    const jsonData = data;
    const capitalizedText = capitalizeFirstLetter(jsonData.concept);

    doc
      .font("Bold")
      .fontSize(18)
      .text(`${capitalizedText}`, { align: "center", underline: true })
      .font("Regular");
    console.log("📝 Writing concept introduction...");

    doc.moveDown(1);
    doc.fontSize(14).text(`${jsonData.concept_introduction}`, {
      align: "justify",
      indent: 30,
    });
    console.log("📝 Writing example...");

    doc.moveDown(1);
    doc.image(starIcon, doc.x + 4, doc.y - 1, {
      width: iconSize,
      height: iconSize,
      continued: true,
    });
    doc
      .font("Italic")
      .fontSize(14)
      .text(`Example: ${jsonData.example}`, { align: "justify", indent: 25 })
      .font("Regular");
    doc.moveDown(0.5);

    console.log("🧠 Rendering guided practice...");

    // --- GUIDED PRACTICE ---
    renderGuidedPractice(doc, jsonData.guided_practice);
    doc.addPage();

    // --- INDEPENDENT PRACTICE ---
    renderIndependentPractice(doc, jsonData.independent_practice);

    // --- INDEPENDENT PRACTICE ---
    renderIndependentPractice(doc, jsonData.independent_practice_2);

    // --- ANSWER KEY ---
    renderAnswerKey(
      doc,
      jsonData.guided_practice,
      jsonData.independent_practice,
      jsonData.independent_practice_2
    );

    // End
    doc.end();
  });
}

// === COMPONENTS ===

function renderGuidedPractice(doc, guided) {
  const boxX = doc.page.margins.left;
  const boxWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .font("Bold")
    .fontSize(16)
    .text("Guided Practice", { align: "center" })
    .font("Regular");
  doc.moveDown(0.5);

  const startY = doc.y;

  if (guided.instructions) {
    doc.image(handRight, doc.x + 8, doc.y - 2, {
      width: iconSize,
      height: iconSize,
      continued: true,
    });
    doc
      .font("Italic")
      .fontSize(12)
      .text(guided.instructions, { indent: 30 })
      .font("Regular");
    doc.moveDown(0.5);
  }

  guided.questions.forEach((q, i) => {
    if (q.type === "open-ended") {
      doc.text(`${i + 1}.`, { continued: true });
      doc.image(pencilIcon, doc.x + 10, doc.y - 2, {
        width: iconSize,
        height: iconSize,
      });
      doc.text(`   ${q.prompt || ""}`, doc.x + 8);
      doc.moveDown(0.5);

      let lineY = doc.y + 5;
      for (let j = 0; j < 2; j++) {
        doc
          .moveTo(boxX + 10, lineY)
          .lineTo(boxX + boxWidth - 10, lineY)
          .stroke();
        lineY += 25;
      }
      doc.moveDown(0.5);
    } else if (q.type === "multiple-choice") {
      if (q.instructions) doc.fontSize(10).text(q.instructions);
      doc.fontSize(12).text(`${i + 1}. ${q.sentence || ""}`);
      if (q.choices?.length) {
        q.choices.forEach((choice) => {
          const label = `${choice.id?.toUpperCase()}) ${choice.text}`;
          doc.text(`   ${label}`);
        });
      }

      doc.moveDown();
    }
  });

  doc.moveDown(3);
  const endY = doc.y;
  const paddingX = 12;
  const paddingY = 8;
  doc
    .rect(
      margin - paddingX,
      startY - paddingY,
      boxWidth + paddingX * 2,
      endY - startY + paddingY * 2
    )
    .stroke();
}

function renderIndependentPractice(doc, independent) {
  doc.addPage();
  const boxX = doc.page.margins.left;
  const boxWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc
    .font("Bold")
    .fontSize(16)
    .text("Independent Practice", { align: "center" })
    .font("Regular");
  doc.moveDown(0.5);
  const startY = doc.y;

  if (independent.instructions) {
    doc.image(paperIcon, doc.x + 8, doc.y - 2, {
      width: iconSize,
      height: iconSize,
      continued: true,
    });
    doc
      .font("Italic")
      .fontSize(12)
      .text(independent.instructions, { indent: 30 });
    doc.moveDown(0.5);
  }

  if (independent.story) {
    const storyStartY = doc.y; // Start position before rendering story

    doc
      .fontSize(12)
      .text(independent.story, {
        align: "justify",
        indent: 30,
      })
      .font("Regular");

    const storyEndY = doc.y; // Position after story is rendered

    // Draw the rectangle box around the story only
    const paddingX = 10;
    const paddingY = 5;

    const boxStartX = boxX + 5; // Add slight left indent
    const boxWidthAdjusted = boxWidth - 10; // Adjust for indent on both sides

    doc
      .rect(
        boxStartX - paddingX,
        storyStartY - paddingY,
        boxWidthAdjusted + paddingX * 2,
        storyEndY - storyStartY + paddingY * 2
      )
      .stroke();

    doc.moveDown();
  }

  independent.questions.forEach((q, i) => {
    if (q.type === "open-ended") {
      doc.text(`${i + 1}.`, { continued: true });
      doc.image(pencilIcon, doc.x + 10, doc.y - 2, {
        width: iconSize,
        height: iconSize,
      });
      doc.text(`   ${q.prompt || ""}`, doc.x + 8);
      doc.moveDown(0.5);

      let lineY = doc.y + 5;
      for (let j = 0; j < 2; j++) {
        doc
          .moveTo(boxX + 10, lineY)
          .lineTo(boxX + boxWidth - 10, lineY)
          .stroke();
        lineY += 25;
      }
      doc.moveDown(2);
    } else if (q.type === "multiple-choice") {
      if (q.instructions) doc.fontSize(12).text(q.instructions);
      doc.fontSize(12).text(`${i + 1}. ${q.question}`);
      // if (q.choices?.length) q.choices.forEach((c) => doc.text(`   ${c}`));
      if (q.choices?.length) {
        q.choices.forEach((choice) => {
          const label = `${choice.id?.toUpperCase()}) ${choice.text}`;
          doc.text(`   ${label}`);
        });
      }

      doc.moveDown();
    }
  });

  doc.moveDown(3);
  const endY = doc.y;
  const paddingX = 12;
  const paddingY = 8;
  //doc.rect(margin - paddingX, startY - paddingY, boxWidth + paddingX * 2, endY - startY + paddingY * 2).stroke();
}

function renderAnswerKey(doc, guided, independent, independent2) {
  doc.addPage();
  doc
    .fontSize(12)
    .text("Guided Practice Answer Key", { underline: true, align: "center" });
  guided.questions.forEach((item, i) => {
    doc.text(`${i + 1}. ${item.sentence || item.prompt || ""}`);
    // if (item.choices?.length) doc.text(`Choices: ${item.choices.join(", ")}`);
    // if (item.answer) {
    //   const ans = Array.isArray(item.answer)
    //     ? item.answer.join(", ")
    //     : item.answer;
    //   doc.text(`Answer: ${ans}`);
    // }
    // Render choices
    if (item.choices?.length) {
      const choicesText = item.choices
        .map((c) => `${c.id.toUpperCase()}) ${c.text}`)
        .join(", ");
      doc.text(`Choices: ${choicesText}`);
    }

    // Render answers
    let answerText = "";

    if (Array.isArray(item.answer)) {
      answerText = item.answer
        .map((ans) => {
          const ansId =
            typeof ans === "string"
              ? ans.match(/[a-z]/i)?.[0]?.toLowerCase()
              : ans?.id?.toLowerCase();
          const match = item.choices?.find(
            (c) => c.id?.toLowerCase() === ansId
          );
          return match ? `${match.id.toUpperCase()}) ${match.text}` : ans;
        })
        .join(", ");
    } else {
      const ansId =
        typeof item.answer === "string"
          ? item.answer.match(/[a-z]/i)?.[0]?.toLowerCase()
          : item.answer?.id?.toLowerCase();
      const match = item.choices?.find((c) => c.id?.toLowerCase() === ansId);
      answerText = match
        ? `${match.id.toUpperCase()}) ${match.text}`
        : item.answer;
    }

    if (answerText) {
      doc.text(`Answer: ${answerText}`);
    }

    doc.moveDown();
  });

  doc.fontSize(12).text("Independent Practice Answer Key", {
    underline: true,
    align: "center",
  });
  doc.moveDown(1);
  independent.questions?.forEach((q, i) => {
    //const ans = Array.isArray(q.answer) ? q.answer.join(", ") : q.answer;
    //doc.text(`${i + 1}. Answer: ${ans || ""}`);
    let answerText = "";
    if (Array.isArray(q.answer)) {
      answerText = q.answer
        .map((ans) => {
          const ansId =
            typeof ans === "string"
              ? ans.match(/[a-z]/i)?.[0]?.toLowerCase()
              : ans?.id?.toLowerCase();
          const match = q.choices?.find((c) => c.id?.toLowerCase() === ansId);
          return match ? `${match.id.toUpperCase()}) ${match.text}` : ans;
        })
        .join(", ");
    } else {
      const ansId =
        typeof q.answer === "string"
          ? q.answer.match(/[a-z]/i)?.[0]?.toLowerCase()
          : q.answer?.id?.toLowerCase();
      const match = q.choices?.find((c) => c.id?.toLowerCase() === ansId);
      answerText = match
        ? `${match.id.toUpperCase()}) ${match.text}`
        : q.answer;
    }
    doc.text(`${i + 1}. Answer: ${answerText}`);
  });

  doc.fontSize(12).text("Independent Practice 2 Answer Key", {
    underline: true,
    align: "center",
  });
  doc.moveDown(1);
  independent2.questions?.forEach((q, i) => {
    //const ans = Array.isArray(q.answer) ? q.answer.join(", ") : q.answer;
    //doc.text(`${i + 1}. Answer: ${ans || ""}`);
    let answerText = "";

    if (Array.isArray(q.answer)) {
      answerText = q.answer
        .map((ans) => {
          const ansId =
            typeof ans === "string"
              ? ans.match(/[a-z]/i)?.[0]?.toLowerCase()
              : ans?.id?.toLowerCase();
          const match = q.choices?.find((c) => c.id?.toLowerCase() === ansId);
          return match ? `${match.id.toUpperCase()}) ${match.text}` : ans;
        })
        .join(", ");
    } else {
      const ansId =
        typeof q.answer === "string"
          ? q.answer.match(/[a-z]/i)?.[0]?.toLowerCase()
          : q.answer?.id?.toLowerCase();
      const match = q.choices?.find((c) => c.id?.toLowerCase() === ansId);
      answerText = match
        ? `${match.id.toUpperCase()}) ${match.text}`
        : q.answer;
    }

    doc.text(`${i + 1}. Answer: ${answerText}`);
  });
}
