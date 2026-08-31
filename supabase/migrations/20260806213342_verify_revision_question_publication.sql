/*
 * ============================================================
 * 1. Preserve compatibility with the existing publish RPC
 * ============================================================
 *
 * Existing normal publication inserts passage_bank rows without
 * explicitly supplying revision_root_id.
 *
 * For a new root package:
 *   revision_root_id = id
 *   revision_number = 1
 */

create or replace function public.set_passage_bank_revision_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.revision_root_id is null then
    new.revision_root_id := new.id;
  end if;

  if new.revision_number is null then
    new.revision_number := 1;
  end if;

  return new;
end;
$$;


drop trigger if exists
  passage_bank_set_revision_defaults
on public.passage_bank;


create trigger passage_bank_set_revision_defaults
before insert
on public.passage_bank
for each row
execute function public.set_passage_bank_revision_defaults();


/*
 * ============================================================
 * 2. Publish an approved revision draft atomically
 * ============================================================
 */

create or replace function public.publish_passage_bank_revision(
  p_draft_package_id uuid,
  p_published_by uuid,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_draft public.passage_bank_draft_packages%rowtype;
  v_source public.passage_bank%rowtype;

  v_draft_package jsonb;
  v_passage jsonb;
  v_questions jsonb;
  v_publish_questions jsonb;

  v_validation jsonb;
  v_published jsonb;

  v_new_passage_id uuid;
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

  if p_published_by is null then
    raise exception
      using
        errcode = '22023',
        message = 'p_published_by is required.';
  end if;

  /*
   * ------------------------------------------------------------
   * 2. Lock and validate the revision draft
   * ------------------------------------------------------------
   */

  select *
  into v_draft
  from public.passage_bank_draft_packages
  where id = p_draft_package_id
  for update;

  if not found then
    raise exception
      using
        errcode = 'P0002',
        message = 'Passage-bank revision draft was not found.';
  end if;

  if v_draft.status <> 'approved' then
    raise exception
      using
        errcode = '22023',
        message = format(
          'Only approved revision drafts can be published. Current status: %s.',
          v_draft.status
        );
  end if;

  if v_draft.revision_of_passage_bank_id is null
     or v_draft.revision_root_id is null
     or v_draft.revision_number is null then
    raise exception
      using
        errcode = '22023',
        message =
          'Draft is not configured as a passage-bank revision.';
  end if;

  if v_draft.revision_number < 2 then
    raise exception
      using
        errcode = '22023',
        message =
          'Revision draft number must be at least 2.';
  end if;

  if v_draft.published_passage_bank_id is not null then
    raise exception
      using
        errcode = '23505',
        message =
          'This revision draft has already been published.';
  end if;

  /*
   * ------------------------------------------------------------
   * 3. Require fresh successful validation
   * ------------------------------------------------------------
   */

  v_validation :=
    coalesce(
      v_draft.validation_json,
      '{}'::jsonb
    );

  if coalesce(
    (v_validation ->> 'success')::boolean,
    false
  ) is not true then
    raise exception
      using
        errcode = '22023',
        message =
          'Revision draft must pass structural validation before publishing.';
  end if;

  if coalesce(
    (v_validation ->> 'stale')::boolean,
    false
  ) is true then
    raise exception
      using
        errcode = '22023',
        message =
          'Revision draft validation is stale. Revalidate before publishing.';
  end if;

  /*
   * ------------------------------------------------------------
   * 4. Lock and validate the source version
   * ------------------------------------------------------------
   */

  select *
  into v_source
  from public.passage_bank
  where id =
    v_draft.revision_of_passage_bank_id
  for update;

  if not found then
    raise exception
      using
        errcode = 'P0002',
        message =
          'Source passage-bank revision was not found.';
  end if;

  if v_source.is_active is not true then
    raise exception
      using
        errcode = '22023',
        message =
          'The source passage-bank revision is no longer active.';
  end if;

  if v_source.revision_root_id <>
     v_draft.revision_root_id then
    raise exception
      using
        errcode = '22023',
        message =
          'Revision draft root does not match the source package.';
  end if;

  if v_draft.revision_number <>
     v_source.revision_number + 1 then
    raise exception
      using
        errcode = '22023',
        message = format(
          'Expected revision number %s, but draft contains revision number %s.',
          v_source.revision_number + 1,
          v_draft.revision_number
        );
  end if;

  if exists (
    select 1
    from public.passage_bank newer
    where newer.revision_root_id =
      v_source.revision_root_id
      and newer.revision_number >
        v_source.revision_number
  ) then
    raise exception
      using
        errcode = '23505',
        message =
          'A newer passage-bank revision already exists.';
  end if;

  /*
   * ------------------------------------------------------------
   * 5. Validate saved draft containers
   * ------------------------------------------------------------
   */

  v_draft_package :=
    v_draft.draft_json;

  if v_draft_package is null
     or jsonb_typeof(v_draft_package) <> 'object' then
    raise exception
      using
        errcode = '22023',
        message =
          'Saved revision draft_json must be a JSON object.';
  end if;

  v_passage :=
    v_draft_package -> 'passage';

  v_questions :=
    v_draft_package -> 'questions';

  if v_passage is null
     or jsonb_typeof(v_passage) <> 'object' then
    raise exception
      using
        errcode = '22023',
        message =
          'Saved revision draft_json.passage must be a JSON object.';
  end if;

  if v_questions is null
     or jsonb_typeof(v_questions) <> 'array' then
    raise exception
      using
        errcode = '22023',
        message =
          'Saved revision draft_json.questions must be a JSON array.';
  end if;

  if jsonb_array_length(v_questions) = 0 then
    raise exception
      using
        errcode = '22023',
        message =
          'Revision draft must contain at least one question.';
  end if;

  /*
   * ------------------------------------------------------------
   * 6. Build controlled publication payload
   * ------------------------------------------------------------
   */

  v_passage :=
    v_passage ||
    jsonb_build_object(
      'subject',
      v_draft.subject,

      'grade_level',
      v_draft.grade_level,

      'teks_standard',
      v_draft.teks_standard,

      'passage_format',
      v_draft.passage_format,

      'content_focus_key',
      v_draft.content_focus_key,

      'title',
      v_draft.title,

      'is_active',
      true
    );

  select coalesce(
    jsonb_agg(
      question_value ||
      jsonb_build_object(
        'review_status',
        'approved',

        'is_active',
        true,

        'created_by',
        p_published_by,

        'reviewed_by',
        p_published_by,

        'reviewed_at',
        v_now
      )
      order by question_ordinality
    ),
    '[]'::jsonb
  )
  into v_publish_questions
  from jsonb_array_elements(v_questions)
    with ordinality
    as question_rows(
      question_value,
      question_ordinality
    );

  /*
   * ------------------------------------------------------------
   * 7. Publish the new passage and questions
   * ------------------------------------------------------------
   *
   * The existing RPC performs the passage/question inserts.
   * The insert trigger initially makes the new passage a valid root.
   */

  v_published :=
    public.publish_passage_question_bank_package(
      v_passage,
      v_publish_questions
    );

  v_new_passage_id :=
    nullif(
      v_published
        -> 'passage'
        ->> 'id',
      ''
    )::uuid;

  if v_new_passage_id is null then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Revision publication returned no passage_bank id.';
  end if;

  if v_published -> 'questions' is null
   or jsonb_typeof(
     v_published -> 'questions'
   ) <> 'array' then
  raise exception
    using
      errcode = 'P0001',
      message =
        'Revision publication returned an invalid questions result.';
end if;

if jsonb_array_length(
     v_published -> 'questions'
   )
   <> jsonb_array_length(
     v_questions
   ) then
  raise exception
    using
      errcode = 'P0001',
      message = format(
        'Revision publication inserted %s of %s questions.',
        jsonb_array_length(
          v_published -> 'questions'
        ),
        jsonb_array_length(
          v_questions
        )
      );
end if;

  /*
   * ------------------------------------------------------------
   * 8. Assign the new version to the existing revision family
   * ------------------------------------------------------------
   */

  update public.passage_bank
  set
    revision_root_id =
      v_draft.revision_root_id,

    revision_number =
      v_draft.revision_number,

    replaces_passage_bank_id =
      v_source.id,

    superseded_at =
      null,

    is_active =
      true,

    updated_at =
      v_now
  where id =
    v_new_passage_id;

  /*
   * ------------------------------------------------------------
   * 9. Supersede the previous version
   * ------------------------------------------------------------
   */

  update public.passage_bank
  set
    is_active =
      false,

    superseded_at =
      v_now,

    updated_at =
      v_now
  where id =
    v_source.id;

  update public.passage_question_bank
  set
    is_active =
      false,

    updated_at =
      v_now
  where passage_bank_id =
    v_source.id;

  /*
   * ------------------------------------------------------------
   * 10. Mark the revision draft as published
   * ------------------------------------------------------------
   */

  update public.passage_bank_draft_packages
  set
    status =
      'published',

    published_passage_bank_id =
      v_new_passage_id,

    published_at =
      v_now,

    updated_by =
      p_published_by,

    updated_at =
      v_now
  where id =
    p_draft_package_id
  returning *
  into v_draft;

  /*
   * ------------------------------------------------------------
   * 11. Record revision publication audit event
   * ------------------------------------------------------------
   */

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
    v_draft.id,
    v_new_passage_id,
    'revision_published',
    'approved',
    'published',
    nullif(trim(p_note), ''),

    jsonb_build_object(
      'success',
      true,

      'stale',
      false,

      'error_count',
      jsonb_array_length(
        coalesce(
          v_validation -> 'errors',
          '[]'::jsonb
        )
      ),

      'warning_count',
      jsonb_array_length(
        coalesce(
          v_validation -> 'warnings',
          '[]'::jsonb
        )
      ),

      'validated_at',
      v_validation -> 'validated_at',

      'validated_by',
      v_validation -> 'validated_by'
    ),

    coalesce(
      p_metadata,
      '{}'::jsonb
    ) ||
    jsonb_build_object(
      'revision_root_id',
      v_draft.revision_root_id,

      'revision_number',
      v_draft.revision_number,

      'replaces_passage_bank_id',
      v_source.id
    ),

    p_published_by
  );

  /*
   * Record the source package supersession separately.
   */
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
    v_draft.id,
    v_source.id,
    'superseded',
    null,
    null,
    nullif(trim(p_note), ''),

    jsonb_build_object(
      'superseded_at',
      v_now
    ),

    jsonb_build_object(
      'revision_root_id',
      v_draft.revision_root_id,

      'superseded_revision_number',
      v_source.revision_number,

      'replacement_passage_bank_id',
      v_new_passage_id,

      'replacement_revision_number',
      v_draft.revision_number
    ),

    p_published_by
  );

  /*
   * ------------------------------------------------------------
   * 12. Return complete publication result
   * ------------------------------------------------------------
   */

  return jsonb_build_object(
    'draft',
    to_jsonb(v_draft),

    'source',
    jsonb_build_object(
      'passage_bank_id',
      v_source.id,

      'revision_root_id',
      v_source.revision_root_id,

      'revision_number',
      v_source.revision_number,

      'is_active',
      false,

      'superseded_at',
      v_now
    ),

    'passage',
    (
      select to_jsonb(new_passage)
      from public.passage_bank new_passage
      where new_passage.id =
        v_new_passage_id
    ),

    'questions',
    v_published -> 'questions'
  );
end;
$$;

revoke execute
on function public.publish_passage_bank_revision(
  uuid,
  uuid,
  text,
  jsonb
)
from public;

revoke execute
on function public.publish_passage_bank_revision(
  uuid,
  uuid,
  text,
  jsonb
)
from anon;

revoke execute
on function public.publish_passage_bank_revision(
  uuid,
  uuid,
  text,
  jsonb
)
from authenticated;

grant execute
on function public.publish_passage_bank_revision(
  uuid,
  uuid,
  text,
  jsonb
)
to service_role;

revoke all
on function public.publish_passage_bank_revision(
  uuid,
  uuid,
  text,
  jsonb
)
from public;

revoke all
on function public.publish_passage_bank_revision(
  uuid,
  uuid,
  text,
  jsonb
)
from anon;

revoke all
on function public.publish_passage_bank_revision(
  uuid,
  uuid,
  text,
  jsonb
)
from authenticated;

grant execute
on function public.publish_passage_bank_revision(
  uuid,
  uuid,
  text,
  jsonb
)
to service_role;