create or replace function public.delete_teacher_account(p_teacher_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from question_attempts
  where student_id in (select id from students where teacher_id = p_teacher_id)
     or session_id in (select id from adaptive_sessions where teacher_id = p_teacher_id);

  delete from remediation_sessions
  where teacher_id = p_teacher_id
     or student_id in (select id from students where teacher_id = p_teacher_id);

  delete from skill_gaps
  where student_id in (select id from students where teacher_id = p_teacher_id);

  delete from portfolios
  where student_id in (select id from students where teacher_id = p_teacher_id)
     or classroom_id in (select id from classrooms where teacher_id = p_teacher_id);

  delete from adaptive_sessions
  where teacher_id = p_teacher_id
     or classroom_id in (select id from classrooms where teacher_id = p_teacher_id);

  delete from students
  where teacher_id = p_teacher_id
     or classroom_id in (select id from classrooms where teacher_id = p_teacher_id);

  delete from classrooms where teacher_id = p_teacher_id;

  delete from worksheets where user_id = p_teacher_id;
end;
$$;

-- Only the server (service role) can call this, never a browser client.
revoke all on function public.delete_teacher_account(uuid) from public, anon, authenticated;
grant execute on function public.delete_teacher_account(uuid) to service_role;