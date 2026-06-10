// Normalized DTOs for the per-user library that's fetched on login and cached in
// Redis. Reuses the existing top-items shapes (TopTrack/TopArtist/TopPlaylist) so
// the player and existing tabs can consume them unchanged. Shared server↔client.

import type { TopArtist, TopPlaylist, TopTrack } from './top-items.js';

/** A saved album from the user's library ("Your Music"). */
export interface SavedAlbum {
  id: string;
  name: string;
  artists: string;
  imageUrl: string | null;
  spotifyUrl: string;
  uri: string;
  totalTracks: number;
  /** ISO 8601 timestamp of when the user saved the album. */
  addedAt: string;
}

/** The six library categories fetched on login. Order is the display/fetch order. */
export const LIBRARY_CATEGORIES = [
  'topTracks',
  'topArtists',
  'followedArtists',
  'savedAlbums',
  'playlists',
  'savedTracks',
] as const;

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

/** The full assembled library returned by GET /me/library. Any category may be
 *  null if its fetch failed or hasn't completed. */
export interface Library {
  topTracks: TopTrack[] | null;
  topArtists: TopArtist[] | null;
  followedArtists: TopArtist[] | null;
  savedAlbums: SavedAlbum[] | null;
  playlists: TopPlaylist[] | null;
  savedTracks: TopTrack[] | null;
}

/**
 * GET /me/library returns every connected member's library, keyed by Spotify
 * user id (the session is multi-user — see SessionView).
 */
export type LibraryByUser = Record<string, Library>;

/** Per-category sync progress. */
export type CategoryStatus = 'pending' | 'ok' | 'error';

export type SyncState = 'pending' | 'ready' | 'error';

/** Sync status the client polls (GET /me/sync/status) to drive the spinner. */
export interface SyncStatus {
  state: SyncState;
  /** ISO 8601 timestamp the sync started. */
  startedAt: string;
  /** Per-category progress; lets the client show "n/6 loaded". */
  categories: Record<LibraryCategory, CategoryStatus>;
  /** Set when the whole sync failed. */
  error?: string;
}

/**
 * GET /me/sync/status returns the sync progress for every connected member,
 * keyed by Spotify user id.
 */
export type SyncStatusByUser = Record<string, SyncStatus>;
