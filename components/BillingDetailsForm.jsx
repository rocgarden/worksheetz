"use client";

import { useState } from "react";

export default function BillingDetailsForm({ profile }) {
  const [errors, setErrors] = useState({});

  const validate = (form) => {
    const newErrors = {};
    const name = form.get("billing_name")?.trim() || "";
    const address = form.get("billing_address")?.trim() || "";

    // Billing name: optional, but if provided must be 2+ words
    if (name && name.split(" ").length < 2) {
      newErrors.billing_name = "Please enter your full first and last name.";
    }

    // Billing address: optional, but must be reasonable
    if (address && address.length < 5) {
      newErrors.billing_address = "Billing address looks too short.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    const form = new FormData(e.target);

    if (!validate(form)) {
      e.preventDefault();
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h2 className="text-xl font-semibold">Billing Details</h2>

      <form
        action="/api/update-billing"
        method="POST"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <input
            type="text"
            name="billing_name"
            defaultValue={profile.billing_name || ""}
            placeholder="Full name for invoices"
            className="w-full border p-2 rounded"
          />
          {errors.billing_name && (
            <p className="text-red-600 text-sm mt-1">{errors.billing_name}</p>
          )}
        </div>

        <div>
          <input
            type="text"
            name="billing_address"
            defaultValue={profile.billing_address || ""}
            placeholder="Billing address (optional)"
            className="w-full border p-2 rounded"
          />
          {errors.billing_address && (
            <p className="text-red-600 text-sm mt-1">
              {errors.billing_address}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Billing Details
        </button>
      </form>
    </div>
  );
}
