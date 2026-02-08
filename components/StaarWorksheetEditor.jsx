//components/StaarWorksheetEditor
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DOMPurify from "dompurify";
import leoProfanity from "leo-profanity";
import toast from "react-hot-toast";
import { staarReadingWorksheetSchema } from "@/libs/zodSchemas";

export default function StaarWorksheetEditor({ fileName, initialData, type }) {
  const searchParams = useSearchParams();
  const canDownload = searchParams.get("canDownload") === "true";

  const [worksheet, setWorksheet] = useState(initialData || {});
  const [worksheetId, setWorksheetId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [savedFileName, setSavedFileName] = useState(false);
  const [pdfCreated, setPdfCreated] = useState(false);

  const router = useRouter();

  const sanitizeText = (input) => {
    if (!input) return "";
    let clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    clean = clean.normalize("NFKC").replace(/\u00A0/g, " ");
    clean = leoProfanity.clean(clean);
    return clean.trim();
  };

  const setPassageField = (field, value) => {
    setWorksheet((prev) => ({
      ...prev,
      passage: {
        ...(prev.passage || {}),
        [field]: value,
      },
    }));
  };

  const setQuestionField = (index, field, value) => {
    setWorksheet((prev) => {
      const qs = [...(prev.questions || [])];
      qs[index] = { ...qs[index], [field]: value };
      return { ...prev, questions: qs };
    });
  };

  const setChoiceField = (qIndex, cIndex, field, value) => {
    setWorksheet((prev) => {
      const qs = [...(prev.questions || [])];
      const q = { ...qs[qIndex] };
      const choices = [...(q.choices || [])];
      choices[cIndex] = { ...choices[cIndex], [field]: value };
      q.choices = choices;
      qs[qIndex] = q;
      return { ...prev, questions: qs };
    });
  };

function numberSentencesPreserveParagraphs(rawText) {
  if (!rawText) return { numberedText: "", numberedLines: [] };

  // Keep paragraph spacing (blank lines)
  const paragraphs = rawText.split(/\n\s*\n/);

  let n = 1;
  const numberedLines = [];

  const numberedParagraphs = paragraphs.map((p) => {
    const trimmed = p.trim();
    if (!trimmed) return "";

    // Simple sentence split (good enough for your use case)
    const sentences = trimmed.split(/(?<=[.!?])\s+/);

    const out = sentences
      .map((s) => {
        const clean = s.trim();
        if (!clean) return "";
        const line = `(${n}) ${clean}`;
        numberedLines.push(line);
        n++;
        return line;
      })
      .filter(Boolean);

    // Join sentences with spaces so it still reads like a paragraph
    return out.join(" ");
  });

  return {
    numberedText: numberedParagraphs.filter(Boolean).join("\n\n"),
    numberedLines,
  };
}


  const handleSave = async () => {
    setSavedFileName(false);

    const rawPassageText = worksheet.passage?.text || "";
    const { numberedText, numberedLines } =
    numberSentencesPreserveParagraphs(rawPassageText);

    const sanitized = {
      ...worksheet,
      type: "staarReading",
      topic: sanitizeText(worksheet.topic),
      gradeLevel: sanitizeText(worksheet.gradeLevel),
      passage: {
        ...(worksheet.passage || {}),
        title: sanitizeText(worksheet.passage?.title),
         text: sanitizeText(numberedText),     // ✅ paragraph format + numbering
         lines: numberedLines.map(sanitizeText) // ✅ indexed lines for choose-a-line
       // text: sanitizeText(worksheet.passage?.text),
        // keep lines if you want; or regenerate on server later
      },
      questions: (worksheet.questions || []).map((q) => ({
        ...q,
       teks: (
        Array.isArray(q.teks)
            ? q.teks.join(",")      // convert array → comma string
            : String(q.teks || "")
        )
        .split(",")
        .map((t) => sanitizeText(t))
        .filter(Boolean),
        question: sanitizeText(q.question),
        prompt: sanitizeText(q.prompt),
        choices: (q.choices || []).map((c) => ({
          ...c,
          text: sanitizeText(c.text),
        })),
      })),
    };

    const parsed = staarReadingWorksheetSchema.safeParse(sanitized);
    if (!parsed.success) {
      console.error(parsed.error.format());
      toast.error("Fix STAAR worksheet issues before saving.");
      return;
    }

    try {
      const res = await fetch("/api/save-worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          worksheet: sanitized,
          topic: sanitized.topic,
          gradeLevel: sanitized.gradeLevel,
          type: "staarReading",
        }),
      });
      console.log(res);

      if (!res.ok) {
        const { error } = await res.json();
        console.log("Res error:: ",res);
        throw new Error(error || "Save failed");
      }
       if(res.ok) {
      const { worksheetId } = await res.json();
      setWorksheetId(worksheetId);
      setIsLocked(true);
      setSavedFileName(true);
      setPdfCreated(false);
      toast.success("✅ Saved. You can now download the PDF.");
      toast.error("⚠️ Download now — don’t leave the page before downloading.", {
        duration: 8000,
        style: { background: "#f87171", color: "#fff" },
      });
      sessionStorage.removeItem("worksheetDraft");
    }
    } catch (e) {
      toast.error(e.message || "Unexpected save error.");
    }
  };

  const handlePdf = async () => {
    if (loadingPdf) return;
    setLoadingPdf(true);

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          type: "staarReading",
          worksheetId,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "PDF generation failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.replace(".json", ".pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setPdfCreated(true); //hide pdf button
      sessionStorage.removeItem("worksheetDraft");
      router.push("/dashboard");
    } catch (err) {
      const newRetry = retryCount + 1;
      setRetryCount(newRetry);
      toast.error(newRetry >= 3 ? "Too many failed attempts." : `PDF failed: ${err.message}`);
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto border border-gray-200">

      <h2 className="text-2xl font-semibold mb-2 text-purple-800">📝 Edit STAAR Reading</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Topic</label>
          <input
            disabled={isLocked}
            className="w-full border border-gray-300 rounded p-2"
            value={worksheet.topic || ""}
            onChange={(e) => setWorksheet((p) => ({ ...p, topic: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Passage Title</label>
          <input
            disabled={isLocked}
            className="w-full border border-gray-300 rounded p-2"
            value={worksheet.passage?.title || ""}
            onChange={(e) => setPassageField("title", e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Passage Text</label>
          <textarea
            disabled={isLocked}
            className="w-full border border-gray-300 rounded p-2 min-h-[160px]"
            value={
            Array.isArray(worksheet.passage?.lines)
                ? worksheet.passage.lines.join("\n")
                : (worksheet.passage?.text || "")
            }
            onChange={(e) => {
            const raw = e.target.value;
            const lines = raw
                .split("\n")
                .map((l) => l.trim())
                .filter(Boolean);

            setPassageField("text", raw);
            setPassageField("lines", lines);
            }}
          />
          <p className="text-xs opacity-70 mt-1">Tip: keep numbered lines like (1) (2) ...</p>
        </div>

        <hr />

        <h3 className="text-lg font-bold">Questions</h3>

        {(worksheet.questions || []).map((q, i) => (
          <div key={q.id || i} className="border rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Q{i + 1} • {q.type}</div>
              <div className="text-xs opacity-70">{q.id}</div>
            </div>

            <div>
              <label className="text-xs font-semibold">TEKS</label>
              <input
                disabled={isLocked}
                className="w-full border border-gray-300 rounded p-2"
                value={Array.isArray(q.teks) ? q.teks.join(", ") : (q.teks || "")}
                onChange={(e) => {
                const arr = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                setQuestionField(i, "teks", arr);
                }}
              />
            </div>

            {q.type === "scr" ? (
            <div>
                <label className="text-xs font-semibold">SCR Prompt</label>
                <textarea
                rows={2}
                className="w-full border border-gray-300 rounded p-2"
                value={q.prompt || ""}
                onChange={(e) => setQuestionField(i, "prompt", e.target.value)}
                />

                <div className="text-xs text-gray-600 mt-2">
                <div className="font-semibold">Rubric</div>

                {/* Max Points */}
                <div className="mt-1">Total Max Points: {q.rubric?.maxPoints}</div>

                {/* All Anchors */}
                <div className="mt-1 space-y-1">
                    {Array.isArray(q.rubric?.anchors) &&
                    q.rubric.anchors.map((anchor, idx) => (
                        <div key={idx} className="pl-2">
                        <div className="font-semibold">Points: {anchor.points}</div>
                        <div>Description: {anchor.description}</div>
                        </div>
                    ))}
                </div>
                </div>
            </div>


            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold">Question</label>
                  <textarea
                    disabled={isLocked}
                    className="w-full border border-gray-300 rounded p-2"
                    value={q.question || ""}
                    onChange={(e) => setQuestionField(i, "question", e.target.value)}
                  />
                 
                </div>

                {q.type === "choose-a-line" ? (
                  <div className="text-sm opacity-80">
                    This item type uses line numbers. Ensure <code>answer</code> is like ["5"].
                    Stored as object: {JSON.stringify(q.answer.lineIndex || {}, null, 2)}
                  </div>
                ) : (
                  <>
                    <div className="text-sm font-semibold">Choices</div>
                    {(q.choices || []).map((c, ci) => (
                      <div key={ci} className="flex gap-2">
                        <div className="w-10 border rounded p-2 text-center">{(c.id || "").toUpperCase()}</div>
                        <input
                          disabled={isLocked}
                          className="flex-1 border border-gray-300 rounded p-2"
                          value={c.text || ""}
                          onChange={(e) => setChoiceField(i, ci, "text", e.target.value)}
                        />
                      </div>
                    ))}
                    <div className="text-xs opacity-70">
                      Answer should be an array of choice IDs (ex: ["b"] or ["a","d"]).
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            disabled={isLocked}
            className="btn btn-primary"
            onClick={handleSave}
          >
            Save
          </button>
        <>
          {savedFileName && !pdfCreated && (
            <div className="mt-6 text-center">
              <button
                onClick={handlePdf}
                disabled={loadingPdf || retryCount >= 3}
                className={`flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition ${
                  loadingPdf || retryCount >= 3
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                }`}
              >
                {loadingPdf
                  ? "Creating PDF..."
                  : retryCount >= 3
                    ? "Try Again Later"
                    : "⬇️ Download PDF"}{" "}
              </button>
              <p className="text-sm text-red-600 mt-2 font-medium">
                You must download your PDF now — it cannot be regenerated after
                you leave this page.
              </p>
            </div>
          )}
        </>
          {/* <button
            disabled={!isLocked || loadingPdf}
            className="btn"
            onClick={handlePdf}
          >
            {loadingPdf ? "Generating..." : "Download PDF"}
          </button> */}
        </div>
      </div>
    </div>
  );
}
