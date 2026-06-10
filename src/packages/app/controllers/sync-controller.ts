import type { Request, Response } from 'express';
import type {
  LibraryByUser,
  SyncStatus,
  SyncStatusByUser,
} from '@soundmate/common/library';
import { requireSessionUsers } from '../lib/session-users.js';
import { userTokenStore } from '../lib/user-token-store.js';
import { getLibrary, getStatus } from '../redis/user-data-repository.js';
import { pendingStatus, runSync } from '../services/user-sync-service.js';

/**
 * POST /me/sync — fan out: kick off a background library fetch for EVERY member
 * of the session. Returns immediately (202); the client polls GET /me/sync/status
 * for the per-user progress map. Idempotent per member (a member already syncing
 * isn't restarted).
 *
 * Token refreshes during the background sync write straight to Redis
 * (users:<id>:tokens) via the per-user store, so there's no session to save.
 */
export async function startSync(req: Request, res: Response): Promise<void> {
  const users = requireSessionUsers(req);

  await Promise.all(
    users.map(async (userId) => {
      const existing = await getStatus(userId);
      if (existing?.state === 'pending') {
        return; // already running for this member
      }
      // Fire-and-forget; the work continues after this response is sent.
      runSync(userTokenStore(userId), userId).catch((err) => {
        console.error(`Background sync crashed for user ${userId}:`, err);
      });
    }),
  );

  res.status(202).json({ state: 'pending' } satisfies Pick<SyncStatus, 'state'>);
}

/** GET /me/sync/status — sync progress for every member, keyed by user id. */
export async function getSyncStatus(req: Request, res: Response): Promise<void> {
  const users = requireSessionUsers(req);
  res.set('Cache-Control', 'no-store');

  const entries = await Promise.all(
    users.map(async (userId) => {
      // No status yet → report pending so the client keeps polling.
      const status = (await getStatus(userId)) ?? pendingStatus();
      return [userId, status] as const;
    }),
  );

  res.json(Object.fromEntries(entries) satisfies SyncStatusByUser);
}

/** GET /me/library — the cached library for every member, keyed by user id. */
export async function getUserLibrary(req: Request, res: Response): Promise<void> {
  const users = requireSessionUsers(req);

  const entries = await Promise.all(
    users.map(async (userId) => [userId, await getLibrary(userId)] as const),
  );

  res.json(Object.fromEntries(entries) satisfies LibraryByUser);
}
