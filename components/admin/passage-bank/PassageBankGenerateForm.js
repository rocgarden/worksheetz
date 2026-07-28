"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const DEFAULT_PLAN = [
  {
    question_type: "multiple_choice",
    dok_level: 1,
    count: 1,
  },
];

const QUESTION_TYPES = [
  "multiple_choice",
  "multi_select",
  "hot_text",
  "constructed_response",
  "drag_drop",
  "complete_table",
  "next_place_in_line",
  "evidence_pair",
];

function createPlanRow() {
  return {
    question_type: "multiple_choice",
    dok_level: 1,
    count: 1,
  };
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="input input-bordered w-full rounded-2xl bg-white"
      />
    </label>
  );
}

export default function PassageBankGenerateForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    subject: "ELA",
    grade_level: "8",
    teks_standard: "8.8C",
    passage_format: "drama",
    content_focus_key:
      "misunderstanding_deadline_choice",
    content_focus:
      "Overheard information creates a misunderstanding, a second complication, and a difficult choice before a deadline.",
    title: "",
    skill_tags: "dramatic_action",
    difficulty_level: 2,
    testing_window: "",
  });

  const [questionPlan, setQuestionPlan] =
    useState(DEFAULT_PLAN);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const totalQuestions = useMemo(
    () =>
      questionPlan.reduce(
        (total, item) =>
          total + Number(item.count || 0),
        0,
      ),
    [questionPlan],
  );

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updatePlanRow = (
    index,
    field,
    value,
  ) => {
    setQuestionPlan((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addPlanRow = () => {
    setQuestionPlan((current) => [
      ...current,
      createPlanRow(),
    ]);
  };

  const removePlanRow = (index) => {
    setQuestionPlan((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      if (
        totalQuestions < 1 ||
        totalQuestions > 30
      ) {
        throw new Error(
          "Total questions must be between 1 and 30.",
        );
      }

      const payload = {
        subject:
          form.subject.trim(),

        grade_level:
          form.grade_level.trim(),

        teks_standard:
          form.teks_standard.trim(),

        passage_format:
          form.passage_format.trim(),

        content_focus_key:
          form.content_focus_key.trim() ||
          null,

        content_focus:
          form.content_focus.trim() ||
          null,

        title:
          form.title.trim() ||
          null,

        skill_tags:
          form.skill_tags
            .split(",")
            .map((tag) =>
              tag.trim(),
            )
            .filter(Boolean),

        difficulty_level:
          Number(
            form.difficulty_level,
          ),

        testing_window:
          form.testing_window.trim() ||
          null,

        question_plan:
          questionPlan.map((item) => ({
            question_type:
              item.question_type,

            dok_level:
              Number(item.dok_level),

            count:
              Number(item.count),
          })),
      };

      const response = await fetch(
        "/api/v2/admin/passage-bank/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to generate passage-bank draft.",
        );
      }

      const draftId =
        data?.draft_id ||
        data?.draft?.id;

      if (!draftId) {
        throw new Error(
          "Draft generation succeeded, but no draft ID was returned.",
        );
      }

      router.push(
        `/admin/passage-bank/drafts/${draftId}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to generate draft.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold">
          Passage settings
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-semibold">
              Subject *
            </span>

            <select
              value={form.subject}
              onChange={(event) =>
                updateForm(
                  "subject",
                  event.target.value,
                )
              }
              className="select select-bordered w-full rounded-2xl bg-white"
            >
              <option value="ELA">
                ELA
              </option>
              <option value="Science">
                Science
              </option>
              <option value="Social Studies">
                Social Studies
              </option>
              <option value="Math">
                Math
              </option>
            </select>
          </label>

          <TextField
            label="Grade level"
            value={form.grade_level}
            onChange={(value) =>
              updateForm(
                "grade_level",
                value,
              )
            }
            placeholder="8"
            required
          />

          <TextField
            label="TEKS standard"
            value={form.teks_standard}
            onChange={(value) =>
              updateForm(
                "teks_standard",
                value,
              )
            }
            placeholder="8.8C"
            required
          />

          <TextField
            label="Passage format"
            value={form.passage_format}
            onChange={(value) =>
              updateForm(
                "passage_format",
                value,
              )
            }
            placeholder="drama"
            required
          />

          <TextField
            label="Title"
            value={form.title}
            onChange={(value) =>
              updateForm(
                "title",
                value,
              )
            }
            placeholder="Optional title"
          />

          <TextField
            label="Content focus key"
            value={
              form.content_focus_key
            }
            onChange={(value) =>
              updateForm(
                "content_focus_key",
                value,
              )
            }
            placeholder="misunderstanding_deadline_choice"
          />

          <label className="block space-y-2">
            <span className="text-sm font-semibold">
              Difficulty level
            </span>

            <select
              value={
                form.difficulty_level
              }
              onChange={(event) =>
                updateForm(
                  "difficulty_level",
                  Number(
                    event.target.value,
                  ),
                )
              }
              className="select select-bordered w-full rounded-2xl bg-white"
            >
              <option value={1}>
                1
              </option>
              <option value={2}>
                2
              </option>
              <option value={3}>
                3
              </option>
            </select>
          </label>

          <TextField
            label="Skill tags"
            value={form.skill_tags}
            onChange={(value) =>
              updateForm(
                "skill_tags",
                value,
              )
            }
            placeholder="dramatic_action, conflict"
          />

          <TextField
            label="Testing window"
            value={
              form.testing_window
            }
            onChange={(value) =>
              updateForm(
                "testing_window",
                value,
              )
            }
            placeholder="Optional"
          />
        </div>

        <label className="mt-5 block space-y-2">
          <span className="text-sm font-semibold">
            Content focus
          </span>

          <textarea
            value={form.content_focus}
            onChange={(event) =>
              updateForm(
                "content_focus",
                event.target.value,
              )
            }
            rows={5}
            className="textarea textarea-bordered w-full rounded-2xl bg-white leading-7"
            placeholder="Describe the required passage structure and content."
          />
        </label>
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Question plan
            </h2>

            <p className="mt-1 text-sm text-base-content/60">
              {totalQuestions} of 30 questions
            </p>
          </div>

          <button
            type="button"
            onClick={addPlanRow}
            className="rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800"
          >
            Add question type
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {questionPlan.map(
            (item, index) => (
              <div
                key={index}
                className="grid gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 md:grid-cols-[1fr_150px_150px_auto]"
              >
                <label className="space-y-2">
                  <span className="text-sm font-semibold">
                    Question type
                  </span>

                  <select
                    value={
                      item.question_type
                    }
                    onChange={(event) =>
                      updatePlanRow(
                        index,
                        "question_type",
                        event.target.value,
                      )
                    }
                    className="select select-bordered w-full rounded-2xl bg-white"
                  >
                    {QUESTION_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type.replaceAll(
                            "_",
                            " ",
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold">
                    DOK
                  </span>

                  <select
                    value={item.dok_level}
                    onChange={(event) =>
                      updatePlanRow(
                        index,
                        "dok_level",
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    className="select select-bordered w-full rounded-2xl bg-white"
                  >
                    <option value={1}>
                      1
                    </option>
                    <option value={2}>
                      2
                    </option>
                    <option value={3}>
                      3
                    </option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold">
                    Count
                  </span>

                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={item.count}
                    onChange={(event) =>
                      updatePlanRow(
                        index,
                        "count",
                        Number(
                          event.target
                            .value,
                        ),
                      )
                    }
                    className="input input-bordered w-full rounded-2xl bg-white"
                  />
                </label>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() =>
                      removePlanRow(index)
                    }
                    disabled={
                      questionPlan.length ===
                      1
                    }
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            submitting ||
            totalQuestions < 1 ||
            totalQuestions > 30
          }
          className="inline-flex min-w-48 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Generating draft…"
            : "Generate draft"}
        </button>
      </div>
    </form>
  );
}