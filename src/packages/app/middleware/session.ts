import { RedisStore } from 'connect-redis';
import type { RequestHandler } from 'express';
import session from 'express-session';
import type { RedisClientType } from 'redis';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** 7 days — keep the store TTL in lockstep with the cookie below. */
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Build the session middleware backed by a shared Redis store. The cookie holds
 * only an opaque session id; the tokens themselves live server-side in Redis,
 * so sessions survive redeploys and are shared across instances.
 *
 * Takes the already-connected, process-wide client (see `redis/redis-client.ts`)
 * — the same connection the library repository uses, no second connect.
 */
export function createSessionMiddleware(client: RedisClientType): RequestHandler {
  const store = new RedisStore({
    client,
    prefix: 'soundmate:sess:',
    ttl: SESSION_TTL_SECONDS, // seconds; refreshed on write
  });

  // The client is served from a separate origin in production, so the session
  // cookie rides cross-site on its fetch calls. That requires
  // `SameSite=None; Secure` (paired with CORS `credentials: true` on the API).
  // In dev the Vite proxy keeps client + API same-origin, so `Lax` is fine and
  // works without HTTPS.
  const isProd = process.env.NODE_ENV === 'production';

  return session({
    store,
    secret: required('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // not readable from JS
      sameSite: isProd ? 'none' : 'lax', // cross-site in prod, same-origin in dev
      secure: isProd, // HTTPS-only in production (required by SameSite=None)
      maxAge: SESSION_TTL_SECONDS * 1000, // ms
    },
  });
}
