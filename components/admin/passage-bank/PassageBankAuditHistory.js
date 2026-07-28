//components/admin/passage-bank/PassageBankAuditHistory.js
"use client";

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

function getValidationLabel(snapshot) {
  if (snapshot.success === true) {
    return "Passed";
  }

  if (snapshot.stale === true) {
    return "Stale";
  }

  if (snapshot.success === false) {
    return "Failed";
  }

  return "—";
}

function getRevisionNumber(metadata, validationSnapshot) {
  return (
    metadata.revision_number ??
    metadata.replacement_revision_number ??
    metadata.target_revision_number ??
    validationSnapshot.target_revision_number ??
    validationSnapshot.source_revision_number ??
    "—"
  );
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue =
    typeof value === "object" ? JSON.stringify(value) : String(value);

  return `"${stringValue.replaceAll('"', '""')}"`;
}

function downloadAuditCsv(events, exportLabel, packageId) {
  if (
    typeof window === "undefined" ||
    !Array.isArray(events) ||
    events.length === 0
  ) {
    return;
  }

  const headers = [
    "Action",
    "From Status",
    "To Status",
    "Note",
    "Performed By Name",
    "Performed By Email",
    "Performed By UUID",
    "Draft Package ID",
    "Published Package ID",
    "Validation Success",
    "Validation Stale",
    "Validation Error Count",
    "Validation Warning Count",
    "Revision Number",
    "Created At",
    "Metadata",
  ];

  const rows = events.map((event) => {
    const validationSnapshot = isPlainObject(event.validation_snapshot)
      ? event.validation_snapshot
      : {};

    const metadata = isPlainObject(event.metadata) ? event.metadata : {};

    const revisionNumber =
      metadata.revision_number ??
      metadata.replacement_revision_number ??
      metadata.target_revision_number ??
      validationSnapshot.target_revision_number ??
      validationSnapshot.source_revision_number ??
      "";

    return [
      event.action,
      event.from_status,
      event.to_status,
      event.note,
      event.performed_by_name,
      event.performed_by_email,
      event.performed_by,
      event.draft_package_id,
      event.published_passage_bank_id,
      validationSnapshot.success,
      validationSnapshot.stale,
      validationSnapshot.error_count,
      validationSnapshot.warning_count,
      revisionNumber,
      event.created_at,
      metadata,
    ]
      .map(escapeCsvValue)
      .join(",");
  });

  const csvContent = [headers.map(escapeCsvValue).join(","), ...rows].join(
    "\n",
  );

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8",
  });

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  const dateStamp = new Date().toISOString().slice(0, 10);

  link.href = url;
const safeLabel = String(
  exportLabel ||
    "passage-bank-audit",
)
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const safePackageId =
  typeof packageId === "string" &&
  packageId.trim()
    ? `-${packageId.trim()}`
    : "";

link.download =
  `${safeLabel}${safePackageId}-${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}


export default function PassageBankAuditHistory({
  events = [],
  title = "Review and audit history",
  emptyMessage = "No review or workflow events have been recorded.",
  exportLabel = "passage-bank-audit",
  packageId = null,
}) {
  const reviewEvents = Array.isArray(events) ? events : [];

  return (
    <section className="rounded-[1.5rem] border border-base-300 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold">{title}</h3>

          <p className="mt-1 text-sm text-base-content/60">
            {reviewEvents.length} event
            {reviewEvents.length === 1 ? "" : "s"}
          </p>
        </div>

        {reviewEvents.length > 0 && (
          <button
            type="button"
            onClick={() => downloadAuditCsv(reviewEvents,exportLabel,packageId,)}
            className="
              inline-flex
              w-full
              cursor-pointer
              items-center
              justify-center
              rounded-full
              border
              border-base-300
              bg-white
              px-4
              py-2
              text-sm
              font-semibold
              transition
              hover:bg-base-200
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-purple-400
              focus-visible:ring-offset-2
              sm:w-auto
            "
          >
            Export CSV
          </button>
        )}
      </div>

      {reviewEvents.length === 0 ? (
        <p className="mt-4 text-sm text-base-content/60">{emptyMessage}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {reviewEvents.map((event, index) => {
            const validationSnapshot = isPlainObject(event.validation_snapshot)
              ? event.validation_snapshot
              : {};

            const metadata = isPlainObject(event.metadata)
              ? event.metadata
              : {};

            const hasTransition = Boolean(event.from_status || event.to_status);

            return (
              <article
                key={event.id || `audit-event-${index}`}
                className="rounded-2xl border border-base-300 bg-base-100 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                        {formatValue(event.action || "workflow_event")}
                      </span>

                      {hasTransition && (
                        <span className="text-xs text-base-content/60">
                          {formatValue(event.from_status)}
                          {" → "}
                          {formatValue(event.to_status)}
                        </span>
                      )}
                    </div>

                    {event.note && (
                      <p className="mt-3 text-sm leading-6">{event.note}</p>
                    )}
                  </div>

                  <p className="text-xs text-base-content/60">
                    {formatDate(event.created_at)}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-base-300 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-base-content/50">
                      Validation
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {getValidationLabel(validationSnapshot)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-base-300 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-base-content/50">
                      Errors
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {validationSnapshot.error_count ?? "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-base-300 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-base-content/50">
                      Warnings
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {validationSnapshot.warning_count ?? "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-base-300 bg-white p-3">
                    <p className="text-xs uppercase tracking-wide text-base-content/50">
                      Revision
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {getRevisionNumber(metadata, validationSnapshot)}
                    </p>
                  </div>
                </div>

                <details className="mt-4 rounded-xl border border-base-300 bg-white">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">
                    Event details
                  </summary>

                  <div className="border-t border-base-300 p-4">
                    <dl className="grid gap-4 text-xs md:grid-cols-2">
                      <div>
                        <dt className="font-semibold">Performed by</dt>

                        <dd className="mt-1 text-base-content/70">
                          <span className="block font-medium text-base-content">
                            {event.performed_by_name ||
                              event.performed_by_email ||
                              "Unknown admin"}
                          </span>

                          {event.performed_by_name &&
                            event.performed_by_email && (
                              <span className="mt-1 block break-all">
                                {event.performed_by_email}
                              </span>
                            )}

                          {event.performed_by && (
                            <span className="mt-1 block break-all font-mono text-[11px] text-base-content/50">
                              {event.performed_by}
                            </span>
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold">Draft package</dt>

                        <dd className="mt-1 break-all font-mono text-base-content/70">
                          {event.draft_package_id || "—"}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold">Published package</dt>

                        <dd className="mt-1 break-all font-mono text-base-content/70">
                          {event.published_passage_bank_id || "—"}
                        </dd>
                      </div>

                      <div>
                        <dt className="font-semibold">Validation time</dt>

                        <dd className="mt-1 text-base-content/70">
                          {formatDate(validationSnapshot.validated_at)}
                        </dd>
                      </div>

                      {metadata.revision_root_id && (
                        <div>
                          <dt className="font-semibold">Revision root</dt>

                          <dd className="mt-1 break-all font-mono text-base-content/70">
                            {metadata.revision_root_id}
                          </dd>
                        </div>
                      )}

                      {metadata.replaces_passage_bank_id && (
                        <div>
                          <dt className="font-semibold">Replaces package</dt>

                          <dd className="mt-1 break-all font-mono text-base-content/70">
                            {metadata.replaces_passage_bank_id}
                          </dd>
                        </div>
                      )}

                      {metadata.replacement_passage_bank_id && (
                        <div>
                          <dt className="font-semibold">Replacement package</dt>

                          <dd className="mt-1 break-all font-mono text-base-content/70">
                            {metadata.replacement_passage_bank_id}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
