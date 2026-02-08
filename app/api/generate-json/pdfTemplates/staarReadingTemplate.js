import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(process.cwd(), "public");

const iconSize = 16;
const bookIcon = path.join(publicDir, "images/book.png");
const pencilIcon = path.join(publicDir, "images/pencil.png");
const handRight = path.join(publicDir, "images/handRight.png");
const margin = 50;

function safeStr(v) {
  return typeof v === "string" ? v : "";
}

function normalizeData(data) {
  // handles jsonb object vs stringified json
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data;
}

// function drawFooter(doc) {
//   const footerY = doc.page.height - doc.page.margins.bottom + 5;

//   doc.save(); // ← save current cursor & graphics state

//   doc
//     .font("Italic")
//     .fontSize(8)
//     .fillColor("#888888")
//     .text(
//       "Worksheetz AI • worksheetzai.com",
//       doc.page.margins.left,
//       footerY,
//       {
//         width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
//         align: "center",
//       }
//     );

//   doc.restore(); // ← restore cursor so PDFKit doesn’t think we’re at the bottom
// }

function drawLines(doc, lines = 4) {
  const boxX = doc.page.margins.left;
  const boxWidth =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  let lineY = doc.y + 8;

  for (let j = 0; j < lines; j++) {
    doc.moveTo(boxX + 10, lineY).lineTo(boxX + boxWidth - 10, lineY).stroke();
    lineY += 22;
  }
  doc.moveDown(2);
}

function renderChoiceList(doc, choices = [], indent = 30) {
  choices.forEach((choice) => {
    const id = safeStr(choice?.id).toUpperCase();
    const text = safeStr(choice?.text);
    const label = `${id}) ${text}`;
    doc.text(`   ${label}`, { indent });
  });
}

function renderTeksLine(doc, teksArr) {
  if (!Array.isArray(teksArr) || teksArr.length === 0) return;
  const teks = teksArr.filter(Boolean).join(", ");
  doc
    .font("Italic")
    .fontSize(9)
    .fillColor("gray")
    .text(`TEKS: ${teks}`, { indent: 20 });
  doc.fillColor("black").font("Regular").fontSize(12);
}

function splitToLines(text) {
  // light helper: if generator didn’t provide lines[], we create simple lines
  const t = safeStr(text).trim();
  if (!t) return [];
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.map((s, i) => `(${i + 1}) ${s}`);
}

export async function staarReadingPdfTemplate(data) {
  const normalized = normalizeData(data);

  return new Promise((resolve, reject) => {
    const stream = new PassThrough();
    const doc = new PDFDocument({ margin });
    const chunks = [];

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
      topic,
      gradeLevel,
      passage = {},
      questions = [],
      genre,
    } = normalized;

    const passageTitle = safeStr(passage.title) || "Reading Passage";
    const passageText = safeStr(passage.text);
    const passageLines =
      Array.isArray(passage.lines) && passage.lines.length > 0
        ? passage.lines
        : splitToLines(passageText);

    // ===== Page 1: Title + Passage =====
    doc
      .font("Bold")
      .fontSize(18)
      .text("STAAR Reading Practice", { align: "center" });

    doc.moveDown(0.5);

    doc
      .font("Regular")
      .fontSize(11)
      .text(
        `Grade ${safeStr(gradeLevel)} 
     
        `,
        { align: "center" }
      );
        //  • ${safeStr(genre) || "Nonfiction"} • Topic:
        //   ${safeStr(topic) || "—"}

    doc.moveDown(1);

    doc.font("Bold").fontSize(14).text(passageTitle, { align: "left" });
    doc.moveDown(0.5);

    if (passageText) {
      doc.image(bookIcon, doc.x + 5, doc.y - 1, {
        width: iconSize,
        height: iconSize,
        continued: true,
      });

      doc.font("Regular").fontSize(12).text(passageText, {
        align: "justify",
        indent: 20,
      });

      doc.moveDown(1);

    }
    // Optional: show “lines” as a mini evidence bank (helps choose-a-line)
    // if (passageLines.length > 0) {
    //   doc.font("Bold").fontSize(12).text("Line Reference", { indent: 20 });
    //   doc.moveDown(0.25);
    //   doc.font("Regular").fontSize(10);
    //   passageLines.forEach((line) => {
    //     doc.text(line, { indent: 20 });
    //   });
    //   doc.moveDown(0.75);
    //   doc.font("Regular").fontSize(12);
    // }

    // ===== Page 2: Questions =====
    doc.addPage();

    doc.font("Bold").fontSize(16).text("Questions", { align: "center" });
    doc.moveDown(0.5);

    doc.image(handRight, doc.x + 3, doc.y - 2, {
      width: iconSize,
      height: iconSize,
      continued: true,
    });
    doc
      .font("Italic")
      .fontSize(12)
      .text("Read the passage. Answer each question.", { indent: 20 });

    doc.moveDown(1);
    doc.font("Regular").fontSize(12);

    questions.forEach((q, idx) => {
      const n = idx + 1;

      if (q.type === "multiple-choice") {
        doc.font("Regular").fontSize(12).text(`${n}. ${safeStr(q.question)}`, {
          indent: 20,
        });
        renderTeksLine(doc, q.teks);
        renderChoiceList(doc, q.choices, 30);
        doc.moveDown(1);
      }

      if (q.type === "multi-select") {
        doc
          .font("Regular")
          .fontSize(12)
          .text(`${n}. ${safeStr(q.question)} (Select TWO answers.)`, {
            indent: 20,
          });
        renderTeksLine(doc, q.teks);
        renderChoiceList(doc, q.choices, 30);
        doc.moveDown(1);
      }

      if (q.type === "choose-a-line") {
        doc
          .font("Regular")
          .fontSize(12)
          .text(`${n}. ${safeStr(q.question)}`, { indent: 20 });
        renderTeksLine(doc, q.teks);

        doc
          .font("Italic")
          .fontSize(11)
          .text("Write the line that best supports your answer:", {
            indent: 20,
          });
        doc.moveDown(0.25);
        drawLines(doc, 2);
        doc.moveDown(1)
      }

      if (q.type === "scr") {
        doc.image(pencilIcon, doc.x + 5, doc.y - 1, {
          width: iconSize,
          height: iconSize,
          continued: true,
        });

        doc
          .font("Regular")
          .fontSize(12)
          .text(`${n}. ${safeStr(q.prompt)}`, { indent: 20 });

        renderTeksLine(doc, q.teks);

        // SCR space (a little more room)
        drawLines(doc, 6);
      }
    });

    // ===== Page 3: Answer Key =====
    doc.addPage();
    doc
      .font("Bold")
      .fontSize(16)
      .text("Answer Key", { align: "center", underline: true });

    doc.moveDown(1);

    questions.forEach((q, idx) => {
      const n = idx + 1;

      if (q.type === "multiple-choice" || q.type === "multi-select") {
        const ans = Array.isArray(q.answer) ? q.answer : [];
        const formatted = ans
          .map((id) => safeStr(id).toUpperCase())
          .filter(Boolean)
          .join(", ");

        // also show option text for clarity (like your reading template)
        let answerText = formatted || "—";
        if (Array.isArray(q.choices) && ans.length > 0) {
          const parts = ans.map((ansId) => {
            const match = q.choices.find(
              (c) => safeStr(c.id).toLowerCase() === safeStr(ansId).toLowerCase()
            );
            return match
              ? `${safeStr(match.id).toUpperCase()}) ${safeStr(match.text)}`
              : safeStr(ansId).toUpperCase();
          });
          answerText = parts.join(", ");
        }

        doc.font("Regular").fontSize(12).text(`${n}. Answer: ${answerText}`);
        renderTeksLine(doc, q.teks);
        doc.moveDown(0.5);
      }

      if (q.type === "choose-a-line") {
        const a = q.answer || {};
        const lineIndex =
          typeof a.lineIndex === "number" ? `Line ${a.lineIndex + 1}` : "";
        const lineText = safeStr(a.lineText);

        doc
          .font("Regular")
          .fontSize(12)
          .text(
            `${n}. Evidence: ${lineIndex || ""}${lineIndex && lineText ? " — " : ""}${lineText || " Student should cite a line from the passage."}`
          );
        renderTeksLine(doc, q.teks);
        doc.moveDown(0.5);
      }

      if (q.type === "scr") {
        doc
            .font("Regular")
            .fontSize(12)
            .text(`${n}. SCR: Student response will vary.`);

        renderTeksLine(doc, q.teks);

        // Display rubric
        const rubric = q.rubric || {};
        const anchors = rubric.anchors || [];

        doc.moveDown(0.5);
        doc.font("Bold").fontSize(12).text("Rubric:", { indent: 20 });
        doc.moveDown(0.25);

        anchors.forEach((a) => {
            doc
            .font("Regular")
            .fontSize(11)
            .text(`${a.points} points — ${a.description}`, { indent: 30 });
        });

        doc.moveDown(1);
        }

    });
    doc.end();
  });
}
