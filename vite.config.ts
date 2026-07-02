import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import { VitePWA } from 'vite-plugin-pwa';

// O deploy é no GitHub Pages em https://<user>.github.io/LifeOS/ (seção 6/11).
// Em desenvolvimento a base é '/'. Permite override por env para forks.
const base = process.env.LIFEOS_BASE ?? (process.env.NODE_ENV === 'production' ? '/LifeOS/' : '/');

export default defineConfig({
  base,
  plugins: [
    // PWA: instalável no iPad/celular/PC, tela cheia e offline (Workbox).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon.png'],
      manifest: {
        name: 'LifeOS — Gêmeo Digital da Vida',
        short_name: 'LifeOS',
        description: 'Sua vida, espelhada: casa, rotina, estoque, finanças e cães, num jogo.',
        lang: 'pt-BR',
        theme_color: '#0d1220',
        background_color: '#0d1220',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
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
