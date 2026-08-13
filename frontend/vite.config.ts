import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  server: {
    port: 5173,
    // Dev convenience: the frontend talks to the Go server same-origin
    // (same code path as the embedded build). Point VITE_API_PROXY at the
    // server (default :8080) — or at :8091 when watching a --demo --serve
    // broadcast. No proxy in production: the Go server serves the built UI.
    proxy: {
      '/api': process.env.VITE_API_PROXY || 'http://127.0.0.1:8080',
      '/events': { target: process.env.VITE_API_PROXY || 'http://127.0.0.1:8080' },
    },
  },
});