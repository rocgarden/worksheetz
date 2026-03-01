//api/generate-json/pdf-templates/readingTemplate.js
export function readingTemplate({ worksheet }) {
  const {
    concept,
    concept_introduction,
    example,
    guided_practice,
    independent_practice,
  } = worksheet;

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}  

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${concept}</title>

  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <style>
   @page {
     margin: 1in 1in 0.75in 1in; /* extra bottom margin */
    }

    body {
    margin: 0;
    padding: 0;
    }

    main {
      padding-bottom: 60px; /* Increase this to push content up */
      min-height: calc(100vh - 60px);
    }

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

   .page-break { page-break-before: always; break-before: page; }

    .avoid-break {
     page-break-inside: avoid;
    }
    .gp-block { break-inside: avoid; page-break-inside: avoid; }

    .gp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    }

    .gp-grid > div {
    border: 1px solid #ccc;
    padding: 8px;
    display: flex;
    flex-direction: column;
    }
      .gp-open { margin-top: 6px !important; }

     h2, h3 {
    page-break-after: avoid;
    }

    /* Only protect boxes + open-ended from splitting */
.gp-question,
.gp-open,
.avoid-break {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Titles shouldn't orphan */
h2, h3 { page-break-after: avoid; }
  
  </style>
</head>

<body class="font-sans text-gray-900">

  <footer>
    © Worksheetz AI — Generated for classroom use
  </footer>

  <!-- MAIN CONTENT -->
  <main>

    <!-- Title -->
    <h1 class="text-xl font-bold text-center mb-2">
      ${concept.charAt(0).toUpperCase() + concept.slice(1)}
    </h1>

    <!-- Concept Introduction -->
    <p class="italic text-base leading-relaxed mb-4">
      ${concept_introduction}
    </p>

    <!-- Example -->
    ${
      example
        ? `<p class="text-base mb-4"><span class="font-semibold">Example:</span> ${example}</p>`
        : ""
    }

    <!-- GUIDED PRACTICE -->
    <h2 class="text-xl font-bold text-center mt-4 mb-2 avoid-break">Guided Practice</h2>

    ${
      guided_practice.instructions
        ? `
      <div class="flex items-start mb-4">
        <p class="italic">${guided_practice.instructions}</p>
      </div>
    `
        : ""
    }

<!-- Guided Practice Grid + Open End -->
<section>
  <div class="grid grid-cols-2 gp-grid border">
    ${guided_practice.questions
      .filter((q) => q.type === "multiple-choice")
      .slice(0, 4)
    .map((q, i) => `
    <div class="gp-question text-[11px] leading-snug">
        
        ${q.paragraph ? `
        <p class="text-[11px] leading-snug mb-2 text-justify">
            <strong>Paragraph:</strong> ${q.paragraph}
        </p>
        ` : ""}

        <p class="font-semibold mb-1">
        ${i + 1}. ${q.question}
        </p>

        <div class="space-y-1 mt-1">
        ${q.choices.map(c => `
            <p class="ml-3 text-[10px] leading-snug">
            ${c.id.toUpperCase()}) ${c.text}
            </p>
        `).join("")}
        </div>
    </div>
    `)
      .join("")}
  </div>

  ${(() => {
    const open = guided_practice.questions.find((q) => q.type === "open-ended");
    if (!open) return "";

    return `
      <div class="gp-open mt-3">
        <p class="text-lg">${open.prompt}</p>
        <div class="mt-3 space-y-4">
          <hr /><hr />
        </div>
      </div>
    `;
  })()}
</section>

    <div class="page-break"></div>

    <!-- INDEPENDENT PRACTICE -->
    <h2 class="text-xl font-bold text-center mb-4">Independent Practice</h2>

    ${
      independent_practice.instructions
        ? `<p class="italic mb-4">${independent_practice.instructions}</p>`
        : ""
    }

 ${(() => {
  const p = independent_practice?.passage;

  const title = p?.title?.trim() || "";
  const subtitle = p?.subtitle?.trim() || "";
  const para1 = p?.paragraph1?.trim() || "";
  const para2 = p?.paragraph2?.trim() || "";

  const fallback = independent_practice?.story?.trim() || "";

  if (!title && !subtitle && !para1 && !para2 && !fallback) return "";

  return `
    <div class="grid grid-cols-[3fr_1fr] gap-6 mb-8">

      <div class="leading-relaxed">

        ${
          title
            ? `<div class="text-lg font-semibold mb-1">${escapeHtml(title)}</div>`
            : ""
        }

        ${
          para1
            ? `<div class="whitespace-pre-line">${escapeHtml(para1)}</div>`
            : fallback
            ? `<div class="whitespace-pre-line">${escapeHtml(fallback)}</div>`
            : ""
        }
       ${
          subtitle
            ? `<div class="whitespace-pre-line mt-3 italic mb-3">${escapeHtml(subtitle)}</div>`
            : ""
        }
        ${
          para2
            ? `<div class="whitespace-pre-line mt-3">${escapeHtml(para2)}</div>`
            : ""
        }
      </div>

      <!-- Annotation Column -->
      <div class="border-l-2 border-dashed pl-4 text-sm text-gray-500">
        <p class="font-semibold mb-2">Notes</p>
        <div class="space-y-6">
          <hr />
          <hr />
          <hr />
          <hr />
          <hr />
        </div>
      </div>

    </div>
  `;
      })()}  
    

    <!-- Independent Practice Questions -->
    <div>
      ${independent_practice.questions
        .map((q, i) => {
          if (q.type === "multiple-choice") {
            return `
            <div class="mb-6">
              <p class="font-semibold">${i + 1}. ${q.question}</p>
              ${q.choices
                .map(
                  (c) => `
                <p class="ml-6">${c.id.toUpperCase()}) ${c.text}</p>
              `
                )
                .join("")}
            </div>
          `;
          }

          if (q.type === "open-ended") {
            return `
            <div class="mb-6">
              <div class="flex items-start">
                <p class="font-semibold">${i + 1}. ${q.prompt}</p>
              </div>

              <div class="mt-4 space-y-6">
                <hr />
                <hr />
                <hr />
              </div>
            </div>
          `;
          }

          return "";
        })
        .join("")}
    </div>

    <!-- PAGE BREAK -->
    <div class="page-break"></div>

    <!-- ANSWER KEY -->
    <h2 class="text-xl font-bold text-center underline mb-6">Answer Key</h2>

    <h3 class="text-lg font-bold mb-2">Guided Practice Answers</h3>
    <ul class="mb-6">
      ${guided_practice.questions
        .map((q, i) => {
          if (q.type === "multiple-choice") {
            const answers = Array.isArray(q.answer)
              ? q.answer.join(", ")
              : q.answer;
            return `<li>${i + 1}. ${answers}</li>`;
          }
          return `<li>${i + 1}. Open-ended — student responses will vary.</li>`;
        })
        .join("")}
    </ul>

    <h3 class="text-lg font-bold mb-2">Independent Practice Answers</h3>
    <ul>
      ${independent_practice.questions
        .map((q, i) => {
          if (q.type === "multiple-choice") {
            const answers = Array.isArray(q.answer)
              ? q.answer.join(", ")
              : q.answer;
            return `<li>${i + 1}. ${answers}</li>`;
          }
          return `<li>${i + 1}. Open-ended — student responses will vary.</li>`;
        })
        .join("")}
    </ul>

  </main>
</body>
</html>
`;
}









  // body::before {
    // content: "Worksheetz AI";
    // position: fixed;
    // top: 40%;
    // left: 15%;
    // font-size: 80px;
    // color: rgba(0,0,0,0.04);
    // transform: rotate(-30deg);
    // z-index: 0;
    // }