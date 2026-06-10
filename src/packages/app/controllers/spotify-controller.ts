import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/app-error.js';
import { activeUserStore } from '../lib/session-users.js';
import { createSpotifyApiService } from '../services/spotify-api-service.js'

const spotifyApi = createSpotifyApiService();

const querySchema = z.object({
  time_range: z
    .enum(['long_term', 'medium_term', 'short_term'])
    .default('long_term'),
  // Query values arrive as strings; coerce and bound to Spotify's limits.
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

/** Parse + validate the shared `time_range`/`limit` query and build service args. */
function parseTopItemsArgs(req: Request) {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    const details = query.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new BadRequestError('Invalid query parameters', details);
  }

  return {
    options: {
      timeRange: query.data.time_range,
      limit: query.data.limit,
    },
    store: activeUserStore(req),
  };
}

/** GET /me/top/tracks?time_range=&limit= — the user's top tracks. */
export async function getTopTracks(req: Request, res: Response): Promise<void> {
  const result = await spotifyApi.getTopTracks(parseTopItemsArgs(req));
  res.json(result);
}

/** GET /me/top/artists?time_range=&limit= — the user's top artists. */
export async function getTopArtists(req: Request, res: Response): Promise<void> {
  const result = await spotifyApi.getTopArtists(parseTopItemsArgs(req));
  res.json(result);
}

/** GET /me/top/playlists?limit= — the user's playlists (time_range is ignored). */
export async function getTopPlaylists(req: Request, res: Response): Promise<void> {
  const result = await spotifyApi.getTopPlaylists(parseTopItemsArgs(req));
  res.json(result);
}

const playlistParamsSchema = z.object({
  id: z.string().min(1),
});

const playlistTracksQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

/** GET /me/playlists/:id/tracks?limit= — the tracks inside one playlist. */
export async function getPlaylistTracks(req: Request, res: Response): Promise<void> {
  const params = playlistParamsSchema.safeParse(req.params);
  if (!params.success) {
    throw new BadRequestError('Missing playlist id');
  }

  const query = playlistTracksQuerySchema.safeParse(req.query);
  if (!query.success) {
    const details = query.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new BadRequestError('Invalid query parameters', details);
  }

  const result = await spotifyApi.getPlaylistTracks({
    playlistId: params.data.id,
    limit: query.data.limit,
    store: activeUserStore(req),
  });
  res.json(result);
}
