//app/Worksheet-Editor/[filename]/page.jsx
"use client";

import { useState, useEffect } from "react";
import WorksheetEditor from "@/components/WorksheetEditor";
import { useRouter } from "next/navigation";

export default function WorksheetEditorPage() {
  const [session, setSession] = useState(null);
  const [initialData, setInitialData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [saved, setSaved] = useState(false); // 🔒 gate rendering
  const [mounted, setMounted] = useState(false); // ensure client-only check
  const router = useRouter();
  const [pdfType, setPdfType] = useState(null);

  useEffect(() => {
    // 1️⃣ Wait for session to resolve
    //  const checkSession = async () => {
    //const { data } = await supabase.auth.getSession();
    //setSession(data.session);
    const dataStr = sessionStorage.getItem("worksheetDraft");
    const nameStr = sessionStorage.getItem("worksheetFileName");
    const type = sessionStorage.getItem("pdfType");
    console.log("session items:: ", dataStr, nameStr, type);
    if (!dataStr || !nameStr) {
      // 🚨 Invalid access — kick user out
      router.push("/");
      return;
    }

    try {
      const parsed = JSON.parse(dataStr);
      setInitialData(parsed);
      setPdfType(type);
      if (nameStr) setFileName(nameStr); // ✅ Restore fileName
    } catch (err) {
      console.error("❌ Failed to load worksheet:", err);
      router.push("/");
    }
    setMounted(true);
    // };
  }, [router]);

  // ✅ Hybrid: Clear unsaved session data on unload or visibility change
  useEffect(() => {
    const clearSessionIfUnsaved = () => {
      if (!saved) {
        sessionStorage.removeItem("worksheetDraft");
        sessionStorage.removeItem("worksheetFileName");
      }
    };

    const handleBeforeUnload = (e) => {
      if (!saved) {
        e.preventDefault();
        e.returnValue = ""; // Show confirmation dialog
        clearSessionIfUnsaved();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        clearSessionIfUnsaved();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [saved]);

  // 🔒 Block rendering during session check to prevent flicker
  if (!mounted || !initialData || !fileName) {
    return <p className="text-gray-500">Loading worksheet...</p>;
  }

  //if (!session) return null; // prevent flicker

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-black mb-4">
        Worksheet Editor Page
      </h1>
      <WorksheetEditor
        type={pdfType}
        fileName={fileName}
        initialData={initialData}
        onSaved={() => {
          // ✅ Mark as saved when child tells us it’s saved
          setSaved(true);
        }}
      />
    </div>
  );
}
