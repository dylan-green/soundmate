// Normalized DTOs — the shape soundmate's own API returns to the client (the
// contract for GET /me/top/{type}). Independent of the raw Spotify shapes so the
// wire format stays stable even if Spotify's response fields change.

export type TimeRange = 'long_term' | 'medium_term' | 'short_term';

export interface TopArtist {
  id: string;
  name: string;
  genres: string[];
  imageUrl: string | null;
  spotifyUrl: string;
  popularity: number;
}

export interface TopTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  imageUrl: string | null;
  spotifyUrl: string;
  uri: string;
  durationMs: number;
  previewUrl: string | null;
}

export interface TopPlaylist {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  spotifyUrl: string;
  uri: string;
  /** The playlist owner's display name (empty string if Spotify omits it). */
  owner: string;
  /** Number of tracks in the playlist. */
  trackCount: number;
}

export interface TopArtistsResponse {
  type: 'artists';
  timeRange: TimeRange;
  items: TopArtist[];
}

export interface TopTracksResponse {
  type: 'tracks';
  timeRange: TimeRange;
  items: TopTrack[];
}

// Playlists come from /me/playlists (the user's own playlists), not a "top"
// endpoint — so there's no time range to report.
export interface TopPlaylistsResponse {
  type: 'playlists';
  items: TopPlaylist[];
}

// The tracks inside a single playlist (GET /playlists/{id}/items). Reuses the
// normalized TopTrack shape so the player can queue/navigate them like the
// top-tracks list.
export interface PlaylistTracksResponse {
  type: 'playlist-tracks';
  playlistId: string;
  items: TopTrack[];
}

export type TopItemsResponse =
  | TopArtistsResponse
  | TopTracksResponse
  | TopPlaylistsResponse;
