-- ═══════════════════════════════════════════════════════════════════════
-- عدد المستخدمين، وكم منهم أدّى الامتحان — في لوحة الإدارة
-- ───────────────────────────────────────────────────────────────────────
-- Supabase → SQL Editor → New query → الصق الملف كلّه → Run.
--
-- الملف ثلاث خطوات: الأولى تقرأ ولا تغيّر شيئاً وتُظهر لك الأرقام فوراً،
-- والثانية تُنشئ دالّة تقرأها لوحة الإدارة، والثالثة تجرّبها.
-- لا شيء هنا يمسّ الأسئلة ولا الحسابات ولا المحاولات — قراءة فقط.
--
-- من أين تأتي الأرقام؟ قاعدتك فيها ثلاثة جداول: questions و profiles و
-- premium_backup. لا جدول لنتائج الامتحانات، فلا سبيل إلى «من أكمل
-- الامتحان ودرجته». الموجود هو profiles.attempts_used: يزيد واحداً حين
-- يبدأ الطالب امتحاناً كاملاً، ولا يتحرّك في «تدرّب» ولا في «المسار»
-- (انظر تعليقات js/api.js). فمن كان attempts_used أكبر من صفر فقد دخل
-- الامتحان فعلاً — وهذا أدقّ ما يمكن قوله الآن.
-- ═══════════════════════════════════════════════════════════════════════


-- ── ١ ─ الأرقام الآن (قراءة فقط) ──────────────────────────────────────
-- شغّل هذه وحدها إن أردت الأرقام ولا شيء غيرها. وإن أعطت خطأً، أرسل لي
-- نصّ الخطأ قبل أن تمضي إلى الخطوة ٢.

select
  (select count(*) from auth.users)                                  as "المستخدمون",
  (select count(*) from public.profiles)                             as "ملفّات_شخصية",
  (select count(*) from public.profiles
    where coalesce(attempts_used, 0) > 0)                            as "أدّوا_الامتحان",
  (select coalesce(sum(attempts_used), 0) from public.profiles)      as "مجموع_المحاولات",
  (select count(*) from public.profiles
    where premium is not null and premium::text not in ('false','f','0'))
                                                                     as "مشتركون",
  (select count(*) from auth.users
    where created_at > now() - interval '24 hours')                  as "جديد_٢٤_ساعة",
  (select count(*) from auth.users
    where created_at > now() - interval '7 days')                    as "جديد_٧_أيام",
  (select count(*) from auth.users
    where last_sign_in_at > now() - interval '7 days')               as "نشط_٧_أيام";


-- ── ٢ ─ الدالّة التي تقرأها لوحة الإدارة ──────────────────────────────
-- دالّة واحدة ترجع كل الأرقام في JSON. مثل بقيّة دوال اللوحة: security
-- definer لتصل إلى auth.users، وأول ما تفعله أن تسأل is_admin() — فمن
-- ليس المشرف يرجع له {"error":"forbidden"} ولا يرى رقماً واحداً.
--
-- «ملفّات_شخصية» عدد صفوف profiles، و«المستخدمون» عدد الحسابات نفسها.
-- وهما عادةً متساويان؛ فإن اختلفا فهناك حساب لم يُنشأ له ملف.

create or replace function public.admin_user_stats()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    return jsonb_build_object('error', 'forbidden');
  end if;

  return jsonb_build_object(
    'users',       (select count(*) from auth.users),
    'profiles',    (select count(*) from public.profiles),
    'took_exam',   (select count(*) from public.profiles
                     where coalesce(attempts_used, 0) > 0),
    'attempts',    (select coalesce(sum(attempts_used), 0) from public.profiles),
    'premium',     (select count(*) from public.profiles
                     where premium is not null
                       and premium::text not in ('false','f','0')),
    'new_24h',     (select count(*) from auth.users
                     where created_at > now() - interval '24 hours'),
    'new_7d',      (select count(*) from auth.users
                     where created_at > now() - interval '7 days'),
    'active_7d',   (select count(*) from auth.users
                     where last_sign_in_at > now() - interval '7 days')
  );
end
$$;

revoke all on function public.admin_user_stats() from public;
grant execute on function public.admin_user_stats() to authenticated;


-- ── ٣ ─ تجربة ─────────────────────────────────────────────────────────
-- في SQL Editor أنت postgres، و is_admin() تقول لا، فالجواب هنا
-- {"error":"forbidden"} — وهذا هو الصحيح: الحارس يعمل. الأرقام تظهر لك
-- في لوحة الإدارة بعد تسجيل دخولك ببريد المشرف.

select jsonb_pretty(public.admin_user_stats()) as "النتيجة";


-- ── بعدها ─────────────────────────────────────────────────────────────
-- افتح /admin فتجد صفّ بطاقات جديداً باسم Users فوق بطاقات الأسئلة.
-- وإن بقي مكانه فارغاً مع سطر رمادي، فالدالّة لم تُنشأ — أعد الخطوة ٢.
-- ═══════════════════════════════════════════════════════════════════════
