// /app/(v2)/classroom/[classroomId]/page.jsx
// Branch: v2/student-success-platform
//
// Server component — fetches classroom detail and student roster,
// renders ClassroomClient for all interactive (delete) behavior.

import { notFound } from "next/navigation";
import ClassroomClient from "./ClassroomClient";
import { createV2ServiceClient } from "@/libs/supabase/server-v2";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getClassroom(classroomId) {
  const supabase = await createV2ServiceClient();
  const { data, error } = await supabase
    .from("classrooms")
    .select("id, name, grade_level, subject, school_year, testing_window, created_at, updated_at")
    .eq("id", classroomId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("[classroom/[classroomId]/page] classroom fetch error:", error);
    return null;
  }
  return data;
}

async function getStudents(classroomId) {
  const supabase = await createV2ServiceClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_code, grade_level, created_at")
    .eq("classroom_id", classroomId)
    .is("deleted_at", null)
    .order("last_name", { ascending: true });

  if (error) {
    console.error("[classroom/[classroomId]/page] students fetch error:", error);
    return [];
  }
  return data ?? [];
}

async function getActiveSessions(classroomId) {
  const supabase = await createV2ServiceClient();
  const { data, error } = await supabase
    .from("adaptive_sessions")
    .select("id, student_id, join_code, teks_standard, expires_at")
    .eq("classroom_id", classroomId)
    .eq("status", "in_progress")
    .gt("expires_at", new Date().toISOString())

    // .is("deleted_at", null);

  if (error) {
    console.error("[classroom/page] active sessions fetch error:", error);
    return [];
  }
  return data ?? [];
}


export default async function ClassroomDetailPage({ params }) {
  const { classroomId, gradeLevel,  } = await params;
  const [classroom, students, active_sessions] = await Promise.all([
    getClassroom(classroomId),
    getStudents(classroomId),
    getActiveSessions(classroomId),
  ]);

  if (!classroom) {
    notFound();
  }

  return (
    <ClassroomClient
      classroom={classroom}
      initialStudents={students}
      classroomId={classroomId}
      gradeLevel={gradeLevel} 
      active_sessions={active_sessions}
    />
  );
}
