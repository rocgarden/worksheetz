// components/DownloadAssetButton.jsx
"use client";

import { useState } from "react";

export default function DownloadAssetButton({
  assetId,
  label = "Download PDF",
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assets/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Download failed");
      }

      // ✅ Navigate to the signed URL to trigger download
      window.location.href = data.url;
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="btn btn-sm btn-primary rounded-full"
      onClick={handleDownload}
      disabled={loading}
    >
      {loading ? "Preparing..." : label}
    </button>
  );
}
