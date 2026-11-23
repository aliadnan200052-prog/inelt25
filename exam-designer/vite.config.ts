import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Writes /exam-sw.js at the site root with the list of built files to precache. */
function serviceWorker(): Plugin {
  return {
    name: 'exam-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => f !== 'index.html');
      const publicFiles = ['manifest.webmanifest', 'favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
      const assets = [...files, ...publicFiles].map((f) => '/exam/' + f).sort();
      const version = createHash('sha1').update(assets.join('\n')).digest('hex').slice(0, 10);
      const src = readFileSync(resolve(__dirname, 'sw/exam-sw.js'), 'utf8')
        .replace('__VERSION__', version)
        .replace('__ASSETS__', JSON.stringify(assets, null, 2));
      writeFileSync(resolve(__dirname, '../exam-sw.js'), src);
    },
  };
}

// Built into ../exam so the existing static site serves it at /exam
export default defineConfig({
  base: '/exam/',
  plugins: [react(), serviceWorker()],
  build: {
    outDir: '../exam',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
