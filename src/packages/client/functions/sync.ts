import type { LibraryByUser, SyncStatusByUser } from '@soundmate/common/library';
import { apiFetch } from './api';

/**
 * Browser helpers for the login-time library sync. In dev, Vite proxies /me/* to
 * the Express server (see vite.config.ts).
 */

/** Kick off the background fetch of the user's library into Redis. */
export async function startSync(): Promise<void> {
  const response = await apiFetch('/me/sync', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to start sync (HTTP ${response.status})`);
  }
}

/**
 * Poll sync progress for every connected member, keyed by Spotify user id.
 * (The session is multi-user, so this is a map — pick the member you care about.)
 */
export async function getSyncStatus(): Promise<SyncStatusByUser> {
  const response = await apiFetch('/me/sync/status');
  if (!response.ok) {
    throw new Error(`Failed to fetch sync status (HTTP ${response.status})`);
  }
  return (await response.json()) as SyncStatusByUser;
}

/**
 * Fetch the cached library for every connected member, keyed by user id (only
 * meaningful once that member's sync is ready).
 */
export async function getLibrary(): Promise<LibraryByUser> {
  const response = await apiFetch('/me/library');
  if (!response.ok) {
    throw new Error(`Failed to fetch library (HTTP ${response.status})`);
  }
  return (await response.json()) as LibraryByUser;
}
