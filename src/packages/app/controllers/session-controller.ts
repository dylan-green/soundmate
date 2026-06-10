import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { InviteResponse, SessionView } from '@soundmate/common/auth';
import { spotifyConfig } from '../config/spotify.js';
import { AppError, BadRequestError } from '../errors/app-error.js';
import { ensureGroupId, groupMemberIds } from '../lib/session-group.js';
import { removeSessionUser, requireSessionUsers, sessionUsers } from '../lib/session-users.js';
import { createInvite as createInviteRecord, INVITE_TTL_SECONDS } from '../redis/invite-repository.js';
import { clearTokens } from '../redis/token-repository.js';

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

const activeSchema = z.object({ userId: z.string().min(1) });

/**
 * POST /session/active { userId } — switch which member playback/token act as.
 * RLS: the target must already be in this session's roster.
 */
export async function setActiveUser(req: Request, res: Response): Promise<void> {
  const parsed = activeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError('Missing userId');
  }

  if (!sessionUsers(req).includes(parsed.data.userId)) {
    throw new AppError('Not a member of this session', 403);
  }
  req.session.activeUserId = parsed.data.userId;
  res.json(await viewOf(req));
}

/**
 * DELETE /session/users/:id — remove a member from the session and clear their
 * stored tokens (per-member logout).
 */
const removeParamsSchema = z.object({ id: z.string().min(1) });

export async function removeUser(req: Request, res: Response): Promise<void> {
  const params = removeParamsSchema.safeParse(req.params);
  if (!params.success) {
    throw new BadRequestError('Missing user id');
  }
  const { id: userId } = params.data;
  if (removeSessionUser(req, userId)) {
    await clearTokens(userId);
  }
  res.json(await viewOf(req));
}
