import type { PlaylistTracksResponse } from '../../common/top-items';
import { NotAuthorizedError } from './get-top-items';

/** Fetch the tracks inside one playlist (GET /me/playlists/:id/tracks). */
export async function getPlaylistTracks(
  playlistId: string,
): Promise<PlaylistTracksResponse> {
  const response = await fetch(
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
