"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStudentClient({ classroomId }) {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    student_code: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setLoading(true);

    try {
      const body = {
        classroom_id: classroomId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      };

      if (form.student_code.trim()) {
        body.student_code = form.student_code.trim();
      }

      const res = await fetch("/api/v2/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to add student. Please try again.");
        return;
      }

      router.push(`/classroom/${classroomId}`);
    } catch (err) {
      setError("Something went wrong. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f3ff] flex items-center justify-center px-4 py-12">
      {/* Background accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-200 opacity-30 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-yellow-200 opacity-25 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
          {/* Header strip */}
          <div className="bg-[#4c1d95] px-8 py-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 text-purple-900"
                >
                  <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Add New Student
              </h1>
            </div>
            <p className="text-purple-300 text-sm pl-11">
              Student will be added to this classroom roster.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* First Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="first_name"
                className="block text-sm font-semibold text-purple-900"
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                autoFocus
                value={form.first_name}
                onChange={handleChange}
                placeholder="e.g. Maria"
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 placeholder-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="last_name"
                className="block text-sm font-semibold text-purple-900"
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                value={form.last_name}
                onChange={handleChange}
                placeholder="e.g. Garcia"
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 placeholder-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Student Code */}
            <div className="space-y-1.5">
              <label
                htmlFor="student_code"
                className="block text-sm font-semibold text-purple-900"
              >
                Student Code{" "}
                <span className="font-normal text-purple-400">(optional)</span>
              </label>
              <input
                id="student_code"
                name="student_code"
                type="text"
                value={form.student_code}
                onChange={handleChange}
                placeholder="Auto-generated if left blank"
                className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-900 placeholder-purple-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
              <p className="text-xs text-purple-400 pl-1">
                Used to identify students without exposing personal info.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/classroom/${classroomId}`)}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-yellow-400 text-purple-900 text-sm font-bold hover:bg-yellow-300 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Adding…
                  </>
                ) : (
                  "Add Student"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-purple-400 mt-4">
          No personal identifiers are stored beyond name and optional code.
        </p>
      </div>
    </div>
  );
}
