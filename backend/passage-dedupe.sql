/* ═══════════════════════════════════════════════════════════════════════
   الأسئلة المكرّرة داخل القطعة الواحدة
   ───────────────────────────────────────────────────────────────────────
   سؤالان يُعدّان نسخة واحدة إذا تطابق نصّاهما بعد تجاهل فرق الفراغات
   وحالة الأحرف — وهو بالضبط ما يفلت من فحص التكرار عند الاستيراد.

   شغّل الخطوة ١ أولاً واقرأ القائمة. إذا اقتنعت، شغّل الخطوة ٢.

   الخطوة ٢ لا تحذف شيئاً: تضع active = false على النسخ الزائدة وتُبقي
   الأقدم من كل سؤال. البرنامج يتجاهل المعطَّل، والتراجع بأمر واحد في
   آخر الملف.
   ═══════════════════════════════════════════════════════════════════════ */


-- ── الخطوة ١ ─ ما الذي سيُعطَّل (قراءة فقط) ───────────────────────────
with norm as (
  select id, passage_title, question,
         btrim(regexp_replace(passage,         '\s+', ' ', 'g')) as p,
         btrim(regexp_replace(lower(question), '\s+', ' ', 'g')) as q
    from public.questions
   where section = 'Reading Comprehension' and coalesce(active, true)
)
select coalesce(passage_title, '— بلا اسم —') as القطعة,
       id,
       row_number() over (partition by p, q order by id) as النسخة,
       left(question, 60) as السؤال
  from norm
 where (p, q) in (select p, q from norm group by p, q having count(*) > 1)
 order by القطعة, q, id;
-- النسخة = ١ تبقى، وما بعدها يُعطَّل.


-- ── الخطوة ٢ ─ التعطيل ───────────────────────────────────────────────
-- with norm as (
--   select id,
--          btrim(regexp_replace(passage,         '\s+', ' ', 'g')) as p,
--          btrim(regexp_replace(lower(question), '\s+', ' ', 'g')) as q
--     from public.questions
--    where section = 'Reading Comprehension' and coalesce(active, true)
-- ), ranked as (
--   select id, row_number() over (partition by p, q order by id) as rn from norm
-- )
-- update public.questions
--    set active = false
--  where id in (select id from ranked where rn > 1);


-- ── التراجع ──────────────────────────────────────────────────────────
-- يعيد تفعيل كل أسئلة القراءة، بما فيها ما كان معطَّلاً قبل هذا الملف،
-- فاستعمله فقط إذا لم تكن قد عطّلت أسئلة قراءة بنفسك من قبل.
-- update public.questions set active = true
--  where section = 'Reading Comprehension' and active = false;
