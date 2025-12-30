// components/ProfileCard.js
export default function ProfileCard({ profile, planInfo }) {
  const displayName = profile.billing_name || profile.name || "—";
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-2">👤 Profile</h2>
      <p>
        <strong>Name:</strong> {displayName}
      </p>
      <p>
        <strong>Email:</strong> {profile.email}
      </p>
      <p>{/* <strong>Plan:</strong> {profile.plan || "Free"} */}</p>
      <p>
        <strong>Access:</strong> {profile.has_access ? "✅ Yes" : "❌ No"}
      </p>
      <p>
        <strong>Plan:</strong> {planInfo}
      </p>
      <p>
        <strong>Joined:</strong>{" "}
        {new Date(profile.created_at).toLocaleDateString()}
      </p>
      {profile.cancel_at_period_end && profile.current_period_end && (
        <p className="text-yellow-600 text-sm mt-2">
          ⚠️ Your subscription will end on{" "}
          {new Date(profile.current_period_end).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          .
        </p>
      )}
      {profile.payment_failed && (
        <p className="text-yellow-600 text-sm mt-2">
          ⚠️ Payment failed. Please update your card in your billing portal.
        </p>
      )}
    </div>
  );
}
