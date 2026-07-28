"use client";

import { useMemo, useState } from "react";

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDraftPackage(draft) {
 const draftJson =
  isPlainObject(draft?.draft_json)
    ? cloneValue(draft.draft_json)
    : {};

const passage =
  isPlainObject(draft?.passage)
    ? cloneValue(draft.passage)
    : isPlainObject(draftJson.passage)
      ? cloneValue(draftJson.passage)
      : {};

const questions =
  Array.isArray(draft?.questions)
    ? cloneValue(draft.questions)
    : Array.isArray(draftJson.questions)
      ? cloneValue(draftJson.questions)
      : [];

  return {
    passage: {
      ...passage,

      title:
        passage.title ??
        draft?.title ??
        "",

      subject:
        passage.subject ??
        draft?.subject ??
        "",

      grade_level:
        passage.grade_level ??
        draft?.grade_level ??
        "",

      teks_standard:
        passage.teks_standard ??
        draft?.teks_standard ??
        "",

      passage_format:
        passage.passage_format ??
        draft?.passage_format ??
        "prose",

      content_focus_key:
        passage.content_focus_key ??
        draft?.content_focus_key ??
        "",

      content_focus:
        passage.content_focus ??
        "",

      passage:
        passage.passage ??
        "",
    },

    questions:
      questions.map((question) => ({
        ...question,

        question_json: {
          ...(isPlainObject(
            question?.question_json,
          )
            ? question.question_json
            : {}),

          answer_options:
            Array.isArray(
              question?.question_json
                ?.answer_options,
            )
              ? question.question_json
                  .answer_options
              : [],
        },
      })),
  };
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-base-content">
        {label}
      </span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
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

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-base-content">
        {label}
      </span>

      <textarea
        value={value ?? ""}
        onChange={(event) =>
          onChange(event.target.value)
        }
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

export default function PassageBankDraftEditor({
  draft,
  draftId,
  onSaved,
}) {
  const initialPackage = useMemo(
    () => normalizeDraftPackage(draft),
    [draft],
  );

  const [draftPackage, setDraftPackage] =
    useState(initialPackage);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState("");

  const updatePassage = (
    field,
    value,
  ) => {
    setDraftPackage((current) => ({
      ...current,

      passage: {
        ...current.passage,
        [field]: value,
      },
    }));
  };

  const updateQuestion = (
    questionIndex,
    updater,
  ) => {
    setDraftPackage((current) => ({
      ...current,

      questions:
        current.questions.map(
          (question, index) =>
            index === questionIndex
              ? updater(question)
              : question,
        ),
    }));
  };

  const updateQuestionField = (
    questionIndex,
    field,
    value,
  ) => {
    updateQuestion(
      questionIndex,
      (question) => ({
        ...question,
        [field]: value,
      }),
    );
  };

  const updateQuestionJsonField = (
    questionIndex,
    field,
    value,
  ) => {
    updateQuestion(
      questionIndex,
      (question) => ({
        ...question,

        question_json: {
          ...question.question_json,
          [field]: value,
        },
      }),
    );
  };

  const updateAnswerOption = (
    questionIndex,
    optionIndex,
    field,
    value,
  ) => {
    updateQuestion(
      questionIndex,
      (question) => ({
        ...question,

        question_json: {
          ...question.question_json,

          answer_options:
            question.question_json.answer_options.map(
              (option, index) =>
                index === optionIndex
                  ? {
                      ...option,
                      [field]: value,
                    }
                  : option,
            ),
        },
      }),
    );
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
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            passage:
              draftPackage.passage,

            questions:
              draftPackage.questions,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save draft changes.",
        );
      }

      setMessage(
        "Draft changes saved. Validation is now stale.",
      );

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
          <h3 className="text-xl font-bold">
            Edit passage
          </h3>

          <p className="mt-2 text-sm text-base-content/60">
            Saving changes returns the package to draft status and marks its validation as stale.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <TextField
            label="Title"
            value={
              draftPackage.passage.title
            }
            onChange={(value) =>
              updatePassage(
                "title",
                value,
              )
            }
            placeholder="Passage title"
          />

          <TextField
            label="Content focus key"
            value={
              draftPackage.passage
                .content_focus_key
            }
            onChange={(value) =>
              updatePassage(
                "content_focus_key",
                value,
              )
            }
            placeholder="content_focus_key"
          />
        </div>

        <div className="mt-5">
          <TextAreaField
            label="Content focus"
            value={
              draftPackage.passage
                .content_focus
            }
            onChange={(value) =>
              updatePassage(
                "content_focus",
                value,
              )
            }
            placeholder="Describe the passage content focus."
            rows={3}
          />
        </div>

        <div className="mt-5">
          <TextAreaField
            label="Passage text"
            value={
              draftPackage.passage
                .passage
            }
            onChange={(value) =>
              updatePassage(
                "passage",
                value,
              )
            }
            placeholder="Enter the full passage."
            rows={18}
          />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-xl font-bold">
            Edit questions
          </h3>

          <p className="mt-2 text-sm text-base-content/60">
            {draftPackage.questions.length} question
            {draftPackage.questions.length === 1
              ? ""
              : "s"}
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {draftPackage.questions.map(
            (question, questionIndex) => {
              const questionJson =
                question.question_json || {};

              const answerOptions =
                Array.isArray(
                  questionJson.answer_options,
                )
                  ? questionJson.answer_options
                  : [];

              return (
                <article
                  key={
                    question.id ||
                    `question-${questionIndex}`
                  }
                  className="rounded-2xl border border-base-300 bg-base-100 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="font-bold">
                      Question{" "}
                      {questionIndex + 1}
                    </h4>

                    <span className="text-xs text-base-content/60">
                      {question.question_type ||
                        "unknown"}
                      {" • "}
                      DOK{" "}
                      {question.dok_level ||
                        "—"}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <TextField
                      label="Question type"
                      value={
                        question.question_type
                      }
                      onChange={(value) =>
                        updateQuestionField(
                          questionIndex,
                          "question_type",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="DOK level"
                      type="number"
                      value={
                        question.dok_level
                      }
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
                      value={
                        question.skill_focus
                      }
                      onChange={(value) =>
                        updateQuestionField(
                          questionIndex,
                          "skill_focus",
                          value,
                        )
                      }
                    />

                    <TextField
                      label="Assessment move"
                      value={
                        question.assessment_move
                      }
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
                      value={
                        question.dramatic_function
                      }
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
                      value={
                        question.target_scene
                      }
                      onChange={(value) =>
                        updateQuestionField(
                          questionIndex,
                          "target_scene",
                          value,
                        )
                      }
                    />
                  </div>

                  <div className="mt-5">
                    <TextAreaField
                      label="Question stem"
                      value={
                        questionJson.stem
                      }
                      onChange={(value) =>
                        updateQuestionJsonField(
                          questionIndex,
                          "stem",
                          value,
                        )
                      }
                      rows={3}
                    />
                  </div>

                  {answerOptions.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <p className="text-sm font-semibold">
                        Answer options
                      </p>

                      {answerOptions.map(
                        (
                          option,
                          optionIndex,
                        ) => (
                          <div
                            key={
                              option.id ||
                              `option-${optionIndex}`
                            }
                            className="grid gap-3 rounded-2xl border border-base-300 bg-white p-4 md:grid-cols-[90px_1fr]"
                          >
                            <TextField
                              label="ID"
                              value={
                                option.id
                              }
                              onChange={(
                                value,
                              ) =>
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
                              value={
                                option.text
                              }
                              onChange={(
                                value,
                              ) =>
                                updateAnswerOption(
                                  questionIndex,
                                  optionIndex,
                                  "text",
                                  value,
                                )
                              }
                            />
                          </div>
                        ),
                      )}
                    </div>
                  )}

                  <div className="mt-5">
                    <TextField
                      label="Correct answer"
                      value={
                        questionJson.correct_answer
                      }
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
                      value={
                        questionJson.explanation
                      }
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
            },
          )}
        </div>
      </section>

      <div className="sticky bottom-4 rounded-[1.5rem] border border-purple-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {message && (
              <p
                className={`text-sm font-semibold ${
                  messageType === "error"
                    ? "text-red-700"
                    : "text-green-700"
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
            {saving
              ? "Saving…"
              : "Save draft changes"}
          </button>
        </div>
      </div>
    </div>
  );
}