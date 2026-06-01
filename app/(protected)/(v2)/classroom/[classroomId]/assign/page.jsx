// /app/(v2)/classroom/[classroomId]/assign/page.jsx

import AssignClient from "./AssignClient";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssignPage({ params, searchParams }) {
  const { classroomId } = await params;
  const sp = await searchParams;
  const preSelectedStudentId = sp?.student_id ?? null;

  const supabase = await createV2ServiceClient();

  // Fetch classroom and students in parallel
  const [classroomResult, studentsResult] = await Promise.all([
    supabase
      .from("classrooms")
      .select("id, grade_level, subject, testing_window")
      .eq("id", classroomId)
      .is("deleted_at", null)
      .single(),

    supabase
      .from("students")
      .select("id, first_name, last_name, student_code, grade_level")
      .eq("classroom_id", classroomId)
      .is("deleted_at", null)
      .order("last_name", { ascending: true }),
  ]);

  if (classroomResult.error || !classroomResult.data) {
    notFound();
  }

  const classroom = classroomResult.data;
  const students = studentsResult.data ?? [];
  const fetchError = studentsResult.error
    ? "Failed to load students for this classroom."
    : null;

  return (
    <AssignClient
      classroomId={classroomId}
      students={students}
      fetchError={fetchError}
      preSelectedStudentId={preSelectedStudentId}
      gradeLevel={classroom.grade_level}
      testingWindow={classroom.testing_window}
      subject={classroom.subject}
    />
  );
}
