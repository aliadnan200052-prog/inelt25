import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built into ../exam so the existing static site serves it at /exam
export default defineConfig({
  base: '/exam/',
  plugins: [react()],
  build: {
    outDir: '../exam',
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
