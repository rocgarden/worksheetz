// /app/(protected)/(v2)/classroom/page.jsx
// Server component — fetches classrooms from v2 API and renders card grid.

import { createClient } from "@/libs/supabase/server";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { redirect } from "next/navigation";
import config from "@/config";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

// ── Helpers ──────────────────────────────────────────────────────────────────

function TestingWindowBadge({ window }) {
  if (!window) return null;

  const styles = {
    BOY: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    MOY: "bg-amber-100 text-amber-800 border border-amber-200",
    EOY: "bg-rose-100 text-rose-800 border border-rose-200",
  };

  const labels = {
    BOY: "Beginning of Year",
    MOY: "Middle of Year",
    EOY: "End of Year",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tracking-wide ${styles[window] ?? "bg-gray-100 text-gray-700"}`}
    >
      {labels[window] ?? window}
    </span>
  );
}

function SubjectIcon({ subject }) {
  const icons = {
    ELA: "📖",
    Math: "✏️",
    Science: "🔬",
    "Social Studies": "🌎",
  };
  return <span className="text-xl">{icons[subject] ?? "📚"}</span>;
}

function ClassroomCard({ classroom }) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Top accent bar — brand purple */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-700 to-purple-500" />

      <div className="p-6 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <SubjectIcon subject={classroom.subject} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-purple-700 transition-colors">
                {classroom.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Grade {classroom.grade_level} · {classroom.subject}
              </p>
            </div>
          </div>
          <TestingWindowBadge window={classroom.testing_window} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-purple-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>
              <strong className="font-semibold text-gray-800">
                {classroom.student_count ?? 0}
              </strong>{" "}
              {classroom.student_count === 1 ? "student" : "students"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg
              className="w-4 h-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{classroom.school_year}</span>
          </div>
        </div>

        {/* Spacer pushes button to bottom */}
        <div className="flex-1" />

        <Link
          href={`/classroom/${classroom.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-700 text-white text-sm font-medium hover:bg-purple-800 active:scale-[0.98] transition-all duration-150"
        >
          View Classroom
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Illustration placeholder */}
      <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-5">
        <svg
          className="w-10 h-10 text-purple-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        No classrooms yet
      </h3>
      <p className="text-sm text-gray-500 max-w-xs mb-6">
        Create your first classroom to start tracking student progress and
        running adaptive practice sessions.
      </p>
      <Link
        href="/classroom/new"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 text-gray-900 text-sm font-semibold hover:bg-yellow-300 active:scale-[0.98] transition-all duration-150 shadow-sm"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Your First Classroom
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ClassroomPage() {
 const supabase = await createClient();
 const serviceSupabase = await createV2ServiceClient();
  //const user = { id: "e1a3fef9-ae21-478a-bc7a-e41f8df3d5e0" }; // hardcoded user for testing — layout guards auth, so we know this is valid

  // Auth — layout already guards this, but double-check for safety
 const { data: { user }, error: authError } = await supabase.auth.getUser();

  if ( authError || !user) {
    redirect(config.auth.loginUrl);
  }

  // Fetch classrooms from v2 API using the internal base URL
  // Next.js server components can call their own API routes via absolute URL
// ── 2. Fetch classrooms directly from v2 Supabase ────────────────────────
  //const serviceSupabase = await createV2ServiceClient();
  
  const { data: classrooms, error: classroomsError } = await serviceSupabase
    .from("classrooms")
    .select(`
      id, name, grade_level, subject, 
      school_year, testing_window, 
      created_at, updated_at,
      students(count)
    `)
    .eq("teacher_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

    const normalizedClassrooms = (classrooms ?? []).map((c) => ({
    ...c,
      student_count: c.students?.[0]?.count ?? 0,  // ← unwrap array
    }));
    console.log("Fetched classrooms:", normalizedClassrooms);

  if (classroomsError) {
    console.error("[classroom/page] classrooms fetch error:", classroomsError);
  }

   // 3. Plan access check
  const { data: profile, error: profileError } = await serviceSupabase
    .from("profiles") 
    .select("classroom_plan, school_plan, max_classrooms")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
        redirect("/dashboard?message=profile-error"); // 
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Classrooms</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {normalizedClassrooms.length > 0
                ? `${normalizedClassrooms.length} ${normalizedClassrooms.length === 1 ? "classroom" : "classrooms"}`
                : "Manage your student rosters"}
            </p>
          </div>

          <Link
            href="/classroom/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400 text-gray-900 text-sm font-semibold hover:bg-yellow-300 active:scale-[0.98] transition-all duration-150 shadow-sm whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Classroom
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error banner */}
        {classroomsError && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
            <span>{classroomsError}</span>
          </div>
        )}

        {/* Classroom grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {normalizedClassrooms.length === 0 && !classroomsError ? (
            <EmptyState />
          ) : (
            normalizedClassrooms.map((classroom) => (
              <ClassroomCard key={classroom.id} classroom={classroom} />
            ))
          )}
        </div>

        {/* Back to dashboard link */}
        <div className="mt-10 pt-8 border-t border-gray-100">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-purple-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
