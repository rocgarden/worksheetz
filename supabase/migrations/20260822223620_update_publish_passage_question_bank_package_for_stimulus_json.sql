/*
 * ============================================================
 * Update passage-bank atomic publish RPC
 *
 * Adds support for passage_bank.stimulus_json.
 *
 * NOTE:
 * public.passage_bank.stimulus_json must already exist.
 * ============================================================
 */

create or replace function public.publish_passage_question_bank_package(
  p_passage jsonb,
  p_questions jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_passage public.passage_bank%rowtype;

  v_question jsonb;
  v_question_json jsonb;

  v_question_teks text;
  v_row_teks text;
  v_json_teks text;

  v_inserted_question public.passage_question_bank%rowtype;
  v_inserted_questions jsonb := '[]'::jsonb;
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

  /*
   * ------------------------------------------------------------
   * 2. Validate RPC argument containers
   * ------------------------------------------------------------
   */

  if p_passage is null
     or jsonb_typeof(p_passage) <> 'object' then
    raise exception
      using
        errcode = '22023',
        message = 'p_passage must be a JSON object.';
  end if;

  if p_questions is null
     or jsonb_typeof(p_questions) <> 'array' then
    raise exception
      using
        errcode = '22023',
        message = 'p_questions must be a JSON array.';
  end if;

  if jsonb_array_length(p_questions) = 0 then
    raise exception
      using
        errcode = '22023',
        message = 'p_questions must contain at least one question.';
  end if;

  /*
   * ------------------------------------------------------------
   * 3. Insert the parent passage
   * ------------------------------------------------------------
   *
   * The canonical passage remains stored in passage.
   *
   * stimulus_json is optional structured presentation metadata
   * for diagrams, labels, captions, sidebars, tables, maps,
   * timelines, images, and other stimulus features.
   * ------------------------------------------------------------
   */

  insert into public.passage_bank (
    subject,
    grade_level,
    teks_standard,
    passage_format,
    content_focus_key,
    content_focus,
    title,
    passage,
    stimulus_json,
    skill_tags,
    difficulty_level,
    is_active
  )
  values (
    nullif(
      trim(p_passage ->> 'subject'),
      ''
    ),

    nullif(
      trim(p_passage ->> 'grade_level'),
      ''
    ),

    nullif(
      trim(p_passage ->> 'teks_standard'),
      ''
    ),

    coalesce(
      nullif(
        trim(p_passage ->> 'passage_format'),
        ''
      ),
      'prose'
    ),

    nullif(
      trim(p_passage ->> 'content_focus_key'),
      ''
    ),

    nullif(
      trim(p_passage ->> 'content_focus'),
      ''
    ),

    nullif(
      trim(p_passage ->> 'title'),
      ''
    ),

    nullif(
      p_passage ->> 'passage',
      ''
    ),

    case
      when p_passage ? 'stimulus_json'
           and jsonb_typeof(
             p_passage -> 'stimulus_json'
           ) = 'object'
        then p_passage -> 'stimulus_json'
      else null
    end,

    coalesce(
      array(
        select jsonb_array_elements_text(
          coalesce(
            p_passage -> 'skill_tags',
            '[]'::jsonb
          )
        )
      ),
      '{}'::text[]
    ),

    coalesce(
      (p_passage ->> 'difficulty_level')::integer,
      2
    ),

    coalesce(
      (p_passage ->> 'is_active')::boolean,
      true
    )
  )
  returning *
  into v_passage;

  /*
   * ------------------------------------------------------------
   * 4. Insert every connected question
   * ------------------------------------------------------------
   */

  for v_question in
    select value
    from jsonb_array_elements(p_questions)
  loop
    if jsonb_typeof(v_question) <> 'object' then
      raise exception
        using
          errcode = '22023',
          message =
            'Every p_questions entry must be a JSON object.';
    end if;

    v_question_json :=
      v_question -> 'question_json';

    if v_question_json is null
       or jsonb_typeof(v_question_json) <> 'object' then
      raise exception
        using
          errcode = '22023',
          message =
            'Every question must include question_json as a JSON object.';
    end if;

    /*
     * Preserve the question-level TEKS.
     *
     * The outer row is preferred when present.
     * The nested JSON value is accepted as a fallback
     * for legacy drafts.
     */

    v_row_teks :=
      nullif(
        trim(
          v_question ->> 'teks_standard'
        ),
        ''
      );

    v_json_teks :=
      nullif(
        trim(
          v_question_json
            ->> 'teks_standard'
        ),
        ''
      );

    /*
     * When both values exist, they must agree.
     */

    if v_row_teks is not null
       and v_json_teks is not null
       and v_row_teks <> v_json_teks then
      raise exception
        using
          errcode = '22023',
          message = format(
            'Question TEKS mismatch: row TEKS "%s" does not match question_json TEKS "%s".',
            v_row_teks,
            v_json_teks
          );
    end if;

    v_question_teks :=
      coalesce(
        v_row_teks,
        v_json_teks
      );

    if v_question_teks is null then
      raise exception
        using
          errcode = '22023',
          message =
            'Every question must include teks_standard.';
    end if;

    /*
     * Ensure the stored JSON always matches the row TEKS.
     */

    v_question_json :=
      jsonb_set(
        v_question_json,
        '{teks_standard}',
        to_jsonb(v_question_teks),
        true
      );

    insert into public.passage_question_bank (
      passage_bank_id,
      teks_standard,
      subject,
      grade_level,
      question_type,
      dok_level,
      skill_focus,
      assessment_move,
      dramatic_function,
      target_scene,
      correct_target_text,
      correct_target_key,
      question_json,
      review_status,
      is_active,
      times_used,
      created_by,
      reviewed_by,
      reviewed_at
    )
    values (
      v_passage.id,

      /*
       * Question-level TEKS may be the primary passage TEKS
       * or one of its approved supporting TEKS.
       */

      v_question_teks,

      /*
       * Subject and grade remain inherited from
       * the parent passage.
       */

      v_passage.subject,
      v_passage.grade_level,

      nullif(
        trim(
          v_question ->> 'question_type'
        ),
        ''
      ),

      (
        v_question ->> 'dok_level'
      )::integer,

      nullif(
        trim(
          v_question ->> 'skill_focus'
        ),
        ''
      ),

      nullif(
        trim(
          v_question ->> 'assessment_move'
        ),
        ''
      ),

      nullif(
        trim(
          v_question ->> 'dramatic_function'
        ),
        ''
      ),

      nullif(
        trim(
          v_question ->> 'target_scene'
        ),
        ''
      ),

      nullif(
        v_question ->> 'correct_target_text',
        ''
      ),

      nullif(
        trim(
          v_question ->> 'correct_target_key'
        ),
        ''
      ),

      v_question_json,

      coalesce(
        nullif(
          trim(
            v_question ->> 'review_status'
          ),
          ''
        ),
        'draft'
      ),

      coalesce(
        (
          v_question ->> 'is_active'
        )::boolean,
        false
      ),

      0,

      nullif(
        v_question ->> 'created_by',
        ''
      )::uuid,

      nullif(
        v_question ->> 'reviewed_by',
        ''
      )::uuid,

      nullif(
        v_question ->> 'reviewed_at',
        ''
      )::timestamptz
    )
    returning *
    into v_inserted_question;

    v_inserted_questions :=
      v_inserted_questions ||
      jsonb_build_array(
        to_jsonb(
          v_inserted_question
        )
      );
  end loop;

  /*
   * ------------------------------------------------------------
   * 5. Verify full publication
   * ------------------------------------------------------------
   */

  if jsonb_array_length(v_inserted_questions)
     <> jsonb_array_length(p_questions) then
    raise exception
      using
        errcode = 'P0001',
        message = format(
          'Publishing inserted %s of %s questions.',
          jsonb_array_length(v_inserted_questions),
          jsonb_array_length(p_questions)
        );
  end if;

  /*
   * ------------------------------------------------------------
   * 6. Return the complete saved package
   * ------------------------------------------------------------
   */

  return jsonb_build_object(
    'passage',
    to_jsonb(v_passage),

    'questions',
    v_inserted_questions
  );
end;
$function$;


/*
 * ============================================================
 * Preserve RPC permissions
 * ============================================================
 */

revoke all
on function public.publish_passage_question_bank_package(
  jsonb,
  jsonb
)
from public;

revoke all
on function public.publish_passage_question_bank_package(
  jsonb,
  jsonb
)
from anon;

revoke all
on function public.publish_passage_question_bank_package(
  jsonb,
  jsonb
)
from authenticated;

grant execute
on function public.publish_passage_question_bank_package(
  jsonb,
  jsonb
)
to service_role;