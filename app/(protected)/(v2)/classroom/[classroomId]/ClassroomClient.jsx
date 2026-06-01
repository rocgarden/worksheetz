// This is the client component for the classroom page. It handles all interactivity and state management for the classroom details view, including listing students, deleting students, and navigating to other pages.
//Branch: v2/student-success-platform
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RosterUpload from "./RosterUpload";
import ClassAssignPanel from "./ClassAssignPanel";

export default function ClassroomClient({ classroom, initialStudents, classroomId, gradeLevel, active_sessions }) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);

  const sessionByStudent = Object.fromEntries(
    (active_sessions ?? [])
    .filter((s) => !(s.status === "in_progress" && s.expires_at && new Date(s.expires_at) < now))
    .map((s) => [s.student_id, s]) 
  );

  async function handleDelete(studentId) {
    setDeletingId(studentId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/v2/students/${studentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to remove student.");
      } else {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }

    // Called by RosterUpload after a successful batch insert
  function handleRosterSuccess(newStudents) {
    setStudents((prev) => {
      // Merge new students, sort by last_name
      const merged = [...prev, ...newStudents];
      return merged.sort((a, b) => a.last_name.localeCompare(b.last_name));
    });
    // Keep panel open so teacher can see the result; they can close it manually
  }

  const windowBadge = {
    BOY: { label: "Beginning of Year", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    MOY: { label: "Middle of Year", color: "bg-amber-100 text-amber-800 border-amber-200", },
    EOY: { label: "End of Year", color: "bg-rose-100 text-rose-800 border-rose-200" },
  };
  
  const tw = classroom.testing_window
    ? windowBadge[classroom.testing_window]
    : null;

    console.log("ClassroomClient render", { classroom, initialStudents, active_sessions });
  return (
  <div
    className="min-h-screen"
    style={{
      background: "#f7f0ff",
      // background: "linear-gradient(to bottom, #f7f0ff 10%, #e9dbff 50%, #d5c4ff 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}
  >
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Syne:wght@700;800&display=swap');

      .card-hover {
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .card-hover:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
      }

      .btn-primary {
        background: #f5c518;
        color: #1a0f35;
        font-weight: 700;
        transition: background 0.15s, transform 0.1s;
      }
      .btn-primary:hover {
        background: #ffd93d;
        transform: translateY(-1px);
      }

      .btn-ghost {
        color: #6b5a99;
        border: 1px solid rgba(167,139,250,0.45);
        transition: background 0.15s, border-color 0.15s;
      }
      .btn-ghost:hover {
        background: rgba(167,139,250,0.15);
        border-color: rgba(167,139,250,0.6);
      }

      .btn-danger {
        color: #ef4444;
        border: 1px solid rgba(248,113,113,0.6);
      }
      .btn-danger:hover {
        background: rgba(248,113,113,0.12);
      }

      .row-hover:hover {
        background: rgba(139,92,246,0.12);
      }
    `}</style>

    {/* Top nav */}
    <header className="border-b border-[#d8cfff] bg-white/70 backdrop-blur-sm sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
        <Link
          href="/classroom"
          className="text-[#6b5a99] hover:text-[#2d1b69] transition-colors text-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All Classrooms
        </Link>
        <span className="text-[#b8a8e6]">/</span>
        <span className="text-[#2d1b69] text-sm truncate max-w-[200px]">{classroom.name}</span>
      </div>
    </header>

    <main className="max-w-6xl mx-auto px-6 py-10">

      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">

              {/* Grade tag */}
              <span
                className="tag rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide"
                style={{
                  background: "rgba(245,197,24,0.15)",
                  color: "#b38b00",
                  border: "1px solid rgba(245,197,24,0.3)",
                }}
              >
                Grade {classroom.grade_level}
              </span>
              {/* Subject tag */}
              <span
                className="tag rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide"
                style={{
                  background: "rgba(167,139,250,0.15)",
                  color: "#6b5a99",
                  border: "1px solid rgba(167,139,250,0.3)",
                }}
              >
                {classroom.subject}
              </span>

              {tw && (
                <span className={`tag rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide ${tw.color}`} style={{ border: `1px solid ${tw.border}` }}>
                  {tw.label}
                </span>
              )}
            </div>

            <h1
              className="mb-1"
              style={{
                color: "#2d1b69",
                fontFamily: "'Syne', sans-serif",
                fontSize: "2rem",
                fontWeight: 800,
                lineHeight: 1.1,
              }}
            >
              {classroom.name}
            </h1>

            <p className="text-sm" style={{ color: "#6b5a99" }}>
              {classroom.school_year} school year
            </p>
          </div>

         {/* Action buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowUpload((v) => !v)}
                className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                aria-expanded={showUpload}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {showUpload ? "Hide Upload" : "Upload Roster"}
              </button>
 
              <Link
                href={`/classroom/${classroomId}/students/new`}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Student
              </Link>
             
            </div>
          </div>

        {/* Stats strip */}
        <div className="mt-6 flex gap-4 flex-wrap">
          {[
            { label: "Students", value: students.length },
            { label: "Active Sessions", value: active_sessions.length ?? 0 },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="px-5 py-3 rounded-xl border"
              style={{
                borderColor: "#d8cfff",
                background: "rgba(255,255,255,0.6)",
              }}
            >
              <div
                className="text-2xl font-bold"
                style={{
                  color: "#2d1b69",
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {value}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#6b5a99" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
           <button className="btn-ghost inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
 onClick={() => setShowAssignPanel(true)}>Assign to Class</button>
                {showAssignPanel && (
                  <ClassAssignPanel
                    classroomId={classroomId}
                    gradeLevel={classroom.grade_level}
                    subject={classroom.subject} 
                    testingWindow={classroom.testing_window}
                    onDone={() => { setShowAssignPanel(false); router.refresh(); }}
                  />
                )}
        </div>
      </div>

      {/* Roster upload panel */}
        {showUpload && (
          <div className="mb-8">
            <RosterUpload
              classroomId={classroomId}
              onSuccess={handleRosterSuccess}
              onClose={() => setShowUpload(false)}
            />
          </div>
        )}

      {/* Error banner */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl border border-red-300 bg-red-100 text-red-700 text-sm flex items-center gap-3">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {errorMsg}
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-600 hover:text-red-800 transition-colors">
            ✕
          </button>
        </div>
      )}

      {/* Student table */}
      {students.length === 0 ? (
          <EmptyState classroomId={classroomId} onUploadClick={() => setShowUpload(true)} />
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            borderColor: "#d8cfff",
            background: "rgba(255,255,255,0.6)",
          }}
        >
          {/* Table header */}
          <div
            className="grid items-center px-6 py-3 border-b"
            style={{
              gridTemplateColumns: "80px 1fr 1fr 140px 260px",
              background: "rgba(45, 9, 154, 0.79)",
              borderColor: "#d8cfff",
            }}
          >
            {["ID", "First Name", "Last Name", "Join Code", ""].map((h) => (
              <div
                key={h}
                className="text-xs font-600 uppercase tracking-wider"
                style={{ color: "#d8cfff", textAlign: h === "Actions" ? "right" : "left" }}
              >
                {h}
              </div>
            ))}
          </div>

          {students.map((student, i) => (
            <StudentRow
              key={student.id}
              student={student}
              classroomId={classroomId}
              isLast={i === students.length - 1}
              confirmId={confirmId}
              deletingId={deletingId}
              onRequestConfirm={setConfirmId}
              onCancelConfirm={() => setConfirmId(null)}
              onConfirmDelete={handleDelete}
              sessionByStudent={sessionByStudent}
            />
          ))}
        </div>
      )}
    </main>
  </div>
);

}

function StudentRow({
  student,
  classroomId,
  isLast,
  confirmId,
  deletingId,
  onRequestConfirm,
  onCancelConfirm,
  onConfirmDelete,
  sessionByStudent,
}) {
  const isConfirming = confirmId === student.id;
  const isDeleting = deletingId === student.id;

  return (
    <div
      className={`row-hover transition-colors ${
        !isLast ? "border-b border-[#d8cfff]" : ""
      }`}
      style={{
        // lighter hover for light theme
        "--tw-row-hover": "rgba(139,92,246,0.12)",
      }}
    >



      {/* Normal row */}
      {!isConfirming && (
        <div
          className="grid items-center px-6 py-4"
          style={{ gridTemplateColumns: "80px 1fr 1fr 140px 260px" }}
        >
          <span
            className="text-xs font-700 tracking-wider"
            style={{
              color: "#ddb833",
              fontFamily: "'DM Sans', monospace",
              fontWeight: 700,
            }}
          >
            {student.student_code}
          </span>

          <span className="text-[#2d1b69] text-sm">{student.first_name}</span>
          <span className="text-[#2d1b69] text-sm">{student.last_name}</span>

            {sessionByStudent[student.id] ? (
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm tracking-widest" style={{ color: "#f5c518" }}>
                {sessionByStudent[student.id].join_code}
              </span>
              <CopyButton textToCopy={sessionByStudent[student.id].join_code} />
            </div>
          ) : (
            <span className="text-white/20 text-xs">—</span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 justify-end">
            <Link
              href={`/classroom/${classroomId}/assign?student_id=${student.id}`}
              className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Assign
            </Link>

            <Link
              href={`/classroom/${classroomId}/progress/${student.id}`}
              className="btn-ghost inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Progress
            </Link>

            <button
              onClick={() => onRequestConfirm(student.id)}
              className="btn-danger inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Confirm delete inline */}
      {isConfirming && (
        <div
          className="confirm-overlay flex items-center justify-between px-6 py-4"
          style={{ background: "rgba(248,113,113,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>

            <span className="text-sm text-[#2d1b69]">
              Remove{" "}
              <span className="font-600 text-[#2d1b69]">
                {student.first_name} {student.last_name}
              </span>
              ? Session history will be preserved.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button
              onClick={onCancelConfirm}
              disabled={isDeleting}
              className="btn-ghost px-4 py-1.5 rounded-lg text-xs font-600"
            >
              Cancel
            </button>

            <button
              onClick={() => onConfirmDelete(student.id)}
              disabled={isDeleting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-600 text-white transition-colors"
              style={{
                background: isDeleting ? "rgba(248,113,113,0.3)" : "#ef4444",
              }}
            >
              {isDeleting ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Removing…
                </>
              ) : (
                "Yes, Remove"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function EmptyState({ classroomId, onUploadClick }) {
  return (
    <div className="text-center py-20 px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3
        className="text-xl mb-2"
        style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#2d1b69" }}
      >
        No students yet
      </h3>
      <p className="text-sm mb-7 max-w-xs mx-auto" style={{ color: "#6b5a99" }}>
        Add students one at a time or upload your full roster from a CSV file.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onUploadClick}
          className="btn-ghost inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Roster
        </button>
        <Link
          href={`/classroom/${classroomId}/students/new`}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add First Student
        </Link>
      </div>
    </div>
  );
}

function CopyButton({ textToCopy, label = "Copy", copiedLabel = "Copied!" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = textToCopy;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
        copied
          ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
          : "bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200"
      }`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
