create or replace function public.update_passage_bank_draft_review_status(
  p_draft_package_id uuid,
  p_to_status text,
  p_action text,
  p_note text default null,
  p_performed_by uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.passage_bank_draft_packages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_draft public.passage_bank_draft_packages;
  v_from_status text;
  v_validation jsonb;
begin
  /*
   * Only the service role should call this RPC.
   */
  if auth.role() <> 'service_role' then
    raise exception 'Service role access required.';
  end if;

  if p_performed_by is null then
    raise exception 'performed_by is required.';
  end if;

  if p_to_status not in (
    'draft',
    'in_review',
    'approved',
    'rejected',
    'published',
    'archived'
  ) then
    raise exception 'Invalid destination status: %', p_to_status;
  end if;

  if p_action not in (
    'submitted_for_review',
    'approved',
    'rejected',
    'returned_to_draft',
    'archived',
    'restored'
  ) then
    raise exception 'Invalid review action: %', p_action;
  end if;

  /*
   * Lock the draft so concurrent review requests cannot race.
   */
  select *
  into v_draft
  from public.passage_bank_draft_packages
  where id = p_draft_package_id
  for update;

  if not found then
    raise exception 'Passage-bank draft was not found.';
  end if;

  v_from_status := v_draft.status;
  v_validation := coalesce(v_draft.validation_json, '{}'::jsonb);

  if v_from_status = 'published' then
    raise exception 'Published packages cannot change review status.';
  end if;

  if v_from_status = 'archived'
     and p_to_status <> 'draft' then
    raise exception 'Archived packages may only be restored to draft.';
  end if;

  if v_from_status = p_to_status then
    raise exception 'Draft is already in status %.', p_to_status;
  end if;

  /*
   * Enforce allowed workflow transitions.
   */
  if not (
    (v_from_status = 'draft'
      and p_to_status in ('in_review', 'archived'))

    or

    (v_from_status = 'in_review'
      and p_to_status in ('approved', 'rejected', 'draft', 'archived'))

    or

    (v_from_status = 'approved'
      and p_to_status in ('draft', 'archived'))

    or

    (v_from_status = 'rejected'
      and p_to_status in ('draft', 'archived'))

    or

    (v_from_status = 'archived'
      and p_to_status = 'draft')
  ) then
    raise exception
      'Invalid review transition from % to %.',
      v_from_status,
      p_to_status;
  end if;

  /*
   * A draft must have a fresh successful validation before it can enter
   * review or be approved.
   */
  if p_to_status in ('in_review', 'approved') then
    if coalesce((v_validation->>'success')::boolean, false) is not true then
      raise exception
        'Draft must pass structural validation before entering %.',
        p_to_status;
    end if;

    if coalesce((v_validation->>'stale')::boolean, false) is true then
      raise exception
        'Draft validation is stale. Revalidate before entering %.',
        p_to_status;
    end if;
  end if;

  /*
   * Prevent an action label from disagreeing with the requested state.
   */
  if
    (p_action = 'submitted_for_review' and p_to_status <> 'in_review')
    or
    (p_action = 'approved' and p_to_status <> 'approved')
    or
    (p_action = 'rejected' and p_to_status <> 'rejected')
    or
    (p_action = 'returned_to_draft' and p_to_status <> 'draft')
    or
    (p_action = 'archived' and p_to_status <> 'archived')
    or
    (p_action = 'restored' and p_to_status <> 'draft')
  then
    raise exception
      'Action % does not match destination status %.',
      p_action,
      p_to_status;
  end if;

  update public.passage_bank_draft_packages
  set
    status = p_to_status,

    updated_by = p_performed_by,

    reviewed_by = case
      when p_to_status in ('approved', 'rejected')
        then p_performed_by
      when p_to_status in ('draft', 'in_review')
        then null
      else reviewed_by
    end,

    reviewed_at = case
      when p_to_status in ('approved', 'rejected')
        then now()
      when p_to_status in ('draft', 'in_review')
        then null
      else reviewed_at
    end
  where id = p_draft_package_id
  returning *
  into v_draft;

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
    p_draft_package_id,
    v_draft.published_passage_bank_id,
    p_action,
    v_from_status,
    p_to_status,
    nullif(trim(p_note), ''),
    jsonb_build_object(
      'success',
      coalesce((v_validation->>'success')::boolean, false),
      'stale',
      coalesce((v_validation->>'stale')::boolean, false),
      'error_count',
      jsonb_array_length(
        coalesce(v_validation->'errors', '[]'::jsonb)
      ),
      'warning_count',
      jsonb_array_length(
        coalesce(v_validation->'warnings', '[]'::jsonb)
      ),
      'validated_at',
      v_validation->'validated_at',
      'validated_by',
      v_validation->'validated_by'
    ),
    coalesce(p_metadata, '{}'::jsonb),
    p_performed_by
  );

  return v_draft;
end;
$$;

revoke all
on function public.update_passage_bank_draft_review_status(
  uuid,
  text,
  text,
  text,
  uuid,
  jsonb
)
from public;

revoke all
on function public.update_passage_bank_draft_review_status(
  uuid,
  text,
  text,
  text,
  uuid,
  jsonb
)
from anon;

revoke all
on function public.update_passage_bank_draft_review_status(
  uuid,
  text,
  text,
  text,
  uuid,
  jsonb
)
from authenticated;

grant execute
on function public.update_passage_bank_draft_review_status(
  uuid,
  text,
  text,
  text,
  uuid,
  jsonb
)
to service_role;

-- select
--   n.nspname as schema_name,
--   p.proname as function_name,
--   pg_get_function_identity_arguments(p.oid)
--     as arguments,
--   p.prosecdef as security_definer
-- from pg_proc p
-- join pg_namespace n
--   on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname =
--     'update_passage_bank_draft_review_status';