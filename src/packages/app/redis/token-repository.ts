import type { StoredTokens } from '@soundmate/common/auth';
import { getRedis } from './redis-client.js';
import { userNamespace } from './user-keys.js';

/**
 * Repository for per-user Spotify tokens in Redis. Tokens live OUTSIDE the
 * session blob, keyed by Spotify user id, so a single session can reference many
 * users and each owns their own tokens. Knows nothing about Express or HTTP.
 *
 * The id must always be a server-derived Spotify id (resolved via GET /me at
 * login), never one supplied by the client.
 */

/** 7 days, matching the session TTL. Refreshed on every write (incl. refresh). */
const TTL_SECONDS = 60 * 60 * 24 * 7;

const tokensKey = (userId: string): string => `${userNamespace(userId)}:tokens`;

/** Read a user's stored tokens, or null if absent/expired. */
export async function getTokens(userId: string): Promise<StoredTokens | null> {
  const redis = await getRedis();
  const raw = await redis.get(tokensKey(userId));
  return raw ? (JSON.parse(raw) as StoredTokens) : null;
}

/** Persist a user's tokens (overwrites; refreshes the TTL). */
export async function setTokens(userId: string, tokens: StoredTokens): Promise<void> {
  const redis = await getRedis();
  await redis.set(tokensKey(userId), JSON.stringify(tokens), { EX: TTL_SECONDS });
}

/** Delete a user's tokens (per-member logout). */
export async function clearTokens(userId: string): Promise<void> {
  const redis = await getRedis();
  await redis.del(tokensKey(userId));
}
