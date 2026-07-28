-- Creates persistent storage for generated passage/question-bank draft packages.
--
-- A draft package contains:
-- - one passage draft
-- - all related question drafts
-- - the latest validation result
-- - generation metadata
--
-- Publishing still creates the final rows in:
-- - public.passage_bank
-- - public.passage_question_bank

create table public.passage_bank_draft_packages (
  id uuid not null default gen_random_uuid(),

  status text not null default 'draft'::text,

  subject text not null,
  grade_level text not null,
  teks_standard text not null,
  passage_format text not null default 'prose'::text,

  content_focus_key text null,
  title text null,

  draft_json jsonb not null,
  validation_json jsonb null,
  generation_json jsonb null,

  created_by uuid null,
  updated_by uuid null,
  reviewed_by uuid null,

  published_passage_bank_id uuid null,

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  reviewed_at timestamp with time zone null,
  published_at timestamp with time zone null,

  constraint passage_bank_draft_packages_pkey
    primary key (id),

  constraint passage_bank_draft_packages_status_check
    check (
      status = any (
        array[
          'draft'::text,
          'in_review'::text,
          'approved'::text,
          'rejected'::text,
          'published'::text,
          'archived'::text
        ]
      )
    ),

  constraint passage_bank_draft_packages_created_by_fkey
    foreign key (created_by)
    references auth.users (id)
    on delete set null,

  constraint passage_bank_draft_packages_updated_by_fkey
    foreign key (updated_by)
    references auth.users (id)
    on delete set null,

  constraint passage_bank_draft_packages_reviewed_by_fkey
    foreign key (reviewed_by)
    references auth.users (id)
    on delete set null,

  constraint passage_bank_draft_packages_published_passage_bank_id_fkey
    foreign key (published_passage_bank_id)
    references public.passage_bank (id)
    on delete set null,

  constraint passage_bank_draft_packages_published_state_check
    check (
      (
        status <> 'published'::text
      )
      or
      (
        published_passage_bank_id is not null
        and published_at is not null
      )
    ),

  constraint passage_bank_draft_packages_reviewed_state_check
    check (
      (
        status not in (
          'approved'::text,
          'rejected'::text
        )
      )
      or
      (
        reviewed_by is not null
        and reviewed_at is not null
      )
    )
) tablespace pg_default;

create index if not exists
  idx_passage_bank_draft_packages_status
on public.passage_bank_draft_packages
using btree (
  status,
  updated_at desc
)
tablespace pg_default;

create index if not exists
  idx_passage_bank_draft_packages_lookup
on public.passage_bank_draft_packages
using btree (
  subject,
  grade_level,
  teks_standard,
  passage_format,
  status
)
tablespace pg_default;

create index if not exists
  idx_passage_bank_draft_packages_created_by
on public.passage_bank_draft_packages
using btree (
  created_by,
  created_at desc
)
tablespace pg_default;

create unique index if not exists
  idx_passage_bank_draft_packages_published_passage
on public.passage_bank_draft_packages
using btree (
  published_passage_bank_id
)
tablespace pg_default
where published_passage_bank_id is not null;

create or replace function public.set_passage_bank_draft_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger
  set_passage_bank_draft_packages_updated_at
before update on public.passage_bank_draft_packages
for each row
execute function public.set_passage_bank_draft_updated_at();