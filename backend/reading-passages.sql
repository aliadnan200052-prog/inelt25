/* ═══════════════════════════════════════════════════════════════════════
   القطع الخارجية — letting a student pick a reading passage by name
   ───────────────────────────────────────────────────────────────────────
   Run this ONCE, in the Supabase dashboard → SQL Editor → New query →
   paste → Run. It is idempotent: running it again changes nothing.

   It adds ONE column and THREE functions. It does not touch start_exam,
   submit_exam, start_practice or any existing admin_* function, so the
   national exam and the other three practice sections behave exactly as
   they do today.

   Why it is needed: start_practice(p_section, p_count) chooses the
   passage itself and has no parameter for asking for a particular one,
   and the questions table has no name for a passage — nothing in the
   database says «قطعة الروبوت». Both of those are added here.
   ═══════════════════════════════════════════════════════════════════════ */


/* ── 1 ─ The Arabic name of a passage ─────────────────────────────────
   Questions that share the same passage text share its name, so the name
   is written to all of them at once (admin_set_passage_title, below). */
alter table public.questions
  add column if not exists passage_title text;


/* ── 2 ─ The list the student picks from ──────────────────────────────
   One entry per distinct passage. `key` is the md5 of the passage text:
   it needs no new table and stays the same for as long as the text does.
   Neither a question nor an answer leaves the server here — only the
   name, the number of questions, and a short preview of the passage. */
create or replace function public.list_reading_passages()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_out jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'unauthorized');
  end if;

  select coalesce(
           jsonb_agg(p order by (p->>'title') is null, p->>'title', p->>'preview'),
           '[]'::jsonb)
    into v_out
    from (
      select jsonb_build_object(
               'key',     md5(q.passage),
               'title',   nullif(btrim(coalesce(max(q.passage_title), '')), ''),
               'count',   count(*),
               'preview', left(regexp_replace(btrim(q.passage), '\s+', ' ', 'g'), 120)
             ) as p
        from public.questions q
       where q.section = 'Reading Comprehension'
         and coalesce(q.active, true)
         and q.passage is not null
         and btrim(q.passage) <> ''
       group by q.passage
    ) s;

  return v_out;
end;
$$;


/* ── 3 ─ Practising one chosen passage ────────────────────────────────
   Returns the same shape start_practice returns, plus the passage's
   name: the correct answer comes down with each question so the page can
   mark it the moment it is answered. Like start_practice this is NOT an
   exam attempt — it neither reads nor writes attempts_used.

   Questions come back ordered by id, i.e. in the order they were
   imported, because questions about a passage follow the text. */
create or replace function public.start_passage_practice(p_key text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
declare
  v_passage text;
  v_title   text;
  v_qs      jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object('error', 'unauthorized');
  end if;

  select q.passage, nullif(btrim(coalesce(max(q.passage_title), '')), '')
    into v_passage, v_title
    from public.questions q
   where q.section = 'Reading Comprehension'
     and coalesce(q.active, true)
     and q.passage is not null
     and md5(q.passage) = p_key
   group by q.passage
   limit 1;

  if v_passage is null then
    return jsonb_build_object('error', 'passage_not_found');
  end if;

  select coalesce(jsonb_agg(
           jsonb_build_object(
             'id',             q.id,
             'section',        q.section,
             'question',       q.question,
             'options',        q.options,
             'correct_answer', q.correct_answer
           ) order by q.id), '[]'::jsonb)
    into v_qs
    from public.questions q
   where q.section = 'Reading Comprehension'
     and coalesce(q.active, true)
     and q.passage = v_passage;

  return jsonb_build_object('passage', v_passage, 'title', v_title, 'questions', v_qs);
end;
$$;


/* ── 4 ─ Naming a passage (admin only) ────────────────────────────────
   The admin test is not written out again here. This calls
   admin_count_questions, which already answers {"error": …} to anyone who
   is not the admin, so "who is an admin" keeps exactly one definition in
   this database and changing it there changes it here too. */
create or replace function public.admin_set_passage_title(p_key text, p_title text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_gate jsonb;
  v_rows int;
begin
  v_gate := public.admin_count_questions()::jsonb;
  if v_gate is null or coalesce(v_gate->>'error', '') <> '' then
    return jsonb_build_object('error', 'forbidden');
  end if;

  update public.questions
     set passage_title = nullif(btrim(coalesce(p_title, '')), '')
   where section = 'Reading Comprehension'
     and passage is not null
     and md5(passage) = p_key;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return jsonb_build_object('error', 'passage_not_found');
  end if;

  return jsonb_build_object('updated', v_rows);
end;
$$;


/* ── 5 ─ Who may call them ────────────────────────────────────────────
   Signed-in users only. A visitor who is not signed in (the anon role)
   cannot call any of the three. admin_set_passage_title is granted to
   authenticated as well, and refuses anyone but the admin from inside. */
revoke all on function public.list_reading_passages()              from public;
revoke all on function public.start_passage_practice(text)         from public;
revoke all on function public.admin_set_passage_title(text, text)  from public;

grant execute on function public.list_reading_passages()             to authenticated;
grant execute on function public.start_passage_practice(text)        to authenticated;
grant execute on function public.admin_set_passage_title(text, text) to authenticated;
