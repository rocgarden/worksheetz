//components/admin/passage-bank/PassageBankManager.js
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PassageBankLoadingState from "./PassageBankLoadingState";

const TABS = {
  drafts: "drafts",
  published: "published",
};

function normalizeListResponse(data, type) {
  if (type === TABS.drafts) {
    return Array.isArray(data?.drafts)
      ? data.drafts
      : Array.isArray(data?.packages)
        ? data.packages
        : [];
  }

  return Array.isArray(data?.packages)
    ? data.packages
    : Array.isArray(data?.published)
      ? data.published
      : [];
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

function getDraftStatusClasses(status) {
  switch (status) {
    case "in_review":
      return "border-yellow-200 bg-yellow-50 text-yellow-700";

    case "approved":
      return "border-green-200 bg-green-50 text-green-700";

    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";

    case "published":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "archived":
      return "border-gray-300 bg-gray-100 text-gray-700";

    case "draft":
    default:
      return "border-purple-200 bg-purple-50 text-purple-700";
  }
}

function formatActionLabel(value) {
  return String(value || "activity").replaceAll("_", " ");
}

function getQueueItemHref(item) {
  if (!item?.id) {
    return null;
  }

  return `/admin/passage-bank/drafts/${item.id}`;
}

function SummaryCard({ label, value, description, onClick, active = false }) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`
        rounded-[1.35rem]
        border
        p-4
        text-left
        transition
        ${
          active
            ? "border-purple-300 bg-purple-50 shadow-sm"
            : "border-base-300 bg-white"
        }
        ${
          onClick
            ? "cursor-pointer hover:border-purple-200 hover:shadow-sm"
            : ""
        }
      `}
    >
      <p className="text-sm font-semibold text-base-content/60">{label}</p>

      <p className="mt-2 text-3xl font-bold">{Number(value || 0)}</p>

      {description && (
        <p className="mt-1 text-xs leading-5 text-base-content/55">
          {description}
        </p>
      )}
    </Component>
  );
}

function ReviewQueueSection({ title, description, items, emptyMessage }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <section className="rounded-[1.5rem] border border-base-300 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-bold">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-base-content/60">
          {description}
        </p>
      </div>

      {safeItems.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-base-200 px-4 py-3 text-sm text-base-content/60">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {safeItems.slice(0, 5).map((item) => {
            const href = getQueueItemHref(item);

            const content = (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-semibold">
                    {item.title || "Untitled draft"}
                  </p>

                  <p className="mt-1 text-xs text-base-content/60">
                    {item.subject || "—"}
                    {" • "}
                    Grade {item.grade_level || "—"}
                    {" • "}
                    {item.teks_standard || "—"}
                  </p>
                </div>

                <span className="text-xs font-semibold text-purple-700">
                  Open →
                </span>
              </div>
            );

            return href ? (
              <Link
                key={item.id}
                href={href}
                className="block rounded-2xl border border-base-300 px-4 py-3 transition hover:border-purple-200 hover:bg-purple-50"
              >
                {content}
              </Link>
            ) : (
              <div
                key={`${item.title}-${item.updated_at}`}
                className="rounded-2xl border border-base-300 px-4 py-3"
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function sortPackages(items, sortBy) {
  const rows = [...items];

  rows.sort((a, b) => {
    switch (sortBy) {
      case "updated_asc":
        return (
          new Date(a.updated_at || a.created_at || 0).getTime() -
          new Date(b.updated_at || b.created_at || 0).getTime()
        );

      case "title_asc":
        return String(a.title || "").localeCompare(
          String(b.title || ""),
          "en",
          {
            sensitivity: "base",
          },
        );

      case "grade_asc":
        return String(a.grade_level || "").localeCompare(
          String(b.grade_level || ""),
          "en",
          {
            numeric: true,
            sensitivity: "base",
          },
        );

      case "teks_asc":
        return String(a.teks_standard || "").localeCompare(
          String(b.teks_standard || ""),
          "en",
          {
            numeric: true,
            sensitivity: "base",
          },
        );

      case "updated_desc":
      default:
        return (
          new Date(b.updated_at || b.created_at || 0).getTime() -
          new Date(a.updated_at || a.created_at || 0).getTime()
        );
    }
  });

  return rows;
}

async function readJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-base-300 bg-base-100 px-6 py-12 text-center">
      <h3 className="break-words text-lg font-bold">{title}</h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-base-content/60">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default function PassageBankManager({ mode = "default" }) {
  const [activeTab, setActiveTab] = useState(TABS.drafts);
  const isReviewMode = mode === "review";

  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [overviewOpen, setOverviewOpen] = useState(true);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [publishedLoading, setPublishedLoading] = useState(true);

  const [draftsError, setDraftsError] = useState("");
  const [publishedError, setPublishedError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    isReviewMode ? "in_review" : "all",
  );
  const [activeFilter, setActiveFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [teksFilter, setTeksFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated_desc");

  const [selectedDraftIds, setSelectedDraftIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkMessage, setBulkMessage] = useState(null);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError("");

    try {
      const response = await fetch("/api/v2/admin/passage-bank", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load passage-bank overview.");
      }

      setOverview(data);
    } catch (error) {
      setOverviewError(
        error instanceof Error
          ? error.message
          : "Failed to load passage-bank overview.",
      );
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadDrafts = useCallback(async () => {
    setDraftsLoading(true);
    setDraftsError("");

    try {
      const response = await fetch(
        "/api/v2/admin/passage-bank/drafts?page=1&page_size=100",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load passage-bank drafts.");
      }

      setDrafts(normalizeListResponse(data, TABS.drafts));
    } catch (error) {
      setDraftsError(
        error instanceof Error
          ? error.message
          : "Failed to load passage-bank drafts.",
      );
    } finally {
      setDraftsLoading(false);
    }
  }, []);

  const loadPublished = useCallback(async () => {
    setPublishedLoading(true);
    setPublishedError("");

    try {
      const response = await fetch(
        "/api/v2/admin/passage-bank/published?page=1&page_size=100",
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load published passage-bank packages.",
        );
      }

      setPublished(normalizeListResponse(data, TABS.published));
    } catch (error) {
      setPublishedError(
        error instanceof Error
          ? error.message
          : "Failed to load published passage-bank packages.",
      );
    } finally {
      setPublishedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    loadDrafts();
    loadPublished();
  }, [loadOverview, loadDrafts, loadPublished]);

  useEffect(() => {
    setSubjectFilter("all");
    setGradeFilter("all");
    setTeksFilter("all");

    if (isReviewMode && activeTab === TABS.drafts) {
      setStatusFilter((current) => (current === "all" ? "in_review" : current));
    }
  }, [activeTab, isReviewMode]);

  useEffect(() => {
    setSelectedDraftIds([]);
  }, [activeTab]);

  useEffect(() => {
    setTeksFilter("all");
  }, [subjectFilter, gradeFilter]);

const activeSourceItems = activeTab === TABS.drafts ? drafts : published;

const filterSourceItems = useMemo(
  () => [...drafts, ...published],
  [drafts, published],
);
  const subjectOptions = useMemo(
    () =>
      [
        ...new Set(
          filterSourceItems
            .map((item) => String(item.subject || "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) =>
        a.localeCompare(b, "en", {
          sensitivity: "base",
        }),
      ),
    [filterSourceItems],
  );

  const gradeOptions = useMemo(
    () =>
      [
        ...new Set(
          filterSourceItems
            .map((item) => String(item.grade_level || "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) =>
        a.localeCompare(b, "en", {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    [filterSourceItems],
  );

  const teksOptions = useMemo(
    () =>
      [
        ...new Set(
          filterSourceItems
            .filter(
              (item) =>
                subjectFilter === "all" || item.subject === subjectFilter,
            )
            .filter(
              (item) =>
                gradeFilter === "all" ||
                String(item.grade_level) === gradeFilter,
            )
            .map((item) => String(item.teks_standard || "").trim())
            .filter(Boolean),
        ),
      ].sort((a, b) =>
        a.localeCompare(b, "en", {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    [filterSourceItems, subjectFilter, gradeFilter],
  );

  const filteredDrafts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matchingDrafts = drafts.filter((draft) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          draft.title,
          draft.subject,
          draft.grade_level,
          draft.teks_standard,
          draft.passage_format,
          draft.content_focus_key,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedQuery),
        );

      const matchesStatus =
        statusFilter === "all" || draft.status === statusFilter;

      const matchesSubject =
        subjectFilter === "all" || draft.subject === subjectFilter;

      const matchesGrade =
        gradeFilter === "all" || String(draft.grade_level) === gradeFilter;

      const matchesTeks =
        teksFilter === "all" || draft.teks_standard === teksFilter;

      return (
        matchesQuery &&
        matchesStatus &&
        matchesSubject &&
        matchesGrade &&
        matchesTeks
      );
    });

    return sortPackages(matchingDrafts, sortBy);
  }, [
    drafts,
    query,
    statusFilter,
    subjectFilter,
    gradeFilter,
    teksFilter,
    sortBy,
  ]);

  const filteredPublished = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const matchingPublished = published.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          item.title,
          item.subject,
          item.grade_level,
          item.teks_standard,
          item.passage_format,
          item.content_focus_key,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedQuery),
        );

      const matchesActive = (() => {
        if (activeFilter === "all") {
          return true;
        }

        if (activeFilter === "active") {
          return item.is_active === true && !item.superseded_at;
        }

        if (activeFilter === "inactive") {
          return item.is_active !== true && !item.superseded_at;
        }

        if (activeFilter === "superseded") {
          return Boolean(item.superseded_at);
        }

        if (activeFilter === "current") {
          return !item.superseded_at;
        }

        return true;
      })();

      const matchesSubject =
        subjectFilter === "all" || item.subject === subjectFilter;

      const matchesGrade =
        gradeFilter === "all" || String(item.grade_level) === gradeFilter;

      const matchesTeks =
        teksFilter === "all" || item.teks_standard === teksFilter;

      return (
        matchesQuery &&
        matchesActive &&
        matchesSubject &&
        matchesGrade &&
        matchesTeks
      );
    });

    return sortPackages(matchingPublished, sortBy);
  }, [
    published,
    query,
    activeFilter,
    subjectFilter,
    gradeFilter,
    teksFilter,
    sortBy,
  ]);

  const overviewSummary = overview?.summary || {};

  const draftSummary = overviewSummary.drafts || {};

  const publishedSummary = overviewSummary.published || {};

  const reviewQueue = overview?.review_queue || {};

  const recentActivity = Array.isArray(overview?.recent_activity)
    ? overview.recent_activity
    : [];

  const isDraftTab = activeTab === TABS.drafts;

  const loading =
    overviewLoading || (isDraftTab ? draftsLoading : publishedLoading);

  const error = isDraftTab ? draftsError : publishedError;

  const items = isDraftTab ? filteredDrafts : filteredPublished;

  const visibleDraftIds = isDraftTab
    ? filteredDrafts.map((draft) => draft.id).filter(Boolean)
    : [];

  const selectedVisibleDraftIds = visibleDraftIds.filter((draftId) =>
    selectedDraftIds.includes(draftId),
  );

  const allVisibleDraftsSelected =
    visibleDraftIds.length > 0 &&
    selectedVisibleDraftIds.length === visibleDraftIds.length;

  const selectedDrafts = drafts.filter((draft) =>
    selectedDraftIds.includes(draft.id),
  );

  const selectedArchivedDrafts = selectedDrafts.filter(
    (draft) => draft.status === "archived",
  );

  const selectedNonArchivedDrafts = selectedDrafts.filter(
    (draft) => draft.status !== "archived",
  );

  const selectedValidatableDrafts = selectedDrafts.filter(
    (draft) => !["published", "archived"].includes(draft.status),
  );

  const toggleDraftSelection = (draftId) => {
    if (!draftId) {
      return;
    }

    setSelectedDraftIds((current) =>
      current.includes(draftId)
        ? current.filter((id) => id !== draftId)
        : [...current, draftId],
    );
  };

  const toggleAllVisibleDrafts = () => {
    setSelectedDraftIds((current) => {
      if (allVisibleDraftsSelected) {
        return current.filter((id) => !visibleDraftIds.includes(id));
      }

      return [...new Set([...current, ...visibleDraftIds])];
    });
  };

  const clearDraftSelection = () => {
    setSelectedDraftIds([]);
  };

  const runBulkDraftAction = async ({ action, drafts: actionDrafts }) => {
    if (
      bulkAction ||
      !Array.isArray(actionDrafts) ||
      actionDrafts.length === 0
    ) {
      return;
    }

    const actionLabel =
      action === "validate"
        ? "validate"
        : action === "archive"
          ? "archive"
          : "restore";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} ${
        actionDrafts.length
      } selected draft${actionDrafts.length === 1 ? "" : "s"}?`,
    );

    if (!confirmed) {
      return;
    }

    setBulkAction(action);
    setBulkMessage(null);

    try {
      const results = await Promise.allSettled(
        actionDrafts.map(async (draft) => {
          const endpoint =
            action === "validate"
              ? `/api/v2/admin/passage-bank/drafts/${draft.id}/validate`
              : `/api/v2/admin/passage-bank/drafts/${draft.id}/review`;

          const requestBody =
            action === "validate"
              ? undefined
              : JSON.stringify({
                  action,
                  note: `Bulk ${action} action from passage-bank admin.`,
                  metadata: {
                    source: "passage_bank_manager",
                    bulk_action: true,
                  },
                });

          const response = await fetch(endpoint, {
            method: "POST",
            headers:
              action === "validate"
                ? undefined
                : {
                    "Content-Type": "application/json",
                  },
            body: requestBody,
          });

          const data = await readJsonResponse(response);

          if (!response.ok) {
            throw new Error(
              data?.error ||
                `Failed to ${actionLabel} ${draft.title || "selected draft"}.`,
            );
          }

          return {
            draftId: draft.id,
            data,
          };
        }),
      );

      const successfulIds = [];
      const failedResults = [];

      results.forEach((result, index) => {
        const draft = actionDrafts[index];

        if (result.status === "fulfilled") {
          successfulIds.push(draft.id);
        } else {
          failedResults.push({
            draftId: draft.id,
            title: draft.title || "Untitled draft",
            message:
              result.reason instanceof Error
                ? result.reason.message
                : `Failed to ${actionLabel} draft.`,
          });
        }
      });

      if (successfulIds.length > 0) {
        setSelectedDraftIds((current) =>
          current.filter((id) => !successfulIds.includes(id)),
        );
      }

      await Promise.all([loadDrafts(), loadOverview()]);

      if (failedResults.length === 0) {
        setBulkMessage({
          type: "success",
          text: `${successfulIds.length} draft${
            successfulIds.length === 1 ? "" : "s"
          } ${
            action === "validate"
              ? "validated"
              : action === "archive"
                ? "archived"
                : "restored"
          } successfully.`,
        });
      } else if (successfulIds.length > 0) {
        setBulkMessage({
          type: "warning",
          text: `${successfulIds.length} succeeded and ${
            failedResults.length
          } failed. First error: ${failedResults[0].message}`,
        });
      } else {
        setBulkMessage({
          type: "error",
          text:
            failedResults[0]?.message ||
            `Unable to ${actionLabel} the selected drafts.`,
        });
      }
    } catch (error) {
      setBulkMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : `Unable to ${actionLabel} the selected drafts.`,
      });
    } finally {
      setBulkAction("");
    }
  };

  const handleBulkValidate = () =>
    runBulkDraftAction({
      action: "validate",
      drafts: selectedValidatableDrafts,
    });

  const handleBulkArchive = () =>
    runBulkDraftAction({
      action: "archive",
      drafts: selectedNonArchivedDrafts,
    });

  const handleBulkRestore = () =>
    runBulkDraftAction({
      action: "restore",
      drafts: selectedArchivedDrafts,
    });

  const handleRefresh = async () => {
    await Promise.all([
      loadOverview(),
      isDraftTab ? loadDrafts() : loadPublished(),
    ]);
  };

  const hasActiveFilters =
    Boolean(query.trim()) ||
    subjectFilter !== "all" ||
    gradeFilter !== "all" ||
    teksFilter !== "all" ||
    sortBy !== "updated_desc" ||
    (isDraftTab ? statusFilter !== "all" : activeFilter !== "all");

  const clearFilters = () => {
    setQuery("");
    setSubjectFilter("all");
    setGradeFilter("all");
    setTeksFilter("all");
    setSortBy("updated_desc");

    if (isDraftTab) {
      setStatusFilter(isReviewMode ? "in_review" : "all");
    } else {
      setActiveFilter("all");
    }
  };

  return (
    <div className="space-y-6">
      <section
        className="
            overflow-hidden
            rounded-[1.75rem]
            border
            border-purple-200
            bg-gradient-to-br
            from-purple-50
            via-white
            to-yellow-50
            shadow-sm
          "
      >
        <button
          type="button"
          onClick={() => setOverviewOpen((current) => !current)}
          aria-expanded={overviewOpen}
          aria-controls="passage-bank-overview-content"
          className="
              flex
              w-full
              cursor-pointer
              items-center
              justify-between
              gap-4
              border-b
              border-purple-100
              bg-purple-100/70
              px-5
              py-4
              text-left
              transition
              hover:bg-purple-100
              sm:px-6
            "
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-purple-950">
                Passage-bank overview
              </h2>

              {!overviewLoading && !overviewError && (
                <span
                  className="
                rounded-full
                border
                border-purple-200
                bg-white
                px-3
                py-1
                text-xs
                font-semibold
                text-purple-700
              "
                >
                  {recentActivity.length} recent event
                  {recentActivity.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-purple-950/60">
              Review workflow, publication status, and recent admin activity.
            </p>
          </div>

          <span
            aria-hidden="true"
            className={`
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-purple-200
              bg-white
              text-lg
              font-bold
              text-purple-800
              shadow-sm
              transition-transform
              duration-200
              ${overviewOpen ? "rotate-180" : ""}
            `}
          >
            ↓
          </span>
        </button>

        {overviewOpen && (
          <div
            id="passage-bank-overview-content"
            className="space-y-5 p-4 sm:p-6"
          >
            {overviewError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                <p className="font-semibold">Could not load overview</p>

                <p className="mt-1 text-sm">{overviewError}</p>
              </div>
            ) : overviewLoading ? (
              <PassageBankLoadingState message="Loading passage-bank overview…" />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    label="Needs review"
                    value={draftSummary.needs_review}
                    description="Drafts currently submitted for review."
                    onClick={() => {
                      setActiveTab(TABS.drafts);
                      setStatusFilter("in_review");
                    }}
                    active={
                      activeTab === TABS.drafts && statusFilter === "in_review"
                    }
                  />

                  <SummaryCard
                    label="Approved"
                    value={draftSummary.by_status?.approved || 0}
                    description="Approved drafts, including items ready to publish."
                    onClick={() => {
                      setActiveTab(TABS.drafts);
                      setStatusFilter("approved");
                    }}
                    active={
                      activeTab === TABS.drafts && statusFilter === "approved"
                    }
                  />

                  <SummaryCard
                    label="Active packages"
                    value={publishedSummary.active}
                    description="Published packages currently available for use."
                    onClick={() => {
                      setActiveTab(TABS.published);
                      setActiveFilter("active");
                    }}
                    active={
                      activeTab === TABS.published && activeFilter === "active"
                    }
                  />

                  <SummaryCard
                    label="Archived drafts"
                    value={draftSummary.archived}
                    description="Draft packages removed from the active workflow."
                    onClick={() => {
                      setActiveTab(TABS.drafts);
                      setStatusFilter("archived");
                    }}
                    active={
                      activeTab === TABS.drafts && statusFilter === "archived"
                    }
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <ReviewQueueSection
                    title="Needs review"
                    description="Draft packages currently waiting for an admin decision."
                    items={reviewQueue.needs_review}
                    emptyMessage="No drafts are currently waiting for review."
                  />

                  <ReviewQueueSection
                    title="Approved, not published"
                    description="Approved first-version drafts that are ready for publication."
                    items={reviewQueue.approved_not_published}
                    emptyMessage="No approved drafts are waiting to be published."
                  />

                  <ReviewQueueSection
                    title="Returned for changes"
                    description="Rejected drafts that need editing before they can be reviewed again."
                    items={reviewQueue.returned_for_changes}
                    emptyMessage="No drafts are currently returned for changes."
                  />

                  <ReviewQueueSection
                    title="Revision queue"
                    description="Revision drafts still in draft or review status."
                    items={reviewQueue.revisions_awaiting_review}
                    emptyMessage="No revisions are currently waiting in the review workflow."
                  />
                </div>

                <section className="rounded-[1.5rem] border border-purple-100 bg-white p-5 shadow-sm">
                  <div>
                    <h3 className="text-lg font-bold">Recent activity</h3>

                    <p className="mt-1 text-sm text-base-content/60">
                      Latest review, publication, revision, and archive events.
                    </p>
                  </div>

                  {recentActivity.length === 0 ? (
                    <p className="mt-5 rounded-2xl bg-base-200 px-4 py-3 text-sm text-base-content/60">
                      No passage-bank activity has been recorded.
                    </p>
                  ) : (
                    <div className="mt-5 divide-y divide-base-300">
                      {recentActivity.slice(0, 8).map((event) => {
                        const draftHref = event.draft_package_id
                          ? `/admin/passage-bank/drafts/${event.draft_package_id}`
                          : null;

                        const publishedHref = event.published_passage_bank_id
                          ? `/admin/passage-bank/published/${event.published_passage_bank_id}`
                          : null;

                        const href = draftHref || publishedHref;

                        const row = (
                          <div className="flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold capitalize">
                                {formatActionLabel(event.action)}
                              </p>

                              <p className="mt-1 text-xs text-base-content/60">
                                {event.from_status && event.to_status && (
                                  <>
                                    {formatActionLabel(event.from_status)}
                                    {" → "}
                                    {formatActionLabel(event.to_status)}
                                    {" • "}
                                  </>
                                )}

                                {formatDate(event.created_at)}
                              </p>

                              {event.note && (
                                <p className="mt-2 text-sm text-base-content/70">
                                  {event.note}
                                </p>
                              )}
                            </div>

                            {href && (
                              <span className="text-xs font-semibold text-purple-700">
                                Open →
                              </span>
                            )}
                          </div>
                        );

                        return href ? (
                          <Link
                            key={event.id}
                            href={href}
                            className="block rounded-xl transition hover:bg-purple-50"
                          >
                            {row}
                          </Link>
                        ) : (
                          <div key={event.id}>{row}</div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}
      </section>

      {isReviewMode && (
        <section
          className="
      rounded-[1.5rem]
      border
      border-yellow-200
      bg-yellow-50
      p-4
      shadow-sm
      sm:p-5
    "
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-yellow-950">
                Review queue shortcuts
              </h2>

              <p className="mt-1 text-sm text-yellow-950/65">
                Jump directly to packages that need a workflow action.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab(TABS.drafts);
                  setStatusFilter("in_review");
                }}
                className={`
                  cursor-pointer
                  rounded-full
                  border
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  transition
                  ${
                    isDraftTab && statusFilter === "in_review"
                      ? "border-yellow-400 bg-yellow-200 text-yellow-950"
                      : "border-yellow-300 bg-white text-yellow-900 hover:bg-yellow-100"
                  }
                `}
              >
                Needs review ({draftSummary.needs_review || 0})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab(TABS.drafts);
                  setStatusFilter("approved");
                }}
                className={`
                    cursor-pointer
                    rounded-full
                    border
                    px-4
                    py-2
                    text-sm
                    font-semibold
                    transition
                    ${
                      isDraftTab && statusFilter === "approved"
                        ? "border-green-300 bg-green-100 text-green-800"
                        : "border-green-200 bg-white text-green-700 hover:bg-green-50"
                    }
                  `}
              >
                Approved ({draftSummary.by_status?.approved || 0})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab(TABS.drafts);
                  setStatusFilter("rejected");
                }}
                className={`
                  cursor-pointer
                  rounded-full
                  border
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  transition
                  ${
                    isDraftTab && statusFilter === "rejected"
                      ? "border-red-300 bg-red-100 text-red-800"
                      : "border-red-200 bg-white text-red-700 hover:bg-red-50"
                  }
                `}
                    >
                Returned ({draftSummary.returned_for_changes || 0})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab(TABS.drafts);
                  setStatusFilter("draft");
                }}
                className={`
                  cursor-pointer
                  rounded-full
                  border
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  transition
                  ${
                    isDraftTab && statusFilter === "draft"
                      ? "border-purple-300 bg-purple-100 text-purple-800"
                      : "border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
                  }
                `}
                    >
                Open revisions ({draftSummary.revisions_awaiting_review || 0})
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="
            inline-flex
            w-fit
            rounded-full
            border
            border-base-300
            bg-base-100
            p-1
          "
        >
          <button
            type="button"
            onClick={() => setActiveTab(TABS.drafts)}
            className={`
              cursor-pointer
              rounded-full
              px-5
              py-2
              text-sm
              font-semibold
              transition
              ${
                isDraftTab
                  ? "bg-primary text-white"
                  : "text-base-content/70 hover:bg-base-200"
              }
            `}
          >
            Drafts ({drafts.length})
          </button>

          {!isReviewMode && (
            <button
              type="button"
              onClick={() => setActiveTab(TABS.published)}
              className={`
                cursor-pointer
                rounded-full
                px-5
                py-2
                text-sm
                font-semibold
                transition
                ${
                  !isDraftTab
                    ? "bg-primary text-white"
                    : "text-base-content/70 hover:bg-base-200"
                }
              `}
            >
              Published ({published.length})
            </button>
          )}
        </div>

        <div
          className={`
              grid
              w-full
              gap-3
              sm:w-auto
              ${isReviewMode ? "sm:grid-cols-1" : "sm:grid-cols-2"}
            `}
        >
          {" "}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
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
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:w-auto
            "
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          {!isReviewMode && (
            <Link
              href="/admin/passage-bank/generate"
              className="
                  inline-flex
                  w-full
                  cursor-pointer
                  items-center
                  justify-center
                  rounded-full
                  bg-primary
                  px-5
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:opacity-90
                  sm:w-auto
                "
            >
              Generate Draft
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-base-300 bg-base-100 p-4">
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, subject, grade, TEKS, or format..."
            className="
                input
                input-bordered
                w-full
                rounded-2xl
                bg-white
                xl:col-span-2
              "
          />

          {isDraftTab ? (
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="
                  select
                  select-bordered
                  w-full
                  rounded-2xl
                  bg-white
                "
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          ) : (
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value)}
              className="
                select
                select-bordered
                w-full
                rounded-2xl
                bg-white
              "
            >
              <option value="all">All packages</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="superseded">Superseded</option>
              <option value="current">Current revisions</option>
            </select>
          )}

          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="
                select
                select-bordered
                w-full
                rounded-2xl
                bg-white
              "
          >
            <option value="all">All subjects</option>

            {subjectOptions.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
            className="
              select
              select-bordered
              w-full
              rounded-2xl
              bg-white
            "
          >
            <option value="all">All grades</option>

            {gradeOptions.map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>

          <select
            value={teksFilter}
            onChange={(event) => setTeksFilter(event.target.value)}
            className="
              select
              select-bordered
              w-full
              rounded-2xl
              bg-white
            "
          >
            <option value="all">All TEKS</option>

            {teksOptions.map((teks) => (
              <option key={teks} value={teks}>
                {teks}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="
              select
              select-bordered
              w-full
              rounded-2xl
              bg-white
            "
          >
            <option value="updated_desc">Recently updated</option>
            <option value="updated_asc">Oldest updated</option>
            <option value="title_asc">Title A–Z</option>
            <option value="grade_asc">Grade</option>
            <option value="teks_asc">TEKS</option>
          </select>
        </div>
      </div>

      {isDraftTab && filteredDrafts.length > 0 && (
        <section
          className="
            rounded-[1.5rem]
            border
            border-purple-200
            bg-purple-50
            px-4
            py-4
            shadow-sm
          "
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={allVisibleDraftsSelected}
                  onChange={toggleAllVisibleDrafts}
                  disabled={bulkAction !== ""}
                  className="
                    checkbox
                    checkbox-primary
                    checkbox-sm
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                />

                <span className="text-sm font-semibold text-purple-950">
                  Select all visible
                </span>
              </label>

              <span
                className="
                  rounded-full
                  border
                  border-purple-200
                  bg-white
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-purple-800
                "
              >
                {selectedDraftIds.length} selected
              </span>

              {selectedDraftIds.length > 0 && (
                <button
                  type="button"
                  onClick={clearDraftSelection}
                  disabled={bulkAction !== ""}
                  className="
                    cursor-pointer
                    text-sm
                    font-semibold
                    text-purple-700
                    underline-offset-4
                    hover:underline
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  Clear selection
                </button>
              )}
            </div>

            {selectedDraftIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
               <button
                  type="button"
                  onClick={handleBulkValidate}
                  disabled={
                    bulkAction !== "" ||
                    selectedValidatableDrafts.length === 0
                  }
                  className="
                    cursor-pointer
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
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {bulkAction === "validate"
                    ? "Validating…"
                    : `Validate (${selectedValidatableDrafts.length})`}
                </button>

               <button
                    type="button"
                    onClick={handleBulkArchive}
                    disabled={
                      bulkAction !== "" ||
                      selectedNonArchivedDrafts.length === 0
                    }
                    className="
                      cursor-pointer
                      rounded-full
                      border
                      border-gray-300
                      bg-white
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-gray-700
                      transition
                      hover:bg-gray-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {bulkAction === "archive"
                      ? "Archiving…"
                      : `Archive (${selectedNonArchivedDrafts.length})`}
                  </button>

              <button
                    type="button"
                    onClick={handleBulkRestore}
                    disabled={
                      bulkAction !== "" ||
                      selectedArchivedDrafts.length === 0
                    }
                    className="
                      cursor-pointer
                      rounded-full
                      border
                      border-green-200
                      bg-green-50
                      px-4
                      py-2
                      text-sm
                      font-semibold
                      text-green-700
                      transition
                      hover:bg-green-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                          >
                            {bulkAction === "restore"
                              ? "Restoring…"
                              : `Restore (${selectedArchivedDrafts.length})`}
                          </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

                {bulkMessage && (
            <div
              role="status"
              className={`
                rounded-2xl
                border
                px-5
                py-4
                text-sm
                ${
                  bulkMessage.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : bulkMessage.type === "warning"
                      ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                      : "border-red-200 bg-red-50 text-red-700"
                }
              `}
            >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">
              {bulkMessage.text}
            </p>

            <button
              type="button"
              onClick={() =>
                setBulkMessage(null)
              }
              className="
                cursor-pointer
                self-start
                text-xs
                font-semibold
                underline-offset-4
                hover:underline
                sm:self-auto
              "
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={clearFilters}
            className="
            cursor-pointer
            rounded-full
            border
            border-base-300
            bg-white
            px-4
            py-2
            text-sm
            font-semibold
            text-base-content/70
            transition
            hover:bg-base-200
        "
          >
            Clear filters
          </button>
        </div>
      )}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <p className="font-semibold">Could not load packages</p>

          <p className="mt-1 text-sm">{error}</p>
        </div>
      ) : loading ? (
        <PassageBankLoadingState message="Loading passage-bank packages…" />
      ) : items.length === 0 ? (
        isDraftTab ? (
          <EmptyState
            title={
              isReviewMode
                ? "No packages match this review queue"
                : drafts.length === 0
                  ? "No draft packages yet"
                  : "No drafts match these filters"
            }
            description={
              isReviewMode
                ? "Choose another review shortcut or change the filters to inspect a different workflow state."
                : drafts.length === 0
                  ? "Generate your first passage-bank draft to begin the review and publication workflow."
                  : "Try changing the search text or status filter."
            }
            action={
              !isReviewMode && drafts.length === 0 ? (
                <Link
                  href="/admin/passage-bank/generate"
                  className="
                    inline-flex
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-full
                    bg-primary
                    px-5
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    hover:opacity-90
                  "
                >
                  Generate draft
                </Link>
              ) : null
            }
          />
        ) : (
          <EmptyState
            title={
              published.length === 0
                ? "No published packages yet"
                : "No published packages match these filters"
            }
            description={
              published.length === 0
                ? "Published passage-bank packages will appear here after completing review and publication."
                : "Try changing the search text or published-status filter."
            }
          />
        )
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const itemId = item.id || item.passage_bank_id;

            const detailHref = isDraftTab
              ? `/admin/passage-bank/drafts/${itemId}`
              : `/admin/passage-bank/published/${itemId}`;

            const questionCount =
              item.question_count ?? item.summary?.question_count ?? 0;

            return (
              <article
                key={itemId}
                className={`
                  rounded-[1.5rem]
                  border
                  bg-white
                  p-5
                  shadow-sm
                  transition
                  hover:shadow-md
                  ${
                    isDraftTab && selectedDraftIds.includes(itemId)
                      ? "border-purple-400 ring-2 ring-purple-100"
                      : "border-base-300 hover:border-purple-200"
                  }
                `}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {isDraftTab && (
                    <label
                      className="
                        flex
                        shrink-0
                        cursor-pointer
                        items-center
                        gap-2
                        self-start
                      "
                    >
                      <input
                          type="checkbox"
                          checked={selectedDraftIds.includes(itemId)}
                          onChange={() =>
                            toggleDraftSelection(itemId)
                          }
                          disabled={bulkAction !== ""}
                          aria-label={`Select ${
                            item.title || "untitled draft"
                          }`}
                          className="
                            checkbox
                            checkbox-primary
                            checkbox-sm
                            disabled:cursor-not-allowed
                          "
                        />

                      <span className="sr-only">Select draft</span>
                    </label>
                  )}{" "}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-lg font-bold">
                        {item.title || "Untitled package"}
                      </h3>

                      {isDraftTab && (
                        <span
                          className={`
                            rounded-full
                            border
                            px-3
                            py-1
                            text-xs
                            font-semibold
                            ${getDraftStatusClasses(item.status)}
                        `}
                        >
                          {String(item.status || "draft").replaceAll("_", " ")}
                        </span>
                      )}

                      {!isDraftTab && (
                        <>
                          {item.revision_number != null && (
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-800">
                              Revision {item.revision_number}
                            </span>
                          )}

                          <span
                            className={`
                                rounded-full
                                border
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                ${
                                  item.is_active
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-gray-300 bg-gray-100 text-gray-700"
                                }
                                `}
                          >
                            {item.is_active ? "Active" : "Inactive"}
                          </span>

                          {item.superseded_at && (
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                              Superseded
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <p className="mt-3 break-words text-sm text-base-content/70">
                      {item.subject || "—"}
                      {" • "}
                      Grade {item.grade_level || "—"}
                      {" • "}
                      {item.teks_standard || "—"}
                      {" • "}
                      {item.passage_format || "—"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-base-content/60">
                      <span>
                        {questionCount} question
                        {questionCount === 1 ? "" : "s"}
                      </span>

                      {!isDraftTab && item.revision_number && (
                        <span>Version {item.revision_number}</span>
                      )}

                      <span>
                        Updated {formatDate(item.updated_at || item.created_at)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={detailHref}
                    className="
                    inline-flex
                    w-full
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
                    md:w-auto
                    "
                  >
                    Open package →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
