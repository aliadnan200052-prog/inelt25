-- ═══════════════════════════════════════════════════════════════════════
-- حذف أسئلة القواعد التجريبية من البنك
-- ───────────────────────────────────────────────────────────────────────
-- Supabase → SQL Editor → New query → الصق → Run.
--
-- الملف أربع خطوات. الثلاث الأولى **لا تحذف شيئاً** — تَعرض وتحفظ وتفحص.
-- والرابعة وحدها هي التي تحذف، وهي معطّلة الآن بين /* و */ : لا تعمل حتى
-- تنزع السطرين بنفسك.
--
-- اقرأ الخطوة ٢ قبل أي شيء: إن كان في قاعدتك جدولٌ يشير إلى الأسئلة
-- (إجابات الطلاب مثلاً) فالحذف إمّا أن يفشل أو يأخذ ذلك معه، والخطوة
-- تقول لك أيّهما، وللحالتين حلّ في الخطوة ٤ب.
--
-- لا شيء هنا يمسّ القراءة أو الوظائف أو الحوار.
-- ═══════════════════════════════════════════════════════════════════════


-- ── ١ ─ ماذا في البنك؟ (قراءة فقط) ───────────────────────────────────
-- صفٌّ لكل قسم. والعمودان الأوسطان مهمّان: «تطابق_تام» ما يطابقه شرط
-- section = 'Grammar' حرفياً، و«بعد_التنظيف» ما يطابقه الشرط المتساهل
-- الذي يتجاوز فرق حالة الأحرف والمسافات الزائدة. إن اختلف الرقمان فعندك
-- صفوف استوردت باسم قسمٍ فيه مسافة أو حرف كبير/صغير مختلف — والحذف في
-- الخطوة ٤ يأخذها جميعاً.

select
  coalesce(q.section, '(null)')                               as "القسم",
  count(*)                                                    as "عدد الأسئلة",
  count(*) filter (where q.section = 'Grammar')               as "تطابق_تام",
  count(*) filter (where btrim(lower(q.section)) = 'grammar') as "بعد_التنظيف",
  min(q.id)                                                   as "أصغر_معرّف",
  max(q.id)                                                   as "أكبر_معرّف"
from public.questions q
group by q.section
order by 1;


-- ── ٢ ─ مَن يشير إلى الأسئلة؟ (قراءة فقط) ────────────────────────────
-- كل مفتاح أجنبي يشير إلى جدول questions، وماذا يفعل عند الحذف:
--
--   NO ACTION / RESTRICT  →  الحذف سيفشل ما دامت هناك صفوف مرتبطة.
--   CASCADE               →  الحذف سيأخذ تلك الصفوف معه (إجابات، نتائج…).
--   SET NULL              →  تبقى الصفوف ويصير عمودها فارغاً.
--
-- إن لم يرجع هذا الاستعلام شيئاً فلا جدول يشير إلى الأسئلة، والحذف لا
-- يمسّ غيرها — امضِ إلى الخطوة ٣ ثم ٤.

select
  tc.table_schema || '.' || tc.table_name  as "الجدول المرتبط",
  kcu.column_name                          as "العمود",
  tc.constraint_name                       as "القيد",
  rc.delete_rule                           as "عند الحذف"
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on kcu.constraint_name   = tc.constraint_name
 and kcu.constraint_schema = tc.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name   = tc.constraint_name
 and ccu.constraint_schema = tc.constraint_schema
join information_schema.referential_constraints rc
  on rc.constraint_name   = tc.constraint_name
 and rc.constraint_schema = tc.constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and ccu.table_schema = 'public'
  and ccu.table_name   = 'questions'
order by 1, 2;


-- ── ٣ ─ نسخة احتياطية قبل الحذف (قراءة فقط) ──────────────────────────
-- يرجع صفّاً واحداً فيه كل أسئلة القواعد بصيغة JSON. انسخ الخلية كلّها
-- واحفظها في ملف عندك قبل أن تحذف. المحذوف لا يُسترجع.
-- (ولوحة الإدارة فيها «تصدير» أيضاً، وهو أسهل إن كنت تفضّله.)

select jsonb_pretty(coalesce(jsonb_agg(to_jsonb(q) order by q.id), '[]'::jsonb))
         as "نسخة_احتياطية_القواعد"
from public.questions q
where btrim(lower(q.section)) = 'grammar';


-- ── ٤ ─ الحذف ────────────────────────────────────────────────────────
-- هذه الخطوة وحدها هي التي تحذف، وهي معطّلة الآن.
--
-- احذف السطر الذي فيه /* والسطر الذي فيه */ تحته، ثم شغّل. تحذف أسئلة
-- القواعد وحدها وترجع عددها، في عمليةٍ واحدة: إن فشل شيء لم يُحذف شيء.

/*
with gone as (
  delete from public.questions
   where btrim(lower(section)) = 'grammar'
  returning id
)
select count(*) as "عدد المحذوف" from gone;
*/


-- ── ٤ب ─ إن أظهرت الخطوة ٢ جدولاً مرتبطاً ────────────────────────────
-- إن رجعت الخطوة ٢ صفّاً فيه NO ACTION أو RESTRICT، فالخطوة ٤ ستفشل
-- بخطأ «violates foreign key constraint» ولن تحذف شيئاً — وهذا حِفظٌ لا
-- عطل. أمامك عندئذٍ طريقان. ضع في <الجدول> و<العمود> ما سمّته لك
-- الخطوة ٢.
--
-- الطريق الأول — احذف ما لم يُجب عنه أحد، وأبقِ ما أُجيب عنه:

/*
with gone as (
  delete from public.questions q
   where btrim(lower(q.section)) = 'grammar'
     and not exists (select 1 from public.<الجدول> a where a.<العمود> = q.id)
  returning id
)
select count(*) as "عدد المحذوف" from gone;
*/

-- الطريق الثاني — احذف الكل، ومعه إجابات الطلاب عن هذه الأسئلة. هذا
-- يمسّ سجلّ المحاولات، فلا تسلكه إلا وأنت عارفٌ بما يعنيه. الكتلة كلّها
-- عمليةٌ واحدة: إن فشل جزء منها لم يُنفَّذ شيء.

/*
begin;

delete from public.<الجدول>
 where <العمود> in (
   select id from public.questions where btrim(lower(section)) = 'grammar'
 );

with gone as (
  delete from public.questions
   where btrim(lower(section)) = 'grammar'
  returning id
)
select count(*) as "عدد المحذوف" from gone;

commit;
*/


-- ── بعد الحذف ────────────────────────────────────────────────────────
-- أعد تشغيل الخطوة ١ للتأكّد أن القواعد اختفت وأن الأقسام الثلاثة
-- الأخرى على حالها. ثم أضف أسئلتك الحقيقية من لوحة الإدارة ← استيراد،
-- بملف أعمدته:
--
--   section,question,option1,option2,option3,option4,correct,passage
--
-- section = Grammar، و correct رقم من ١ إلى ٤، و passage يُترك فارغاً
-- لغير القراءة. ولوحة الإدارة ترفض الصف الناقص وتتجاوز المكرّر، فلا خوف
-- من رفع الملف مرتين.
-- ═══════════════════════════════════════════════════════════════════════
