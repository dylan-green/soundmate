import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { AppError } from '../errors/app-error.js';
import { addGroupMember, getGroupMembers } from '../redis/group-repository.js';
import { sessionUsers } from './session-users.js';

/**
 * Helpers for the cross-device soundmate GROUP — a redis-backed roster shared by
 * every session pointing at the same `req.session.groupId`. The group is the
 * union of members across devices and drives READ-ONLY blended views (library,
 * sync status, peer top-items).
 */

/** The group this session belongs to, if any. */
export function sessionGroupId(req: Request): string | undefined {
  return req.session.groupId;
}

/**
 * Return this session's groupId, creating one if absent. A new group is seeded
 * with the browser's own authenticated accounts (`req.session.users`). Called
 * when minting an invite so the inviter is already a member.
 */
export async function ensureGroupId(req: Request): Promise<string> {
  const existing = req.session.groupId;
  if (existing) {
    return existing;
  }
  const groupId = randomUUID();
  req.session.groupId = groupId;
  await Promise.all(sessionUsers(req).map((id) => addGroupMember(groupId, id)));
  return groupId;
}

/**
 * The full blend roster for this session: the union of the browser's own logins
 * and every member of its group (deduped). Falls back to just the own logins
 * when the session has no group yet. Cached reads over these ids need no token.
 */
export async function groupMemberIds(req: Request): Promise<string[]> {
  const own = sessionUsers(req);
  const groupId = req.session.groupId;
  if (!groupId) {
    return own;
  }
  const members = await getGroupMembers(groupId);
  return [...new Set([...own, ...members])];
}

/**
 * Pure row-level-security check: a target id may only be addressed if it's part
 * of the caller's blend roster. Throws 403 otherwise. Exported for unit testing.
 */
export function assertGroupMember(memberIds: string[], targetId: string): void {
  if (!memberIds.includes(targetId)) {
    throw new AppError('Not a member of this group', 403);
  }
}

/**
 * RLS gate for the optional `?userId=` query param on data reads: the requested
 * member must be in the caller's group. Lets a peer view another member's live
 * data while keeping that member's token strictly server-side.
 */
export async function requireGroupMember(req: Request, targetId: string): Promise<void> {
  assertGroupMember(await groupMemberIds(req), targetId);
}
