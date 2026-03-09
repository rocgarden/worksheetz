// /api/generate-json/pdf-templates/grammarTemplate.js

export function grammarTemplate(data) {
  const {
    gradeLevel,
    topic,
    concept,
    concept_introduction,
    example,
    guided_practice,
    independent_practice,
    independent_practice_2,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Grammar Worksheet</title>

  <style>
    @page {
    margin: 40px 40px 80px 40px;   
    }

    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }

    /* HEADER */
    .header {
    position: relative;
    margin-bottom: 2px;
    text-align: center;
    }


    /* FOOTER */
    footer {
         position: fixed;
         bottom: 0;
         left: 0;
         right: 0;
         height: 30px;
         text-align: center;
         font-size: 11px;
         color: #999;
         padding: 10px 0;
       }

    h2 {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    h3 {
      font-size: 16px;
      font-weight: bold;
      margin-top: 20px;
      margin-bottom: 6px;
    }

    .section {
      margin-bottom: 24px;
    }

    .box {
      border: 1px solid #d1d5db;
      padding: 8px;
      border-radius: 6px;
      background: #fafafa;
      margin-top: 8px;
      margin-bottom: 8px;
    }

    .question {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .choices {
      margin-left: 20px;
      margin-top: 2px;
    }

    .page-break {
      page-break-before: always;
    }

    .lines {
    margin-top: 10px;
    margin-bottom: 24px; /* ensures space before footer */
    page-break-inside: avoid;
    }


    .line {
      border-bottom: 1px solid #ccc;
      height: 24px;
      margin-top: 12px;
    }
    
    .first-page-header {
     page-break-after: always;
   }

  </style>
</head>

<body>

  <!-- HEADER -->
  <div class="header">
    <h1 style="font-size:22px; margin:0;">${concept}</h1>
  </div>
  <!-- FOOTER -->
    <footer>
      © Worksheetz AI — Generated for classroom use
    </footer>

  <!-- MAIN CONTENT -->
  <main>

    <!-- INTRO -->
    <div class="section">
      <p>${concept_introduction}</p>

      <div class="box">
        <strong>Example:</strong> ${example}
      </div>
    </div>

    <!-- GUIDED PRACTICE -->
    <div class="section">
      <h3>Guided Practice</h3>

      ${
        guided_practice.instructions
          ? `<p><em>${guided_practice.instructions}</em></p>`
          : ""
      }

      ${guided_practice.questions
        .map((q, i) => renderQuestion(q, i))
        .join("")}
    </div>

    <!-- INDEPENDENT PRACTICE 1 -->
    <div class="page-break"></div>
    <div class="section">
      <h2>Independent Practice</h2>

      ${
        independent_practice.instructions
          ? `<p><em>${independent_practice.instructions}</em></p>`
          : ""
      }

      ${
        independent_practice.story
          ? `<div class="box"><pre style="white-space:pre-wrap; font-family:inherit;">${independent_practice.story}</pre></div>`
          : ""
      }

      ${independent_practice.questions
        .map((q, i) => renderQuestion(q, i))
        .join("")}
    </div>

    <!-- INDEPENDENT PRACTICE 2 -->
    <div class="page-break"></div>
    <div class="section">
      <h2>Independent Practice 2</h2>

      ${
        independent_practice_2.instructions
          ? `<p><em>${independent_practice_2.instructions}</em></p>`
          : ""
      }

      ${
        independent_practice_2.story
          ? `<div class="box"><pre style="white-space:pre-wrap; font-family:inherit;">${independent_practice_2.story}</pre></div>`
          : ""
      }

      ${independent_practice_2.questions
        .map((q, i) => renderQuestion(q, i))
        .join("")}
    </div>

    <!-- ANSWER KEY -->
    <div class="page-break"></div>
    <div class="section">
      <h2>Answer Key</h2>

      <h3>Guided Practice</h3>
      ${guided_practice.questions
        .map((q, i) => renderAnswer(q, i))
        .join("")}

      <h3>Independent Practice</h3>
      ${independent_practice.questions
        .map((q, i) => renderAnswer(q, i))
        .join("")}

      <h3>Independent Practice 2</h3>
      ${independent_practice_2.questions
        .map((q, i) => renderAnswer(q, i))
        .join("")}
    </div>

  </main>
</body>
</html>
`;
}

// ----------------------------
// HELPERS
// ----------------------------

function renderQuestion(q, i) {
  if (q.type === "multiple-choice") {
    return `
      <div class="question">
        <p><strong>${i + 1}.</strong> ${q.sentence || q.question}</p>
        <div class="choices">
          ${q.choices
            .map((c) => `${c.id.toUpperCase()}) ${c.text}`)
            .join("<br/>")}
        </div>
      </div>
    `;
  }

  if (q.type === "open-ended") {
    return `
      <div class="question">
        <p><strong>${i + 1}.</strong> ${q.prompt}</p>
        <div class="lines">
          <div class="line"></div>
          <div class="line"></div>
        </div>
      </div>
    `;
  }

  return "";
}

function renderAnswer(q, i) {
  const ans = Array.isArray(q.answer)
    ? q.answer.map((a) => a.toUpperCase()).join(", ")
    : q.answer;

  return `<p><strong>${i + 1}.</strong> ${ans}</p>`;
}
