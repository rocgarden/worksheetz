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

export default function PassageBankManager() {
  const [activeTab, setActiveTab] = useState(TABS.drafts);

  const [drafts, setDrafts] = useState([]);
  const [published, setPublished] = useState([]);

  const [draftsLoading, setDraftsLoading] = useState(true);
  const [publishedLoading, setPublishedLoading] = useState(true);

  const [draftsError, setDraftsError] = useState("");
  const [publishedError, setPublishedError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");

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
    loadDrafts();
    loadPublished();
  }, [loadDrafts, loadPublished]);

  const filteredDrafts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return drafts.filter((draft) => {
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

      return matchesQuery && matchesStatus;
    });
  }, [drafts, query, statusFilter]);

  const filteredPublished = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return published.filter((item) => {
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

      return matchesQuery && matchesActive;
    });
  }, [published, query, activeFilter]);

  const isDraftTab = activeTab === TABS.drafts;

  const loading = isDraftTab ? draftsLoading : publishedLoading;

  const error = isDraftTab ? draftsError : publishedError;

  const items = isDraftTab ? filteredDrafts : filteredPublished;

  const handleRefresh = async () => {
    if (isDraftTab) {
      await loadDrafts();
      return;
    }

    await loadPublished();
  };

  const hasActiveFilters =
    Boolean(query.trim()) ||
    (isDraftTab ? statusFilter !== "all" : activeFilter !== "all");

  const clearFilters = () => {
    setQuery("");

    if (isDraftTab) {
      setStatusFilter("all");
    } else {
      setActiveFilter("all");
    }
  };

  return (
    <div className="space-y-6">
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
        </div>

        <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
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
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
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
      </div>

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
              drafts.length === 0
                ? "No draft packages yet"
                : "No drafts match these filters"
            }
            description={
              drafts.length === 0
                ? "Generate your first passage-bank draft to begin the review and publication workflow."
                : "Try changing the search text or status filter."
            }
            action={
              drafts.length === 0 ? (
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
                className="
                  rounded-[1.5rem]
                  border
                  border-base-300
                  bg-white
                  p-5
                  shadow-sm
                  transition
                  hover:border-purple-200
                  hover:shadow-md
                "
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
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
