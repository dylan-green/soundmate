import { defineConfig } from 'vite';

const API_TARGET = 'http://127.0.0.1:8080';

export default defineConfig({
  // The client app lives here; index.html is the Vite entry.
  root: 'src/client',

  server: {
    // Bind to IPv4 127.0.0.1 (not the default 'localhost', which can resolve to
    // IPv6 ::1 only). This must match the 127.0.0.1 address we redirect to and
    // that Spotify uses for the callback.
    host: '127.0.0.1',
    port: 5173,
    // In dev the client is on :5173 and the API on :8080. Proxy backend routes
    // so relative fetches (e.g. /login/status) reach Express.
    proxy: {
      '/login': API_TARGET,
      '/me': API_TARGET,
      '/auth': API_TARGET,
      '/health': API_TARGET,
    },
  },

  build: {
    // Build into dist/public so the Express server can serve it in production
    // (see src/index.ts express.static).
    outDir: '../../dist/public',
    emptyOutDir: true,
  },
});
