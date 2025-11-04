import fs from "fs";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Point to the public directory in a Next.js app
const publicDir = path.resolve(process.cwd(), "public");

const iconSize = 16;
const bookIcon = path.join(publicDir, "images/book.png");
const pencilIcon = path.join(publicDir, "images/pencil.png");
const handRight = path.join(publicDir, "images/handRight.png");
const margin = 50;

function capitalizeFirstLetter(string) {
  if (typeof string !== "string") return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export async function readingPdfTemplate(data) {
  return new Promise((resolve, reject) => {
    const stream = new PassThrough();
    const doc = new PDFDocument({ margin });
    const chunks = [];

    // ✅ Use absolute paths to fonts in public directory
    const fontsPath = path.resolve(process.cwd(), "public", "fonts");

    doc.registerFont("Regular", path.join(fontsPath, "Roboto-Regular.ttf"));
    doc.registerFont("Italic", path.join(fontsPath, "Roboto-Italic.ttf"));
    doc.registerFont("Bold", path.join(fontsPath, "Roboto-Bold.ttf"));

    doc.font("Regular");
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));

    doc.pipe(stream);

    const {
      concept,
      concept_introduction,
      example,
      guided_practice,
      independent_practice,
    } = data;

    const capitalizedConcept = capitalizeFirstLetter(concept);

    // === Title & Intro ===
    doc.font("Bold").fontSize(18).text(capitalizedConcept, { align: "center" });
    doc.moveDown(1);

    doc.font("Italic").fontSize(13).text(concept_introduction, {
      align: "justify",
      indent: 20,
    });
    doc.moveDown(0.5);

    if (example) {
      doc.font("Regular").fontSize(12).text(`Example: ${example}`, {
        align: "left",
        indent: 20,
      });
      doc.moveDown(1);
    }

    // === Guided Practice ===
    renderGuidedPractice(doc, guided_practice);

    // === Independent Practice ===
    renderIndependentPractice(doc, independent_practice);

    // === Answer Key ===
    renderAnswerKey(doc, guided_practice, independent_practice);

    doc.end();
  });
}

// === INDEPENDENT PRACTICE ===
function renderIndependentPractice(doc, practice) {
  doc.addPage();
  doc
    .font("Bold")
    .fontSize(16)
    .text("Independent Practice", { align: "center" });
  doc.moveDown(0.5);

  if (practice.instructions) {
    doc.font("Italic").fontSize(12).text(practice.instructions, {
      indent: 20,
    });
    doc.moveDown(0.5);
  }

  if (practice.story) {
    doc.image(bookIcon, doc.x + 5, doc.y - 1, {
      width: iconSize,
      height: iconSize,
      continued: true,
    });
    doc.font("Regular").fontSize(12).text(practice.story, {
      align: "justify",
      indent: 20,
    });
    doc.moveDown(1);
  }

  practice.questions.forEach((q, i) => {
    if (q.type === "multiple-choice") {
      // doc.image(questionIcon, doc.x + 5, doc.y - 1, {
      //   width: iconSize,
      //   height: iconSize,
      //   continued: true,
      // });
      doc
        .font("Regular")
        .fontSize(12)
        .text(`${i + 1}. ${q.question}`, {
          indent: 20,
        });
      // q.choices?.forEach((choice) => {
      //   doc.text(`   ${choice}`, { indent: 30 });
      // });
      q.choices?.forEach((choice) => {
        const choiceLabel = `${choice.id?.toUpperCase()}) ${choice.text}`;
        doc.text(`   ${choiceLabel}`, { indent: 30 });
      });

      doc.moveDown(1);
    } else if (q.type === "open-ended") {
      doc.image(pencilIcon, doc.x + 5, doc.y - 1, {
        width: iconSize,
        height: iconSize,
        continued: true,
      });
      doc
        .font("Regular")
        .fontSize(12)
        .text(`${i + 1}. ${q.prompt}`, {
          indent: 20,
        });
      drawLinesForAnswer(doc);
    }
  });
}

// === ANSWER KEY ===
function renderAnswerKey(doc, guided, independent) {
  doc.addPage();
  doc
    .font("Bold")
    .fontSize(16)
    .text("Answer Key", { align: "center", underline: true });
  doc.moveDown(1);

  doc.font("Bold").fontSize(14).text("Guided Practice Answers:");
  renderAnswerSection(doc, guided.questions);

  doc.moveDown(1);
  doc.font("Bold").fontSize(14).text("Independent Practice Answers:");
  renderAnswerSection(doc, independent.questions);
}

function renderAnswerSection(doc, questions) {
  questions.forEach((q, i) => {
    const num = i + 1;

    if (q.type === "multiple-choice") {
      let answerText = "";

      if (Array.isArray(q.answer)) {
        answerText = q.answer
          .map((ans) => {
            // Handle both string IDs and object answers
            const ansId = typeof ans === "string" ? ans : ans?.id;

            const match = q.choices?.find(
              (choice) => choice.id?.toLowerCase() === ansId?.toLowerCase()
            );

            return match
              ? `${match.id.toUpperCase()}) ${match.text}`
              : ansId || "—";
          })
          .join(", ");
      } else {
        // Handle single string or object
        const ansId = typeof q.answer === "string" ? q.answer : q.answer?.id;

        const match = q.choices?.find(
          (choice) => choice.id?.toLowerCase() === ansId?.toLowerCase()
        );

        answerText = match
          ? `${match.id.toUpperCase()}) ${match.text}`
          : ansId || "—";
      }

      doc.font("Regular").fontSize(12).text(`${num}. Answer: ${answerText}`);
    } else if (q.type === "open-ended") {
      doc
        .font("Regular")
        .fontSize(12)
        .text(`${num}. Open-ended: Student response will vary.`);
    }

    doc.moveDown(0.5);
  });
}

// === DRAW LINES FOR OPEN-ENDED ===
function drawLinesForAnswer(doc) {
  const boxX = doc.page.margins.left;
  const boxWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  let lineY = doc.y + 5;
  for (let j = 0; j < 3; j++) {
    doc
      .moveTo(boxX + 10, lineY)
      .lineTo(boxX + boxWidth - 10, lineY)
      .stroke();
    lineY += 25;
  }
  doc.moveDown(2);
}

function renderGridQuestion(doc, q, number, x, y, width, height) {
  const padding = 10;
  const boxBottom = y + height;
  let currentY = y + padding;

  // Draw bounding box
  doc.rect(x, y, width, height).stroke();

  doc.font("Regular").fontSize(11);

  // Render paragraph (if any)
  if (q.paragraph) {
    const iconOffset = iconSize + 5;
    doc.image(bookIcon, x + padding, currentY, {
      width: iconSize,
      height: iconSize,
    });

    const paraX = x + padding + iconOffset;
    const paraWidth = width - 2 * padding - iconOffset;
    const paraHeight = doc.heightOfString(`Paragraph: ${q.paragraph}`, {
      width: paraWidth,
      align: "justify",
    });

    doc.text(`Paragraph: ${q.paragraph}`, paraX, currentY, {
      width: paraWidth,
      align: "justify",
    });

    currentY += Math.max(iconSize, paraHeight) + 8; // space below paragraph
  }

  // Render question
  const questionText = `${number}. ${q.question}`;
  const questionHeight = doc.heightOfString(questionText, {
    width: width - 2 * padding,
  });

  doc.text(questionText, x + padding, currentY, {
    width: width - 2 * padding,
  });

  currentY += questionHeight + 6; // space below question

  q.choices?.forEach((choice) => {
    const choiceLabel = `${choice.id?.toUpperCase()}) ${choice.text}`;
    const choiceHeight = doc.heightOfString(choiceLabel, {
      width: width - 2 * padding - 10,
    });

    doc.text(choiceLabel, x + padding + 10, currentY, {
      width: width - 2 * padding - 10,
    });

    currentY += choiceHeight + 4;
  });
}

function renderGuidedPractice(doc, practice) {
  doc.font("Bold").fontSize(16).text("Guided Practice", { align: "center" });
  doc.moveDown(0.5);

  if (practice.instructions) {
    doc.image(handRight, doc.x + 3, doc.y - 2, {
      width: iconSize,
      height: iconSize,
      continued: true,
    });
    doc.font("Italic").fontSize(12).text(practice.instructions, { indent: 20 });
    doc.moveDown(0.5);
  }

  const gridStartY = doc.y;
  const gridMargin = 0;
  const columnWidth =
    (doc.page.width -
      doc.page.margins.left -
      doc.page.margins.right -
      gridMargin) /
    2;
  const startX = doc.page.margins.left;

  const gridQuestions = practice.questions
    .filter((q) => q.type === "multiple-choice")
    .slice(0, 4);

  let rowHeights = [0, 0]; // max height for row 0 and row 1
  let boxPositions = [];

  // First: calculate box heights
  gridQuestions.forEach((q, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);

    const height = getQuestionBoxHeight(doc, q, columnWidth);
    rowHeights[row] = Math.max(rowHeights[row] || 0, height);

    boxPositions.push({ q, index, row, col, height });
  });

  // Second: render the boxes using row-wise uniform height
  let yPositions = [gridStartY];
  yPositions[1] = yPositions[0] + rowHeights[0] + gridMargin;

  boxPositions.forEach(({ q, index, row, col }) => {
    const x = startX + col * (columnWidth + gridMargin);
    const y = yPositions[row];

    const rowHeight = rowHeights[row]; // Use tallest in the row
    renderGridQuestion(doc, q, index + 1, x, y, columnWidth, rowHeight);
  });

  // Third: set cursor below the last row
  const gridBottomY = yPositions[1] + rowHeights[1];
  doc.y = gridBottomY + 16;

  // Reset x position
  doc.x = doc.page.margins.left;

  // Finally: render open-ended question
  const openEnded = practice.questions.find((q) => q.type === "open-ended");
  if (openEnded) {
    doc.image(pencilIcon, doc.x + 3, doc.y - 1, {
      width: iconSize,
      height: iconSize,
      continued: true,
    });

    doc
      .font("Regular")
      .fontSize(12)
      .text(
        `5. ${openEnded.prompt}`,
        doc.page.margins.left + iconSize + 5,
        doc.y,
        {
          width:
            doc.page.width -
            doc.page.margins.left -
            doc.page.margins.right -
            iconSize -
            5,
          align: "left",
        }
      );

    drawLinesForAnswer(doc);
  }
}

function getQuestionBoxHeight(doc, q, width) {
  const padding = 10;
  let totalHeight = padding;

  doc.font("Regular").fontSize(11);

  if (q.paragraph) {
    const iconOffset = iconSize + 5;
    const paraWidth = width - 2 * padding - iconOffset;
    const paraHeight = doc.heightOfString(`Paragraph: ${q.paragraph}`, {
      width: paraWidth,
      align: "justify",
    });
    totalHeight += Math.max(iconSize, paraHeight) + 8;
  }

  const questionHeight = doc.heightOfString(`${q.question}`, {
    width: width - 2 * padding,
  });
  totalHeight += questionHeight + 6;

  // ✅ Updated: properly calculate height using choice.id and choice.text
  q.choices?.forEach((choice) => {
    const choiceLabel = `${choice.id?.toUpperCase()}) ${choice.text}`;
    const choiceHeight = doc.heightOfString(`   ${choiceLabel}`, {
      width: width - 2 * padding - 10,
    });
    totalHeight += choiceHeight + 4;
  });

  totalHeight += padding; // bottom padding

  return totalHeight;
}

// function getQuestionBoxHeight(doc, q, width) {
//   const padding = 10;
//   let totalHeight = padding;

//   doc.font("Regular").fontSize(11);

//   if (q.paragraph) {
//     const iconOffset = iconSize + 5;
//     const paraWidth = width - 2 * padding - iconOffset;
//     const paraHeight = doc.heightOfString(`Paragraph: ${q.paragraph}`, {
//       width: paraWidth,
//       align: "justify",
//     });
//     totalHeight += Math.max(iconSize, paraHeight) + 8;
//   }

//   const questionHeight = doc.heightOfString(`${q.question}`, {
//     width: width - 2 * padding,
//   });
//   totalHeight += questionHeight + 6;

//   q.choices?.forEach((choice) => {
//     const choiceHeight = doc.heightOfString(`   ${choice}`, {
//       width: width - 2 * padding - 10,
//     });
//     totalHeight += choiceHeight + 4;
//   });

//   totalHeight += padding; // bottom padding

//   return totalHeight;
// }

// === ANSWER SECTION ===
// function renderAnswerSection(doc, questions) {
//   questions.forEach((q, i) => {
//     const num = i + 1;
//     if (q.type === "multiple-choice") {
//       const ans = Array.isArray(q.answer) ? q.answer.join(", ") : q.answer;
//       doc.font("Regular").fontSize(12).text(`${num}. Answer: ${ans}`);
//     } else if (q.type === "open-ended") {
//       doc
//         .font("Regular")
//         .fontSize(12)
//         .text(`${num}. Open-ended: Student response will vary.`);
//     }
//     doc.moveDown(0.5);
//   });
// }

// Render choices
// q.choices?.forEach((choice) => {
//   const choiceText = `   ${choice}`;
//   const choiceHeight = doc.heightOfString(choiceText, {
//     width: width - 2 * padding - 10,
//   });

//   doc.text(choiceText, x + padding + 10, currentY, {
//     width: width - 2 * padding - 10,
//   });

//   currentY += choiceHeight + 4; // space between choices
// });
