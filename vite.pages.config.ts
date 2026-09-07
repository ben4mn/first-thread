import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath, URL } from 'node:url';

// The workshop is browser-only. Build its same React component directly for
// Pages, avoiding a server/RSC runtime and framework base-path prerendering.
export default defineConfig({
  base: process.env.PAGES_BASE_PATH ? `${process.env.PAGES_BASE_PATH}/` : '/',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  server: {
    proxy: process.env.FIRST_THREAD_AI
      ? { '/api/ai': 'http://127.0.0.1:5276' }
      : undefined,
  },
  build: { outDir: 'dist/client', emptyOutDir: true },
});
