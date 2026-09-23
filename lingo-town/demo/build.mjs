/**
 * Builds the single-file demo: demo/dist/lingo-town-demo.html.
 * esbuild bundles the real screens with Next's Link/router swapped for
 * in-memory shims; Tailwind compiles the same globals.css.
 */
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "demo/dist");
mkdirSync(out, { recursive: true });

const js = await build({
  entryPoints: [join(root, "demo/App.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    "next/link": join(root, "demo/shims/next-link.tsx"),
    "next/navigation": join(root, "demo/shims/next-navigation.ts"),
    "@": root,
  },
  logLevel: "warning",
  logOverride: { "unsupported-directive": "silent" },
});

execFileSync(
  join(root, "node_modules/.bin/tailwindcss"),
  ["-i", join(root, "app/globals.css"), "-o", join(out, "app.css"), "--minify"],
  { cwd: root, stdio: "inherit" },
);

const css = readFileSync(join(out, "app.css"), "utf8");
const script = js.outputFiles[0].text.replaceAll("</script", "<\\/script");
const fonts =
  "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400..700&family=Fraunces:opsz,wght,SOFT@9..144,400..700,0..100&family=IBM+Plex+Sans+Arabic:wght@400;500;600&display=swap";

const html = `<title>Lingo Town</title>
<meta name="description" content="Practise real English conversations in a cozy little town.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>
:root{--font-fraunces:"Fraunces";--font-dm-sans:"DM Sans";--font-plex-arabic:"IBM Plex Sans Arabic"}
${css}
/* Unlayered, so it beats the host page's own body reset. */
html,body{background:var(--lt-bg)}
body{margin:0;color:var(--lt-ink);font-family:var(--font-sans);font-size:1rem;line-height:1.55}
</style>
<div id="root"></div>
<script>${script}</script>
`;
writeFileSync(join(out, "lingo-town-demo.html"), html);
console.log(`demo/dist/lingo-town-demo.html  ${(html.length / 1024).toFixed(0)} KB`);
