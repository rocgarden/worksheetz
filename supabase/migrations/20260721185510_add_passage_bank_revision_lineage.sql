/*
 * ============================================================
 * 1. Add version lineage to published passage-bank packages
 * ============================================================
 */

alter table public.passage_bank
add column revision_root_id uuid null;

alter table public.passage_bank
add column revision_number integer not null default 1;

alter table public.passage_bank
add column replaces_passage_bank_id uuid null;

alter table public.passage_bank
add column superseded_at timestamptz null;


/*
 * Every existing package becomes the root of its own revision family.
 */
update public.passage_bank
set revision_root_id = id
where revision_root_id is null;


/*
 * The root must always identify an existing passage_bank row.
 */
alter table public.passage_bank
alter column revision_root_id set not null;

alter table public.passage_bank
add constraint passage_bank_revision_root_id_fkey
foreign key (revision_root_id)
references public.passage_bank(id)
on delete restrict;

alter table public.passage_bank
add constraint passage_bank_replaces_passage_bank_id_fkey
foreign key (replaces_passage_bank_id)
references public.passage_bank(id)
on delete restrict;


/*
 * Version numbers begin at 1.
 */
alter table public.passage_bank
add constraint passage_bank_revision_number_check
check (revision_number >= 1);


/*
 * A package cannot replace itself.
 */
alter table public.passage_bank
add constraint passage_bank_cannot_replace_self_check
check (
  replaces_passage_bank_id is null
  or replaces_passage_bank_id <> id
);


/*
 * Version 1 is the root version and replaces nothing.
 * Later versions must identify the package they replace.
 */
alter table public.passage_bank
add constraint passage_bank_revision_shape_check
check (
  (
    revision_number = 1
    and revision_root_id = id
    and replaces_passage_bank_id is null
  )
  or
  (
    revision_number > 1
    and replaces_passage_bank_id is not null
  )
);


/*
 * A passage may only have one package directly replacing it.
 */
create unique index passage_bank_unique_direct_replacement_idx
on public.passage_bank (
  replaces_passage_bank_id
)
where replaces_passage_bank_id is not null;


/*
 * Each revision family may contain only one row for a version number.
 */
create unique index passage_bank_revision_family_version_idx
on public.passage_bank (
  revision_root_id,
  revision_number
);


/*
 * Supports retrieving revision history in order.
 */
create index passage_bank_revision_history_idx
on public.passage_bank (
  revision_root_id,
  revision_number desc
);


/*
 * Supports finding the active version in a revision family.
 */
create index passage_bank_active_revision_idx
on public.passage_bank (
  revision_root_id,
  is_active
)
where is_active = true;


/*
 * ============================================================
 * 2. Add revision source fields to draft packages
 * ============================================================
 *
 * published_passage_bank_id remains the output created by the draft.
 *
 * revision_of_passage_bank_id identifies the published package being
 * revised.
 */

alter table public.passage_bank_draft_packages
add column revision_of_passage_bank_id uuid null;

alter table public.passage_bank_draft_packages
add column revision_root_id uuid null;

alter table public.passage_bank_draft_packages
add column revision_number integer null;


alter table public.passage_bank_draft_packages
add constraint passage_bank_draft_packages_revision_of_fkey
foreign key (revision_of_passage_bank_id)
references public.passage_bank(id)
on delete restrict;

alter table public.passage_bank_draft_packages
add constraint passage_bank_draft_packages_revision_root_fkey
foreign key (revision_root_id)
references public.passage_bank(id)
on delete restrict;


/*
 * A normal generated draft has all three revision fields null.
 *
 * A revision draft must contain:
 * - the package being revised
 * - the revision family root
 * - a target version number of at least 2
 */
alter table public.passage_bank_draft_packages
add constraint passage_bank_draft_packages_revision_shape_check
check (
  (
    revision_of_passage_bank_id is null
    and revision_root_id is null
    and revision_number is null
  )
  or
  (
    revision_of_passage_bank_id is not null
    and revision_root_id is not null
    and revision_number is not null
    and revision_number >= 2
  )
);


/*
 * A source package may have only one unfinished revision draft.
 *
 * After that draft is published, rejected, or archived, another
 * revision can be created later.
 */
create unique index passage_bank_draft_packages_open_revision_idx
on public.passage_bank_draft_packages (
  revision_of_passage_bank_id
)
where
  revision_of_passage_bank_id is not null
  and status in (
    'draft',
    'in_review',
    'approved'
  );


create index passage_bank_draft_packages_revision_history_idx
on public.passage_bank_draft_packages (
  revision_root_id,
  revision_number,
  created_at desc
)
where revision_root_id is not null;


/*
 * ============================================================
 * 3. Expand audit actions for revision workflow
 * ============================================================
 */

alter table public.passage_bank_review_events
drop constraint passage_bank_review_events_action_check;

alter table public.passage_bank_review_events
add constraint passage_bank_review_events_action_check
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
    'revision_created',
    'revision_published',
    'superseded',
    'archived',
    'restored',
    'deactivated',
    'reactivated'
  )
);