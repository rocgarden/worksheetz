// components/NoSubLibrarySection.jsx
"use client";

import { useEffect, useState } from "react";
import DownloadAssetButton from "./DownloadAssetButton";

export default function NoSubLibrarySection() {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/assets/list");
      const data = await res.json();
      if (!res.ok) {
        console.error("list failed:", data);
        return;
      }
      setAssets(data.assets || []);
    })();
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Download Pre-Generated Worksheets</h2>
      <p className="text-sm opacity-70">
        Logged-in users can download a limited number each month (no
        subscription).
      </p>

      <div className="grid gap-3">
        {assets.map((a) => (
          <div key={a.id} className="border rounded-xl p-4">
            <div className="font-semibold">{a.title}</div>
            <div className="text-sm opacity-70">
              {a.subject}
              {a.grade ? ` • Grade ${a.grade}` : ""}
            </div>

            <div className="mt-3">
              <DownloadAssetButton assetId={a.id} />
            </div>
          </div>
        ))}
      </div>
      {/* ✅ Upgrade CTA under the list */}
      {/* <div className="pt-2 border-t">
        <p className="text-sm opacity-70 mb-2">
          Need more downloads or want to generate your own worksheets?
        </p>
        <ButtonAccount text="Upgrade to Pro" />
      </div> */}
    </div>
  );
}
