create or replace function public.set_passage_bank_active_state(
  p_passage_bank_id uuid,
  p_is_active boolean,
  p_performed_by uuid,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_passage public.passage_bank%rowtype;

  v_draft_package_id uuid;
  v_active_question_count integer;
  v_question_count integer;

  v_action text;
  v_now timestamptz := now();
begin
  /*
   * ------------------------------------------------------------
   * 1. Restrict execution
   * ------------------------------------------------------------
   */

  if auth.role() <> 'service_role' then
    raise exception
      using
        errcode = '42501',
        message = 'Service role access required.';
  end if;

  if p_performed_by is null then
    raise exception
      using
        errcode = '22023',
        message = 'p_performed_by is required.';
  end if;

  if p_is_active is null then
    raise exception
      using
        errcode = '22023',
        message = 'p_is_active is required.';
  end if;

  /*
   * ------------------------------------------------------------
   * 2. Lock and retrieve the published package
   * ------------------------------------------------------------
   */

  select *
  into v_passage
  from public.passage_bank
  where id = p_passage_bank_id
  for update;

  if not found then
    raise exception
      using
        errcode = 'P0002',
        message = 'Published passage-bank package was not found.';
  end if;

  /*
   * ------------------------------------------------------------
   * 3. Prevent meaningless repeated requests
   * ------------------------------------------------------------
   */

  if v_passage.is_active is not distinct from p_is_active then
    raise exception
      using
        errcode = '22023',
        message = format(
          'Passage-bank package is already %s.',
          case
            when p_is_active then 'active'
            else 'inactive'
          end
        );
  end if;

  /*
   * ------------------------------------------------------------
   * 4. Reactivation rules
   * ------------------------------------------------------------
   *
   * Only the latest package in a revision family may be reactivated.
   *
   * A superseded historical version must remain inactive.
   */

  if p_is_active is true then
    if v_passage.superseded_at is not null then
      raise exception
        using
          errcode = '22023',
          message =
            'Superseded passage-bank revisions cannot be reactivated.';
    end if;

    if exists (
      select 1
      from public.passage_bank newer
      where newer.revision_root_id =
        v_passage.revision_root_id
        and newer.revision_number >
          v_passage.revision_number
    ) then
      raise exception
        using
          errcode = '22023',
          message =
            'Only the latest passage-bank revision can be reactivated.';
    end if;

    if exists (
      select 1
      from public.passage_bank sibling
      where sibling.revision_root_id =
        v_passage.revision_root_id
        and sibling.id <> v_passage.id
        and sibling.is_active is true
    ) then
      raise exception
        using
          errcode = '23505',
          message =
            'Another revision in this passage-bank family is already active.';
    end if;
  end if;

  /*
   * ------------------------------------------------------------
   * 5. Locate the originating draft when one exists
   * ------------------------------------------------------------
   */

  select draft.id
  into v_draft_package_id
  from public.passage_bank_draft_packages draft
  where draft.published_passage_bank_id =
    v_passage.id
  limit 1;

  /*
   * ------------------------------------------------------------
   * 6. Update passage and connected questions
   * ------------------------------------------------------------
   */

  update public.passage_bank
  set
    is_active =
      p_is_active,

    updated_at =
      v_now
  where id =
    v_passage.id;

  update public.passage_question_bank
  set
    is_active =
      p_is_active,

    updated_at =
      v_now
  where passage_bank_id =
    v_passage.id;

  /*
   * ------------------------------------------------------------
   * 7. Count resulting question state
   * ------------------------------------------------------------
   */

  select
    count(*)::integer,

    count(*) filter (
      where question.is_active is true
    )::integer
  into
    v_question_count,
    v_active_question_count
  from public.passage_question_bank question
  where question.passage_bank_id =
    v_passage.id;

  /*
   * ------------------------------------------------------------
   * 8. Record immutable audit event
   * ------------------------------------------------------------
   */

  v_action :=
    case
      when p_is_active then
        'reactivated'
      else
        'deactivated'
    end;

  insert into public.passage_bank_review_events (
    draft_package_id,
    published_passage_bank_id,
    action,
    from_status,
    to_status,
    note,
    validation_snapshot,
    metadata,
    performed_by
  )
  values (
    v_draft_package_id,
    v_passage.id,
    v_action,
    null,
    null,
    nullif(trim(p_note), ''),

    jsonb_build_object(
      'previous_is_active',
      v_passage.is_active,

      'new_is_active',
      p_is_active,

      'question_count',
      v_question_count,

      'active_question_count',
      v_active_question_count
    ),

    coalesce(
      p_metadata,
      '{}'::jsonb
    ) ||
    jsonb_build_object(
      'revision_root_id',
      v_passage.revision_root_id,

      'revision_number',
      v_passage.revision_number
    ),

    p_performed_by
  );

  /*
   * ------------------------------------------------------------
   * 9. Return updated package state
   * ------------------------------------------------------------
   */

  return jsonb_build_object(
    'passage',
    (
      select to_jsonb(updated_passage)
      from public.passage_bank updated_passage
      where updated_passage.id =
        v_passage.id
    ),

    'draft_package_id',
    v_draft_package_id,

    'question_count',
    v_question_count,

    'active_question_count',
    v_active_question_count,

    'action',
    v_action
  );
end;
$$;

revoke execute
on function public.set_passage_bank_active_state(
  uuid,
  boolean,
  uuid,
  text,
  jsonb
)
from public;

revoke execute
on function public.set_passage_bank_active_state(
  uuid,
  boolean,
  uuid,
  text,
  jsonb
)
from anon;

revoke execute
on function public.set_passage_bank_active_state(
  uuid,
  boolean,
  uuid,
  text,
  jsonb
)
from authenticated;

grant execute
on function public.set_passage_bank_active_state(
  uuid,
  boolean,
  uuid,
  text,
  jsonb
)
to service_role;