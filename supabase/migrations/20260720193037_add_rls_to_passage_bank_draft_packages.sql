alter table public.passage_bank_draft_packages
enable row level security;

create policy
  "passage_bank_draft_packages service role access"
on public.passage_bank_draft_packages
as permissive
for all
to service_role
using (true)
with check (true);