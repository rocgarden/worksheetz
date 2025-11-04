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

export async function socialStudiesPdfTemplate(data) {
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
      intro_activity,
      topic,
    } = data;

    //  const capitalizedConcept = capitalizeFirstLetter(concept);
    const capitalizedTopic = capitalizeFirstLetter(topic);

    // === Title & Intro ===
    doc.font("Bold").fontSize(18).text(capitalizedTopic, { align: "center" });
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

    renderIntroActivity(doc, intro_activity);

    renderCollabActivity(doc, capitalizedTopic);

    // === Guided Practice ===
    renderGuidedPractice(doc, guided_practice);

    // === Independent Practice ===
    renderIndependentPractice(doc, independent_practice);

    // === Answer Key ===
    renderAnswerKey(doc, guided_practice, independent_practice, intro_activity);

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
        doc.text(`   ${choice.id?.toUpperCase()}) ${choice.text}`, {
          indent: 30,
        });
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
function renderAnswerKey(doc, guided, independent, intro_activity = null) {
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

  doc.moveDown(1);
  if (intro_activity) {
    doc.font("Bold").fontSize(14).text("Concept Activity Answers:");
    renderIntroActivityAnswers(doc, intro_activity);
    doc.moveDown(1);
  }
}

// === ANSWER SECTION ===
function renderAnswerSection(doc, questions) {
  questions.forEach((q, i) => {
    const num = i + 1;
    if (q.type === "multiple-choice") {
      //const ans = Array.isArray(q.answer) ? q.answer.join(", ") : q.answer;
      //doc.font("Regular").fontSize(12).text(`${num}. Answer: ${ans}`);
      let answerText = "";

      // ✅ Normalize answer as an array
      const answerArray = Array.isArray(q.answer)
        ? q.answer
        : typeof q.answer === "string"
        ? [q.answer]
        : [];

      // ✅ Build a map of { id: text } from choices
      const choiceMap = Object.fromEntries(
        (q.choices || []).map((c) => [String(c.id).toLowerCase(), c.text])
      );

      // ✅ Create display text
      answerText = answerArray
        .map((ansId) => {
          if (typeof ansId !== "string") return "[Invalid ID]";
          const id = ansId.toLowerCase();
          const label = id.toUpperCase();
          return `${label}) ${choiceMap[id] || "[missing text]"}`;
        })
        .join(", ");

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
function renderIntroActivityAnswers(doc, activity) {
  if (!activity || !activity.answers) return;

  doc.font("Regular").fontSize(12);

  if (Array.isArray(activity.answers)) {
    activity.answers.forEach((ans, i) => {
      doc.text(`${i + 1}. ${ans}`);
    });
  } else if (typeof activity.answers === "string") {
    doc.text(`Answer: ${activity.answers}`);
  }
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

function renderGuidedPractice(doc, practice) {
  doc.addPage();
  doc.font("Bold").fontSize(16).text("Guided Practice", { align: "center" });
  doc.moveDown(0.5);

  if (practice.instructions) {
    doc.image(handRight, doc.x + 3, doc.y - 2, {
      width: iconSize,
      height: iconSize,
      continued: true,
    });
    doc.font("Italic").fontSize(12).text(practice.instructions, {
      indent: 20,
    });
    doc.moveDown(0.5);
  }

  let questionNumber = 1;

  // Multiple-choice questions
  const mcQuestions = practice.questions.filter(
    (q) => q.type === "multiple-choice"
  );
  mcQuestions.forEach((q) => {
    // Show source or paragraph first if exists
    if (q.source || q.paragraph) {
      const content = q.source || q.paragraph;
      const label = q.source ? "Source" : "Paragraph";
      doc.image(bookIcon, doc.x + 5, doc.y - 1, {
        width: iconSize,
        height: iconSize,
        continued: true,
      });
      doc.font("Regular").fontSize(12).text(`${label}: ${content}`, {
        indent: 20,
        align: "justify",
      });
      doc.moveDown(0.5);
    }

    // Render the question
    doc.font("Regular").fontSize(12).text(`${questionNumber}. ${q.question}`, {
      indent: 20,
    });

    // Render choices
    // q.choices?.forEach((choice) => {
    //   doc.text(`   ${choice}`, { indent: 30 });
    // });
    q.choices?.forEach((choice) => {
      doc.text(`   ${choice.id?.toUpperCase()}) ${choice.text}`, {
        indent: 30,
      });
    });

    doc.moveDown(1);
    questionNumber++;
  });

  // Open-ended question
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
      .text(`${questionNumber}. ${openEnded.prompt}`, {
        indent: 20,
      });
    drawLinesForAnswer(doc);
  }
}

function renderIntroActivity(doc, activity) {
  if (!activity || !activity.type) return;

  doc.moveDown(1);
  doc.font("Bold").fontSize(14).text("Practice Activity", { align: "center" });

  doc
    .font("Italic")
    .fontSize(12)
    .text(activity.instructions || "");
  doc.moveDown(0.5);

  doc.font("Regular").fontSize(12);

  switch (activity.type) {
    case "fill-in-the-blank":
      if (activity.word_bank) {
        doc.text(`Word Bank: ${activity.word_bank.join(", ")}`);
        doc.moveDown(0.5);
      }
      activity.sentences?.forEach((s, i) => {
        doc
          .font("Regular")
          .fontSize(14)
          .text(`${i + 1}. ${s}`);
      });
      break;

    case "cloze-paragraph":
      doc.text(activity.paragraph || "");
      break;

    case "timeline_ordering":
      activity.events?.forEach((event, i) => {
        doc.text(`• ${event}`);
      });
      break;

    case "question":
      doc.text(`Question: ${activity.question || "What do you think?"}`);
      drawLinesForAnswer(doc);
      break;

    default:
      doc.text("Unsupported activity type.");
      break;
  }

  doc.moveDown(1);
}

function renderCollabActivity(doc, capitalizedTopic) {
  doc.moveDown(1);
  doc
    .font("Bold")
    .fontSize(14)
    .text("Collaborative Activity", { align: "center" });
  doc.moveDown(0.3);

  doc.image(pencilIcon, doc.x + 3, doc.y - 1, {
    width: iconSize,
    height: iconSize,
    continued: true,
  });

  doc
    .font("Italic")
    .fontSize(12)
    .text(
      `• Discuss with a partner one important concept or theme about the ${capitalizedTopic}.`,
      { indent: 20 }
    );

  doc.moveDown(0.2);

  doc
    .font("Italic")
    .text(
      `• Write a sentence or draw a picture about what your partner discussed.`,
      { indent: 20 }
    );

  doc.moveDown(1);
  drawLinesForAnswer(doc); // Let students write or draw below
}

function getQuestionBoxHeight(doc, q, width) {
  const padding = 10;
  let totalHeight = padding;

  doc.font("Regular").fontSize(11);

  if (q.source || q.paragraph) {
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

  q.choices?.forEach((choice) => {
    const choiceHeight = doc.heightOfString(`   ${choice}`, {
      width: width - 2 * padding - 10,
    });
    totalHeight += choiceHeight + 4;
  });

  totalHeight += padding; // bottom padding

  return totalHeight;
}

//  case "vocabulary_matching":
//       if (activity.terms && activity.definitions) {
//         activity.terms.forEach((term, i) => {
//           const definition = activity.definitions[i] || "";
//           doc.text(`${i + 1}. ${term} → ${definition}`);
//         });
//       }
//       break;

// function renderGridQuestion(doc, q, number, x, y, width, height) {
//   const padding = 10;
//   const boxBottom = y + height;
//   let currentY = y + padding;

//   // Draw bounding box
//   doc.rect(x, y, width, height).stroke();

//   doc.font("Regular").fontSize(11);

//   // Render paragraph (if any)
//   if (q.source || q.paragraph) {
//     const content = q.source || q.paragraph;
//     const label = q.source ? "Source" : "Paragraph";
//     // render with label and icon
//     doc.image(bookIcon, x + padding, currentY, {
//       width: iconSize,
//       height: iconSize,
//     });
//     const iconOffset = iconSize + 5;
//     const paraX = x + padding + iconOffset;
//     const paraWidth = width - 2 * padding - iconOffset;
//     const paraHeight = doc.heightOfString(`${label}: ${content}`, {
//       width: paraWidth,
//       align: "justify",
//     });
//     doc.text(`${label}: ${content}`, paraX, currentY, {
//       width: paraWidth,
//       align: "justify",
//     });
//     currentY += Math.max(iconSize, paraHeight) + 8;
//   }

//   // Render question
//   const questionText = `${number}. ${q.question}`;
//   const questionHeight = doc.heightOfString(questionText, {
//     width: width - 2 * padding,
//   });

//   doc.text(questionText, x + padding, currentY, {
//     width: width - 2 * padding,
//   });

//   currentY += questionHeight + 6; // space below question

//   // Render choices
//   q.choices?.forEach((choice) => {
//     const choiceText = `   ${choice}`;
//     const choiceHeight = doc.heightOfString(choiceText, {
//       width: width - 2 * padding - 10,
//     });

//     doc.text(choiceText, x + padding + 10, currentY, {
//       width: width - 2 * padding - 10,
//     });

//     currentY += choiceHeight + 4; // space between choices
//   });
// }
