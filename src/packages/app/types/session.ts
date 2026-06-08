import 'express-session';
import type { StoredTokens } from '@soundmate/common/auth';

// Augment express-session's SessionData with our per-session fields.
declare module 'express-session' {
  interface SessionData {
    /** The authenticated user's Spotify tokens (server-side only). */
    tokens?: StoredTokens;
    /** Pending OAuth CSRF state, set on /login and verified on /login/callback. */
    oauthState?: string;
    /**
     * The authenticated user's Spotify id. Resolved once (GET /me) and used as the
     * Redis namespace for this user's data. This is the ONLY source of the id for
     * reads/writes — it's never accepted from the client (row-level security).
     */
    userId?: string;
  }
}
