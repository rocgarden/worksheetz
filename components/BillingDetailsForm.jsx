"use client";

import { useState } from "react";

export default function BillingDetailsForm({ profile }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <span className="text-lg font-semibold">Update Billing Details</span>
        <span className="text-gray-500">{open ? "▲" : "▼"}</span>
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="p-4 border-t space-y-4 bg-gray-50">
          <form
            action="/api/update-billing"
            method="POST"
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name for Invoices
              </label>
              <input
                type="text"
                name="billing_name"
                defaultValue={profile.billing_name || ""}
                placeholder="First and last name"
                className="w-full border p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Billing Address (optional)
              </label>
              <input
                type="text"
                name="billing_address"
                defaultValue={profile.billing_address || ""}
                placeholder="Address for invoices"
                className="w-full border p-2 rounded"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Save Billing Details
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
