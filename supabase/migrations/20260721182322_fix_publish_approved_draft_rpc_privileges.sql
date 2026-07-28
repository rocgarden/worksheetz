revoke execute
on function public.publish_approved_passage_bank_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from public;

revoke execute
on function public.publish_approved_passage_bank_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from anon;

revoke execute
on function public.publish_approved_passage_bank_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from authenticated;

grant execute
on function public.publish_approved_passage_bank_draft(
  uuid,
  uuid,
  text,
  jsonb
)
to service_role;