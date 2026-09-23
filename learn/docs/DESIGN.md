# Learn English — Product & System Design

A language-learning product built on evidence-informed Second Language
Acquisition (SLA) principles. It is **not** a flashcard app, a grammar book,
a video player and a quiz app bolted together: every part feeds one loop.

```
REAL LANGUAGE → UNDERSTAND → NOTICE → PRACTICE → RETRIEVE → USE → GET FEEDBACK → REUSE LATER
   (input)     (comprehension) (noticing) (guided)  (recall)  (speaking,   (short,        (spaced review
                                                              role-play)   level-aware)    + recycling)
```

The principles behind each decision:

| Principle | Where it lives in the product |
| --- | --- |
| Comprehensible input comes first (Krashen; VanPatten) | Every lesson opens with a real situation and a listening/reading text *before* any explanation. |
| Noticing (Schmidt) | A dedicated **Notice** stage points attention at one form inside the text the learner just understood. |
| Form-meaning-use, not rules (Larsen-Freeman) | Grammar is always *Context → Example → Pattern → Short explanation → Practice → Use*. |
| Retrieval practice (Roediger & Karpicke) | Retrieval tasks are typed, without options. Multiple choice is kept for comprehension and recognition only. |
| Spacing (Cepeda et al.) | Every item the learner meets enters a spaced-review scheduler. Errors come back sooner. |
| Output & interaction (Swain; Long) | Every lesson ends with speaking (controlled → guided → free) and a goal-based role-play. |
| Corrective feedback that is short and targeted (Lyster; Ellis) | Feedback shows *your answer → better → why*, one reason, at the learner's level. Fluency tasks are not corrected turn by turn. |
| Recycling / multiple encounters (Nation) | Items return in later lessons, in reviews and in *different* sentences each time. |
| Chunks & collocations (Lewis; Nation) | Items are expressions such as *make a decision*, not single-word translations. |

---

## 1. Information architecture

```
Learn English (/learn)
├── Onboarding          goal, support language, "complete beginner?" → placement or A0
├── Placement test      grammar · vocabulary · reading · listening (speaking NOT claimed)
├── Home                Continue learning (primary) · Today's review · Level · Skill shortcuts · Progress
├── Learning path       A0 → A1 → A2 → B1 → B2 → C1
│   └── Level
│       ├── Units
│       │   └── Lessons ──► Lesson player (11 stages, see §5)
│       └── Level check (assessment) — gate to the next level
├── Daily review        spaced retrieval of due items, in fresh contexts
├── Libraries           entry points into the SAME content, by skill
│   ├── Listening       lesson inputs + standalone YouTube videos (admin-curated)
│   ├── Speaking        every speaking task & role-play the learner has unlocked
│   ├── Vocabulary      the learner's items by stage (New/Learning/Review/Mastered), with contexts seen
│   └── Grammar         patterns met so far, each linked back to the lesson it came from
├── Progress            skill profile · "What you can do now" · level readiness checklist
└── Settings            support language, speech rate, reset

Admin (/learn/admin)
├── Levels · Units · Lessons (stage editors) · Videos · Items (vocab/expressions/grammar)
├── Placement bank · Level assessments · Review schedules
├── Student progress
└── Import / Export content
```

Libraries are *views*, not separate apps: a listening video in the library is
the lesson input; a word in the vocabulary library shows the lessons and
sentences where the learner met it; a grammar pattern links back to its lesson.

---

## 2. Database schema

The browser build runs **local-first** (content from static JSON files,
learner progress in `localStorage`) so it deploys as a static site. The same
shapes map one-to-one onto the Postgres/Supabase schema in
[`../db/schema.sql`](../db/schema.sql). Swapping storage means writing one
adapter behind the two repository interfaces in `js/data/` — no engine or UI
change.

Four independent domains (see §9 of the brief, "Technical principle"):

**Content** (authored by admins, read by everyone)

| Table | Purpose |
| --- | --- |
| `cefr_levels` | A0…C1, name, summary, can-do statements, sort order |
| `units` | belongs to a level; title, summary, sort |
| `lessons` | belongs to a unit; title, topic, minutes, status (draft/published), `body jsonb` holding the stage blocks |
| `videos` | YouTube id + URL, title, CEFR level (set **manually**), topic, duration, difficulty 1–5, transcript lines with optional timestamps, vocabulary/expression/grammar focus, comprehension questions |
| `learning_items` | the unit of spaced review: kind (`word`, `collocation`, `phrasal-verb`, `expression`, `grammar`), form, meaning, Arabic gloss, level, audio URL, `match` patterns (regex for recognising the item in free text), note, production prompt |
| `item_contexts` | many sentences per item, each tagged with the lesson it comes from — **the recycling table** |
| `lesson_items` | lesson ↔ item with role `introduce` or `recycle` |
| `assessments` | placement bank and level checks (`kind`, `level`, `body jsonb`) |
| `review_schedules` | admin-scheduled review pushes (item ids, due date, audience) |

**User progress** (written by the learner, readable by admins)

| Table | Purpose |
| --- | --- |
| `profiles` | current level, placement result, support language, role |
| `lesson_progress` | status, current stage, stage scores, completion time |
| `attempts` | append-only evidence log: exercise, item ids, **skill**, **task type**, correct/score, response, timestamp |
| `speaking_logs` | speaking task, mode (controlled/guided/free), seconds recorded — audio itself is never uploaded |
| `level_results` | per-section scores of each level check and whether it passed |

**Review system**

| Table | Purpose |
| --- | --- |
| `item_states` | one row per learner × item: stage, interval, ease, due, reps, lapses, streak, correct counts per task type, distinct contexts answered |

Lesson bodies are JSON blocks rather than dozens of tables because stage
content is heterogeneous (a role-play and a stress exercise share nothing) and
admins need to add new exercise types without migrations. Everything that is
*queried across lessons* — items, contexts, videos, attempts, item states — is
relational.

---

## 3. Learning flow (one lesson)

```
 ┌─────────────┐   ┌──────────┐   ┌────────┐   ┌──────────────────┐   ┌──────────┐
 │ 1 Situation │ → │ 2 Listen │ → │3 Notice│ → │4 Words & phrases │ → │5 Pattern │
 │  real-life  │   │ gist →   │   │ one    │   │ in context, with │   │ context→ │
 │  goal+can-do│   │ detail → │   │ form   │   │ audio + example  │   │ pattern→ │
 └─────────────┘   │ inference│   │ at a   │   └──────────────────┘   │ explain  │
      INPUT        └──────────┘   │ time   │         NOTICING         └──────────┘
                      INPUT       └────────┘
 ┌──────────┐   ┌────────────────┐   ┌─────────────┐   ┌──────────┐   ┌───────────┐   ┌──────────┐
 │6 Practice│ → │7 Pronunciation │ → │8 Retrieval  │ → │9 Speaking│ → │10 Role-   │ → │11 Summary│
 │ guided,  │   │ sound → stress │   │ "close the  │   │controlled│   │ play with │   │ feedback,│
 │ mixed    │   │ → shadowing    │   │ book", typed│   │→ guided  │   │ a goal    │   │ can-dos, │
 │ types    │   └────────────────┘   │ no options  │   │→ free    │   └───────────┘   │ scheduled│
 └──────────┘      PRACTICE          └─────────────┘   └──────────┘   INTERACTION     │ reviews  │
   PRACTICE                             RETRIEVAL          USE                        └──────────┘
                                                                                     SPACED REVIEW
 Feedback is given inside every stage, not only at the end.
```

* The listening stage asks for **gist first** (transcript hidden), then
  detail (transcript available), then inference at B1+. The aim is the message,
  not word-by-word translation.
* The notice stage asks a question *before* explaining ("Why did the speaker
  use *going to*?"), then gives a two-line explanation.
* Practice mixes types: gap-fill, sentence building, transformation, error
  correction, dictation, matching; multiple choice is a minority.
* Retrieval asks for recall with no options and no text on screen.
* Speaking moves from controlled (repeat model lines) to guided (a frame) to
  free (a prompt, prep time, a checklist).
* The role-play has a **communicative goal** checklist (e.g. *order a drink*,
  *ask the price*). The character responds to what the learner actually typed
  or said; errors are not interrupted, only up to two are shown at the end.
* On completion, the lesson's items enter the review scheduler, and the
  lesson's can-do statements are credited only if the lesson's evidence is
  good enough (see §7).

---

## 4. User flow

```
First visit ─► Onboarding ─┬─ "I'm a complete beginner" ─► A0, lesson 1
                           └─ Placement test (≈10–15 min)
                                 ─► Result: "Estimated level: B1" + strong/weak areas
                                    + honest note: speaking was not measured
                                 ─► Start at estimated level (or choose lower)

Every day ─► Home
             ├─ Continue learning  → next lesson the learner needs (in-progress first)
             ├─ Today's review     → N items due · ~M minutes
             └─ Skill shortcut     → library (listening/speaking/vocabulary/grammar)

End of level ─► Readiness checklist (lessons, retention, speaking, level check)
             ─► Level check (per-section pass marks) ─► next level unlocked
```

Earlier lessons stay open for revision at all times. Later levels unlock by
placement or by passing the level check, not by collecting points.

---

## 5. Lesson structure (content model)

```jsonc
{
  "id": "a2-u2-l1", "level": "A2", "unitId": "a2-u2",
  "title": "Plans for the weekend", "topic": "Making plans", "minutes": 25,
  "context":  { "situation": "...", "situation_ar": "...", "goal": "...", "canDo": ["I can talk about my plans..."] },
  "input":    { "videoId": null, "title": "...", "script": [{ "s": "Leila", "t": "Are you doing anything on Saturday?", "time": 12 }],
                "gist": [/* mcq */], "detail": [/* mcq | gap */], "inference": [/* B1+ */] },
  "reading":  { "title": "...", "text": "...", "questions": [] },         // optional
  "vocabulary": ["make-plans", "free-time", ...],                           // items introduced here
  "recycle":    ["make-a-decision", ...],                                   // items from earlier lessons, in new sentences
  "notice":   [{ "quote": "I'm going to call him.", "question": { /* mcq | recall */ }, "explain": "...", "explain_ar": "..." }],
  "grammar":  { "item": "going-to", "context": "...", "pattern": "be + going to + verb", "examples": [], "explain": "...", "explain_ar": "..." },
  "practice":      [/* gap | order | transform | correct | match | dictation | mcq */],
  "pronunciation": [/* minimal-pair | stress | sentence-stress | connected | intonation | shadow */],
  "retrieval":     [/* recall | gap | produce  — never mcq */],
  "speaking":  { "controlled": {}, "guided": {}, "free": {} },
  "interaction": { "studentRole": "Customer", "characterRole": "Waiter", "goals": [], "turns": [] }
}
```

Every exercise carries `skill` (listening, reading, vocabulary, grammar,
pronunciation, functional) and `items` (the learning items it exercises), so
each attempt becomes evidence for the progress model and the review scheduler.

**Feedback contract** — every checker returns:

```
{ correct, near, feedback: { yourAnswer, better, why } }
```

`why` comes from (1) an anticipated-error rule authored on the exercise, (2) a
library of common learner errors (e.g. *I am agree*, *discuss about*,
*I have 20 years*), or (3) a neutral "compare with the model". Spelling slips
are "almost", not "wrong".

---

## 6. Admin structure

```
/learn/admin
├── Content tree       Level ▸ Unit ▸ Lesson (create / edit / reorder / delete / draft-publish)
├── Lesson editor      one panel per stage; each block is a typed form (schema-driven),
│                      with a JSON view for advanced edits and live validation
├── Videos             paste a YouTube URL → id extracted → title, CEFR level, topic, duration,
│                      difficulty, transcript (optional [mm:ss] per line), vocabulary,
│                      target expressions, grammar focus, questions. The level is ALWAYS set
│                      by the admin; nothing is inferred from YouTube.
├── Items              vocabulary / expressions / grammar patterns, their contexts (recycling),
│                      and where each item is used
├── Assessments        placement bank per skill × level; level checks per level
├── Review schedules   push chosen items into learners' review on a date
├── Student progress   per learner: level, lessons, skill profile, due reviews
└── Import / Export    the whole content set as one JSON bundle
```

All admin forms are generated from one field-schema per entity/exercise type
(`js/data/content-schema.js`), and the same schema validates content in the
test-suite — including that every referenced item and video exists.

---

## 7. Progress system

Progress is **evidence-based**, computed from the attempt log and item
states — not from points.

| Dimension | Evidence | Shown as |
| --- | --- | --- |
| Listening comprehension | accuracy on listening questions (recent-weighted) | % and number of questions |
| Reading | accuracy on reading questions | % |
| Vocabulary retention | of items reviewed ≥ 1 day after they were learned, share recalled correctly (last 30 days) + counts per stage | % + New/Learning/Review/Mastered |
| Grammar accuracy | accuracy on grammar-tagged practice & retrieval | % |
| Speaking practice | tasks done by mode (controlled/guided/free), minutes recorded | counts — **no accuracy claimed** |
| Pronunciation | perception accuracy (minimal pairs, stress) + shadowing done | % + count |
| Functional communication | role-play goals achieved | goals / attempted |
| Lessons | completed lessons per level | n / total |

**"What you can do now"** lists the can-do statements of completed lessons,
grouped by level — the headline of the progress screen.

A lesson counts as *completed* when every stage was visited and its scored
stages reached ≥ 60 %. Below that, the lesson is marked *done — worth
revisiting* and its can-dos are not yet credited.

**Level readiness** (gate to the next level) — all must hold:

1. All lessons of the level completed.
2. Vocabulary: ≥ 70 % of the level's items have left *Learning* (reached
   *Review* or *Mastered*).
3. Speaking: at least one guided and one free speaking task done per unit.
4. Level check passed: **each section** (listening, reading, vocabulary,
   grammar) ≥ 70 % — a strong section cannot hide a weak one.

---

## 8. Spaced-review logic

Stages: **New → Learning → Review → Mastered** (a lapse sends any item back to
Learning).

```
state = { stage, step, intervalDays, ease (2.3), due, reps, lapses, streak,
          correctByTask {recognition, recall, production}, contexts[] }

on WRONG     → stage = learning, step = 0, due = now + 10 min,
               ease -= 0.2 (min 1.3), streak = 0, lapses += 1 if it had graduated
on CORRECT, learning:
               steps = [20 min, 1 day]; step += 1; after the last step → Review, interval = 3 d
               (hard 2 d · easy 4 d)
on CORRECT, review/mastered:
               hard: interval × 1.2, ease −0.15 · good: interval × ease · easy: interval × ease × 1.3, ease +0.1
               (max 180 days)
```

"Hard" means correct with a hint or a spelling slip; the learner never has to
rate themselves except for free sentences.

**Mastered is never one right answer.** An item becomes Mastered only when
*all* hold:

* interval ≥ 21 days, and a streak of ≥ 3 correct reviews
* ≥ 5 correct answers in total
* correct in ≥ 2 task types, including at least one **production** (own sentence)
* correct in ≥ 3 **different contexts** (sentences)

**Choosing the task** — the task type grows with the item: Learning →
*recall* (fill the item into a sentence, first-letter hint available);
Review → alternate *recall* and *production*; Mastered → *production*.
*Recognition* (meaning multiple choice) is used only for brand-new items.

**Choosing the context (recycling)** — each item has many sentences from
different lessons and levels (`item_contexts`). The review picks a sentence
the learner has **not** answered correctly yet, and never the same sentence
twice in a row — so *make a decision* comes back as *"Have you made a decision
yet?"*, then *"It wasn't an easy decision to make."*

**Queue order** — lapsed items first, then by how overdue they are relative
to their interval; a session holds at most 15 items (≈ 5–8 minutes). Admin
review schedules force chosen items due on a date.

Recycling also happens **outside** the review: lessons list earlier items in
`recycle`, use them in their scripts and exercises, and highlight them as
"seen before" in the transcript. Answers in those lessons update the same
item states.

---

## 9. UI structure

Design language: the site's existing *Quiet Academic* system — cream canvas,
one green accent, generous whitespace, Inter for English, IBM Plex Sans
Arabic for support text. Not game-like: no mascots, confetti, coins or
streak flames. Colour is used for meaning only (correct / almost / wrong,
current step).

```
Home
┌───────────────────────────────────────────┐
│ Good evening                    A2 · Level│
│ ┌───────────────────────────────────────┐ │
│ │ CONTINUE LEARNING                     │ │  ← the one primary action
│ │ Plans for the weekend      Stage 4/11 │ │
│ │ ▓▓▓▓▓▓░░░░░░               [Continue] │ │
│ └───────────────────────────────────────┘ │
│ Today's review  12 items · ~6 min [Start] │
│ ─────────────────────────────────────────  │
│ Listening  Speaking  Vocabulary  Grammar   │  ← quiet shortcuts
│ Progress to B1  ▸ 3 of 4 checks met       │
└───────────────────────────────────────────┘

Lesson player
┌───────────────────────────────────────────┐
│ ← Plans for the weekend        4 / 11     │
│ ●●●●○○○○○○○  INPUT · NOTICE · PRACTICE …  │
│                                           │
│  (one stage at a time, one task at a time)│
│                                           │
│  ┌ feedback panel slides in under task ┐  │
│  │ Your answer · Better · Why          │  │
│  └─────────────────────────────────────┘  │
│                            [Continue →]   │
└───────────────────────────────────────────┘
```

* Mobile-first, single column; max content width 720 px on desktop.
* Bottom navigation (Home · Path · Review · Progress) on phones, top on desktop.
* One primary button per screen.
* English content is LTR; Arabic support text (A0–B1, toggleable) is RTL and
  visually secondary.
* Accessible: keyboard operable, focus rings, 4.5:1 text contrast, dark theme.

---

## Code map

```
learn/
├── index.html · admin.html          app shells (ES modules, no build step)
├── content/                          CONTENT — static JSON, one file per lesson
│   ├── catalog.json                  levels, units, lesson index
│   ├── items.json                    learning items + their contexts (recycling)
│   ├── videos.json                   admin-curated YouTube library
│   ├── lessons/<id>.json             lesson bodies
│   ├── placement.json · assessments.json
├── db/schema.sql                     Postgres/Supabase schema for the server build
├── js/engine/                        LEARNING ENGINE — pure, DOM-free, unit-tested
│   ├── text.js                       normalisation, contractions, fuzzy matching
│   ├── feedback.js                   answer checking + common-error library
│   ├── srs.js                        spaced-review scheduler + mastery rule
│   ├── review.js                     builds review tasks in fresh contexts
│   ├── lesson.js                     stage sequence, lesson scoring
│   ├── roleplay.js                   goal-based dialogue engine
│   ├── progress.js                   skill model, can-dos, level readiness
│   └── placement.js                  staircase placement test
├── js/data/                          STORAGE — repositories (swap for Supabase here)
│   ├── content-repo.js · progress-repo.js · content-schema.js
├── js/ui/                            student UI (router, views, exercise widgets)
├── js/admin/                         admin panel
└── tests/                            node --test
```
