//components/admin/passage-bank/PassageBankPublishedDetail.js
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PassageBankAuditHistory from "./PassageBankAuditHistory";
import PassageBankLoadingState from "./PassageBankLoadingState";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return String(value).replaceAll("_", " ");
}

function getQuestionStem(question, index) {
  return (
    question?.question_json?.stem || question?.stem || `Question ${index + 1}`
  );
}

function getCorrectAnswerText(questionJson) {
  const correctAnswer = questionJson?.correct_answer;

  if (Array.isArray(correctAnswer)) {
    return correctAnswer.join(", ");
  }

  if (correctAnswer !== null && correctAnswer !== undefined) {
    return String(correctAnswer);
  }

  return null;
}

export default function PassageBankPublishedDetail({ passageBankId }) {
  const router = useRouter();

  const [creatingRevision, setCreatingRevision] = useState(false);

  const [publishedPackage, setPublishedPackage] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeUpdating, setActiveUpdating] = useState(false);

  const [actionMessage, setActionMessage] = useState("");

  const [actionMessageType, setActionMessageType] = useState("");

  const isActionRunning = activeUpdating || creatingRevision;

  const loadPublishedPackage = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/v2/admin/passage-bank/published/${passageBankId}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load published package.");
      }

      setPublishedPackage(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load published package.",
      );
    } finally {
      setLoading(false);
    }
  }, [passageBankId]);

  useEffect(() => {
    loadPublishedPackage();
  }, [loadPublishedPackage]);
  useEffect(() => {
  if (
    !actionMessage ||
    actionMessageType !== "success"
  ) {
    return;
  }

  const timeoutId = window.setTimeout(() => {
    setActionMessage("");
    setActionMessageType("");
  }, 5000);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [
  actionMessage,
  actionMessageType,
]);

  const passage = useMemo(() => {
    if (isPlainObject(publishedPackage?.package)) {
      return publishedPackage.package;
    }

    if (isPlainObject(publishedPackage?.passage)) {
      return publishedPackage.passage;
    }

    if (isPlainObject(publishedPackage?.published)) {
      return publishedPackage.published;
    }

    if (isPlainObject(publishedPackage?.published_package)) {
      return publishedPackage.published_package;
    }

    return {};
  }, [publishedPackage]);

  const questions = useMemo(() => {
    if (Array.isArray(publishedPackage?.package?.questions)) {
      return publishedPackage.package.questions;
    }

    if (Array.isArray(publishedPackage?.questions)) {
      return publishedPackage.questions;
    }

    if (Array.isArray(publishedPackage?.published?.questions)) {
      return publishedPackage.published.questions;
    }

    if (Array.isArray(publishedPackage?.published_package?.questions)) {
      return publishedPackage.published_package.questions;
    }

    return [];
  }, [publishedPackage]);
  const revisions = useMemo(() => {
    if (Array.isArray(publishedPackage?.revisions)) {
      return publishedPackage.revisions;
    }

    if (Array.isArray(publishedPackage?.revision_history)) {
      return publishedPackage.revision_history;
    }

    if (Array.isArray(publishedPackage?.package?.revisions)) {
      return publishedPackage.package.revisions;
    }

    return [];
  }, [publishedPackage]);

  const reviewEvents = useMemo(() => {
    if (Array.isArray(publishedPackage?.package?.review_events)) {
      return publishedPackage.package.review_events;
    }

    if (Array.isArray(publishedPackage?.review_events)) {
      return publishedPackage.review_events;
    }

    return [];
  }, [publishedPackage]);

  const auditEvents = useMemo(
    () =>
      reviewEvents.map((event) => ({
        ...event,
        metadata: {
          ...(isPlainObject(event.metadata) ? event.metadata : {}),
          revision_number:
            event?.metadata?.revision_number ?? passage.revision_number ?? null,
        },
      })),
    [reviewEvents, passage.revision_number],
  );

  const sourceDraftId = useMemo(() => {
    const publicationEvent =
      reviewEvents.find(
        (event) =>
          event?.draft_package_id &&
          ["published", "revision_published"].includes(event.action),
      ) || reviewEvents.find((event) => event?.draft_package_id);

    return publicationEvent?.draft_package_id || null;
  }, [reviewEvents]);

  const updateActiveState = async () => {
    const nextActiveState = passage.is_active !== true;

    setActiveUpdating(true);
    setActionMessage("");
    setActionMessageType("");

    try {
      const response = await fetch(
        `/api/v2/admin/passage-bank/published/${passageBankId}/active`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: nextActiveState,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || data?.details || "Failed to update active status.",
        );
      }

      setActionMessage(
        nextActiveState
          ? "Published package activated."
          : "Published package deactivated.",
      );

      setActionMessageType("success");

      await loadPublishedPackage();
    } catch (updateError) {
      setActionMessage(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update active status.",
      );
      setActionMessageType("error");
    } finally {
      setActiveUpdating(false);
    }
  };
  const createRevisionDraft = async () => {
    setCreatingRevision(true);
    setActionMessage("");
    setActionMessageType("");

    try {
      const response = await fetch(
        `/api/v2/admin/passage-bank/published/${passageBankId}/revision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: "Revision created from passage-bank admin UI.",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || data?.details || "Failed to create revision draft.",
        );
      }

      const revisionDraftId =
        data?.draft_id || data?.draft?.id || data?.revision_draft_id;

      if (!revisionDraftId) {
        throw new Error(
          "Revision draft was created, but no draft ID was returned.",
        );
      }

      router.push(`/admin/passage-bank/drafts/${revisionDraftId}`);
    } catch (revisionError) {
      setActionMessage(
        revisionError instanceof Error
          ? revisionError.message
          : "Failed to create revision draft.",
      );
      setActionMessageType("error");
    } finally {
      setCreatingRevision(false);
    }
  };

  if (loading) {
    return <PassageBankLoadingState message="Loading published package…" />;
  }
  if (error) {
    return (
      <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Could not load published package</p>

        <p className="mt-2 text-sm">{error}</p>

        <button
          type="button"
          onClick={loadPublishedPackage}
          className="mt-4 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  function confirmAction(message, action) {
    if (!window.confirm(message)) {
      return;
    }

    action();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">
                {passage.title || "Untitled published passage"}
              </h2>

              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Published
              </span>

              <span
                className={`
                  rounded-full
                  border
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  ${
                    passage.is_active
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-gray-300 bg-gray-100 text-gray-700"
                  }
                `}
              >
                {passage.is_active ? "Active" : "Inactive"}
              </span>

              {passage.superseded_at && (
                <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  Superseded
                </span>
              )}
            </div>

            <p className="mt-3 text-sm text-base-content/70">
              {formatValue(passage.subject)}
              {" • "}
              Grade {formatValue(passage.grade_level)}
              {" • "}
              {formatValue(passage.teks_standard)}
              {" • "}
              {formatValue(passage.passage_format)}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-base-content/60">
              <span>
                {questions.length} question
                {questions.length === 1 ? "" : "s"}
              </span>

              <span>Revision {passage.revision_number ?? "-"}</span>

              <span>Created {formatDate(passage.created_at)}</span>

              <span>Updated {formatDate(passage.updated_at)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadPublishedPackage}
              disabled={isActionRunning}
              className="rounded-full border border-base-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-base-200 focus:outline-none focus:outline-none
focus-visible:ring-2
focus-visible:ring-purple-400
focus-visible:ring-offset-2"
            >
              Refresh
            </button>

            {sourceDraftId && (
              <Link
                href={`/admin/passage-bank/drafts/${sourceDraftId}`}
                className="
                    rounded-full
                    border
                    border-blue-200
                    bg-blue-50
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-blue-700
                    transition
                    hover:bg-blue-100
                    "
              >
                View source draft
              </Link>
            )}

            {!passage.superseded_at && (
              <button
                type="button"
                onClick={() =>
                  confirmAction(
                    "Create a new revision draft from this published package? The current package will remain active until the revision is reviewed and published.",
                    createRevisionDraft,
                  )
                }
                disabled={isActionRunning}
                className="
                    rounded-full
                    border
                    border-purple-200
                    bg-purple-50
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-purple-800
                    hover:bg-purple-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    "
              >
                {creatingRevision ? "Creating revision…" : "Create revision"}
              </button>
            )}

            {!passage.superseded_at && (
              <button
                type="button"
                onClick={() =>
                  confirmAction(
                    passage.is_active
                      ? "Deactivate this published package? It will no longer be selected for student assessments."
                      : "Activate this published package and make it available for student assessments?",
                    updateActiveState,
                  )
                }
                disabled={isActionRunning}
                className={`
                  rounded-full
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  disabled:opacity-50
                  ${passage.is_active ? "bg-gray-700" : "bg-green-600"}
                `}
              >
                {activeUpdating
                  ? "Updating…"
                  : passage.is_active
                    ? "Deactivate"
                    : "Activate"}
              </button>
            )}
          </div>
        </div>

        {actionMessage && (
          <div
            role={actionMessageType === "error" ? "alert" : "status"}
            className={`
            mt-4
            rounded-2xl
            border
            px-4
            py-3
            text-sm
            font-medium
            ${
                actionMessageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }
            `}
          >
            {actionMessage}
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Passage metadata</h3>

        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Content focus key
            </dt>

            <dd className="mt-2 break-words text-sm font-medium">
              {formatValue(passage.content_focus_key)}
            </dd>
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Difficulty
            </dt>

            <dd className="mt-2 text-sm font-medium">
              {formatValue(passage.difficulty_level)}
            </dd>
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Times used
            </dt>

            <dd className="mt-2 text-sm font-medium">
              {formatValue(passage.times_used)}
            </dd>
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 p-4 sm:col-span-2 lg:col-span-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Content focus
            </dt>

            <dd className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {formatValue(passage.content_focus)}
            </dd>
          </div>

          <div className="rounded-2xl border border-base-300 bg-base-100 p-4 sm:col-span-2 lg:col-span-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
              Skill tags
            </dt>

            <dd className="mt-3 flex flex-wrap gap-2">
              {Array.isArray(passage.skill_tags) &&
              passage.skill_tags.length > 0 ? (
                passage.skill_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800"
                  >
                    {formatValue(tag)}
                  </span>
                ))
              ) : (
                <span className="text-sm">—</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Passage</h3>

        <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-base-300 bg-base-100 p-5 text-sm leading-7">
          {passage.passage || passage.stimulus || "No passage text saved."}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Published questions</h3>

          <span className="text-sm text-base-content/60">
            {questions.length} total
          </span>
        </div>

        <div className="mt-5 space-y-5">
          {questions.length === 0 ? (
            <p className="text-sm text-base-content/60">
              No published questions were returned.
            </p>
          ) : (
            questions.map((question, index) => {
              const questionJson = isPlainObject(question.question_json)
                ? question.question_json
                : {};

              const answerOptions = Array.isArray(questionJson.answer_options)
                ? questionJson.answer_options
                : [];

              const correctAnswer = getCorrectAnswerText(questionJson);

              return (
                <article
                  key={question.id || `question-${index}`}
                  className="rounded-2xl border border-base-300 bg-base-100 p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                      Question {index + 1}
                    </span>

                    <span className="rounded-full border border-base-300 bg-white px-3 py-1 text-xs font-semibold">
                      {formatValue(question.question_type)}
                    </span>

                    <span className="rounded-full border border-base-300 bg-white px-3 py-1 text-xs font-semibold">
                      DOK {formatValue(question.dok_level)}
                    </span>

                    <span
                      className={`
                          rounded-full
                          border
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          ${
                            question.is_active
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-gray-300 bg-gray-100 text-gray-700"
                          }
                        `}
                    >
                      {question.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h4 className="mt-4 font-semibold leading-7">
                    {getQuestionStem(question, index)}
                  </h4>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <p>
                      <span className="font-semibold">Skill focus:</span>{" "}
                      {formatValue(question.skill_focus)}
                    </p>

                    <p>
                      <span className="font-semibold">Assessment move:</span>{" "}
                      {formatValue(question.assessment_move)}
                    </p>

                    <p>
                      <span className="font-semibold">Dramatic function:</span>{" "}
                      {formatValue(question.dramatic_function)}
                    </p>

                    <p>
                      <span className="font-semibold">Target scene:</span>{" "}
                      {formatValue(question.target_scene)}
                    </p>
                  </div>

                  {answerOptions.length > 0 && (
                    <div className="mt-5 space-y-2">
                      {answerOptions.map((option, optionIndex) => {
                        const optionId =
                          option?.id ?? String.fromCharCode(65 + optionIndex);

                        const isCorrect =
                          String(optionId) ===
                          String(questionJson.correct_answer);

                        return (
                          <div
                            key={`${optionId}-${optionIndex}`}
                            className={`
                                  rounded-xl
                                  border
                                  px-4
                                  py-3
                                  text-sm
                                  ${
                                    isCorrect
                                      ? "border-green-200 bg-green-50"
                                      : "border-base-300 bg-white"
                                  }
                                `}
                          >
                            <span className="font-semibold">{optionId}.</span>{" "}
                            {option?.text ?? String(option)}
                            {isCorrect && (
                              <span className="ml-2 text-xs font-semibold text-green-700">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {correctAnswer && (
                    <p className="mt-5 text-sm">
                      <span className="font-semibold">Correct answer:</span>{" "}
                      {correctAnswer}
                    </p>
                  )}

                  {questionJson.explanation && (
                    <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6">
                      <p className="font-semibold text-blue-900">Explanation</p>

                      <p className="mt-2 text-blue-900/80">
                        {questionJson.explanation}
                      </p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Revision history</h3>

          <span className="text-sm text-base-content/60">
            {revisions.length} revision
            {revisions.length === 1 ? "" : "s"}
          </span>
        </div>

        {revisions.length === 0 ? (
          <p className="mt-4 text-sm text-base-content/60">
            No revision history was returned for this package.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {revisions.map((revision, index) => (
              <Link
                key={revision.id || `revision-${index}`}
                href={
                  revision.id
                    ? `/admin/passage-bank/published/${revision.id}`
                    : "#"
                }
                aria-current={
                  revision.id === passageBankId ? "page" : undefined
                }
                className={`
                    flex
                    flex-col
                    gap-3
                    rounded-2xl
                    border
                    p-4
                    transition
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    ${
                      revision.id === passageBankId
                        ? "border-purple-300 bg-purple-50"
                        : "border-base-300 bg-base-100 hover:border-purple-200 hover:bg-purple-50/50"
                    }
                `}
              >
                <div>
                  <p className="font-semibold">
                    Revision {revision.revision_number ?? index + 1}
                    {revision.id === passageBankId && (
                      <span className="ml-2 text-xs font-semibold text-purple-700">
                        Current page
                      </span>
                    )}
                  </p>
                  {revision.title && (
                    <p className="mt-1 text-sm text-base-content/70">
                      {revision.title}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-base-content/60">
                    {formatDate(revision.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`
                        rounded-full
                        border
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        ${
                          revision.is_active
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-gray-300 bg-gray-100 text-gray-700"
                        }
                      `}
                  >
                    {revision.is_active ? "Active" : "Inactive"}
                  </span>

                  {revision.superseded_at && (
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                      Superseded
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <PassageBankAuditHistory
          events={auditEvents}
          exportLabel="passage-bank-published-audit"
          packageId={passageBankId}
          emptyMessage="No review or publication events were returned for this package."
        />
    </div>
  );
}
