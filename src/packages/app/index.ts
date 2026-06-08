import cors from 'cors';
import express from 'express';
import { healthCheck } from './controllers/home-controller.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { securityHeaders } from './middleware/security-headers.js';
import { createSessionMiddleware } from './middleware/session.js';
import { getRedis } from './redis/redis-client.js';
import authRouter from './routes/auth-routes.js';
import loginRouter from './routes/login-routes.js';
import router from './routes/routes.js';

const port = Number(process.env.PORT) || 8080;

async function main(): Promise<void> {
  // Connect the shared Redis client once at boot — the session store and the
  // library repository both ride on this single connection. Fail fast if Redis
  // is unreachable rather than erroring per-request later.
  const redis = await getRedis();

  const app = express();

  // Behind a TLS-terminating proxy in production, trust X-Forwarded-Proto so the
  // session's `secure` cookie is actually set (express-session checks req.secure).
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // The client is deployed as a separate static origin (see @soundmate/client),
  // so browser requests to this API are cross-site. Allow that single origin
  // with credentials so the session cookie rides along. In dev the Vite proxy
  // keeps things same-origin, so CORS is a no-op there.
  const clientOrigin = process.env.CLIENT_BASE_URL;
  if (clientOrigin) {
    app.use(cors({ origin: clientOrigin, credentials: true }));
  }

  // Global middleware
  app.use(securityHeaders);
  app.use(express.json());
  app.use(createSessionMiddleware(redis));

  app.use('/login', loginRouter);
  app.use('/me', router);
  app.use('/auth', authRouter);

  // Health check
  app.get('/health', healthCheck);

  // Error handling — these MUST come last, after all routes.
  // notFoundHandler turns unmatched routes into a NotFoundError;
  // errorHandler is the single place that formats every error response.
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start listening
  app.listen(port, () => {
    console.log(`Listening on http://127.0.0.1:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
