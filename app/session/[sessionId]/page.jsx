// /app/(v2)/session/[sessionId]/page.jsx
// Branch: v2/student-success-platform
// Server component — unwraps sessionId from params, passes to SessionClient.
// Public page, no auth required (student-facing).

import SessionClient from "./SessionClient";

export default async function SessionPage({ params }) {
  const { sessionId } = await params;
  return <SessionClient sessionId={sessionId} />;
}