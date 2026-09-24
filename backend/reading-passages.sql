/* ═══════════════════════════════════════════════════════════════════════
   القطع الخارجية — letting a student pick a reading passage by name
   ───────────────────────────────────────────────────────────────────────
   Run this in the Supabase dashboard → SQL Editor → New query → paste →
   Run. It is idempotent: running it again changes nothing, and running a
   newer copy of this file upgrades the functions in place.

   It adds ONE column and FOUR functions. It does not touch start_exam,
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


/* ── 2 ─ What counts as "the same passage" ────────────────────────────
   Questions are grouped by their passage text, because there is no
   passage table to point at. Keying on the raw text split a passage in
   two whenever the same text had been imported twice with a whitespace
   difference: one stray double space or a trailing newline and half the
   questions ended up under a second, nameless entry. The key is
   therefore taken from the text with runs of whitespace collapsed and
   the ends trimmed — exactly the difference those imports have, and
   nothing a reader would notice.

   Only the KEY is normalised. The passage a student reads is still the
   stored text, paragraph breaks and all. */
create or replace function public.passage_key(p_passage text)
returns text
language sql
immutable
set search_path = pg_temp
-- Collapse first, then trim: btrim with one argument strips spaces but
-- not newlines, so trimming first leaves a trailing newline that the
-- collapse then turns into a trailing space — and two texts that differ
-- only by that space keep two different keys, which is the whole bug.
as $$ select md5(btrim(regexp_replace(coalesce(p_passage, ''), '\s+', ' ', 'g'))) $$;


/* ── 3 ─ The list the student picks from ──────────────────────────────
   One entry per passage. Neither a question nor an answer leaves the
   server here — only the name, the number of questions, and a short
   preview of the passage. */
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
               'key',     public.passage_key(q.passage),
               'title',   nullif(btrim(coalesce(max(q.passage_title), '')), ''),
               'count',   count(*),
               'preview', left(btrim(regexp_replace(min(q.passage), '\s+', ' ', 'g')), 120)
             ) as p
        from public.questions q
       where q.section = 'Reading Comprehension'
         and coalesce(q.active, true)
         and q.passage is not null
         and btrim(q.passage) <> ''
       group by public.passage_key(q.passage)
    ) s;

  return v_out;
end;
$$;


/* ── 4 ─ Practising one chosen passage ────────────────────────────────
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

  /* Variants of one passage differ only in whitespace, so any of them
     reads the same. Take the longest, which is the one that kept its
     paragraph breaks. */
  select (array_agg(q.passage order by length(q.passage) desc))[1],
         nullif(btrim(coalesce(max(q.passage_title), '')), '')
    into v_passage, v_title
    from public.questions q
   where q.section = 'Reading Comprehension'
     and coalesce(q.active, true)
     and q.passage is not null
     and public.passage_key(q.passage) = p_key;

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
     and public.passage_key(q.passage) = p_key;

  return jsonb_build_object('passage', v_passage, 'title', v_title, 'questions', v_qs);
end;
$$;


/* ── 5 ─ Naming a passage (admin only) ────────────────────────────────
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
     and public.passage_key(passage) = p_key;

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    return jsonb_build_object('error', 'passage_not_found');
  end if;

  return jsonb_build_object('updated', v_rows);
end;
$$;


/* ── 6 ─ Who may call them ────────────────────────────────────────────
   Signed-in users only. A visitor who is not signed in (the anon role)
   cannot call any of the three. admin_set_passage_title is granted to
   authenticated as well, and refuses anyone but the admin from inside. */
revoke all on function public.passage_key(text)                    from public;
revoke all on function public.list_reading_passages()              from public;
revoke all on function public.start_passage_practice(text)         from public;
revoke all on function public.admin_set_passage_title(text, text)  from public;

grant execute on function public.passage_key(text)                   to authenticated;
grant execute on function public.list_reading_passages()             to authenticated;
grant execute on function public.start_passage_practice(text)        to authenticated;
grant execute on function public.admin_set_passage_title(text, text) to authenticated;
