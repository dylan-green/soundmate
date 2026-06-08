// Raw Spotify Web API object shapes — a minimal subset of the fields we read.
// Field names match the OpenAPI schema exactly (snake_case). Shared between the
// server (which fetches + maps these) and the client (which may map them too).

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface ExternalUrls {
  spotify: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  // Spotify may omit these on some artist objects — treat as optional.
  genres?: string[];
  images: SpotifyImage[];
  external_urls: ExternalUrls;
  popularity?: number;
  uri: string;
}

export interface SpotifySimplifiedArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  // Present on full album objects (e.g. saved albums); omitted on the simplified
  // album nested in a track.
  artists?: SpotifySimplifiedArtist[];
  external_urls?: ExternalUrls;
  uri?: string;
  total_tracks?: number;
  release_date?: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifySimplifiedArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls: ExternalUrls;
  popularity: number;
  preview_url: string | null;
  uri: string;
}

export interface SpotifyPlaylistOwner {
  id: string;
  display_name: string | null;
}

/**
 * The track-count reference on a (simplified) playlist — a link + total count.
 * Spotify renamed this from `tracks` to `items` (see CLAUDE.md Web API rule 7);
 * `/me/playlists` now returns `items: { href, total }`.
 */
export interface SpotifyPlaylistItemsRef {
  href: string;
  total: number;
}

/** Simplified playlist object as returned by /me/playlists. */
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  // Spotify returns `null` for playlists without a cover image.
  images: SpotifyImage[] | null;
  external_urls: ExternalUrls;
  uri: string;
  owner: SpotifyPlaylistOwner;
  items: SpotifyPlaylistItemsRef;
}

/**
 * One entry in a playlist's item list (GET /playlists/{id}/items). The nested
 * track can be null for removed/unavailable entries. Both the current `items`
 * endpoint and the deprecated `tracks` endpoint expose the entry under `track`;
 * some responses use `item` — read whichever is present.
 */
export interface SpotifyPlaylistTrackItem {
  added_at: string | null;
  is_local: boolean;
  track?: SpotifyTrack | null;
  item?: SpotifyTrack | null;
}

/** Generic paging object returned by list endpoints like /me/top/{type}. */
export interface PagingObject<T> {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: T[];
}

/** The authenticated user as returned by GET /me. */
export interface SpotifyUser {
  id: string;
  display_name: string | null;
}

/** One entry in GET /me/albums — a saved album plus when it was added. */
export interface SpotifySavedAlbum {
  added_at: string;
  album: SpotifyAlbum;
}

/** One entry in GET /me/tracks — a saved track plus when it was added. */
export interface SpotifySavedTrack {
  added_at: string;
  track: SpotifyTrack;
}

/**
 * Cursor-paged object — GET /me/following is the one endpoint that paginates by
 * cursor (`after`) rather than offset.
 */
export interface CursorPagingObject<T> {
  href: string;
  limit: number;
  next: string | null;
  total: number;
  cursors: { after: string | null; before?: string | null };
  items: T[];
}

/** GET /me/following nests its cursor-paged artists under an `artists` wrapper. */
export interface SpotifyFollowingResponse {
  artists: CursorPagingObject<SpotifyArtist>;
}
