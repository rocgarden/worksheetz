//components/admin/passage-bank/PassageBankEditor
"use client";

import { useMemo, useState } from "react";

const GENERATABLE_QUESTION_TYPES = [
  {
    value: "multiple_choice",
    label: "Multiple choice",
  },
  {
    value: "hot_text",
    label: "Hot text",
  },
];

const DOK_LEVELS = [1, 2, 3];

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDraftPackage(draft) {
  const draftJson = isPlainObject(draft?.draft_json)
    ? cloneValue(draft.draft_json)
    : {};

  const passage = isPlainObject(draft?.passage)
    ? cloneValue(draft.passage)
    : isPlainObject(draftJson.passage)
      ? cloneValue(draftJson.passage)
      : {};

  const questions = Array.isArray(draft?.questions)
    ? cloneValue(draft.questions)
    : Array.isArray(draftJson.questions)
      ? cloneValue(draftJson.questions)
      : [];

  return {
    passage: {
      ...passage,

      title: passage.title ?? draft?.title ?? "",

      subject: passage.subject ?? draft?.subject ?? "",

      grade_level: passage.grade_level ?? draft?.grade_level ?? "",

      teks_standard: passage.teks_standard ?? draft?.teks_standard ?? "",

      passage_format:
        passage.passage_format ?? draft?.passage_format ?? "prose",

      content_focus_key:
        passage.content_focus_key ?? draft?.content_focus_key ?? "",

      content_focus: passage.content_focus ?? "",

      passage: passage.passage ?? "",

      stimulus_json: isPlainObject(passage.stimulus_json)
        ? passage.stimulus_json
        : null,
    },

    questions: questions.map((question) => {
      const questionType =
        typeof question?.question_type === "string" &&
        question.question_type.trim()
          ? question.question_type.trim()
          : typeof question?.question_json?.question_type === "string"
            ? question.question_json.question_type.trim()
            : "";

      return {
        ...question,

        question_type: questionType,

        question_json: {
          ...question.question_json,

          answer_options:
            questionType === "hot_text" ||
            questionType === "constructed_response"
              ? null
              : Array.isArray(question?.question_json?.answer_options)
                ? question.question_json.answer_options
                : [],
        },
      };
    }),
  };
}

function TextField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-base-content">{label}</span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="
          input
          input-bordered
          w-full
          rounded-2xl
          bg-white
        "
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 5 }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-base-content">{label}</span>

      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="
          textarea
          textarea-bordered
          w-full
          rounded-2xl
          bg-white
          leading-7
        "
      />
    </label>
  );
}

function createBlankMultipleChoiceQuestion({ passage, questionNumber }) {
  const teksStandard =
    typeof passage?.teks_standard === "string" ? passage.teks_standard : "";

  const sharedPassage =
    typeof passage?.passage === "string" ? passage.passage : "";

  return {
    question_type: "multiple_choice",
    dok_level: 1,
    skill_focus: "",
    assessment_move: "",

    dramatic_function: "",
    target_scene: "",

    correct_target_text: null,
    correct_target_key: null,

    question_json: {
      question_type: "multiple_choice",
      teks_standard: teksStandard,
      dok_level: 1,

      passage: sharedPassage,

      stem: `New question ${questionNumber}`,

      answer_options: [
        {
          id: "A",
          text: "",
        },
        {
          id: "B",
          text: "",
        },
        {
          id: "C",
          text: "",
        },
        {
          id: "D",
          text: "",
        },
      ],

      correct_answer: "A",
      explanation: "",

      next_question_logic: {
        if_correct: {
          action: "increase_difficulty",

          dok_level: 2,
        },

        if_incorrect: {
          action: "decrease_difficulty",

          dok_level: 1,
        },
      },
    },

    review_status: "draft",
    is_active: false,
  };
}

export default function PassageBankDraftEditor({ draft, draftId, onSaved }) {
  const initialPackage = useMemo(() => normalizeDraftPackage(draft), [draft]);

  const [draftPackage, setDraftPackage] = useState(initialPackage);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");

  const [generationForm, setGenerationForm] = useState({
    question_type: "multiple_choice",
    dok_level: 1,
    skill_focus: "",
    assessment_move: "",
  });

  const [generatingQuestion, setGeneratingQuestion] = useState(false);
  const [regeneratingQuestionIndex, setRegeneratingQuestionIndex] =
    useState(null);

  const updatePassage = (field, value) => {
    setDraftPackage((current) => ({
      ...current,

      passage: {
        ...current.passage,
        [field]: value,
      },
    }));
  };

  const updateQuestion = (questionIndex, updater) => {
    setDraftPackage((current) => ({
      ...current,

      questions: current.questions.map((question, index) =>
        index === questionIndex ? updater(question) : question,
      ),
    }));
  };

  const updateQuestionField = (questionIndex, field, value) => {
    const synchronizedJsonFields = new Set([
      "question_type",
      "dok_level",
      "teks_standard",
    ]);

    updateQuestion(questionIndex, (question) => ({
      ...question,
      [field]: value,

      question_json: synchronizedJsonFields.has(field)
        ? {
            ...question.question_json,
            [field]: value,
          }
        : question.question_json,
    }));
  };

  const updateQuestionJsonField = (questionIndex, field, value) => {
    updateQuestion(questionIndex, (question) => ({
      ...question,

      question_json: {
        ...question.question_json,
        [field]: value,
      },
    }));
  };

  const updateAnswerOption = (questionIndex, optionIndex, field, value) => {
    updateQuestion(questionIndex, (question) => ({
      ...question,

      question_json: {
        ...question.question_json,

        answer_options: question.question_json.answer_options.map(
          (option, index) =>
            index === optionIndex
              ? {
                  ...option,
                  [field]: value,
                }
              : option,
        ),
      },
    }));
  };

  const updateGenerationForm = (field, value) => {
    setGenerationForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const addBlankQuestion = () => {
    setDraftPackage((current) => {
      const nextQuestion = createBlankMultipleChoiceQuestion({
        passage: current.passage,

        questionNumber: current.questions.length + 1,
      });

      return {
        ...current,

        questions: [...current.questions, nextQuestion],
      };
    });

    setMessage(
      "Blank question added. Complete its fields, then save and validate the draft.",
    );

    setMessageType("success");
  };
  const generateAnotherQuestion = async () => {
    setGeneratingQuestion(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        `/api/v2/admin/passage-bank/drafts/${draftId}/generate-question`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question_type: generationForm.question_type,

            dok_level: Number(generationForm.dok_level),

            skill_focus: generationForm.skill_focus.trim() || null,

            assessment_move: generationForm.assessment_move.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate another question.");
      }

      if (!isPlainObject(data?.question)) {
        throw new Error("The generator returned no usable question.");
      }

      setDraftPackage((current) => ({
        ...current,

        questions: [...current.questions, cloneValue(data.question)],
      }));

      setMessage(
        "A new question was generated and added to the draft. Review it, then validate the package.",
      );

      setMessageType("success");

      if (typeof onSaved === "function") {
        await onSaved(data);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to generate another question.",
      );

      setMessageType("error");
    } finally {
      setGeneratingQuestion(false);
    }
  };

  const regenerateQuestion = async (questionIndex) => {
    const question = draftPackage.questions[questionIndex];

    if (!question) {
      setMessage("The selected question could not be found.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `Regenerate Question ${questionIndex + 1}? The current question will be replaced immediately in the saved draft.`,
    );

    if (!confirmed) {
      return;
    }

    setRegeneratingQuestionIndex(questionIndex);

    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        `/api/v2/admin/passage-bank/drafts/${draftId}/regenerate-question`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            question_index: questionIndex,

            skill_focus: question.skill_focus || null,

            assessment_move: question.assessment_move || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to regenerate the question.");
      }

      if (!isPlainObject(data?.question)) {
        throw new Error(
          "The generator returned no usable replacement question.",
        );
      }

      setDraftPackage((current) => ({
        ...current,

        questions: current.questions.map((existingQuestion, index) =>
          index === questionIndex
            ? cloneValue(data.question)
            : existingQuestion,
        ),
      }));

      setMessage(
        `Question ${questionIndex + 1} was regenerated. Review it, then validate the package.`,
      );

      setMessageType("success");

      if (typeof onSaved === "function") {
        await onSaved(data);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to regenerate the question.",
      );

      setMessageType("error");
    } finally {
      setRegeneratingQuestionIndex(null);
    }
  };

  const moveQuestion = (questionIndex, direction) => {
    setDraftPackage((current) => {
      const targetIndex =
        direction === "up" ? questionIndex - 1 : questionIndex + 1;

      if (targetIndex < 0 || targetIndex >= current.questions.length) {
        return current;
      }

      const questions = [...current.questions];

      [questions[questionIndex], questions[targetIndex]] = [
        questions[targetIndex],
        questions[questionIndex],
      ];

      return {
        ...current,
        questions,
      };
    });

    setMessage(
      `Question ${questionIndex + 1} moved ${
        direction === "up" ? "up" : "down"
      }. Save the draft to keep the new order.`,
    );

    setMessageType("success");
  };

  const deleteQuestion = (questionIndex) => {
    if (draftPackage.questions.length <= 1) {
      setMessage("A passage-bank draft must contain at least one question.");
      setMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `Delete Question ${questionIndex + 1}? This change is not permanent until you save the draft.`,
    );

    if (!confirmed) {
      return;
    }

    setDraftPackage((current) => ({
      ...current,

      questions: current.questions.filter(
        (_, index) => index !== questionIndex,
      ),
    }));

    setMessage(
      `Question ${questionIndex + 1} removed. Save the draft to keep this change.`,
    );

    setMessageType("success");
  };

  const duplicateQuestion = (questionIndex) => {
    setDraftPackage((current) => {
      const sourceQuestion = current.questions[questionIndex];

      if (!sourceQuestion) {
        return current;
      }

      const duplicatedQuestion = cloneValue(sourceQuestion);

      /*
       * Remove persisted identity fields so the duplicate is treated
       * as a new draft question rather than the same stored row.
       */
      delete duplicatedQuestion.id;
      delete duplicatedQuestion.created_at;
      delete duplicatedQuestion.updated_at;
      delete duplicatedQuestion.passage_question_bank_id;

      return {
        ...current,

        questions: [
          ...current.questions.slice(0, questionIndex + 1),

          duplicatedQuestion,

          ...current.questions.slice(questionIndex + 1),
        ],
      };
    });

    setMessage(
      `Question ${questionIndex + 1} duplicated. Edit the copy, then save and validate the draft.`,
    );

    setMessageType("success");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(
        `/api/v2/admin/passage-bank/drafts/${draftId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            passage: draftPackage.passage,

            questions: draftPackage.questions,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save draft changes.");
      }

      setMessage("Draft changes saved. Validation is now stale.");

      setMessageType("success");

      if (typeof onSaved === "function") {
        await onSaved(data);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save draft changes.",
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-xl font-bold">Edit passage</h3>

          <p className="mt-2 text-sm text-base-content/60">
            Saving changes returns the package to draft status and marks its
            validation as stale.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <TextField
            label="Title"
            value={draftPackage.passage.title}
            onChange={(value) => updatePassage("title", value)}
            placeholder="Passage title"
          />

          <TextField
            label="Content focus key"
            value={draftPackage.passage.content_focus_key}
            onChange={(value) => updatePassage("content_focus_key", value)}
            placeholder="content_focus_key"
          />
        </div>

        <div className="mt-5">
          <TextAreaField
            label="Content focus"
            value={draftPackage.passage.content_focus}
            onChange={(value) => updatePassage("content_focus", value)}
            placeholder="Describe the passage content focus."
            rows={3}
          />
        </div>

        <div className="mt-5">
          <TextAreaField
            label="Passage text"
            value={draftPackage.passage.passage}
            onChange={(value) => updatePassage("passage", value)}
            placeholder="Enter the full passage."
            rows={18}
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/60 p-5">
          <div>
            <h4 className="font-bold text-purple-950">
              Generate another question
            </h4>

            <p className="mt-1 text-sm text-purple-900/70">
              Uses the current saved passage and existing questions to create
              one additional question.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Question type</span>

              <select
                value={generationForm.question_type}
                onChange={(event) =>
                  updateGenerationForm("question_type", event.target.value)
                }
                className="select select-bordered w-full rounded-2xl bg-white"
              >
                {GENERATABLE_QUESTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold">DOK level</span>

              <select
                value={generationForm.dok_level}
                onChange={(event) =>
                  updateGenerationForm("dok_level", Number(event.target.value))
                }
                className="select select-bordered w-full rounded-2xl bg-white"
              >
                {DOK_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    DOK {level}
                  </option>
                ))}
              </select>
            </label>

            <TextField
              label="Skill focus"
              value={generationForm.skill_focus}
              onChange={(value) => updateGenerationForm("skill_focus", value)}
              placeholder="Optional"
            />

            <TextField
              label="Assessment move"
              value={generationForm.assessment_move}
              onChange={(value) =>
                updateGenerationForm("assessment_move", value)
              }
              placeholder="Optional"
            />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={generateAnotherQuestion}
              disabled={generatingQuestion || saving}
              className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-full
                  bg-primary
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
            >
              {generatingQuestion ? "Generating…" : "Generate question"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-bold">Edit questions</h3>

            <p className="mt-2 text-sm text-base-content/60">
              {draftPackage.questions.length} question
              {draftPackage.questions.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={addBlankQuestion}
            disabled={saving}
            className="
            inline-flex
            cursor-pointer
            items-center
            justify-center
            rounded-full
            border
            border-purple-200
            bg-purple-50
            px-4
            py-2
            text-sm
            font-semibold
            text-purple-800
            transition
            hover:bg-purple-100
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          >
            Add blank question
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {draftPackage.questions.map((question, questionIndex) => {
            const questionJson = question.question_json || {};

            const answerOptions = Array.isArray(questionJson.answer_options)
              ? questionJson.answer_options
              : [];

            return (
              <article
                key={question.id || `question-${questionIndex}`}
                className="rounded-2xl border border-base-300 bg-base-100 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="font-bold">Question {questionIndex + 1}</h4>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-base-content/60">
                      {question.question_type || "unknown"}
                      {" • "}
                      DOK {question.dok_level || "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => regenerateQuestion(questionIndex)}
                      disabled={
                        saving ||
                        generatingQuestion ||
                        regeneratingQuestionIndex !== null
                      }
                      className="
                            rounded-full
                            border
                            border-blue-200
                            bg-blue-50
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-blue-800
                            transition
                            hover:bg-blue-100
                            disabled:cursor-not-allowed
                            disabled:opacity-40
                          "
                    >
                      {regeneratingQuestionIndex === questionIndex
                        ? "Regenerating…"
                        : "Regenerate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateQuestion(questionIndex)}
                      disabled={saving}
                      className="
                          rounded-full
                          border
                          border-purple-200
                          bg-purple-50
                          px-3
                          py-1.5
                          text-xs
                          font-semibold
                          text-purple-800
                          transition
                          hover:bg-purple-100
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteQuestion(questionIndex)}
                      disabled={saving || draftPackage.questions.length <= 1}
                      className="
                          rounded-full
                          border
                          border-red-200
                          bg-red-50
                          px-3
                          py-1.5
                          text-xs
                          font-semibold
                          text-red-700
                          transition
                          hover:bg-red-100
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(questionIndex, "up")}
                      disabled={
                        saving ||
                        generatingQuestion ||
                        regeneratingQuestionIndex !== null ||
                        questionIndex === 0
                      }
                      className="
                          rounded-full
                          border
                          border-base-300
                          bg-white
                          px-3
                          py-1.5
                          text-xs
                          font-semibold
                          transition
                          hover:bg-base-200
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                    >
                      Up
                    </button>

                    <button
                      type="button"
                      onClick={() => moveQuestion(questionIndex, "down")}
                      disabled={
                        saving ||
                        generatingQuestion ||
                        regeneratingQuestionIndex !== null ||
                        questionIndex === draftPackage.questions.length - 1
                      }
                      className="
                          rounded-full
                          border
                          border-base-300
                          bg-white
                          px-3
                          py-1.5
                          text-xs
                          font-semibold
                          transition
                          hover:bg-base-200
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                        "
                    >
                      Down
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Question type"
                    value={question.question_type}
                    onChange={(value) =>
                      updateQuestionField(questionIndex, "question_type", value)
                    }
                  />

                  <TextField
                    label="DOK level"
                    type="number"
                    value={question.dok_level}
                    onChange={(value) =>
                      updateQuestionField(
                        questionIndex,
                        "dok_level",
                        Number(value),
                      )
                    }
                  />

                  <TextField
                    label="Skill focus"
                    value={question.skill_focus}
                    onChange={(value) =>
                      updateQuestionField(questionIndex, "skill_focus", value)
                    }
                  />

                  <TextField
                    label="Assessment move"
                    value={question.assessment_move}
                    onChange={(value) =>
                      updateQuestionField(
                        questionIndex,
                        "assessment_move",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Dramatic function"
                    value={question.dramatic_function}
                    onChange={(value) =>
                      updateQuestionField(
                        questionIndex,
                        "dramatic_function",
                        value,
                      )
                    }
                  />

                  <TextField
                    label="Target scene"
                    value={question.target_scene}
                    onChange={(value) =>
                      updateQuestionField(questionIndex, "target_scene", value)
                    }
                  />
                </div>

                <div className="mt-5">
                  <TextAreaField
                    label="Question stem"
                    value={questionJson.stem}
                    onChange={(value) =>
                      updateQuestionJsonField(questionIndex, "stem", value)
                    }
                    rows={3}
                  />
                </div>

                {answerOptions.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm font-semibold">Answer options</p>

                    {answerOptions.map((option, optionIndex) => (
                      <div
                        key={option.id || `option-${optionIndex}`}
                        className="grid gap-3 rounded-2xl border border-base-300 bg-white p-4 md:grid-cols-[90px_1fr]"
                      >
                        <TextField
                          label="ID"
                          value={option.id}
                          onChange={(value) =>
                            updateAnswerOption(
                              questionIndex,
                              optionIndex,
                              "id",
                              value,
                            )
                          }
                        />

                        <TextField
                          label="Option text"
                          value={option.text}
                          onChange={(value) =>
                            updateAnswerOption(
                              questionIndex,
                              optionIndex,
                              "text",
                              value,
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-5">
                  <TextField
                    label="Correct answer"
                    value={questionJson.correct_answer}
                    onChange={(value) =>
                      updateQuestionJsonField(
                        questionIndex,
                        "correct_answer",
                        value,
                      )
                    }
                    placeholder="Example: C"
                  />
                </div>

                <div className="mt-5">
                  <TextAreaField
                    label="Explanation"
                    value={questionJson.explanation}
                    onChange={(value) =>
                      updateQuestionJsonField(
                        questionIndex,
                        "explanation",
                        value,
                      )
                    }
                    rows={4}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="sticky bottom-4 rounded-[1.5rem] border border-purple-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {message && (
              <p
                className={`text-sm font-semibold ${
                  messageType === "error" ? "text-red-700" : "text-green-700"
                }`}
              >
                {message}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              inline-flex
              items-center
              justify-center
              rounded-full
              bg-primary
              px-6
              py-2.5
              font-semibold
              text-white
              transition
              hover:opacity-90
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {saving ? "Saving…" : "Save draft changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
