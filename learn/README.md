# Learn English (`/learn`)

A language-learning app built on SLA principles: every lesson runs the loop
**real language → understand → notice → practise → retrieve → use → feedback → reuse later**,
from A0 (complete beginner) to C1. Full product and system design: [`docs/DESIGN.md`](docs/DESIGN.md).

- Student app: `/learn/` · Admin panel: `/learn/admin`
- Static ES modules, no build step, same conventions and design system as the rest of the site.

## Run locally

```sh
python3 -m http.server 8000        # from the repository root
# open http://localhost:8000/learn/index.html and http://localhost:8000/learn/admin.html
```

## Tests

```sh
cd learn && npm test
```

The tests cover the learning engine (answer matching, feedback, spaced review and the
mastery rule, role-play, placement, lesson completion, level readiness). They also
validate **all shipped content** with the same schema the admin panel uses: references,
exercise shapes, "retrieval has no multiple choice", every role-play completes with its
model answers, recycling across levels, and so on.

## Structure

| Layer | Where | Notes |
| --- | --- | --- |
| Learning engine | `js/engine/` | Pure, DOM-free, unit-tested |
| Content | `content/` | JSON: `catalog.json`, `items.json`, `videos.json`, `lessons/<id>.json`, `placement.json`, `assessments.json`, `schedules.json` |
| Content schema | `js/data/content-schema.js` | Admin forms, line formats and validation |
| Storage | `js/data/content-repo.js`, `js/data/progress-repo.js` | Repository interfaces (local implementation) |
| Student UI | `js/ui/` | Router, views, exercise widgets, speech |
| Admin | `js/admin/` | Content management |
| Server schema | `db/schema.sql` | Postgres/Supabase tables + RLS for the multi-user build |

## What this build does and doesn't do

- **Progress is per browser.** Learner data lives in `localStorage`. Learners can download it
  (Settings), and teachers can import those files under Admin → Student progress.
- **Admin edits are per browser until published.** Export the bundle in Admin → Overview, then run
  `node learn/tools/apply-bundle.mjs learn-content-bundle.json` and commit `learn/content/`.
  For live multi-user editing, create the tables in `db/schema.sql` and implement the two
  repository classes against them. The engine and UI don't change.
- **Audio.** Lesson scripts are read by the browser's speech synthesis until real audio is added
  (the `audio` field on script lines and items) or a YouTube video is attached. Voice quality
  depends on the device.
- **Speaking is practised, not scored.** Learners record and compare with the model. Optional
  browser speech recognition is off by default (Settings) and is presented only as a rough guide.
- **No YouTube videos ship with the content.** Admins add and level them by hand.
