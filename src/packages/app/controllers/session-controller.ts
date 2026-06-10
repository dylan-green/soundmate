import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { InviteResponse, SessionView } from '@soundmate/common/auth';
import { spotifyConfig } from '../config/spotify.js';
import { ensureGroupId, groupMemberIds } from '../lib/session-group.js';
import { requireSessionUsers, sessionUsers } from '../lib/session-users.js';
import { createInvite as createInviteRecord, INVITE_TTL_SECONDS } from '../redis/invite-repository.js';

/** Build the non-sensitive session view from the current request. */
async function viewOf(req: Request): Promise<SessionView> {
  return {
    users: sessionUsers(req),
    activeUserId: req.session.activeUserId ?? null,
    groupMembers: await groupMemberIds(req),
  };
}

/** GET /session — the member roster + active member + group (never tokens). */
export async function getSession(req: Request, res: Response): Promise<void> {
  res.set('Cache-Control', 'no-store');
  res.json(await viewOf(req));
}

/**
 * POST /session/invite — mint a shareable link that adds whoever opens it (after
 * a Spotify login) to this session's group. Requires an authenticated session;
 * lazily creates the group seeded with this browser's own members.
 */
export async function createInvite(req: Request, res: Response): Promise<void> {
  requireSessionUsers(req); // 401 if this browser isn't authenticated
  const groupId = await ensureGroupId(req);
  const token = randomUUID();
  await createInviteRecord(token, groupId);
  const payload: InviteResponse = {
    url: `${spotifyConfig.clientBaseUrl}/?invite=${token}`,
    expiresAt: Date.now() + INVITE_TTL_SECONDS * 1000,
  };
  res.set('Cache-Control', 'no-store');
  res.json(payload);
}
