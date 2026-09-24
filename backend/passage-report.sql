/* ═══════════════════════════════════════════════════════════════════════
   تقرير القطع الخارجية — قراءة فقط
   ───────────────────────────────────────────────────────────────────────
   لا يعدّل ولا يحذف شيئاً. الصقه في محرّر SQL في Supabase واقرأ العمودين:

     أسئلة_مختلفة  أقلّ من  الأسئلة   →  أسئلة مكرّرة داخل القطعة نفسها.
                                         نظّفها بـ backend/passage-dedupe.sql

     نسخ_النص      أكبر من  ١         →  نصّ القطعة مخزَّن بأكثر من صورة
                                         (فراغ زائد أو سطر جديد في آخره).
                                         يُعالَج بإعادة تشغيل
                                         backend/reading-passages.sql
   ═══════════════════════════════════════════════════════════════════════ */
select
  coalesce(max(passage_title), '— بلا اسم —')                              as الاسم,
  count(*)                                                                 as الأسئلة,
  count(distinct btrim(regexp_replace(lower(question), '\s+', ' ', 'g')))  as أسئلة_مختلفة,
  count(distinct passage)                                                  as نسخ_النص,
  left(btrim(regexp_replace(min(passage), '\s+', ' ', 'g')), 60)           as النص
from public.questions
where section = 'Reading Comprehension'
  and coalesce(active, true)
  and passage is not null
  and btrim(passage) <> ''
group by btrim(regexp_replace(passage, '\s+', ' ', 'g'))
order by النص;
