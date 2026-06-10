import { getRedis } from './redis-client.js';

/**
 * Repository for soundmate invite tokens in Redis. A token is an opaque,
 * server-minted randomUUID that maps to a groupId — NEVER the session id, so a
 * leaked link can't hijack a session or expose the cookie. Multi-use within a
 * short TTL: the same link can add several people until it expires; it is not
 * deleted on use. Knows nothing about Express or HTTP.
 */

/** 2 hours — long enough to share a link, short enough to limit a leak. */
export const INVITE_TTL_SECONDS = 60 * 60 * 2;

const inviteKey = (token: string): string => `invites:${token}`;

/** Persist token -> groupId (overwrites; refreshes the TTL). */
export async function createInvite(token: string, groupId: string): Promise<void> {
  const redis = await getRedis();
  await redis.set(inviteKey(token), groupId, { EX: INVITE_TTL_SECONDS });
}

/** Resolve an invite token to its groupId, or null if invalid/expired. */
export async function getInviteGroup(token: string): Promise<string | null> {
  const redis = await getRedis();
  return redis.get(inviteKey(token));
}
