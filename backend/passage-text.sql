/* ═══════════════════════════════════════════════════════════════════════
   اقرأ نصّ القطعة كاملاً — قراءة فقط
   ───────────────────────────────────────────────────────────────────────
   غيّر الكلمات في السطر المعلَّم، ثم شغّل. يطبع كل نسخة من النصّ كاملةً مع
   طولها وعدد أسئلتها، لتقرأهما وتقرّر أيّهما الصحيح.
   ═══════════════════════════════════════════════════════════════════════ */
select count(*)               as الأسئلة,
       length(min(passage))   as الطول,
       min(passage)           as النص
  from public.questions
 where section = 'Reading Comprehension'
   and coalesce(active, true)
   and passage ilike '%Obesity is a medical condition%'   -- ← غيّر هذه
 group by btrim(regexp_replace(passage, '\s+', ' ', 'g'))
 order by الطول desc;
