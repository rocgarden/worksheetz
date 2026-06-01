"use client";

// /app/(v2)/classroom/[classroomId]/RosterUpload.jsx
// Branch: v2/student-success-platform
//
// Client component — CSV roster upload with preview, row-level validation,
// and batch upload. No external CSV library; plain split-based parsing.
//
// Props:
//   classroomId  string  — passed from ClassroomClient
//   onSuccess    fn      — called with the array of newly created students
//   onClose      fn      — called when user dismisses the panel

import { useState, useRef } from "react";

// ── CSV Template ─────────────────────────────────────────────────────────────
const TEMPLATE_HEADERS = ["First Name", "Last Name", "Student Code (optional)"];
const TEMPLATE_EXAMPLE = [
  ["Maria", "Garcia", ""],
  ["James", "Thompson", ""],
  ["Aisha", "Okonkwo", ""],
];

function downloadTemplate() {
  const rows = [
    TEMPLATE_HEADERS.join(","),
    ...TEMPLATE_EXAMPLE.map((r) => r.join(",")),
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "roster-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const HEADER_ALIASES = {
  "first name": "first_name",
  "last name": "last_name",
  "student code": "student_code",
  "student code (optional)": "student_code",

  // Common roster / Google-style exports
  firstname: "first_name",
  "given name": "first_name",
  "student first name": "first_name",
  "first": "first_name",

  lastname: "last_name",
  surname: "last_name",
  "family name": "last_name",
  "student last name": "last_name",
  "last": "last_name",

  "student id": "student_code",
  "student identifier": "student_code",
  "student number": "student_code",
  "id": "student_code",
  "code": "student_code",

  // Google Classroom commonly exports/display columns like these
  "name": "full_name",
  "full name": "full_name",
  "student name": "full_name",
};

// ── CSV Parser ────────────────────────────────────────────────────────────────
// Handles quoted fields and trims whitespace. Returns { headers, rows }.
function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return { headers: [], rows: [] };

  function splitLine(line) {
    const fields = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        fields.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    fields.push(cur.trim());
    return fields;
  }

  const headers = splitLine(lines[0]).map((h) => {
  const normalized = h
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/_/g, " ");

  return HEADER_ALIASES[normalized] || normalized.replace(/\s+/g, "_");
  });

    const rows = lines.slice(1).map((line, i) => {
    const vals = splitLine(line);
    const obj = { _row: i + 2 }; // 1-based, +1 for header
    headers.forEach((h, hi) => {
      obj[h] = vals[hi] ?? "";
    });
    return obj;
  });

  return { headers, rows };
}

// ── Row Validator ─────────────────────────────────────────────────────────────
function validateRow(row) {
  const errors = [];
  const first_name = (row.first_name ?? "").trim();
  const last_name = (row.last_name ?? "").trim();

  if (!first_name) errors.push("First name is required.");
  else if (first_name.length > 50) errors.push("First name exceeds 50 characters.");

  if (!last_name) errors.push("Last name is required.");
  else if (last_name.length > 50) errors.push("Last name exceeds 50 characters.");

  return errors;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RosterUpload({ classroomId, onSuccess, onClose }) {
  const fileInputRef = useRef(null);

  const [parsedRows, setParsedRows] = useState([]); // { first_name, last_name, student_code, _row, _errors[] }
  const [fileName, setFileName] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null); // { created, students, failed? }
  const [globalError, setGlobalError] = useState(null);

  // ── File select / parse ──────────────────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setGlobalError("Please select a .csv file.");
      return;
    }

    setGlobalError(null);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const { headers, rows } = parseCSV(text);

      if (!headers.includes("first_name") || !headers.includes("last_name")) {
        setGlobalError(
          'CSV must have "first_name" and "last_name" columns. Download the template to get started.'
        );
        setParsedRows([]);
        return;
      }

      const validated = rows.map((row) => {
      let first_name = (row.first_name ?? "").trim();
  let last_name = (row.last_name ?? "").trim();

  // Google Classroom / Sheets often has one "Name" column
  const full_name = (row.full_name ?? "").trim();

  if ((!first_name || !last_name) && full_name) {
        const parts = full_name.split(/\s+/);
        first_name = first_name || parts[0] || "";
        last_name = last_name || parts.slice(1).join(" ") || "";
      }

      return {
        first_name,
        last_name,
        student_code: (row.student_code ?? "").trim() || null,
        _row: row._row,
        _errors: validateRow({ first_name, last_name }),
      };
    });

      setParsedRows(validated);
    };
    reader.readAsText(file);
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  async function handleUpload() {
    const valid = parsedRows.filter((r) => r._errors.length === 0);
    if (valid.length === 0) return;

    setUploading(true);
    setGlobalError(null);
    setResult(null);

    try {
      const res = await fetch("/api/v2/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroom_id: classroomId,
          students: valid.map(({ first_name, last_name, student_code }) => ({
            first_name,
            last_name,
            ...(student_code ? { student_code } : {}),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 207) {
        setGlobalError(data.error || "Upload failed. Please try again.");
        return;
      }

      setResult(data);

      if (data.created > 0 && onSuccess) {
        onSuccess(data.students);
      }
    } catch {
      setGlobalError("Network error. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  // ── Counts ───────────────────────────────────────────────────────────────
  const validCount = parsedRows.filter((r) => r._errors.length === 0).length;
  const errorCount = parsedRows.filter((r) => r._errors.length > 0).length;
  const hasPreview = parsedRows.length > 0;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: "#d8cfff",
        background: "rgba(255,255,255,0.85)",
        boxShadow: "0 4px 24px rgba(76,29,149,0.08)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "#d8cfff", background: "rgba(76,29,149,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(245,197,24,0.15)" }}
          >
            <svg className="w-4 h-4" style={{ color: "#b38b00" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "#2d1b69" }}>
              Upload Roster
            </h2>
            <p className="text-xs" style={{ color: "#6b5a99" }}>
                 CSV file — First Name, Last Name, Student Code (optional)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              color: "#6b5a99",
              border: "1px solid rgba(167,139,250,0.45)",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template
          </button>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-purple-100"
            style={{ color: "#6b5a99" }}
            aria-label="Close upload panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* Global error */}
        {globalError && (
          <div
            className="flex items-start gap-3 p-3 rounded-xl text-sm"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(248,113,113,0.3)", color: "#b91c1c" }}
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {globalError}
          </div>
        )}

        {/* Success result */}
        {result && (
          <div
            className="p-4 rounded-xl text-sm space-y-1"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            <p className="font-semibold" style={{ color: "#065f46" }}>
              ✓ {result.created} student{result.created !== 1 ? "s" : ""} added successfully.
            </p>
            {result.failed?.length > 0 && (
              <p style={{ color: "#92400e" }}>
                {result.failed.length} row{result.failed.length !== 1 ? "s" : ""} could not be imported:
              </p>
            )}
            {result.failed?.map((f) => (
              <p key={f.row} className="text-xs pl-2" style={{ color: "#b91c1c" }}>
                Row {f.row}: {f.reason}
              </p>
            ))}
          </div>
        )}

        {/* Drop zone / file input */}
        {!result && (
          <div
            className="relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
            style={{ borderColor: "#c4b5fd", background: "rgba(139,92,246,0.03)" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-8 h-8" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "#4c1d95" }}>
                {fileName ? fileName : "Click to select a CSV file"}
              </p>
              <p className="text-xs mt-1" style={{ color: "#6b5a99" }}>
                .csv files only
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Preview table */}
        {hasPreview && !result && (
          <div>
            {/* Summary bar */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 text-xs">
                <span
                  className="px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#065f46" }}
                >
                  {validCount} valid
                </span>
                {errorCount > 0 && (
                  <span
                    className="px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#b91c1c" }}
                  >
                    {errorCount} with errors
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setParsedRows([]);
                  setFileName(null);
                  setGlobalError(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-xs transition-colors"
                style={{ color: "#6b5a99" }}
              >
                Clear
              </button>
            </div>

            {/* Table */}
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#d8cfff" }}>
              {/* Table header */}
              <div
                className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-widest"
                style={{
                  gridTemplateColumns: "2rem 1fr 1fr 100px",
                  background: "rgba(45,27,105,0.85)",
                  color: "#d8cfff",
                }}
              >
                <span>#</span>
                <span>First Name</span>
                <span>Last Name</span>
                <span>Code</span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor: "#ede9fe" }}>
                {parsedRows.map((row) => {
                  const hasError = row._errors.length > 0;
                  return (
                    <div key={row._row}>
                      <div
                        className="grid items-center px-4 py-2.5 text-sm"
                        style={{
                          gridTemplateColumns: "2rem 1fr 1fr 100px",
                          background: hasError ? "rgba(239,68,68,0.05)" : "transparent",
                        }}
                      >
                        <span className="text-xs" style={{ color: hasError ? "#ef4444" : "#9ca3af" }}>
                          {row._row}
                        </span>
                        <span style={{ color: hasError ? "#b91c1c" : "#2d1b69" }}>
                          {row.first_name || <span className="italic" style={{ color: "#ef4444" }}>missing</span>}
                        </span>
                        <span style={{ color: hasError ? "#b91c1c" : "#2d1b69" }}>
                          {row.last_name || <span className="italic" style={{ color: "#ef4444" }}>missing</span>}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: row.student_code ? "#b38b00" : "#9ca3af" }}>
                          {row.student_code || <span className="italic font-normal">auto</span>}
                        </span>
                      </div>
                      {hasError && (
                        <div className="px-4 pb-2 text-xs" style={{ color: "#b91c1c" }}>
                          {row._errors.join(" ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upload button */}
            {validCount > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: uploading ? "rgba(245,197,24,0.5)" : "#f5c518",
                    color: "#1a0f35",
                    opacity: uploading ? 0.8 : 1,
                  }}
                >
                  {uploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Uploading…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Confirm Upload ({validCount} student{validCount !== 1 ? "s" : ""})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}