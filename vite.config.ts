import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// O deploy é no GitHub Pages em https://<user>.github.io/LifeOS/ (seção 6/11).
// Em desenvolvimento a base é '/'. Permite override por env para forks.
const base = process.env.LIFEOS_BASE ?? (process.env.NODE_ENV === 'production' ? '/LifeOS/' : '/');

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@domain': fileURLToPath(new URL('./src/domain', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
