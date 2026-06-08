import type { TokenStore } from '@soundmate/common/auth';
import {
  LIBRARY_CATEGORIES,
  type LibraryCategory,
  type SyncStatus,
} from '@soundmate/common/library';
import {
  type CategoryData,
  setCategory,
  setStatus,
} from '../redis/user-data-repository.js';
import { createSpotifyApiService } from './spotify-api-service.js';

const spotifyApi = createSpotifyApiService();

/** Spotify caps list endpoints at 50 items per page; one page is enough here. */
const LIMIT = 50;
const TIME_RANGE = 'long_term' as const;

function pendingStatus(): SyncStatus {
  const categories = Object.fromEntries(
    LIBRARY_CATEGORIES.map((c) => [c, 'pending'] as const),
  ) as SyncStatus['categories'];
  return { state: 'pending', startedAt: new Date().toISOString(), categories };
}

/**
 * Fetch every library category for `userId` and cache it in Redis, updating the
 * sync status as each category lands so the client can show progress. Per-category
 * failures are recorded but never abort the whole sync — partial data is fine.
 *
 * Express-free: takes a TokenStore + the server-resolved userId.
 */
export async function runSync(store: TokenStore, userId: string): Promise<void> {
  const status = pendingStatus();
  await setStatus(userId, status);

  // Fetch + persist one category, then persist progress. Generic so the fetcher's
  // result type is checked against the category's stored shape.
  async function syncOne<C extends LibraryCategory>(
    category: C,
    fetcher: () => Promise<CategoryData[C]>,
  ): Promise<void> {
    try {
      const data = await fetcher();
      await setCategory(userId, category, data);
      status.categories[category] = 'ok';
    } catch (err) {
      console.error(`Sync failed for ${category} (user ${userId}):`, err);
      status.categories[category] = 'error';
    }
    await setStatus(userId, status);
  }

  await Promise.all([
    syncOne('topTracks', async () =>
      (await spotifyApi.getTopTracks({ options: { timeRange: TIME_RANGE, limit: LIMIT }, store })).items,
    ),
    syncOne('topArtists', async () =>
      (await spotifyApi.getTopArtists({ options: { timeRange: TIME_RANGE, limit: LIMIT }, store })).items,
    ),
    syncOne('followedArtists', () => spotifyApi.getFollowedArtists({ limit: LIMIT, store })),
    syncOne('savedAlbums', () => spotifyApi.getSavedAlbums({ limit: LIMIT, store })),
    syncOne('playlists', async () =>
      (await spotifyApi.getTopPlaylists({ options: { timeRange: TIME_RANGE, limit: LIMIT }, store })).items,
    ),
    syncOne('savedTracks', () => spotifyApi.getSavedTracks({ limit: LIMIT, store })),
  ]);

  // Ready as long as something loaded; error only if every category failed.
  const anyOk = LIBRARY_CATEGORIES.some((c) => status.categories[c] === 'ok');
  status.state = anyOk ? 'ready' : 'error';
  if (!anyOk) {
    status.error = 'All library fetches failed.';
  }
  await setStatus(userId, status);
}
