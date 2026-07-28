/*
 * Published-package actions such as deactivate/reactivate may apply
 * to legacy packages that were not created from a persisted draft.
 */

alter table public.passage_bank_review_events
alter column draft_package_id drop not null;


/*
 * Every audit event must still identify at least one target:
 *
 * - a draft package
 * - a published passage-bank package
 * - or both
 */

alter table public.passage_bank_review_events
add constraint passage_bank_review_events_target_check
check (
  draft_package_id is not null
  or published_passage_bank_id is not null
);

create index passage_bank_review_events_package_action_idx
on public.passage_bank_review_events (
  published_passage_bank_id,
  action,
  created_at desc
)
where published_passage_bank_id is not null;