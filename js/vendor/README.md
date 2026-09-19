# Vendored browser libraries

These are served from this site, not from a CDN. A CDN script tag is a
third party that can change what it serves at any time, on pages that hold
a signed-in session — and `@2` was a floating major, so the site ran
whatever had been published most recently. Serving them ourselves means the
content-security-policy can allow scripts from this origin only.

Both files were taken from the npm tarball and checked against the
integrity hash npm publishes for that exact version:

| file | package | version | npm integrity (tarball) |
| --- | --- | --- | --- |
| `supabase-js-2.116.0.js` | `@supabase/supabase-js` | 2.116.0 | `sha512-YyWmKXt2NspV9iO8FPnlswUFJIRnrLd3oTCb+3ZyYRuKZtBH0xCUDgnUqoyA0fGUxpM/UhfwDjYf/dht/9bp7g==` |
| `xlsx-0.18.5.min.js` | `xlsx` (SheetJS) | 0.18.5 | `sha512-dmg3LCjBPHZnQp5/F/+nnTa+miPJxUXB6vtk42YjBBKayDNagxGEeIdWApkYPOf3Z3pm3k62Knjzp7lMeTEtFQ==` |

`supabase-js-2.116.0.js` is `dist/umd/supabase.js`; `xlsx-0.18.5.min.js` is
`dist/xlsx.full.min.js`. Neither file is edited.

## Known issue with xlsx 0.18.5

SheetJS 0.18.5 is affected by CVE-2023-30533 — prototype pollution while
reading a crafted spreadsheet, which is exactly what the admin importer
does. **0.18.5 is the newest version npm has**; the fix lands in 0.19.3,
published only at https://cdn.sheetjs.com, so it cannot be pulled from npm.

Until it is updated, the safe path is the importer's other two formats:
**CSV and JSON never touch SheetJS at all** — `parseQuestionFile()` in
`js/api.js` only loads it for `.xlsx`/`.xls`. Converting a spreadsheet from
an unfamiliar source to CSV before importing avoids the issue entirely.

## Updating one of these

    npm pack @supabase/supabase-js@<version>
    tar xzf supabase-supabase-js-<version>.tgz
    cp package/dist/umd/supabase.js js/vendor/supabase-js-<version>.js

Then update the `<script src>` on every page that loads it, and this file.
The version is in the filename so an update cannot be served from a stale
cache.
