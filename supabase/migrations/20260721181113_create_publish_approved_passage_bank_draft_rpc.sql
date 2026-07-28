-- create or replace function public.publish_approved_passage_bank_draft(
--   p_draft_package_id uuid,
--   p_published_by uuid,
--   p_note text default null,
--   p_metadata jsonb default '{}'::jsonb
-- )
-- returns jsonb
-- language plpgsql
-- security definer
-- set search_path = public, auth
-- as $$
-- declare
--   v_draft public.passage_bank_draft_packages%rowtype;

--   v_draft_package jsonb;
--   v_passage jsonb;
--   v_questions jsonb;
--   v_publish_questions jsonb;

--   v_validation jsonb;
--   v_published jsonb;
--   v_published_passage_id uuid;
-- begin
--   /*
--    * ------------------------------------------------------------
--    * 1. Restrict access to the service role
--    * ------------------------------------------------------------
--    */

--   if auth.role() <> 'service_role' then
--     raise exception
--       using
--         errcode = '42501',
--         message = 'Service role access required.';
--   end if;

--   if p_published_by is null then
--     raise exception
--       using
--         errcode = '22023',
--         message = 'p_published_by is required.';
--   end if;

--   /*
--    * ------------------------------------------------------------
--    * 2. Lock and retrieve the approved draft
--    * ------------------------------------------------------------
--    */

--   select *
--   into v_draft
--   from public.passage_bank_draft_packages
--   where id = p_draft_package_id
--   for update;

--   if not found then
--     raise exception
--       using
--         errcode = 'P0002',
--         message = 'Passage-bank draft was not found.';
--   end if;

--   if v_draft.status <> 'approved' then
--     raise exception
--       using
--         errcode = '22023',
--         message = format(
--           'Only approved drafts can be published. Current status: %s.',
--           v_draft.status
--         );
--   end if;

--   if v_draft.published_passage_bank_id is not null then
--     raise exception
--       using
--         errcode = '23505',
--         message = 'This draft has already been published.';
--   end if;

--   /*
--    * ------------------------------------------------------------
--    * 3. Require a fresh successful validation snapshot
--    * ------------------------------------------------------------
--    */

--   v_validation :=
--     coalesce(
--       v_draft.validation_json,
--       '{}'::jsonb
--     );

--   if coalesce(
--     (v_validation ->> 'success')::boolean,
--     false
--   ) is not true then
--     raise exception
--       using
--         errcode = '22023',
--         message =
--           'Draft must pass structural validation before publishing.';
--   end if;

--   if coalesce(
--     (v_validation ->> 'stale')::boolean,
--     false
--   ) is true then
--     raise exception
--       using
--         errcode = '22023',
--         message =
--           'Draft validation is stale. Revalidate before publishing.';
--   end if;

--   /*
--    * ------------------------------------------------------------
--    * 4. Validate the stored draft package containers
--    * ------------------------------------------------------------
--    */

--   v_draft_package :=
--     v_draft.draft_json;

--   if v_draft_package is null
--      or jsonb_typeof(v_draft_package) <> 'object' then
--     raise exception
--       using
--         errcode = '22023',
--         message = 'Saved draft_json must be a JSON object.';
--   end if;

--   v_passage :=
--     v_draft_package -> 'passage';

--   v_questions :=
--     v_draft_package -> 'questions';

--   if v_passage is null
--      or jsonb_typeof(v_passage) <> 'object' then
--     raise exception
--       using
--         errcode = '22023',
--         message =
--           'Saved draft_json.passage must be a JSON object.';
--   end if;

--   if v_questions is null
--      or jsonb_typeof(v_questions) <> 'array' then
--     raise exception
--       using
--         errcode = '22023',
--         message =
--           'Saved draft_json.questions must be a JSON array.';
--   end if;

--   if jsonb_array_length(v_questions) = 0 then
--     raise exception
--       using
--         errcode = '22023',
--         message =
--           'Saved draft must contain at least one question.';
--   end if;

--   /*
--    * ------------------------------------------------------------
--    * 5. Build the controlled publish payload
--    * ------------------------------------------------------------
--    *
--    * Do not trust workflow fields stored inside draft_json.
--    * This wrapper supplies the final approval and activation values.
--    */

--   v_passage :=
--     v_passage ||
--     jsonb_build_object(
--       'subject',
--       v_draft.subject,

--       'grade_level',
--       v_draft.grade_level,

--       'teks_standard',
--       v_draft.teks_standard,

--       'passage_format',
--       v_draft.passage_format,

--       'content_focus_key',
--       v_draft.content_focus_key,

--       'title',
--       v_draft.title,

--       'is_active',
--       true
--     );

--   select coalesce(
--     jsonb_agg(
--       question_value ||
--       jsonb_build_object(
--         'review_status',
--         'approved',

--         'is_active',
--         true,

--         'created_by',
--         p_published_by,

--         'reviewed_by',
--         p_published_by,

--         'reviewed_at',
--         now()
--       )
--       order by question_ordinality
--     ),
--     '[]'::jsonb
--   )
--   into v_publish_questions
--   from jsonb_array_elements(v_questions)
--     with ordinality
--     as question_rows(
--       question_value,
--       question_ordinality
--     );

--   /*
--    * ------------------------------------------------------------
--    * 6. Publish passage and questions using the existing transaction
--    * ------------------------------------------------------------
--    */

--   v_published :=
--     public.publish_passage_question_bank_package(
--       v_passage,
--       v_publish_questions
--     );

--   v_published_passage_id :=
--     nullif(
--       v_published
--         -> 'passage'
--         ->> 'id',
--       ''
--     )::uuid;

--   if v_published_passage_id is null then
--     raise exception
--       using
--         errcode = 'P0001',
--         message =
--           'Publishing returned no passage_bank id.';
--   end if;

--   /*
--    * ------------------------------------------------------------
--    * 7. Mark the draft as published
--    * ------------------------------------------------------------
--    */

--   update public.passage_bank_draft_packages
--   set
--     status =
--       'published',

--     published_passage_bank_id =
--       v_published_passage_id,

--     published_at =
--       now(),

--     updated_by =
--       p_published_by,

--     reviewed_by =
--       coalesce(
--         reviewed_by,
--         p_published_by
--       ),

--     reviewed_at =
--       coalesce(
--         reviewed_at,
--         now()
--       )
--   where id =
--     p_draft_package_id
--   returning *
--   into v_draft;

--   /*
--    * ------------------------------------------------------------
--    * 8. Record the immutable publish event
--    * ------------------------------------------------------------
--    */

--   insert into public.passage_bank_review_events (
--     draft_package_id,
--     published_passage_bank_id,
--     action,
--     from_status,
--     to_status,
--     note,
--     validation_snapshot,
--     metadata,
--     performed_by
--   )
--   values (
--     p_draft_package_id,
--     v_published_passage_id,
--     'published',
--     'approved',
--     'published',
--     nullif(trim(p_note), ''),

--     jsonb_build_object(
--       'success',
--       coalesce(
--         (v_validation ->> 'success')::boolean,
--         false
--       ),

--       'stale',
--       coalesce(
--         (v_validation ->> 'stale')::boolean,
--         false
--       ),

--       'error_count',
--       jsonb_array_length(
--         coalesce(
--           v_validation -> 'errors',
--           '[]'::jsonb
--         )
--       ),

--       'warning_count',
--       jsonb_array_length(
--         coalesce(
--           v_validation -> 'warnings',
--           '[]'::jsonb
--         )
--       ),

--       'validated_at',
--       v_validation -> 'validated_at',

--       'validated_by',
--       v_validation -> 'validated_by'
--     ),

--     coalesce(
--       p_metadata,
--       '{}'::jsonb
--     ),

--     p_published_by
--   );

--   /*
--    * ------------------------------------------------------------
--    * 9. Return published package and workflow state
--    * ------------------------------------------------------------
--    */

--   return jsonb_build_object(
--     'draft',
--     to_jsonb(v_draft),

--     'passage',
--     v_published -> 'passage',

--     'questions',
--     v_published -> 'questions'
--   );
-- end;
-- $$;

revoke all
on function public.publish_approved_passage_bank_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from public;

revoke all
on function public.publish_approved_passage_bank_draft(
  uuid,
  uuid,
  text,
  jsonb
)
from anon;

revoke all
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