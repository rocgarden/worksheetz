create or replace function public.increment_passage_question_usage(
  p_question_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.passage_question_bank
  set times_used = times_used + 1
  where id = p_question_id;
$$;

revoke all on function public.increment_passage_question_usage(uuid)
from public;

revoke all on function public.increment_passage_question_usage(uuid)
from anon;

revoke all on function public.increment_passage_question_usage(uuid)
from authenticated;

grant execute on function public.increment_passage_question_usage(uuid)
to service_role;