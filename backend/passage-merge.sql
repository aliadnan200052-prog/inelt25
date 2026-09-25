/* ═══════════════════════════════════════════════════════════════════════
   توحيد نسختين من قطعة واحدة
   ───────────────────────────────────────────────────────────────────────
   حين تظهر القطعة مرّتين لأن نصّها مخزَّن بصورتين مختلفتين، هذا يجعل
   أسئلتها كلها تشير إلى نصّ واحد فتعود قطعة واحدة.

   النصّ الفائز هو صاحب العدد الأكبر من الأسئلة، وعند التساوي الأطول.

   الشرط: النصّان يبدآن بالأربعين حرفاً نفسها، وأقصرهما لا يقلّ عن نصف
   أطولهما — كي لا تُدمج قطعتان مختلفتان تصادف أن بدايتهما واحدة. اقرأ
   الخطوة ١ وتأكّد بعينك قبل الخطوة ٢، وراجع
   backend/passage-compare.sql لترى أين يختلف النصّان بالضبط.

   هذه الخطوة تُعيد كتابة نصّ القطعة على أسئلة النسخة الخاسرة. خذ نسخة
   احتياطية من الجدول قبلها إن أردت التراجع — لا تراجع تلقائياً هنا.
   ═══════════════════════════════════════════════════════════════════════ */


-- ── الخطوة ١ ─ ماذا سيحدث (قراءة فقط) ────────────────────────────────
with p as (
  select btrim(regexp_replace(passage, '\s+', ' ', 'g')) as txt, count(*) as n
    from public.questions
   where section = 'Reading Comprehension'
     and coalesce(active, true)
     and passage is not null and btrim(passage) <> ''
   group by 1
), ranked as (
  select txt, n, left(txt, 40) as head,
         row_number() over (partition by left(txt, 40) order by n desc, length(txt) desc) as rk,
         count(*)    over (partition by left(txt, 40)) as variants,
         max(length(txt)) over (partition by left(txt, 40)) as longest
    from p
)
select case when rk = 1 then 'يبقى' else 'يُدمج فيه' end as الحال,
       n as الأسئلة, length(txt) as الطول, left(txt, 55) as النص
  from ranked
 where variants > 1
   and length(txt) >= longest * 0.5
 order by head, rk;


-- ── الخطوة ٢ ─ التوحيد ───────────────────────────────────────────────
-- with p as (
--   select btrim(regexp_replace(passage, '\s+', ' ', 'g')) as txt, count(*) as n
--     from public.questions
--    where section = 'Reading Comprehension'
--      and coalesce(active, true)
--      and passage is not null and btrim(passage) <> ''
--    group by 1
-- ), ranked as (
--   select txt, n, left(txt, 40) as head,
--          row_number() over (partition by left(txt, 40) order by n desc, length(txt) desc) as rk,
--          count(*)    over (partition by left(txt, 40)) as variants,
--          max(length(txt)) over (partition by left(txt, 40)) as longest
--     from p
-- ), winner as (
--   select head, txt from ranked where rk = 1 and variants > 1
-- ), loser as (
--   select head, txt from ranked where rk > 1 and variants > 1 and length(txt) >= longest * 0.5
-- )
-- update public.questions q
--    set passage = w.txt
--   from loser l
--   join winner w on w.head = l.head
--  where q.section = 'Reading Comprehension'
--    and q.passage is not null
--    and btrim(regexp_replace(q.passage, '\s+', ' ', 'g')) = l.txt;
