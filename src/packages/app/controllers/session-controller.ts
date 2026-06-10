import type { Request, Response } from 'express';
import { z } from 'zod';
import type { SessionView } from '@soundmate/common/auth';
import { AppError, BadRequestError } from '../errors/app-error.js';
import { removeSessionUser, sessionUsers } from '../lib/session-users.js';
import { clearTokens } from '../redis/token-repository.js';

/** Build the non-sensitive session view from the current request. */
function viewOf(req: Request): SessionView {
  return {
    users: sessionUsers(req),
    activeUserId: req.session.activeUserId ?? null,
  };
}

/** GET /session — the member roster + active member (never tokens). */
export function getSession(req: Request, res: Response): void {
  res.set('Cache-Control', 'no-store');
  res.json(viewOf(req));
}

const activeSchema = z.object({ userId: z.string().min(1) });

/**
 * POST /session/active { userId } — switch which member playback/token act as.
 * RLS: the target must already be in this session's roster.
 */
export function setActiveUser(req: Request, res: Response): void {
  const parsed = activeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new BadRequestError('Missing userId');
  }
  if (!sessionUsers(req).includes(parsed.data.userId)) {
    throw new AppError('Not a member of this session', 403);
  }
  req.session.activeUserId = parsed.data.userId;
  res.json(viewOf(req));
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
  res.json(viewOf(req));
}
