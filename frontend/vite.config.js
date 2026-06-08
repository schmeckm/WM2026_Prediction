/// <reference types="vitest" />
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = dirname(fileURLToPath(import.meta.url));
const appVersion = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8')).version;

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION || appVersion),
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'WM 2026 Tippspiel',
        short_name: 'WM2026',
        description: 'FIFA WM 2026 Tippspiel',
        theme_color: '#0A0A0A',
        background_color: '#0A0A0A',
        display: 'standalone',
        lang: 'de',
        icons: [
          { src: '/icons/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Do not precache index.html — always fetch fresh shell after deploy.
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2,webp}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/uploads/, /^\/socket.io/, /^\/assets\//],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/uploads': { target: 'http://127.0.0.1:3000', changeOrigin: true },
      '/socket.io': { target: 'http://127.0.0.1:3000', ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'chart.js': ['chart.js'],
          sentry: ['@sentry/vue'],
          'socket.io-client': ['socket.io-client'],
        },
      },
    },
  },
});
