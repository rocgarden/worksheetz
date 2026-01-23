"use client";

import { useState } from "react";

export default function AdminPublishSampleButton({
  worksheetId,
  title,
  subject,
  grade,
  isPublic = false,
}) {
  const [loading, setLoading] = useState(false);

  const publish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/samples/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worksheetId, title, subject, grade, isPublic }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Publish failed");

      alert(`Published: ${data.asset.title}`);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-sm bg-blue-400/60 rounded"
      onClick={publish}
      disabled={loading}
    >
      {loading ? "Publishing..." : "Publish to Library"}
    </button>
  );
}
