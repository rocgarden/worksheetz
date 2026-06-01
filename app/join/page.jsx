// /app/(v2)/join/page.jsx
// Branch: v2/student-success-platform
// Public page — no auth required. Students land here to enter their join code.
// This is a server component wrapper that renders the client form.

import JoinClient from "./JoinClient";

export const metadata = {
  title: "Join Practice Session — WorksheetzAI",
  description: "Enter your join code to start your adaptive practice session.",
};

export default function JoinPage() {
  return <JoinClient />;
}
