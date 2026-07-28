//components/admin/passage-bank/PassageBankDraftDetail.js
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PassageBankDraftEditor from "./PassageBankEditor";
import PassageBankAuditHistory from "@/components/admin/passage-bank/PassageBankAuditHistory";
import PassageBankLoadingState from "./PassageBankLoadingState";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClasses(status) {
  switch (status) {
    case "approved":
      return "border-green-200 bg-green-50 text-green-700";

    case "in_review":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";

    case "published":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "archived":
      return "border-gray-300 bg-gray-100 text-gray-700";

    default:
      return "border-purple-200 bg-purple-50 text-purple-700";
  }
}

function getValidationState(validation) {
  if (!isPlainObject(validation)) {
    return {
      label: "Not validated",
      classes: "border-gray-300 bg-gray-100 text-gray-700",
    };
  }

  if (validation.stale === true) {
    return {
      label: "Validation stale",
      classes: "border-yellow-200 bg-yellow-50 text-yellow-700",
    };
  }

  if (validation.success === true) {
    return {
      label: "Validation passed",
      classes: "border-green-200 bg-green-50 text-green-700",
    };
  }

  return {
    label: "Validation failed",
    classes: "border-red-200 bg-red-50 text-red-700",
  };
}

function getQuestionLabel(question, index) {
  return (
    question?.question_json?.stem || question?.stem || `Question ${index + 1}`
  );
}

export default function PassageBankDraftDetail({ draftId }) {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionMessageType, setActionMessageType] = useState("");

  const [editing, setEditing] = useState(false);
  const [reviewNote, setReviewNote] = useState("");

  const isActionRunning = Boolean(actionLoading);

  const loadDraft = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/v2/admin/passage-bank/drafts/${draftId}`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load draft package.");
      }

      setDraft(data?.draft || data?.package || data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load draft package.",
      );
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);
  useEffect(() => {
    if (!actionMessage || actionMessageType !== "success") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionMessage("");
      setActionMessageType("");
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionMessage, actionMessageType]);

  const revisionSourceId =
    draft?.generation?.source_passage_bank_id ||
    draft?.revision_of_passage_bank_id ||
    draft?.source_passage_bank_id ||
    draft?.revision_source_passage_bank_id ||
    draft?.revises_passage_bank_id ||
    null;

  const isRevision = Boolean(revisionSourceId);

  const packageJson = isPlainObject(draft?.draft_json) ? draft.draft_json : {};

  const passage = isPlainObject(draft?.passage)
    ? draft.passage
    : isPlainObject(packageJson?.passage)
      ? packageJson.passage
      : {};

  const questions = Array.isArray(draft?.questions)
    ? draft.questions
    : Array.isArray(packageJson?.questions)
      ? packageJson.questions
      : [];

  const validation = isPlainObject(draft?.validation)
    ? draft.validation
    : draft?.validation_json;
  const validationState = useMemo(
    () => getValidationState(validation),
    [validation],
  );
  const reviewEvents = Array.isArray(draft?.reviewEvents)
    ? draft.reviewEvents
    : Array.isArray(draft?.review_events)
      ? draft.review_events
      : [];

  const publishedPassageBankId = draft?.published_passage_bank_id || null;

  const runDraftAction = async ({ name, endpoint, method = "POST", body }) => {
    setActionLoading(name);
    setActionMessage("");
    setActionMessageType("");

    try {
      const response = await fetch(endpoint, {
        method,
        headers:
          body === undefined
            ? undefined
            : {
                "Content-Type": "application/json",
              },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Draft action failed.");
      }

      setActionMessage(data?.message || "Action completed successfully.");
      setActionMessageType("success");
      setReviewNote("");

      await loadDraft();
    } catch (actionError) {
      setActionMessage(
        actionError instanceof Error
          ? actionError.message
          : "Draft action failed.",
      );
      setActionMessageType("error");
    } finally {
      setActionLoading("");
    }
  };

  const handleValidate = () =>
    runDraftAction({
      name: "validate",
      endpoint: `/api/v2/admin/passage-bank/drafts/${draftId}/validate`,
    });

  const handleSubmitForReview = () =>
    runDraftAction({
      name: "submit_for_review",
      endpoint: `/api/v2/admin/passage-bank/drafts/${draftId}/review`,
      body: {
        action: "submit_for_review",

        note: reviewNote.trim() || "Submitted from passage-bank admin UI.",
      },
    });

  const handleApprove = () =>
    runDraftAction({
      name: "approve",
      endpoint: `/api/v2/admin/passage-bank/drafts/${draftId}/review`,
      body: {
        action: "approve",

        note: reviewNote.trim() || "Approved from passage-bank admin UI.",
      },
    });

  const handleReject = () =>
    runDraftAction({
      name: "reject",
      endpoint: `/api/v2/admin/passage-bank/drafts/${draftId}/review`,
      body: {
        action: "reject",

        note: reviewNote.trim() || "Rejected from passage-bank admin UI.",
      },
    });

  const handleReturnToDraft = () =>
    runDraftAction({
      name: "return_to_draft",
      endpoint: `/api/v2/admin/passage-bank/drafts/${draftId}/review`,
      body: {
        action: "return_to_draft",

        note:
          reviewNote.trim() || "Returned to draft from passage-bank admin UI.",
      },
    });

  const handlePublish = () =>
    runDraftAction({
      name: "publish",

      endpoint: isRevision
        ? `/api/v2/admin/passage-bank/drafts/${draftId}/publish-revision`
        : `/api/v2/admin/passage-bank/drafts/${draftId}/publish`,

      body: {
        note:
          reviewNote.trim() ||
          (isRevision
            ? "Revision published from passage-bank admin UI."
            : "Published from passage-bank admin UI."),

        metadata: {
          source: "passage_bank_admin_ui",
        },
      },
    });

  const handleArchive = () =>
    runDraftAction({
      name: "archive",
      endpoint: `/api/v2/admin/passage-bank/drafts/${draftId}/review`,
      body: {
        action: "archive",

        note: reviewNote.trim() || "Archived from passage-bank admin UI.",
      },
    });

  const handleRestore = () =>
    runDraftAction({
      name: "restore",
      endpoint: `/api/v2/admin/passage-bank/drafts/${draftId}/review`,
      body: {
        action: "restore",

        note: reviewNote.trim() || "Restored from passage-bank admin UI.",
      },
    });

  if (loading) {
    return <PassageBankLoadingState message="Loading draft package…" />;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Could not load draft</p>

        <p className="mt-2 text-sm">{error}</p>

        <button
          type="button"
          onClick={loadDraft}
          className="mt-4 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!draft) {
    return null;
  }

  const canValidate = ["draft", "rejected"].includes(draft.status);

  const canSubmit =
    draft.status === "draft" &&
    validation?.success === true &&
    validation?.stale !== true;

  const canApprove = draft.status === "in_review";

  const canReject = draft.status === "in_review";

  const canReturn = ["in_review", "approved", "rejected"].includes(
    draft.status,
  );

  const canPublish = draft.status === "approved";

  const canArchive =
    draft.status !== "published" && draft.status !== "archived";

  const canRestore = draft.status === "archived";

  const hasWorkflowAction =
    canValidate ||
    canSubmit ||
    canApprove ||
    canReject ||
    canReturn ||
    canPublish ||
    canArchive ||
    canRestore;

  function confirmAction(message, action) {
    if (!window.confirm(message)) {
      return;
    }

    action();
  }

  const canEdit = ["draft", "rejected"].includes(draft.status);

  return (
    <div className="space-y-6">
      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words text-2xl font-bold">
                {draft.title || passage.title || "Untitled draft"}
              </h2>

              <span
                className={`
                  rounded-full
                  border
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  ${getStatusClasses(draft.status)}
                `}
              >
                {String(draft.status || "draft").replaceAll("_", " ")}
              </span>

              <span
                className={`
                  rounded-full
                  border
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  ${validationState.classes}
                `}
              >
                {validationState.label}
              </span>
            </div>

            <p className="mt-3 text-sm text-base-content/70">
              {draft.subject || "—"}
              {" • "}
              Grade {draft.grade_level || "—"}
              {" • "}
              {draft.teks_standard || "—"}
              {" • "}
              {draft.passage_format || "—"}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-base-content/60">
              <span>
                {questions.length} question
                {questions.length === 1 ? "" : "s"}
              </span>

              {draft.revision_number && (
                <span>Revision {draft.revision_number}</span>
              )}

              <span>Updated {formatDate(draft.updated_at)}</span>
            </div>
          </div>

          {hasWorkflowAction && (
            <div className="mt-6">
              <label className="block space-y-2">
                <span className="text-sm font-semibold">Reviewer note</span>

                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  disabled={isActionRunning}
                  rows={3}
                  placeholder="Add context for this workflow action."
                  className="textarea textarea-bordered w-full rounded-2xl bg-white"
                />
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadDraft}
              disabled={isActionRunning}
              className="disabled:cursor-not-allowed disabled:opacity-50 rounded-full border border-base-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-base-200"
            >
              Refresh
            </button>

            {publishedPassageBankId && (
              <Link
                href={`/admin/passage-bank/published/${publishedPassageBankId}`}
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
                View published package
              </Link>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing((current) => !current)}
                disabled={isActionRunning}
                className="
                cursor-pointer
                disabled:cursor-not-allowed disabled:opacity-50
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
                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-purple-400
                focus-visible:ring-offset-2
              "
              >
                {editing ? "Close editor" : "Edit draft"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {canValidate && (
            <button
              type="button"
              onClick={handleValidate}
              disabled={isActionRunning}
              className="cursor-pointer rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 disabled:opacity-50 focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-purple-400
                focus-visible:ring-offset-2"
            >
              {actionLoading === "validate" ? "Validating…" : "Validate"}
            </button>
          )}

          {canSubmit && (
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={isActionRunning}
              className="  cursor-pointer
              rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-purple-400
              focus-visible:ring-offset-2"
            >
              {actionLoading === "submit_for_review"
                ? "Submitting…"
                : "Submit for review"}
            </button>
          )}

          {canApprove && (
            <button
              type="button"
              onClick={() =>
                confirmAction(
                  "Approve this draft for publication?",
                  handleApprove,
                )
              }
              disabled={isActionRunning}
              className="  cursor-pointer
                rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-purple-400
                focus-visible:ring-offset-2"
            >
              {actionLoading === "approve" ? "Approving…" : "Approve"}
            </button>
          )}

          {canReject && (
            <button
              type="button"
              onClick={() =>
                confirmAction(
                  "Reject this draft and return it to the author for revision?",
                  handleReject,
                )
              }
              disabled={isActionRunning}
              className="  cursor-pointer
 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading === "reject" ? "Rejecting…" : "Reject"}
            </button>
          )}

          {canReturn && (
            <button
              type="button"
              onClick={() =>
                confirmAction(
                  "Return this package to draft status? It will need review again before publication.",
                  handleReturnToDraft,
                )
              }
              disabled={isActionRunning}
              className="  cursor-pointer
 rounded-full border border-base-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Return to draft
            </button>
          )}

          {canPublish && (
            <button
              type="button"
              onClick={() =>
                confirmAction(
                  isRevision
                    ? "Publish this revision? The current active revision will be superseded and deactivated."
                    : "Publish this package and make it available in the passage bank?",
                  handlePublish,
                )
              }
              disabled={isActionRunning}
              className="  cursor-pointer
 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading === "publish"
                ? "Publishing…"
                : isRevision
                  ? "Publish revision"
                  : "Publish"}
            </button>
          )}

          {canArchive && (
            <button
              type="button"
              onClick={() =>
                confirmAction(
                  "Archive this draft? It will be removed from the active review workflow but kept for audit history.",
                  handleArchive,
                )
              }
              disabled={isActionRunning}
              className="
                    cursor-pointer
                    rounded-full
                    border
                    border-gray-300
                    bg-gray-100
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-gray-700
                    disabled:opacity-50
                  "
            >
              {actionLoading === "archive" ? "Archiving…" : "Archive"}
            </button>
          )}

          {canRestore && (
            <button
              type="button"
              onClick={() =>
                confirmAction(
                  "Restore this archived package to draft status?",
                  handleRestore,
                )
              }
              disabled={isActionRunning}
              className="
                    cursor-pointer
                    rounded-full
                    border
                    border-purple-200
                    bg-purple-50
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    text-purple-800
                    disabled:opacity-50
                  "
            >
              {actionLoading === "restore" ? "Restoring…" : "Restore draft"}
            </button>
          )}
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

        {editing && (
          <PassageBankDraftEditor
            draft={draft}
            draftId={draftId}
            onSaved={async () => {
              setEditing(false);
              await loadDraft();
            }}
          />
        )}
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Passage</h3>

        <div className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-base-300 bg-base-100 p-5 text-sm leading-7">
          {passage.passage || "No passage text saved."}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-bold">Questions</h3>

          <span className="text-sm text-base-content/60">
            {questions.length} total
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {questions.length === 0 ? (
            <p className="text-sm text-base-content/60">No questions saved.</p>
          ) : (
            questions.map((question, index) => (
              <article
                key={question.id || `${question.question_type}-${index}`}
                className="rounded-2xl border border-base-300 bg-base-100 p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                    Question {index + 1}
                  </span>

                  <span className="text-xs text-base-content/60">
                    {question.question_type || "unknown type"}
                    {" • "}
                    DOK {question.dok_level || "—"}
                  </span>
                </div>

                <h4 className="mt-4 font-semibold">
                  {getQuestionLabel(question, index)}
                </h4>

                {Array.isArray(question?.question_json?.answer_options) && (
                  <div className="mt-4 space-y-2">
                    {question.question_json.answer_options.map((option) => (
                      <div
                        key={option.id || option.text}
                        className="rounded-xl border border-base-300 bg-white px-4 py-3 text-sm"
                      >
                        <span className="font-semibold">
                          {option.id}
                          {". "}
                        </span>

                        {option.text}
                      </div>
                    ))}
                  </div>
                )}

                {question?.question_json?.correct_answer && (
                  <p className="mt-4 text-sm">
                    <span className="font-semibold">Correct answer:</span>{" "}
                    {question.question_json.correct_answer}
                  </p>
                )}

                {question?.question_json?.explanation && (
                  <p className="mt-3 text-sm text-base-content/70">
                    {question.question_json.explanation}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold">Validation</h3>

        {!isPlainObject(validation) ? (
          <p className="mt-4 text-sm text-base-content/60">
            This draft has not been validated.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/60">
                  Errors
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {validation.error_count ?? validation.errors?.length ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/60">
                  Warnings
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {validation.warning_count ?? validation.warnings?.length ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <p className="text-xs uppercase tracking-wide text-base-content/60">
                  Validated
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {formatDate(validation.validated_at)}
                </p>
              </div>
            </div>

            {Array.isArray(validation.issues) &&
              validation.issues.length > 0 && (
                <div className="space-y-2">
                  {validation.issues.map((issue, index) => (
                    <div
                      key={`${issue.path}-${index}`}
                      className={`
                          rounded-2xl
                          border
                          px-4
                          py-3
                          text-sm
                          ${
                            issue.severity === "error"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-yellow-200 bg-yellow-50 text-yellow-800"
                          }
                        `}
                    >
                      <p className="font-semibold">
                        {issue.path || "Validation issue"}
                      </p>

                      <p className="mt-1">{issue.message}</p>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </section>
      <PassageBankAuditHistory
        events={reviewEvents}
        exportLabel="passage-bank-draft-audit"
        packageId={draftId}
        emptyMessage="No review or workflow events have been recorded for this draft."
      />
    </div>
  );
}
