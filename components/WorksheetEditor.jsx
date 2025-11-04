"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import IntroActivityEditor from "./IntroActivityEditor";
import toast from "react-hot-toast";
import { saveWorksheetSchema } from "@/libs/zodSchemas";
import AnswerKeyReview from "./AnswerKeyReview";
import { useSearchParams } from "next/navigation";

export default function WorksheetEditor({ fileName, initialData, type }) {
  const searchParams = useSearchParams();
  const canDownload = searchParams.get("canDownload") === "true";
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [worksheet, setWorksheet] = useState(initialData || {});
  const [savedFileName, setSavedFileName] = useState(false);
  const [pdfCreated, setPdfCreated] = useState(false);
  const [formCreated, setFormCreated] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [worksheetId, setWorksheetId] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const router = useRouter();

  const inputProps = {
    disabled: isLocked,
    className: "w-full border border-gray-700 text-gray-700 rounded p-2",
  };

  // Handle form field changes
  const handleChange = (field, value) => {
    setWorksheet((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setWorksheet((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleQuestionChange = (section, index, key, value) => {
    setWorksheet((prev) => {
      const updatedQuestions = [...prev[section].questions];
      const currentQuestion = updatedQuestions[index];
      const updatedQuestion = { ...currentQuestion, [key]: value };

      // Auto-sync answer if `choices` changed
      if (key === "choices") {
        const existingAnswers = currentQuestion.answer || [];

        // Remove any answers not in new choices
        updatedQuestion.answer = existingAnswers.filter((ans) =>
          value.includes(ans)
        );

        // Optional: default to first option if answer becomes empty
        if (updatedQuestion.answer.length === 0 && value.length > 0) {
          updatedQuestion.answer = [value[0]];
        }
      }

      // Reset answer when type changes
      if (key === "type") {
        if (value === "multiple-choice") {
          updatedQuestion.answer = [""];
        } else if (value === "open-ended") {
          updatedQuestion.answer = "";
        }
      }
      updatedQuestions[index] = updatedQuestion;

      return {
        ...prev,
        [section]: {
          ...prev[section],
          questions: updatedQuestions,
        },
      };
    });
  };

  const handleSave = async () => {
    setSavedFileName(false);
    sessionStorage.setItem("worksheetFileName", fileName);
    const topic = worksheet.topic;
    const gradeLevel = worksheet.gradeLevel;

    if (!topic || !gradeLevel) {
      alert("Missing topic or grade level");
      return;
    }
    // 👇 Validate before sending to API
    const parsed = saveWorksheetSchema
      .omit({
        userId: true,
      })
      .safeParse({
        //userId: "placeholder", // If userId is required, pass it from props or get from session
        fileName,
        worksheet,
        topic,
        gradeLevel,
        type,
      });

    if (!parsed.success) {
      console.error("❌ Zod validation failed:", parsed.error.format());
      toast.error("Please fix errors in the worksheet before saving.");
      return;
    }

    try {
      const res = await fetch("/api/save-worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          worksheet, // your JSON object
          topic,
          gradeLevel,
          type,
        }),
      });

      if (res.ok) {
        const { worksheetId } = await res.json();
        setWorksheetId(worksheetId);
        toast.success("✅ PDF created. Click below to download.");
        // 👉 Show warning toast
        toast.error(
          "⚠️ Download your PDF now — it can't be regenerated later if you leave this page.",
          { duration: 8000 }
        );
        setSavedFileName(true);
        setIsLocked(true); // if you're locking after save
        setPdfCreated(false);
        setFormCreated(false);
        sessionStorage.removeItem("worksheetDraft");
      } else {
        const { error } = await res.json();
        alert("❌ Failed to save worksheet: " + error);
      }
    } catch (err) {
      console.error("❌ handleSave error:", err);
      alert("Unexpected error saving worksheet.");
    }
  };

  const handlePdf = async () => {
    if (loadingPdf) return; // prevent double-fire
    setLoadingPdf(true);
    try {
      const res = await fetch(`/api/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          type, // wrap type in an object e.g. "grammar", "reading"
          worksheetId,
          //worksheetData: approvedJson, // full JSON object from frontend
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

      // Optional: revoke after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setPdfCreated(true); //hide pdf button
      sessionStorage.removeItem("worksheetDraft");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ PDF generation failed", err);
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);

      if (newRetryCount >= 3) {
        toast.error("Too many failed attempts. Please try again later.");
      } else {
        toast.error(`PDF generation failed: ${err.message || "Unknown error"}`);
      }
      setPdfCreated(false); // allow retry
    } finally {
      setLoadingPdf(false);
    }
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-lg p-6 max-w-3xl mx-auto border border-gray-200">
      <h2 className="text-2xl font-semibold mb-6 text-purple-800">
        📝 Edit Worksheet
      </h2>
      {!worksheet ? (
        <>Loading Paragraph, please wait...</>
      ) : (
        <>
          {/* Concept Introduction */}
          <div className="mb-6">
            <label className="block font-medium text-gray-700 mb-2">
              Concept Introduction
            </label>
            <textarea
              rows={4}
              {...inputProps}
              className="w-full border border-gray-700 text-gray-700 rounded p-2"
              value={worksheet.concept_introduction}
              onChange={(e) =>
                handleChange("concept_introduction", e.target.value)
              }
            />
          </div>
          {/* Example */}
          <div className="mb-6">
            <label className="block font-medium text-gray-700 mb-2">
              Example
            </label>
            <textarea
              rows={2}
              {...inputProps}
              className="w-full border border-gray-700 text-gray-700 rounded p-2"
              value={worksheet.example}
              onChange={(e) => handleChange("example", e.target.value)}
            />
          </div>

          {/* IntroActivity */}
          {worksheet.intro_activity && (
            <IntroActivityEditor
              introActivity={worksheet.intro_activity}
              onChange={(field, value) =>
                handleNestedChange("intro_activity", field, value)
              }
            />
          )}

          {/* Guided Practice */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              🧠 Guided Practice
            </h3>
            <label className="block font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              rows={2}
              {...inputProps}
              className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
              value={worksheet.guided_practice.instructions}
              onChange={(e) =>
                handleNestedChange(
                  "guided_practice",
                  "instructions",
                  e.target.value
                )
              }
            />
            {/* Questions */}
            {worksheet.guided_practice.questions.map((q, idx) => (
              <div
                key={idx}
                className="mb-6 border border-gray-200 p-4 rounded bg-gray-50"
              >
                <p className="text-sm text-gray-600 italic mb-2">
                  Question Type:{" "}
                  <span className="font-medium text-gray-800">{q.type}</span>
                </p>

                {q.type === "multiple-choice" && type === "reading" && (
                  <div className="mb-2">
                    <label className="block font-medium text-gray-700 mb-1">
                      Paragraph
                    </label>
                    <textarea
                      {...inputProps}
                      rows={2}
                      value={q.paragraph || ""}
                      onChange={(e) =>
                        handleQuestionChange(
                          "guided_practice",
                          idx,
                          "paragraph",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}

                {q.type === "multiple-choice" && type === "socialStudies" && (
                  <div className="mb-2">
                    <label className="block font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <textarea
                      {...inputProps}
                      rows={2}
                      value={q.source || ""}
                      onChange={(e) =>
                        handleQuestionChange(
                          "guided_practice",
                          idx,
                          "paragraph",
                          e.target.value
                        )
                      }
                    />
                  </div>
                )}

                <label className="block font-medium text-gray-700 mb-1">
                  Question {idx + 1}:{" "}
                  {q.type === "open-ended" ? "Enter Prompt" : "Question"}
                </label>
                <input
                  className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-2"
                  {...inputProps}
                  value={
                    q.sentence ||
                    q.prompt ||
                    q.question ||
                    q.paragraph ||
                    q.source ||
                    ""
                  }
                  onChange={
                    (e) =>
                      handleQuestionChange(
                        "guided_practice",
                        idx,
                        "sentence",
                        e.target.value
                      )
                    //handleQuestionChange("guided_practice", idx, q.type === "open-ended" ? "prompt" : "question", e.target.value)
                  }
                />
                {/* Choices (if multiple-choice) */}
                {q.choices && q.type === "multiple-choice" && (
                  <>
                    <label className="block font-medium text-gray-700 mb-1">
                      Choices
                    </label>
                    {q.choices.map((choice, cIdx) => (
                      <div
                        key={choice.id || cIdx}
                        className="flex items-center gap-2 mb-1"
                      >
                        <input
                          {...inputProps}
                          className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-1"
                          value={choice?.text || ""}
                          onChange={(e) => {
                            const newChoices = [...q.choices];
                            newChoices[cIdx] = {
                              ...newChoices[cIdx],
                              text: e.target.value,
                            };
                            handleQuestionChange(
                              "guided_practice",
                              idx,
                              "choices",
                              newChoices
                            );
                          }}
                        />

                        {/* Checkbox to mark as correct */}
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              Array.isArray(q.answer)
                                ? q.answer.includes(choice.id)
                                : false
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const newAnswers = new Set(
                                Array.isArray(q.answer) ? q.answer : []
                              );
                              if (checked) {
                                newAnswers.add(choice.id);
                              } else {
                                newAnswers.delete(choice.id);
                              }
                              handleQuestionChange(
                                "guided_practice",
                                idx,
                                "answer",
                                [...newAnswers]
                              );
                            }}
                          />
                          Correct
                        </label>
                        {!isLocked && q.choices.length > 1 && (
                          <button
                            onClick={() => {
                              const newChoices = [...q.choices];
                              newChoices.splice(cIdx, 1);

                              const updatedAnswers = Array.isArray(q.answer)
                                ? q.answer.filter((ans) => ans !== choice.id)
                                : q.answer === choice.id
                                ? null
                                : q.answer;

                              handleQuestionChange(
                                "guided_practice",
                                idx,
                                "choices",
                                newChoices
                              );
                              handleQuestionChange(
                                "guided_practice",
                                idx,
                                "answer",
                                updatedAnswers
                              );
                            }}
                            className="text-red-600 text-xs underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                    {/* 
                    <button
                      className="text-xs text-blue-600 underline"
                      onClick={() => {
                        const newChoices = [...(q.choices || []), ""];
                        handleQuestionChange(
                          "guided_practice",
                          idx,
                          "choices",
                          newChoices
                        );
                      }}
                    >
                      + Add Choice
                    </button> */}
                  </>
                )}
              </div>
            ))}
          </div>
          {/* Independent Practice */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              🧩 Independent Practice
            </h3>

            <label className="block font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              rows={2}
              {...inputProps}
              className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
              value={worksheet.independent_practice.instructions}
              onChange={(e) =>
                handleNestedChange(
                  "independent_practice",
                  "instructions",
                  e.target.value
                )
              }
            />
            <label className="block font-medium text-gray-700 mb-1">
              Story
            </label>
            <textarea
              rows={4}
              {...inputProps}
              className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
              value={worksheet.independent_practice.story}
              onChange={(e) =>
                handleNestedChange(
                  "independent_practice",
                  "story",
                  e.target.value
                )
              }
            />
            {/* Questions */}
            {worksheet.independent_practice.questions.map((q, idx) => (
              <div
                key={idx}
                className="mb-6 border border-gray-200 p-4 rounded bg-gray-50"
              >
                <p className="text-sm text-gray-600 italic mb-2">
                  Question Type:{" "}
                  <span className="font-medium text-gray-800">{q.type}</span>
                </p>
                <label className="block font-medium text-gray-700 mb-1">
                  Question {idx + 1}: Sentence
                </label>
                <input
                  className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-2"
                  {...inputProps}
                  value={q.sentence || q.prompt || q.question || ""}
                  onChange={(e) =>
                    handleQuestionChange(
                      "independent_practice",
                      idx,
                      "question",
                      e.target.value
                    )
                  }
                />
                {/* Choices (if multiple-choice) */}
                {q.choices && q.type === "multiple-choice" && (
                  <>
                    <label className="block font-medium text-gray-700 mb-1">
                      Choices
                    </label>
                    {q.choices.map((choice, cIdx) => (
                      <div
                        key={choice.id || cIdx}
                        className="flex items-center gap-2 mb-1"
                      >
                        <input
                          {...inputProps}
                          className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-1"
                          value={choice?.text || ""}
                          onChange={(e) => {
                            const newChoices = [...q.choices];
                            newChoices[cIdx] = {
                              ...newChoices[cIdx],
                              text: e.target.value,
                            };
                            handleQuestionChange(
                              "independent_practice",
                              idx,
                              "choices",
                              newChoices
                            );
                          }}
                        />

                        {/* Checkbox to mark as correct */}
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              Array.isArray(q.answer)
                                ? q.answer.includes(choice.id)
                                : false
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const newAnswers = new Set(
                                Array.isArray(q.answer) ? q.answer : []
                              );
                              if (checked) {
                                newAnswers.add(choice.id);
                              } else {
                                newAnswers.delete(choice.id);
                              }
                              handleQuestionChange(
                                "independent_practice",
                                idx,
                                "answer",
                                [...newAnswers]
                              );
                            }}
                          />
                          Correct
                        </label>
                        {!isLocked && q.choices.length > 1 && (
                          <button
                            onClick={() => {
                              const newChoices = [...q.choices];
                              newChoices.splice(cIdx, 1);

                              const updatedAnswers = Array.isArray(q.answer)
                                ? q.answer.filter((ans) => ans !== choice.id)
                                : q.answer === choice.id
                                ? null
                                : q.answer;

                              handleQuestionChange(
                                "independent_practice",
                                idx,
                                "choices",
                                newChoices
                              );
                              handleQuestionChange(
                                "independent_practice",
                                idx,
                                "answer",
                                updatedAnswers
                              );
                            }}
                            className="text-red-600 text-xs underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}

                    {/* <button
                      className="text-xs text-blue-600 underline"
                      onClick={() => {
                        const newChoices = [...(q.choices || []), ""];
                        handleQuestionChange(
                          "independent_practice",
                          idx,
                          "choices",
                          newChoices
                        );
                      }}
                    >
                      + Add Choice
                    </button> */}
                  </>
                )}
              </div>
            ))}
          </div>
          {/**Independent Practice Part 2 */}
          {worksheet.independent_practice_2 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                🧩 Independent Practice Part 2
              </h3>

              <label className="block font-medium text-gray-700 mb-1">
                Instructions
              </label>
              <textarea
                rows={2}
                {...inputProps}
                className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
                value={worksheet.independent_practice_2.instructions}
                onChange={(e) =>
                  handleNestedChange(
                    "independent_practice",
                    "instructions",
                    e.target.value
                  )
                }
              />
              <label className="block font-medium text-gray-700 mb-1">
                Story
              </label>
              <textarea
                rows={4}
                {...inputProps}
                className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-4"
                value={worksheet.independent_practice_2.story}
                onChange={(e) =>
                  handleNestedChange(
                    "independent_practice",
                    "story",
                    e.target.value
                  )
                }
              />

              {/* Questions */}
              {worksheet.independent_practice_2.questions.map((q, idx) => (
                <div
                  key={idx}
                  className="mb-6 border border-gray-200 p-4 rounded bg-gray-50"
                >
                  <p className="text-sm text-gray-600 italic mb-2">
                    Question Type:{" "}
                    <span className="font-medium text-gray-800">{q.type}</span>
                  </p>
                  <label className="block font-medium text-gray-700 mb-1">
                    Question {idx + 1}: Sentence
                  </label>
                  <input
                    className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-2"
                    {...inputProps}
                    value={q.sentence || q.prompt || q.question || ""}
                    onChange={(e) =>
                      handleQuestionChange(
                        "independent_practice",
                        idx,
                        "question",
                        e.target.value
                      )
                    }
                  />
                  {/* Choices (if multiple-choice) */}
                  {q.choices && q.type === "multiple-choice" && (
                    <>
                      <label className="block font-medium text-gray-700 mb-1">
                        Choices
                      </label>
                      {q.choices.map((choice, cIdx) => (
                        <div
                          key={choice.id || cIdx}
                          className="flex items-center gap-2 mb-1"
                        >
                          <input
                            {...inputProps}
                            className="w-full border border-gray-700 text-gray-700 rounded p-2 mb-1"
                            value={choice?.text || ""}
                            onChange={(e) => {
                              const newChoices = [...q.choices];
                              newChoices[cIdx] = {
                                ...newChoices[cIdx],
                                text: e.target.value,
                              };
                              handleQuestionChange(
                                "independent_practice",
                                idx,
                                "choices",
                                newChoices
                              );
                            }}
                          />

                          {/* Checkbox to mark as correct */}
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={
                                Array.isArray(q.answer)
                                  ? q.answer.includes(choice.id)
                                  : false
                              }
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const newAnswers = new Set(
                                  Array.isArray(q.answer) ? q.answer : []
                                );
                                if (checked) {
                                  newAnswers.add(choice.id);
                                } else {
                                  newAnswers.delete(choice.id);
                                }
                                handleQuestionChange(
                                  "independent_practice",
                                  idx,
                                  "answer",
                                  [...newAnswers]
                                );
                              }}
                            />
                            Correct
                          </label>
                          {!isLocked && q.choices.length > 1 && (
                            <button
                              onClick={() => {
                                const newChoices = [...q.choices];
                                newChoices.splice(cIdx, 1);

                                const updatedAnswers = Array.isArray(q.answer)
                                  ? q.answer.filter((ans) => ans !== choice.id)
                                  : q.answer === choice.id
                                  ? null
                                  : q.answer;

                                handleQuestionChange(
                                  "independent_practice",
                                  idx,
                                  "choices",
                                  newChoices
                                );
                                handleQuestionChange(
                                  "independent_practice",
                                  idx,
                                  "answer",
                                  updatedAnswers
                                );
                              }}
                              className="text-red-600 text-xs underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))}

                      {/* <button
                        className="text-xs text-blue-600 underline"
                        onClick={() => {
                          const newChoices = [...(q.choices || []), ""];
                          handleQuestionChange(
                            "independent_practice",
                            idx,
                            "choices",
                            newChoices
                          );
                        }}
                      >
                        + Add Choice
                      </button> */}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {/*NON Editable Answer Key */}
          <details className="mb-10">
            <summary className="text-xl font-semibold text-gray-800 mb-4 cursor-pointer">
              🧾 Review Answer Key
            </summary>
            <div className="mt-4">
              <AnswerKeyReview worksheet={worksheet} />
            </div>
          </details>
        </>
      )}
      {/* Buttons */}

      <div className="text-right mt-4 flex flex-wrap gap-4 justify-end">
        {!savedFileName && (
          <div>
            {canDownload ? (
              <>
                <p className="text-sm text-red-600 mt-2 font-medium">
                  You must create and download your PDF now — it cannot be
                  regenerated after you leave this page.
                </p>
                <button
                  onClick={handleSave}
                  className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition"
                >
                  Create Pdf
                </button>
                <button
                  className="text-sm text-blue-600 underline mb-4 m-4"
                  onClick={() => {
                    const confirmReset = window.confirm(
                      "Generate new worksheet? Current one will be lost."
                    );
                    if (!confirmReset) return;

                    sessionStorage.removeItem("worksheetDraft");
                    sessionStorage.removeItem("worksheetFileName");

                    // Optional: redirect to regenerate
                    router.push("/dashboard");
                  }}
                >
                  ↻ Regenerate New Worksheet
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                🚫 You’ve reached your PDF download limit. Upgrade your plan to
                continue.
              </p>
            )}
          </div>
        )}

        {/* {savedFileName && ( */}
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
        {/* )} */}
      </div>
    </div>
  );
}

//  <button
//   className="text-sm text-blue-600 underline mb-4"
//   onClick={() => {
//     const confirmReset = window.confirm(
//       "Generate new worksheet? Current one will be lost."
//     );
//     if (!confirmReset) return;

//     sessionStorage.removeItem("worksheetDraft");
//     sessionStorage.removeItem("worksheetFileName");

//     // Optional: redirect to regenerate
//     router.push("/");
//   }}
// >
//   ↻ Generate New Worksheet
// </button>;

// /* 🎉 Show this message + reset option after either one is created */

// {
//   (pdfCreated || formCreated) && (
//     <div className="flex items-center gap-4 ml-4">
//       <p className="text-green-700 font-semibold">🎉 Worksheet generated!</p>
//       <button
//         className="text-sm text-blue-600 underline mb-4"
//         onClick={() => {
//           const confirmReset = window.confirm(
//             "Generate new worksheet? Current one will be lost."
//           );
//           if (!confirmReset) return;

//           sessionStorage.removeItem("worksheetDraft");
//           sessionStorage.removeItem("worksheetFileName");

//           // Optional: redirect to regenerate
//           router.push("/");
//         }}
//       >
//         ↻ Generate New Worksheet
//       </button>
//     </div>
//   );
// }

//  <div className="mb-10">
//    <h3 className="text-xl font-semibold text-gray-800 mb-4">
//      🧾 Review Answer Key
//    </h3>

//    {/* Guided Practice */}
//    <div className="mb-6">
//      <h4 className="text-lg font-medium text-purple-700 mb-2">
//        🧠 Guided Practice
//      </h4>
//      {worksheet.guided_practice.questions.map((q, qIdx) => (
//        <div
//          key={qIdx}
//          className="bg-gray-50 border border-gray-200 p-4 rounded mb-3"
//        >
//          <p className="text-sm text-gray-700 font-semibold mb-2">
//            Question {qIdx + 1}: {q.sentence || q.prompt || q.question || ""}
//          </p>

//          {q.type === "multiple-choice" && (
//            <>
//              <label className="block text-sm text-gray-600 mb-1">Answers</label>
//              {(Array.isArray(q.answer) ? q.answer : [q.answer]).filter(
//                (a) => a && a.trim()
//              ).length > 0 ? (
//                (Array.isArray(q.answer) ? q.answer : [q.answer])
//                  .filter((a) => a && a.trim())
//                  .map((ans, aIdx) => (
//                    <div
//                      key={aIdx}
//                      className="text-sm bg-gray-100 p-2 text-black rounded mb-1 border border-gray-300"
//                    >
//                      ✅ {ans}
//                    </div>
//                  ))
//              ) : (
//                <div className="text-sm text-gray-500 italic">
//                  No correct answer selected.
//                </div>
//              )}
//            </>
//          )}
//        </div>
//      ))}
//    </div>

//    {/* Independent Practice 1 */}
//    <div>
//      <h4 className="text-lg font-medium text-purple-700 mb-2">
//        🧩 Independent Practice 1
//      </h4>
//      {worksheet.independent_practice.questions.map((q, qIdx) => (
//        <div
//          key={qIdx}
//          className="bg-gray-50 border border-gray-200 p-4 rounded mb-3"
//        >
//          <p className="text-sm text-gray-700 font-semibold mb-2">
//            Question {qIdx + 1}: {q.question || q.prompt || q.sentence || ""}
//          </p>

//          {q.type === "multiple-choice" && (
//            <>
//              <label className="block text-sm text-gray-600 mb-1">Answers</label>
//              {(Array.isArray(q.answer) ? q.answer : [q.answer]).filter(
//                (a) => a && a.trim()
//              ).length > 0 ? (
//                (Array.isArray(q.answer) ? q.answer : [q.answer]).map(
//                  (ans, aIdx) => (
//                    <div
//                      key={aIdx}
//                      className="text-sm bg-gray-100 p-2 text-black rounded mb-1 border border-gray-300"
//                    >
//                      ✅ {ans}
//                    </div>
//                  )
//                )
//              ) : (
//                <div className="text-sm text-gray-500 italic">
//                  No correct answer selected.
//                </div>
//              )}
//            </>
//          )}
//        </div>
//      ))}
//    </div>

//    {/* Independent Practice 2 */}
//    {worksheet.independent_practice_2 && (
//      <div>
//        <h4 className="text-lg font-medium text-purple-700 mb-2">
//          🧩 Independent Practice 2
//        </h4>
//        {worksheet.independent_practice_2.questions.map((q, qIdx) => (
//          <div
//            key={qIdx}
//            className="bg-gray-50 border border-gray-200 p-4 rounded mb-3"
//          >
//            <p className="text-sm text-gray-700 font-semibold mb-2">
//              Question {qIdx + 1}: {q.question || q.prompt || q.sentence || ""}
//            </p>

//            {q.type === "multiple-choice" && (
//              <>
//                <label className="block text-sm text-gray-600 mb-1">
//                  Answers
//                </label>
//                {(Array.isArray(q.answer) ? q.answer : [q.answer]).filter(
//                  (a) => a && a.trim()
//                ).length > 0 ? (
//                  (Array.isArray(q.answer) ? q.answer : [q.answer]).map(
//                    (ans, aIdx) => (
//                      <div
//                        key={aIdx}
//                        className="text-sm bg-gray-100 p-2 text-black rounded mb-1 border border-gray-300"
//                      >
//                        ✅ {ans}
//                      </div>
//                    )
//                  )
//                ) : (
//                  <div className="text-sm text-gray-500 italic">
//                    No correct answer selected.
//                  </div>
//                )}
//              </>
//            )}
//          </div>
//        ))}
//      </div>
//    )}

//    {/*  Practice  */}
//    {worksheet.independent_practice_2 && (
//      <div>
//        <h4 className="text-lg font-medium text-purple-700 mb-2">
//          🧩 Practice Activity{" "}
//        </h4>
//        {worksheet.intro_activity?.answers.map((q, qIdx) => (
//          <div
//            key={qIdx}
//            className="bg-gray-50 border border-gray-200 p-4 rounded mb-3"
//          >
//            {/* <p className="text-sm text-gray-700 font-semibold mb-2">
//           Question {qIdx + 1}: {q.question || q.prompt || q.sentence || ""}
//         </p> */}

//            {
//              <>
//                <label className="block text-sm text-gray-600 mb-1">
//                  Answers
//                </label>
//                {(Array.isArray(q.answers) ? q.answers : [q.answers]).filter(
//                  (a) => a && a.trim()
//                ).length > 0 ? (
//                  (Array.isArray(q.answers) ? q.answers : [q.answers]).map(
//                    (ans, aIdx) => (
//                      <div
//                        key={aIdx}
//                        className="text-sm bg-gray-100 p-2 text-black rounded mb-1 border border-gray-300"
//                      >
//                        ✅ {ans}
//                      </div>
//                    )
//                  )
//                ) : (
//                  <div className="text-sm text-gray-500 italic">
//                    No correct answer selected.
//                  </div>
//                )}
//              </>
//            }
//          </div>
//        ))}
//      </div>
//    )}
//  </div>;
