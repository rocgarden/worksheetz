// /app/(v2)/classroom/[classroomId]/students/new/page.jsx
import NewStudentClient from "./NewStudentClient";

export default async function NewStudentPage({ params }) {
  const { classroomId } = await params;
  return <NewStudentClient classroomId={classroomId} />;
}