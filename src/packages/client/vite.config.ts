import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

const API_TARGET = 'http://127.0.0.1:8080';

// Resolve @soundmate/common to its TypeScript source so dev + build never depend
// on the common package being compiled first (the app, on NodeNext, consumes the
// built ./dist instead — see the package's exports map).
const commonDir = fileURLToPath(new URL('../common', import.meta.url));

export default defineConfig({
  // The Vite project root is this client package (index.html lives here).
  root: fileURLToPath(new URL('.', import.meta.url)),

  resolve: {
    alias: [
      { find: /^@soundmate\/common$/, replacement: `${commonDir}/index.ts` },
      { find: /^@soundmate\/common\/(.*)$/, replacement: `${commonDir}/$1.ts` },
    ],
  },

  server: {
    // Bind to IPv4 127.0.0.1 (not the default 'localhost', which can resolve to
    // IPv6 ::1 only). This must match the 127.0.0.1 address we redirect to and
    // that Spotify uses for the callback.
    host: '127.0.0.1',
    port: 5173,
    // In dev the client is on :5173 and the API on :8080. Proxy backend routes
    // so relative fetches reach Express and stay same-origin (the session cookie
    // works without cross-site config). In production the client is a separate
    // static origin and talks to the API via VITE_API_BASE_URL + CORS.
    proxy: {
      '/login': API_TARGET,
      '/me': API_TARGET,
      '/auth': API_TARGET,
      '/health': API_TARGET,
    },
  },

  build: {
    // Build into the repo-root dist/client for independent static deploy.
    outDir: fileURLToPath(new URL('../../../dist/client', import.meta.url)),
    emptyOutDir: true,
  },
});
