import 'express-session';
import type { StoredTokens } from '../../common/auth.js';

// Augment express-session's SessionData with our per-session fields.
declare module 'express-session' {
  interface SessionData {
    /** The authenticated user's Spotify tokens (server-side only). */
    tokens?: StoredTokens;
    /** Pending OAuth CSRF state, set on /login and verified on /login/callback. */
    oauthState?: string;
  }
}
