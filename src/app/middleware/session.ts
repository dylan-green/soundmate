import type { RequestHandler } from 'express';
import session from 'express-session';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Session middleware. The cookie holds only an opaque session id; the tokens
 * themselves live server-side in the session store.
 *
 * NOTE: the default store is in-memory (per-process). Fine for dev, but for
 * production/multi-instance use a shared store (Redis, etc.) and serve over
 * HTTPS so `secure` cookies apply.
 */
export const sessionMiddleware: RequestHandler = session({
  secret: required('SESSION_SECRET'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // not readable from JS
    sameSite: 'lax', // sent on the top-level OAuth callback navigation
    secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});
