import type { StoredTokens, TokenStore } from '@soundmate/common/auth';
import { clearTokens, getTokens, setTokens } from '../redis/token-repository.js';

/**
 * A TokenStore backed by Redis, keyed by Spotify user id. This is what the
 * auth/data services receive — they stay framework-agnostic while tokens live
 * per-user in Redis (not in the session blob), so one session can hold many
 * users and a token refresh persists immediately (no session save needed).
 */
export function userTokenStore(userId: string): TokenStore {
  return {
    get: () => getTokens(userId),
    set: (tokens) => setTokens(userId, tokens),
    clear: () => clearTokens(userId),
  };
}

/**
 * An ephemeral, in-memory TokenStore over freshly-exchanged tokens. Used only
 * during login — we need a store to call GET /me and learn the user's id BEFORE
 * we can key the persistent store. Never persisted.
 */
export function memoryTokenStore(initial: StoredTokens): TokenStore {
  let tokens: StoredTokens | null = initial;
  return {
    get: async () => tokens,
    set: async (next) => {
      tokens = next;
    },
    clear: async () => {
      tokens = null;
    },
  };
}
