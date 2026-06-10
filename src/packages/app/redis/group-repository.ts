import { getRedis } from './redis-client.js';
import { groupNamespace } from './user-keys.js';

/**
 * Repository for cross-device soundmate GROUPS in Redis. A group is a SET of
 * member Spotify ids, shared by every session that references the same groupId
 * (lib/session-group.ts). It is the read-only blend roster — distinct from the
 * per-session `users` roster — so peers can see each other's data without ever
 * sharing tokens or playback. Knows nothing about Express or HTTP.
 *
 * Ids must always be server-derived Spotify ids (resolved via GET /me at login),
 * never client-supplied (row-level security).
 */

/** 7 days, matching the session/token TTL. Refreshed on every write. */
const TTL_SECONDS = 60 * 60 * 24 * 7;

const membersKey = (groupId: string): string => `${groupNamespace(groupId)}:members`;

/** Add a member to the group (idempotent — a SET) and refresh the TTL. */
export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  const redis = await getRedis();
  const key = membersKey(groupId);
  await redis.sAdd(key, userId);
  await redis.expire(key, TTL_SECONDS);
}

/** Every member id in the group (empty array if the group is absent/expired). */
export async function getGroupMembers(groupId: string): Promise<string[]> {
  const redis = await getRedis();
  return redis.sMembers(membersKey(groupId));
}

/** Remove a member from the group. */
export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  const redis = await getRedis();
  await redis.sRem(membersKey(groupId), userId);
}
