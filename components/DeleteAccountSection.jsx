"use client";

// components/DeleteAccountSection.jsx
// Danger-zone card with a type-to-confirm modal for permanent account deletion.

import { useState } from "react";
import { createClient } from "@/libs/supabase/client";

export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canDelete = confirmText === "DELETE" && !loading;

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setConfirmText("");
    setError(null);
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-[2rem] border border-red-200 bg-white shadow-sm p-6">
        <p className="font-semibold text-red-700 mb-1">Delete account</p>
        <p className="text-sm text-base-content/70 mb-4">
          Permanently delete your Teks Portfolio account, your classrooms, your
          students, and all of their practice data. This can't be undone.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition"
        >
          Delete my account
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-red-700">Delete your account?</h2>

            <p className="mt-3 text-sm text-base-content/80">This permanently deletes:</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-base-content/80 space-y-1">
              <li>Your account and profile</li>
              <li>All classrooms and student rosters</li>
              <li>All student sessions, answers, skill gaps, and portfolios</li>
              <li>Your saved worksheets and usage history</li>
            </ul>
            <p className="mt-3 text-sm text-base-content/80">
              Any active subscription will be canceled right away.
            </p>

            <label htmlFor="confirm-delete" className="mt-5 block text-sm font-semibold">
              Type DELETE to confirm
            </label>
            <input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={loading}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            {error && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-base-content/70 hover:bg-base-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canDelete}
                className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}