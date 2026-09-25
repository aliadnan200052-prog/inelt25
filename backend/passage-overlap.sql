/* ═══════════════════════════════════════════════════════════════════════
   نسختان من قطعة: هل أسئلتهما نفسها أم مختلفة؟ — قراءة فقط
   ───────────────────────────────────────────────────────────────────────
   غيّر الكلمات في السطرين المعلَّمين إلى بداية القطعة، ثم شغّل.

   العمود «في_كم_نسخة» = ٢ يعني السؤال مكتوب مرّتين، واحدة مع كل نصّ —
   أي أنه مكرّر فعلاً وستذهب نسخته الزائدة مع passage-dedupe.sql
   والعمود = ١ يعني سؤال يخصّ نسخته وحدها، فلو وحّدت النصّين لاجتمع
   الاثنان في قطعة واحدة بأسئلة أكثر.
   ═══════════════════════════════════════════════════════════════════════ */

-- الخلاصة أولاً
select count(*) filter (where نسخ = 2) as أسئلة_مشتركة,
       count(*) filter (where نسخ = 1) as أسئلة_تخصّ_نسخة_واحدة,
       count(*)                        as مجموع_الأسئلة_المختلفة
  from (
    select btrim(regexp_replace(lower(question), '\s+', ' ', 'g')) as q,
           count(distinct btrim(regexp_replace(passage, '\s+', ' ', 'g'))) as نسخ
      from public.questions
     where section = 'Reading Comprehension'
       and coalesce(active, true)
       and passage ilike '%Obesity is a medical condition%'   -- ← غيّر هذه
     group by 1
  ) s;

-- ثم سؤالاً سؤالاً
select count(distinct btrim(regexp_replace(passage, '\s+', ' ', 'g'))) as في_كم_نسخة,
       count(*)                                                        as عدد_الصفوف,
       min(id)                                                         as أول_رقم,
       max(id)                                                         as آخر_رقم,
       left(min(question), 70)                                         as السؤال
  from public.questions
 where section = 'Reading Comprehension'
   and coalesce(active, true)
   and passage ilike '%Obesity is a medical condition%'       -- ← وهذه
 group by btrim(regexp_replace(lower(question), '\s+', ' ', 'g'))
 order by في_كم_نسخة desc, السؤال;
