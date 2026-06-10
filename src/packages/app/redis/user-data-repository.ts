import {
  LIBRARY_CATEGORIES,
  type Library,
  type LibraryCategory,
  type SavedAlbum,
  type SyncStatus,
} from '@soundmate/common/library';
import type { TopArtist, TopPlaylist, TopTrack } from '@soundmate/common/top-items';
import { getRedis } from './redis-client.js';
import { userNamespace } from './user-keys.js';

/**
 * Repository for per-user library data in Redis. Owns the key shapes and TTL;
 * knows nothing about Spotify or HTTP. Every key is namespaced by the user's
 * Spotify id — the caller must pass a server-derived id (see the RLS note in the
 * sync controller), never one supplied by the client.
 */

/** 7 days, matching the session cookie lifetime. */
const TTL_SECONDS = 60 * 60 * 24 * 7;

/** Maps each library category to the concrete DTO list it stores. */
export interface CategoryData {
  topTracks: TopTrack[];
  topArtists: TopArtist[];
  followedArtists: TopArtist[];
  savedAlbums: SavedAlbum[];
  playlists: TopPlaylist[];
  savedTracks: TopTrack[];
}

const categoryKey = (userId: string, category: LibraryCategory): string =>
  `${userNamespace(userId)}:library:${category}`;

const statusKey = (userId: string): string => `${userNamespace(userId)}:sync:status`;

/** Persist one category's normalized list (overwrites; refreshes the TTL). */
export async function setCategory<C extends LibraryCategory>(
  userId: string,
  category: C,
  data: CategoryData[C],
): Promise<void> {
  const redis = await getRedis();
  await redis.set(categoryKey(userId, category), JSON.stringify(data), {
    EX: TTL_SECONDS,
  });
}

/** Read one category, or null if absent/expired. */
export async function getCategory<C extends LibraryCategory>(
  userId: string,
  category: C,
): Promise<CategoryData[C] | null> {
  const redis = await getRedis();
  const raw = await redis.get(categoryKey(userId, category));
  return raw ? (JSON.parse(raw) as CategoryData[C]) : null;
}

/** Read all six categories in one round-trip and assemble the Library. */
export async function getLibrary(userId: string): Promise<Library> {
  const redis = await getRedis();
  const keys = LIBRARY_CATEGORIES.map((c) => categoryKey(userId, c));
  const values = await redis.mGet(keys);
  const library = {} as Library;
  LIBRARY_CATEGORIES.forEach((category, i) => {
    const raw = values[i];
    library[category] = raw ? JSON.parse(raw) : null;
  });
  return library;
}

/** Write the sync status (refreshes its TTL). */
export async function setStatus(userId: string, status: SyncStatus): Promise<void> {
  const redis = await getRedis();
  await redis.set(statusKey(userId), JSON.stringify(status), { EX: TTL_SECONDS });
}

/** Read the sync status, or null if none exists yet. */
export async function getStatus(userId: string): Promise<SyncStatus | null> {
  const redis = await getRedis();
  const raw = await redis.get(statusKey(userId));
  return raw ? (JSON.parse(raw) as SyncStatus) : null;
}
