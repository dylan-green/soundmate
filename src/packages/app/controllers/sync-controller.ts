import type { Request, Response } from 'express';
import type { SyncStatus } from '@soundmate/common/library';
import { LIBRARY_CATEGORIES } from '@soundmate/common/library';
import { AppError } from '../errors/app-error.js';
import { sessionTokenStore } from '../lib/session-token-storage.js';
import { getLibrary, getStatus } from '../redis/user-data-repository.js';
import { createSpotifyApiService } from '../services/spotify-api-service.js';
import { runSync } from '../services/user-sync-service.js';

const spotifyApi = createSpotifyApiService();

/**
 * Row-level security: the per-user key always comes from `req.session.userId`,
 * never from the request. A session with no userId (never synced / not logged in)
 * gets a 401, so it's impossible to address another user's data.
 */
function requireUserId(req: Request): string {
  const userId = req.session.userId;
  if (!userId) {
    throw new AppError('Not authenticated', 401);
  }
  return userId;
}

/**
 * POST /me/sync — kick off a background fetch of the user's full library into
 * Redis. Returns immediately (202); the client polls GET /me/sync/status.
 */
export async function startSync(req: Request, res: Response): Promise<void> {
  const store = sessionTokenStore(req);

  // Resolve (and cache) the Spotify user id — this also fails fast with 401 if
  // the session isn't authenticated.
  let userId = req.session.userId;
  if (!userId) {
    const user = await spotifyApi.getCurrentUser(store);
    userId = user.id;
    req.session.userId = userId;
  }

  // Idempotent: if a sync is already running, don't start another.
  const existing = await getStatus(userId);
  if (existing?.state === 'pending') {
    res.status(202).json(existing);
    return;
  }

  // Fire-and-forget. The work continues after this response is sent.
  // NOTE: a refresh inside runSync mutates `req.session.tokens` after the
  // response — fine with the default in-memory session store (same object by
  // reference); a Redis-backed session store would need an explicit save().
  void runSync(store, userId).catch((err) => {
    console.error(`Background sync crashed for user ${userId}:`, err);
  });

  res.status(202).json({ state: 'pending' } satisfies Pick<SyncStatus, 'state'>);
}

/** GET /me/sync/status — the current sync progress for this session's user. */
export async function getSyncStatus(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  res.set('Cache-Control', 'no-store');

  const status = await getStatus(userId);
  if (status) {
    res.json(status);
    return;
  }
  // No status yet — report pending so the client keeps polling.
  const categories = Object.fromEntries(
    LIBRARY_CATEGORIES.map((c) => [c, 'pending'] as const),
  ) as SyncStatus['categories'];
  res.json({
    state: 'pending',
    startedAt: new Date().toISOString(),
    categories,
  } satisfies SyncStatus);
}

/** GET /me/library — the cached library for this session's user. */
export async function getUserLibrary(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const library = await getLibrary(userId);
  res.json(library);
}
