# Lingo Town

A mobile-first English speaking-practice app for Arab learners, set in a cozy illustrated town.
This is the front-end phase: every screen is built. Conversations, speech recognition and AI replies
are mocked behind typed service interfaces, so real providers plug in without UI changes.

## Run

```bash
cd lingo-town
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (all routes prerender statically)
npm run lint       # type-check
```

The service worker only registers in production builds (`npm run build && npm start`).

## Screens

| Route | Screen |
| --- | --- |
| `/` | Town: greeting, today's scene, illustrated map, people you know |
| `/scene/[sceneId]` | Listen & Learn: scene playback with captions and Slower, key phrases, rescue phrase |
| `/scene/[sceneId]/talk` | Talk: chat with recasts, hold-to-speak mic, hints, keyboard fallback. `?level=harder` hides hints and speeds speech up |
| `/scene/[sceneId]/review` | Review: success, what went well, one correction, phrases added |
| `/phrasebook` | Saved phrases by place, with a "due for review" recall deck |
| `/me` | Stats, light/dark/auto theme, reset |
| `/offline` | Offline fallback (precached) |

## Structure

```
app/                 routes, root layout (fonts, PWA metadata), manifest.ts, globals.css (tokens)
components/
  ui/                Button, ButtonLink, Card, Chip, IconButton, Pill, Ar (Arabic text)
  nav/               TabBar, TopBar, PageTransition, ServiceWorker
  town/ scene/ talk/ review/ phrasebook/ me/   screen components
  illustrations/     inline SVG: Portrait, TownMap buildings, SceneArt, SuccessBadge, LogoMark
data/                types.ts + mock content (scenes, characters, places)
lib/
  services/          speechToText, textToSpeech, startRecording, getCharacterReply, summarizeSession
  progress.ts        learner progress (localStorage now, Supabase later)
  haptics.ts motion.ts theme.ts hooks/
public/              sw.js, icons, iOS splash screens
```

## Design tokens

Defined once as CSS variables in `app/globals.css` (light + dark), then mapped into Tailwind v4
utilities in the `@theme` block (Tailwind v4's replacement for `tailwind.config`).

- Colours: `cream` `surface` `line` `ink` `muted` `teal` `teal-pressed` `teal-soft` `terra` `terra-deep` `terra-soft`
- Radius: `rounded-card` 22px, `rounded-btn` 16px, pills `rounded-full`
- Shadows: `shadow-soft` `shadow-card` `shadow-lift` `shadow-teal`
- Type: Fraunces (display), DM Sans (UI), IBM Plex Sans Arabic (`<Ar>` always sets `lang="ar" dir="rtl"`).
  Scale: `text-xs` 12, `sm` 14, `base` 16, `lg` 20, `xl` 28, `2xl` 34

All text/background token pairs meet 4.5:1 in both themes.

## Plugging in real services

`lib/services/index.ts` is the only file to change. Implement `SpeechService` and `ConversationService`
from `lib/services/types.ts`:

- `startRecording()`: return a `Recording` backed by `MediaRecorder`; `level()` drives the waveform.
- `speechToText({ audio, scene, stepIndex })`: POST the blob to a route handler (e.g. Whisper).
- `getCharacterReply({ scene, history, learnerText, stepIndex })`: call an LLM from a route handler.
  Return the corrected form as a `highlights` range so the recast is shown softly.
- `summarizeSession(scene, history)`: wins first, one focused `Correction`.
- `textToSpeech(text, opts)`: currently the browser's speech engine; swap for pre-generated audio or a TTS API.

Scene content lives in `data/scenes.ts`, typed by `data/types.ts`. Progress functions in
`lib/progress.ts` (`savePhrases`, `reviewPhrase`, `completeScene`) are the seam for Supabase.

## Deploy (Vercel)

Create a separate Vercel project from this repo with **Root Directory = `lingo-town`**.
The repo root keeps deploying the existing INELT site. `.vercelignore` at the root excludes this folder from it.
