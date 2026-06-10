// Auth/token contracts shared between the server and client. The token VALUES
// live server-side (per session); these interfaces are the abstraction services
// depend on, plus the non-sensitive JSON shapes the API exposes to the browser.

/** Spotify tokens stored per user, server-side (keyed by Spotify user id). */
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  scope: string;
  /** Absolute expiry as epoch milliseconds. */
  expiresAt: number;
}

/**
 * Abstraction over where a user's tokens live. At runtime this is backed by
 * Redis, keyed by Spotify user id (see app/lib/user-token-store.ts), so one
 * session can hold many members and each member holds owns their own token.
 */
export interface TokenStore {
  get(): Promise<StoredTokens | null>;
  set(tokens: StoredTokens): Promise<void>;
}

/**
 * Non-sensitive view of a session's membership (GET /session). Lists the
 * connected member ids and which one playback/token endpoints act as. Never
 * includes tokens.
 */
export interface SessionView {
  /** Spotify ids of all members connected to this session. */
  users: string[];
  /** The member playback / token endpoints act as, or null if none. */
  activeUserId: string | null;
  /** Spotify ids of every member in this session's cross-device GROUP */
  groupMembers: string[];
}

export interface InviteResponse {
  /** Full URL to send to the invitee (client origin + ?invite=<token>). */
  url: string;
  /** Absolute expiry of the invite as epoch milliseconds. */
  expiresAt: number;
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
