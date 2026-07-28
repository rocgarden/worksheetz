create table public.passage_bank_review_events (
  id uuid primary key default gen_random_uuid(),

  draft_package_id uuid not null
    references public.passage_bank_draft_packages(id)
    on delete restrict,

  published_passage_bank_id uuid null
    references public.passage_bank(id)
    on delete restrict,

  action text not null,

  from_status text null,
  to_status text null,

  note text null,

  validation_snapshot jsonb null,
  metadata jsonb not null default '{}'::jsonb,

  performed_by uuid not null
    references auth.users(id)
    on delete restrict,

  created_at timestamptz not null default now(),

  constraint passage_bank_review_events_action_check
    check (
      action in (
        'created',
        'edited',
        'validated',
        'submitted_for_review',
        'approved',
        'rejected',
        'returned_to_draft',
        'published',
        'archived',
        'restored',
        'deactivated',
        'reactivated'
      )
    ),

  constraint passage_bank_review_events_status_check
    check (
      (
        from_status is null
        or from_status in (
          'draft',
          'in_review',
          'approved',
          'rejected',
          'published',
          'archived'
        )
      )
      and
      (
        to_status is null
        or to_status in (
          'draft',
          'in_review',
          'approved',
          'rejected',
          'published',
          'archived'
        )
      )
    ),

  constraint passage_bank_review_events_status_change_check
    check (
      from_status is null
      or to_status is null
      or from_status <> to_status
    )
);

create index passage_bank_review_events_draft_created_idx
on public.passage_bank_review_events (
  draft_package_id,
  created_at desc
);

create index passage_bank_review_events_published_created_idx
on public.passage_bank_review_events (
  published_passage_bank_id,
  created_at desc
)
where published_passage_bank_id is not null;

create index passage_bank_review_events_actor_created_idx
on public.passage_bank_review_events (
  performed_by,
  created_at desc
);

create index passage_bank_review_events_action_created_idx
on public.passage_bank_review_events (
  action,
  created_at desc
);

alter table public.passage_bank_review_events
enable row level security;

create policy
  "passage_bank_review_events service role access"
on public.passage_bank_review_events
as permissive
for all
to service_role
using (true)
with check (true);