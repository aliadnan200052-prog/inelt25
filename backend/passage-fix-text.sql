/* ═══════════════════════════════════════════════════════════════════════
   تصحيح كلمة داخل نصّ قطعة
   ───────────────────────────────────────────────────────────────────────
   حين تكون القطعتان واحدة وفرقهما خطأ مطبعي، تصحيحُ الخطأ يجعل النصّين
   متطابقين فتعودان قطعة واحدة من تلقاء نفسهما — بلا دمج ولا إعادة كتابة
   للنصّ كلّه.

   اضبط السطرين في الأعلى، شغّل الخطوة ١ واقرأ ما سيتغيّر، ثم الخطوة ٢.
   التراجع في آخر الملف: بدّل القديم بالجديد وشغّله.
   ═══════════════════════════════════════════════════════════════════════ */


-- ── الخطوة ١ ─ ما الذي سيتغيّر (قراءة فقط) ───────────────────────────
select id,
       length(passage)                                      as الطول_قبل,
       length(replace(passage, 'In this time', 'In his time')) as الطول_بعد,
       substr(passage, greatest(position('In this time' in passage) - 40, 1), 90) as حول_الموضع
  from public.questions
 where section = 'Reading Comprehension'
   and passage like '%In this time%'          -- ← النص القديم
 order by id;


-- ── الخطوة ٢ ─ التصحيح ───────────────────────────────────────────────
-- update public.questions
--    set passage = replace(passage, 'In this time', 'In his time')
--  where section = 'Reading Comprehension'
--    and passage like '%In this time%';


-- ── التراجع ──────────────────────────────────────────────────────────
-- update public.questions
--    set passage = replace(passage, 'In his time', 'In this time')
--  where section = 'Reading Comprehension'
--    and passage like '%In his time%';
