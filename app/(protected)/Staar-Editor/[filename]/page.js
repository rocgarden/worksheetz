// app/(protected)/Staar-Editor/[filename]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Disclaimer from "@/components/Disclaimer";
import StaarWorksheetEditor from "@/components/StaarWorksheetEditor";

export default function StaarEditorPage() {
  const [initialData, setInitialData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const dataStr = sessionStorage.getItem("worksheetDraft");
    const nameStr = sessionStorage.getItem("worksheetFileName");
    const typeStr = sessionStorage.getItem("pdfType");

    // 🔒 Only allow STAAR editor to open if this is a STAAR draft
    if (!dataStr || !nameStr || typeStr !== "staarReading") {
      router.push("/dashboard");
      return;
    }

    try {
      const parsed = JSON.parse(dataStr);
      setInitialData(parsed);
      setFileName(nameStr);
      setMounted(true);
    } catch (e) {
      router.push("/dashboard");
    }
  }, [router]);

  if (!mounted || !initialData || !fileName) {
    return <p className="text-gray-500 p-6">Loading STAAR worksheet...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-black mb-4">STAAR Editor</h1>
      <Disclaimer variant="editor" />

      <StaarWorksheetEditor fileName={fileName} initialData={initialData} />
    </div>
  );
}

