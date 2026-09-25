/* ═══════════════════════════════════════════════════════════════════════
   لماذا تظهر القطعة مرّتين؟ — قراءة فقط
   ───────────────────────────────────────────────────────────────────────
   يقارن كل نصّين يبدآن بالبداية نفسها ويُظهر أول موضع يختلفان فيه، مع ما
   حوله من كلمات. لا يعدّل شيئاً.

   إن كان الاختلاف تافهاً — علامة اقتباس مائلة، شرطة، مسافة — فالقطعتان
   واحدة انقسمت، وتُوحَّد بـ backend/passage-merge.sql
   وإن كان جملة أو فقرة ناقصة فهما نسختان مختلفتان فعلاً، وقرارُ أيّهما
   يُبقى قرارك.
   ═══════════════════════════════════════════════════════════════════════ */
with p as (
  select btrim(regexp_replace(passage, '\s+', ' ', 'g')) as txt,
         count(*) as الأسئلة
    from public.questions
   where section = 'Reading Comprehension'
     and coalesce(active, true)
     and passage is not null
     and btrim(passage) <> ''
   group by 1
), pairs as (
  select a.txt as a, b.txt as b, a.الأسئلة as أسئلة_أ, b.الأسئلة as أسئلة_ب
    from p a
    join p b on left(a.txt, 40) = left(b.txt, 40) and a.txt < b.txt
), d as (
  select *,
         (select min(i)
            from generate_series(1, least(length(a), length(b))) i
           where substr(a, i, 1) <> substr(b, i, 1)) as pos
    from pairs
)
select أسئلة_أ, أسئلة_ب,
       length(a) as طول_أ,
       length(b) as طول_ب,
       coalesce(pos, least(length(a), length(b)) + 1) as أول_اختلاف,
       substr(a, greatest(coalesce(pos, least(length(a), length(b)) + 1) - 30, 1), 70) as عند_أ,
       substr(b, greatest(coalesce(pos, least(length(a), length(b)) + 1) - 30, 1), 70) as عند_ب,
       left(a, 45) as البداية
  from d
 order by البداية;
