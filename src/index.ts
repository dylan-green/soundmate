import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { healthCheck } from './app/controllers/home-controller.js';
import { errorHandler, notFoundHandler } from './app/middleware/error-handler.js';
import { sessionMiddleware } from './app/middleware/session.js';
import authRouter from './app/routes/auth-routes.js';
import loginRouter from './app/routes/login-routes.js';
import router from './app/routes/routes.js';

const port = process.env.PORT;
const app = express();

// Global middleware
app.use(express.json());
app.use(sessionMiddleware);

app.use('/login', loginRouter);
app.use('/me', router);
app.use('/auth', authRouter);

// Health check
app.get('/health', healthCheck);

// Serve the built Lit client (production). In dev the Vite server (:5173)
// hosts the client and proxies these API routes back to this server.
const clientDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'public',
);
app.use(express.static(clientDir));

// Error handling — these MUST come last, after all routes.
// notFoundHandler turns unmatched routes into a NotFoundError;
// errorHandler is the single place that formats every error response.
app.use(notFoundHandler);
app.use(errorHandler);

// Start listening
app.listen(port, () => {
  console.log(`Listening on http://127.0.0.1:${port}`);
});
