import type { PlaylistTracksResponse } from '@soundmate/common/top-items';
import { apiFetch } from './api';
import { NotAuthorizedError } from './errors';

/** Fetch the tracks inside one playlist (GET /me/playlists/:id/tracks). */
export async function getPlaylistTracks(
  playlistId: string,
): Promise<PlaylistTracksResponse> {
  const response = await apiFetch(
    `/me/playlists/${encodeURIComponent(playlistId)}/tracks?limit=50`,
  );

  if (response.status === 401 || response.status === 403) {
    throw new NotAuthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Failed to load playlist tracks (HTTP ${response.status})`);
  }
  return (await response.json()) as PlaylistTracksResponse;
}
