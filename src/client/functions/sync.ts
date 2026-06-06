import type { Library, SyncStatus } from '../../common/library';

/**
 * Browser helpers for the login-time library sync. In dev, Vite proxies /me/* to
 * the Express server (see vite.config.ts).
 */

/** Kick off the background fetch of the user's library into Redis. */
export async function startSync(): Promise<void> {
  const response = await fetch('/me/sync', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to start sync (HTTP ${response.status})`);
  }
}

/** Poll the current sync progress. */
export async function getSyncStatus(): Promise<SyncStatus> {
  const response = await fetch('/me/sync/status');
  if (!response.ok) {
    throw new Error(`Failed to fetch sync status (HTTP ${response.status})`);
  }
  return (await response.json()) as SyncStatus;
}

/** Fetch the cached library (only meaningful once the sync is ready). */
export async function getLibrary(): Promise<Library> {
  const response = await fetch('/me/library');
  if (!response.ok) {
    throw new Error(`Failed to fetch library (HTTP ${response.status})`);
  }
  return (await response.json()) as Library;
}
