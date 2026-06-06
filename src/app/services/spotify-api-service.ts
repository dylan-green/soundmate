import type {
  PagingObject,
  SpotifyArtist,
  SpotifyPlaylist,
  SpotifyPlaylistTrackItem,
  SpotifyTrack,
} from '../../common/spotify.js';
import type {
  PlaylistTracksResponse,
  TimeRange,
  TopArtist,
  TopArtistsResponse,
  TopPlaylist,
  TopPlaylistsResponse,
  TopTrack,
  TopTracksResponse,
} from '../../common/top-items.js';
import type { TokenStore } from '../../common/auth.js';
import { spotifyApiGet } from './spotify-api.js';

interface TopItemsOptions {
  timeRange: TimeRange;
  limit: number;
}

function mapArtist(artist: SpotifyArtist): TopArtist {
  return {
    id: artist.id,
    name: artist.name,
    genres: artist.genres ?? [],
    imageUrl: artist.images[0]?.url ?? null,
    spotifyUrl: artist.external_urls.spotify,
    popularity: artist.popularity ?? 0,
  };
}

function mapTrack(track: SpotifyTrack): TopTrack {
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    imageUrl: track.album.images[0]?.url ?? null,
    spotifyUrl: track.external_urls.spotify,
    uri: track.uri,
    durationMs: track.duration_ms,
    previewUrl: track.preview_url,
  };
}

function mapPlaylist(playlist: SpotifyPlaylist): TopPlaylist {
  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    imageUrl: playlist.images?.[0]?.url ?? null,
    spotifyUrl: playlist.external_urls.spotify,
    uri: playlist.uri,
    owner: playlist.owner.display_name ?? '',
    trackCount: playlist.items?.total ?? 0,
  };
}

type SpotifyApiOptions = {
  options: TopItemsOptions;
  store: TokenStore;
}

type PlaylistTracksArgs = {
  playlistId: string;
  // /playlists/{id}/items has no time_range — only a limit applies.
  limit: number;
  store: TokenStore;
}

export interface SpotifyApiService {
  getTopTracks: (args: SpotifyApiOptions) => Promise<TopTracksResponse>;
  getTopArtists: (args: SpotifyApiOptions) => Promise<TopArtistsResponse>;
  getTopPlaylists: (args: SpotifyApiOptions) => Promise<TopPlaylistsResponse>;
  getPlaylistTracks: (args: PlaylistTracksArgs) => Promise<PlaylistTracksResponse>;
}

export const createSpotifyApiService = (): SpotifyApiService => {
  function getquery(options: TopItemsOptions) {
    return new URLSearchParams({
      time_range: options.timeRange,
      limit: String(options.limit),
    });
  }

  async function getTopTracks(args: SpotifyApiOptions): Promise<TopTracksResponse> {
    const { options, store: tokenStore } = args;
    const query = getquery(options);
    const page = await spotifyApiGet<PagingObject<SpotifyTrack>>(
      `/me/top/tracks?${query.toString()}`,
      tokenStore,
    );
    return {
      type: 'tracks',
      timeRange: options.timeRange,
      items: page.items.map(mapTrack),
    };
  }

  async function getTopArtists(args: SpotifyApiOptions): Promise<TopArtistsResponse> {
    const { options, store: tokenStore } = args;
    const query = getquery(options);
    const page = await spotifyApiGet<PagingObject<SpotifyArtist>>(
      `/me/top/artists?${query.toString()}`,
      tokenStore,
    );
    return {
      type: 'artists',
      timeRange: options.timeRange,
      items: page.items.map(mapArtist),
    };
  }

  async function getTopPlaylists(args: SpotifyApiOptions): Promise<TopPlaylistsResponse> {
    const { options, store: tokenStore } = args;
    const query = new URLSearchParams({ limit: String(options.limit) });
    const page = await spotifyApiGet<PagingObject<SpotifyPlaylist>>(
      `/me/playlists?${query.toString()}`,
      tokenStore,
    );
    return {
      type: 'playlists',
      // Spotify can include null entries (e.g. deleted playlists) — drop them.
      items: page.items.filter((p): p is SpotifyPlaylist => p != null).map(mapPlaylist),
    };
  }

  async function getPlaylistTracks(args: PlaylistTracksArgs): Promise<PlaylistTracksResponse> {
    const { playlistId, limit, store: tokenStore } = args;
    // Current (non-deprecated) endpoint for a playlist's contents. Restrict to
    // tracks (no podcast episodes) so every entry maps to a TopTrack.
    const query = new URLSearchParams({
      limit: String(limit),
      additional_types: 'track',
    });
    const page = await spotifyApiGet<PagingObject<SpotifyPlaylistTrackItem>>(
      `/playlists/${encodeURIComponent(playlistId)}/items?${query.toString()}`,
      tokenStore,
    );
    const tracks = page.items
      // The entry sits under `track` (or `item`); drop removed/unavailable ones.
      .map((entry) => entry?.track ?? entry?.item ?? null)
      .filter((track): track is SpotifyTrack => track != null)
      .map(mapTrack);
    return {
      type: 'playlist-tracks',
      playlistId,
      items: tracks,
    };
  }

  return {
    getTopTracks,
    getTopArtists,
    getTopPlaylists,
    getPlaylistTracks,
  };
}
