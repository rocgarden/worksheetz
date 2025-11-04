// components/ProfileCard.js
export default function ProfileCard({ profile, planInfo }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold mb-2">👤 Profile</h2>
      <p>
        <strong>Name:</strong> {profile.name || "—"}
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
    </div>
  );
}
