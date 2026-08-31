create or replace function public.create_passage_bank_revision_draft(
  p_passage_bank_id uuid,
  p_created_by uuid,
  p_note text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_source public.passage_bank%rowtype;
  v_revision_root public.passage_bank%rowtype;
  v_draft public.passage_bank_draft_packages%rowtype;

  v_questions jsonb;
  v_draft_json jsonb;

  v_next_revision_number integer;
  v_question_count integer;
begin
  /*
   * ------------------------------------------------------------
   * 1. Restrict execution to the service role
   * ------------------------------------------------------------
   */

  if auth.role() <> 'service_role' then
    raise exception
      using
        errcode = '42501',
        message = 'Service role access required.';
  end if;

  if p_created_by is null then
    raise exception
      using
        errcode = '22023',
        message = 'p_created_by is required.';
  end if;

  /*
   * ------------------------------------------------------------
   * 2. Lock and retrieve the published source package
   * ------------------------------------------------------------
   */

  select *
  into v_source
  from public.passage_bank
  where id = p_passage_bank_id
  for update;

  if not found then
    raise exception
      using
        errcode = 'P0002',
        message = 'Published passage-bank package was not found.';
  end if;

  if v_source.is_active is not true then
    raise exception
      using
        errcode = '22023',
        message =
          'Only the active passage-bank revision can be revised.';
  end if;

  if v_source.revision_root_id is null
     or v_source.revision_number is null then
    raise exception
      using
        errcode = '22023',
        message =
          'Published package is missing revision lineage.';
  end if;

  /*
   * Lock the family root. This serializes version-number allocation
   * for the complete revision family.
   */
  select *
  into v_revision_root
  from public.passage_bank
  where id = v_source.revision_root_id
  for update;

  if not found then
    raise exception
      using
        errcode = 'P0002',
        message = 'Revision-family root was not found.';
  end if;

  /*
   * Ensure this source is still the latest published version.
   */
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
        errcode = '22023',
        message =
          'Only the latest passage-bank revision can be revised.';
  end if;

  /*
   * ------------------------------------------------------------
   * 3. Prevent duplicate open revision drafts
   * ------------------------------------------------------------
   */

  if exists (
    select 1
    from public.passage_bank_draft_packages existing
    where existing.revision_of_passage_bank_id =
      v_source.id
      and existing.status in (
        'draft',
        'in_review',
        'approved'
      )
  ) then
    raise exception
      using
        errcode = '23505',
        message =
          'An open revision draft already exists for this package.';
  end if;

  /*
   * ------------------------------------------------------------
   * 4. Allocate the next published version number
   * ------------------------------------------------------------
   */

  select
    coalesce(
      max(version.revision_number),
      0
    ) + 1
  into v_next_revision_number
  from public.passage_bank version
  where version.revision_root_id =
    v_source.revision_root_id;

  if v_next_revision_number <=
     v_source.revision_number then
    raise exception
      using
        errcode = 'P0001',
        message =
          'Could not allocate the next revision number.';
  end if;

  /*
   * ------------------------------------------------------------
   * 5. Copy connected questions into editable draft shape
   * ------------------------------------------------------------
   */

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
        'teks_standard',
        question.teks_standard,

        'question_type',
        question.question_type,

        'dok_level',
        question.dok_level,

        'skill_focus',
        question.skill_focus,

        'assessment_move',
        question.assessment_move,

        'dramatic_function',
        question.dramatic_function,

        'target_scene',
        question.target_scene,

        'correct_target_text',
        question.correct_target_text,

        'correct_target_key',
        question.correct_target_key,

        'question_json',
        jsonb_set(
            coalesce(
            question.question_json,
            '{}'::jsonb
            ),
            '{teks_standard}',
            to_jsonb(
            question.teks_standard
            ),
            true
        )
        )
        order by
          question.created_at,
          question.id
      ),
      '[]'::jsonb
    ),

    count(*)::integer
  into
    v_questions,
    v_question_count
  from public.passage_question_bank question
  where question.passage_bank_id =
    v_source.id;

  if v_question_count = 0 then
    raise exception
      using
        errcode = '22023',
        message =
          'Published package has no connected questions to revise.';
  end if;

  /*
   * ------------------------------------------------------------
   * 6. Build the editable draft package
   * ------------------------------------------------------------
   */

  v_draft_json :=
    jsonb_build_object(
      'passage',
      jsonb_build_object(
        'subject',
        v_source.subject,

        'grade_level',
        v_source.grade_level,

        'teks_standard',
        v_source.teks_standard,

        'passage_format',
        v_source.passage_format,

        'content_focus_key',
        v_source.content_focus_key,

        'content_focus',
        v_source.content_focus,

        'title',
        v_source.title,

        'passage',
        v_source.passage,

        'skill_tags',
        to_jsonb(
          coalesce(
            v_source.skill_tags,
            '{}'::text[]
          )
        ),

        'difficulty_level',
        v_source.difficulty_level
      ),

      'questions',
      v_questions
    );

  /*
   * ------------------------------------------------------------
   * 7. Insert the editable revision draft
   * ------------------------------------------------------------
   *
   * Validation is intentionally stale. Even though the content was copied
   * from an approved package, the revision must be validated through the
   * normal draft workflow before it can return to review.
   */

  insert into public.passage_bank_draft_packages (
    status,
    subject,
    grade_level,
    teks_standard,
    passage_format,
    content_focus_key,
    title,
    draft_json,
    validation_json,
    generation_json,
    created_by,
    updated_by,
    revision_of_passage_bank_id,
    revision_root_id,
    revision_number
  )
  values (
    'draft',
    v_source.subject,
    v_source.grade_level,
    v_source.teks_standard,
    v_source.passage_format,
    v_source.content_focus_key,
    v_source.title,
    v_draft_json,

    jsonb_build_object(
      'success',
      false,

      'stale',
      true,

      'errors',
      '[]'::jsonb,

      'warnings',
      '[]'::jsonb,

      'reason',
      'revision_draft_created',

      'source_passage_bank_id',
      v_source.id,

      'source_revision_number',
      v_source.revision_number
    ),

    jsonb_build_object(
      'mode',
      'revision',

      'source_passage_bank_id',
      v_source.id,

      'revision_root_id',
      v_source.revision_root_id,

      'source_revision_number',
      v_source.revision_number,

      'target_revision_number',
      v_next_revision_number,

      'created_at',
      now()
    ),

    p_created_by,
    p_created_by,
    v_source.id,
    v_source.revision_root_id,
    v_next_revision_number
  )
  returning *
  into v_draft;

  /*
   * ------------------------------------------------------------
   * 8. Record the immutable revision-created event
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
    v_source.id,
    'revision_created',
    null,
    'draft',
    nullif(trim(p_note), ''),

    jsonb_build_object(
      'success',
      false,

      'stale',
      true,

      'source_passage_bank_id',
      v_source.id,

      'source_revision_number',
      v_source.revision_number,

      'target_revision_number',
      v_next_revision_number
    ),

    coalesce(
      p_metadata,
      '{}'::jsonb
    ) ||
    jsonb_build_object(
      'revision_root_id',
      v_source.revision_root_id
    ),

    p_created_by
  );

  /*
   * ------------------------------------------------------------
   * 9. Return the new revision draft
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

      'title',
      v_source.title
    ),

    'target_revision_number',
    v_next_revision_number,

    'question_count',
    v_question_count
  );
end;
$$;

revoke execute
on function public.create_passage_bank_revision_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from public;

revoke execute
on function public.create_passage_bank_revision_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from anon;

revoke execute
on function public.create_passage_bank_revision_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from authenticated;

grant execute
on function public.create_passage_bank_revision_draft(
  uuid,
  uuid,
  text,
  jsonb
)
to service_role;

revoke all
on function public.create_passage_bank_revision_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from public;

revoke all
on function public.create_passage_bank_revision_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from anon;

revoke all
on function public.create_passage_bank_revision_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from authenticated;

grant execute
on function public.create_passage_bank_revision_draft(
  uuid,
  uuid,
  text,
  jsonb
)
to service_role;