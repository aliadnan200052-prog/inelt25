-- ════════════════════════════════════════════════════════════════════════
-- Learn English — Postgres / Supabase schema (server build)
--
-- The static build keeps content in /learn/content/*.json and progress in
-- localStorage. These tables hold exactly the same shapes, so moving to a
-- server means one adapter behind js/data/content-repo.js and
-- js/data/progress-repo.js — the engine and UI do not change.
--
-- Domains:  CONTENT (admin-authored)  ·  USER PROGRESS  ·  REVIEW SYSTEM
-- Namespace: everything lives in schema "learn" so it cannot collide with
-- the INELT exam tables in "public".
-- ════════════════════════════════════════════════════════════════════════

create schema if not exists learn;
set search_path = learn, public;

-- ─── Enums ──────────────────────────────────────────────────────────────
create type cefr as enum ('A0','A1','A2','B1','B2','C1');
create type item_kind as enum ('word','collocation','phrasal-verb','expression','grammar');
create type skill as enum ('listening','reading','vocabulary','grammar','speaking','pronunciation','functional');
create type task_type as enum ('recognition','recall','production');
create type review_stage as enum ('new','learning','review','mastered');
create type content_status as enum ('draft','published');
create type speaking_mode as enum ('controlled','guided','free');

-- ════════════════════════════════════════════════════════════════════════
-- CONTENT
-- ════════════════════════════════════════════════════════════════════════
create table cefr_levels (
  code        cefr primary key,
  name        text not null,
  summary     text not null default '',
  summary_ar  text not null default '',
  can_do      text[] not null default '{}',
  sort        int not null
);

create table units (
  id          text primary key,
  level_code  cefr not null references cefr_levels(code) on update cascade,
  title       text not null,
  summary     text not null default '',
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);
create index units_level_idx on units(level_code, sort);

create table lessons (
  id          text primary key,
  unit_id     text not null references units(id) on delete cascade,
  title       text not null,
  topic       text not null default '',
  minutes     int  not null default 20,
  sort        int  not null default 0,
  status      content_status not null default 'draft',
  -- Stage blocks: context, input, reading, notice, grammar, practice,
  -- pronunciation, retrieval, speaking, interaction. Heterogeneous by
  -- design (see docs/DESIGN.md §2); validated by js/data/content-schema.js.
  body        jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);
create index lessons_unit_idx on lessons(unit_id, sort);

create table videos (
  id           text primary key,
  youtube_id   text not null,
  url          text not null,
  title        text not null,
  level_code   cefr not null,              -- set by the admin, never inferred
  topic        text not null default '',
  duration_sec int,
  difficulty   smallint check (difficulty between 1 and 5),
  transcript   jsonb,                      -- [{ s, t, time }]
  vocabulary   text[] not null default '{}',   -- learning_items.id
  expressions  text[] not null default '{}',   -- learning_items.id
  grammar      text[] not null default '{}',   -- learning_items.id
  questions    jsonb not null default '[]',
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
create index videos_level_topic_idx on videos(level_code, topic);

create table learning_items (
  id          text primary key,
  kind        item_kind not null,
  form        text not null,                -- "make a decision"
  meaning     text not null,
  meaning_ar  text not null default '',
  level_code  cefr not null,
  example     text not null default '',
  note        text not null default '',
  produce     text not null default '',     -- prompt for an own-sentence task
  audio_url   text,
  match       text[] not null default '{}', -- regex patterns recognising the item in free text
  tags        text[] not null default '{}'
);
create index items_level_idx on learning_items(level_code, kind);

-- Recycling: the same item in many sentences, lessons and levels.
create table item_contexts (
  id          text primary key,
  item_id     text not null references learning_items(id) on delete cascade,
  sentence    text not null,
  cloze       text not null,                -- the substring that is blanked out
  accept      text[] not null default '{}', -- other acceptable fills
  lesson_id   text references lessons(id) on delete set null,
  level_code  cefr not null
);
create index item_contexts_item_idx on item_contexts(item_id);

create table lesson_items (
  lesson_id   text not null references lessons(id) on delete cascade,
  item_id     text not null references learning_items(id) on delete cascade,
  role        text not null check (role in ('introduce','recycle')),
  primary key (lesson_id, item_id)
);
create index lesson_items_item_idx on lesson_items(item_id);

create table lesson_videos (
  lesson_id   text not null references lessons(id) on delete cascade,
  video_id    text not null references videos(id) on delete cascade,
  primary key (lesson_id, video_id)
);

create table assessments (
  id          text primary key,
  kind        text not null check (kind in ('placement','level')),
  level_code  cefr,                         -- null for the placement bank
  body        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table review_schedules (
  id          text primary key,
  title       text not null,
  item_ids    text[] not null,
  due_at      timestamptz not null,
  audience    text not null default 'seen' check (audience in ('seen','all')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════
-- USER PROGRESS
-- ════════════════════════════════════════════════════════════════════════
create table profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  role           text not null default 'student' check (role in ('student','admin')),
  current_level  cefr not null default 'A0',
  unlocked_level cefr not null default 'A0',
  support_lang   text not null default 'ar' check (support_lang in ('ar','none')),
  placement      jsonb,                     -- { overall, bySkill, takenAt }
  created_at     timestamptz not null default now()
);

create table lesson_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  lesson_id    text not null references lessons(id) on delete cascade,
  status       text not null check (status in ('in_progress','completed','revisit')),
  stage        int  not null default 0,
  stage_scores jsonb not null default '{}',
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

-- Append-only evidence log; the progress model is computed from it.
create table attempts (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  ts          timestamptz not null default now(),
  lesson_id   text,
  exercise_id text,
  item_ids    text[] not null default '{}',
  skill       skill not null,
  task        task_type,
  correct     boolean not null,
  score       real not null default 0,
  source      text not null default 'lesson' check (source in ('lesson','review','placement','assessment','video')),
  response    text,
  meta        jsonb
);
create index attempts_user_ts_idx on attempts(user_id, ts desc);
create index attempts_user_skill_idx on attempts(user_id, skill, ts desc);

create table speaking_logs (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  lesson_id   text,
  mode        speaking_mode not null,
  seconds     int not null default 0,
  ts          timestamptz not null default now()
);
create index speaking_user_idx on speaking_logs(user_id, ts desc);

create table level_results (
  id             bigserial primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  level_code     cefr not null,
  section_scores jsonb not null,            -- { listening: .8, reading: .7, ... }
  passed         boolean not null,
  ts             timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════
-- REVIEW SYSTEM
-- ════════════════════════════════════════════════════════════════════════
create table item_states (
  user_id         uuid not null references auth.users(id) on delete cascade,
  item_id         text not null references learning_items(id) on delete cascade,
  stage           review_stage not null default 'new',
  step            smallint not null default 0,
  interval_days   real not null default 0,
  ease            real not null default 2.3,
  due_at          timestamptz not null default now(),
  reps            int not null default 0,
  lapses          int not null default 0,
  streak          int not null default 0,
  correct_by_task jsonb not null default '{"recognition":0,"recall":0,"production":0}',
  contexts        text[] not null default '{}', -- item_contexts.id answered correctly
  last_context    text,
  learned_at      timestamptz,
  last_seen_at    timestamptz,
  primary key (user_id, item_id)
);
create index item_states_due_idx on item_states(user_id, due_at);

-- ════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════════
create or replace function learn.is_admin() returns boolean
language sql stable security definer set search_path = learn, public as $$
  select exists (select 1 from learn.profiles where user_id = auth.uid() and role = 'admin');
$$;

-- Content: everyone signed in reads published content; admins write.
do $$
declare t text;
begin
  foreach t in array array['cefr_levels','units','videos','learning_items','item_contexts',
                           'lesson_items','lesson_videos','assessments','review_schedules']
  loop
    execute format('alter table learn.%I enable row level security', t);
    execute format('create policy %I on learn.%I for select to authenticated using (true)', t || '_read', t);
    execute format('create policy %I on learn.%I for all to authenticated using (learn.is_admin()) with check (learn.is_admin())', t || '_admin', t);
  end loop;
end $$;

alter table lessons enable row level security;
create policy lessons_read  on lessons for select to authenticated using (status = 'published' or learn.is_admin());
create policy lessons_admin on lessons for all to authenticated using (learn.is_admin()) with check (learn.is_admin());

-- Progress: learners own their rows; admins can read everyone's.
do $$
declare t text;
begin
  foreach t in array array['lesson_progress','attempts','speaking_logs','level_results','item_states']
  loop
    execute format('alter table learn.%I enable row level security', t);
    execute format('create policy %I on learn.%I for select to authenticated using (user_id = auth.uid() or learn.is_admin())', t || '_read', t);
    execute format('create policy %I on learn.%I for insert to authenticated with check (user_id = auth.uid())', t || '_insert', t);
    execute format('create policy %I on learn.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_update', t);
  end loop;
end $$;

alter table profiles enable row level security;
create policy profiles_read   on profiles for select to authenticated using (user_id = auth.uid() or learn.is_admin());
create policy profiles_insert on profiles for insert to authenticated with check (user_id = auth.uid() and role = 'student');
-- A learner may edit their own profile but never promote themselves.
create policy profiles_update on profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and role = (select p.role from learn.profiles p where p.user_id = auth.uid()));

-- ─── Seed levels ────────────────────────────────────────────────────────
insert into cefr_levels (code, name, sort) values
  ('A0','Starter',0), ('A1','Beginner',1), ('A2','Elementary',2),
  ('B1','Intermediate',3), ('B2','Upper-intermediate',4), ('C1','Advanced',5)
on conflict do nothing;
