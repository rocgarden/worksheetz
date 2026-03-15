// app/api/generate-json/pdfTemplates/utils/buildHtml.js

export function buildStyles() {
  return `
    ${worksheetCss}
    ${printCss}
    ${typographyCss}
  `;
}

const worksheetCss = `
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #111827;
    margin: 0;
    padding: 0;
    background: white;
  }

  .worksheet-shell {
    padding: 0;
  }

  .worksheet-section {
    margin-bottom: 24px;
  }

  .worksheet-title {
    font-size: 24px;
    font-weight: 700;
    text-align: center;
    margin-bottom: 8px;
  }

  .worksheet-subtitle {
    font-size: 15px;
    font-style: italic;
    text-align: center;
    margin-bottom: 18px;
    color: #374151;
  }

  .section-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 12px;
    text-align: center;
  }

  .instruction-text {
    font-style: italic;
    margin-bottom: 12px;
  }

  .page-break {
    break-before: page;
    page-break-before: always;
  }

  .reading-passage-layout {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 24px;
    margin-bottom: 24px;
    align-items: start;
  }

  .reading-paragraph {
    white-space: pre-line;
    line-height: 1.6;
    text-align: justify;
  }

  .reading-subhead {
    font-weight: 700;
    font-style: italic;
    margin: 12px 0 8px;
  }

  .grammar-box {
  border: 1px solid #d1d5db;
  padding: 8px;
  border-radius: 6px;
  background: #fafafa;
  margin-top: 8px;
  margin-bottom: 8px;
}

.grammar-story {
  white-space: pre-wrap;
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.5;
}

.grammar-section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
}

.grammar-subsection-title {
  font-size: 16px;
  font-weight: 700;
  margin-top: 20px;
  margin-bottom: 6px;
}

.notes-lines hr {
  margin: 12px 0;
  border: 0;
  border-top: 1px solid #d1d5db;
}

  .notes-column {
    border-left: 2px dashed #9ca3af;
    padding-left: 14px;
    color: #6b7280;
    font-size: 13px;
    min-height: 100%;
  }

  .notes-heading {
    font-weight: 700;
    margin-bottom: 8px;
  }

  .notes-lines hr {
    margin: 18px 0;
    border: 0;
    border-top: 1px solid #d1d5db;
  }

  .social-box {
  border: 1px solid #d1d5db;
  padding: 8px;
  border-radius: 6px;
  background: #fafafa;
  margin-top: 8px;
  margin-bottom: 8px;
}

.social-story {
  white-space: pre-wrap;
  line-height: 1.5;
  text-align: justify;
}

.social-subsection-title {
  font-size: 16px;
  font-weight: 700;
  margin-top: 20px;
  margin-bottom: 6px;
}

  .worksheet-footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 24px;
    text-align: center;
    font-size: 11px;
    color: #6b7280;
  }
`;

const printCss = `
  @page {
    margin: 0.8in 0.8in 0.8in 0.8in;
  }

  main {
    padding-bottom: 0.45in;
  }

  .avoid-break {
    break-inside: avoid;
    page-break-inside: avoid;
  }
`;

const typographyCss = `
  p {
    margin: 0 0 8px 0;
    line-height: 1.5;
  }

  .small-text {
    font-size: 12px;
  }

  .body-text {
    font-size: 14px;
  }

  .question-text {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .choice-text {
    font-size: 13px;
    margin-left: 18px;
    line-height: 1.45;
  }

  .teks-label {
    font-size: 11px;
    color: #6b7280;
    font-style: italic;
    margin: 4px 0 8px 18px;
  }
`;