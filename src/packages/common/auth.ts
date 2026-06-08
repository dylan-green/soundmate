// Auth/token contracts shared between the server and client. The token VALUES
// live server-side (per session); these interfaces are the abstraction services
// depend on, plus the non-sensitive JSON shapes the API exposes to the browser.

/** Spotify tokens stored per user session, server-side. */
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  scope: string;
  /** Absolute expiry as epoch milliseconds. */
  expiresAt: number;
}

/**
 * Abstraction over where a user's tokens live. At runtime this is backed by the
 * Express session (see app/lib/session-token-storage.ts), but services depend
 * only on this interface — they never import Express.
 */
export interface TokenStore {
  get(): StoredTokens | null;
  set(tokens: StoredTokens): void;
  clear(): void;
}

/** Shape of the JSON returned by the server's GET /login/status endpoint. */
export interface LoginStatus {
  status: 'authenticated' | 'unauthenticated';
  /** Granted scopes (space-separated). Present only when authenticated. */
  scope?: string;
  /** ISO timestamp of access-token expiry. Present only when authenticated. */
  expiresAt?: string;
}

/**
 * Shape of GET /auth/token — a short-lived access token for the browser (e.g.
 * the Web Playback SDK). The refresh token and Client Secret never leave the
 * server.
 */
export interface UserTokenResponse {
  accessToken: string;
  /**
   * Absolute expiry of THIS access token as epoch milliseconds. Lets the
   * browser cache the token and know when to re-fetch, without decoding it.
   */
  expiresAt: number;
}
