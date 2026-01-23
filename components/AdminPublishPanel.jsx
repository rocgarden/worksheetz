"use client";

import { useEffect, useMemo, useState } from "react";
import AdminPublishSampleButton from "@/components/AdminPublishSampleButton";

export default function AdminPublishPanel() {
  const [worksheets, setWorksheets] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/worksheets/list");
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.error || "Failed to load worksheets");
        setWorksheets(data.worksheets || []);
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return worksheets;
    return worksheets.filter((w) => {
      return (
        (w.topic || "").toLowerCase().includes(q) ||
        (w.file_name || "").toLowerCase().includes(q) ||
        (w.type || "").toLowerCase().includes(q) ||
        (w.grade_level || "").toLowerCase().includes(q)
      );
    });
  }, [worksheets, query]);

  return (
    <div className="space-y-3 m-10">
      <input
        className="input input-bordered w-full"
        placeholder="Search by topic, file name, type, grade..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {loading ? (
        <p className="text-sm opacity-70">Loading worksheets…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm opacity-70">No worksheets found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => (
            <div
              key={w.id}
              className="border rounded-xl p-3 flex flex-col gap-2"
            >
              <div>
                <div className="font-semibold">{w.topic || w.file_name}</div>
                <div className="text-sm opacity-70">
                  {w.type} • {w.grade_level} • {w.file_name}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                <AdminPublishSampleButton
                  worksheetId={w.id}
                  title={w.topic || w.file_name}
                  subject={w.type || "worksheet"}
                  grade={w.grade_level || null}
                  isPublic={false}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
