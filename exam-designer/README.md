# مصمّم الامتحانات (Exam Paper Designer)

A React + TypeScript (Vite) app for building exam papers and exporting them as print-ready PDFs.
The source lives here. `npm run build` writes the static site to `../exam`, which the existing site serves at `/exam`.

```bash
npm install
npm run dev      # http://localhost:5173/exam/
npm run build    # type-check + build into ../exam
```

## Structure
- `src/model.ts`, `src/types.ts`: exam data model, question types, numbering and labels
- `src/store.ts`: autosave to IndexedDB
- `src/paper/`: the paper renderer, used by both the live preview and the PDF
  - `blocks.tsx` turns an exam into groups of *segments* (the units the paginator can move)
  - `Paper.tsx` measures segments at the real page width in mm, paginates them (a question is never split
    inside a segment, and its heading stays with what follows), and decides whether two copies fit on one sheet
- `src/editor/`: the step panels (info, questions, design, preview, export)

## PDF export
Export renders the same paper DOM unscaled into `#print-root`, sets `@page` to the paper size with zero margins,
and opens the browser's print engine ("Save as PDF"). The output is vector text with embedded fonts, so Arabic
shaping and bidirectional text are correct. It is not a screenshot.
