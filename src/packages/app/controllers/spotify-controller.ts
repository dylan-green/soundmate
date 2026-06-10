import type { Request, Response } from 'express';
import { z } from 'zod';
import type { TokenStore } from '@soundmate/common/auth';
import { BadRequestError } from '../errors/app-error.js';
import { requireGroupMember } from '../lib/session-group.js';
import { activeUserStore } from '../lib/session-users.js';
import { userTokenStore } from '../lib/user-token-store.js';
import { createSpotifyApiService } from '../services/spotify-api-service.js'

const spotifyApi = createSpotifyApiService();

const querySchema = z.object({
  time_range: z
    .enum(['long_term', 'medium_term', 'short_term'])
    .default('long_term'),
  // Query values arrive as strings; coerce and bound to Spotify's limits.
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

const userIdSchema = z.object({ userId: z.string().min(1).optional() });

/**
 * Resolve the TokenStore for a data read. Defaults to the active member; with a
 * valid `?userId=` that names a group peer, uses that peer's store instead.
 */
async function resolveStore(req: Request): Promise<TokenStore> {
  const parsed = userIdSchema.safeParse(req.query);
  const userId = parsed.success ? parsed.data.userId : undefined;
  if (userId) {
    await requireGroupMember(req, userId);
    return userTokenStore(userId);
  }
  return activeUserStore(req);
}

/** Parse + validate the shared `time_range`/`limit` query. */
function parseTopItemsOptions(req: Request) {
  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    const details = query.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new BadRequestError('Invalid query parameters', details);
  }

  return {
    timeRange: query.data.time_range,
    limit: query.data.limit,
  };
}

/** GET /me/top/tracks?time_range=&limit=&userId= — top tracks (self or a peer). */
export async function getTopTracks(req: Request, res: Response): Promise<void> {
  const result = await spotifyApi.getTopTracks({
    options: parseTopItemsOptions(req),
    store: await resolveStore(req),
  });
  res.json(result);
}

/** GET /me/top/artists?time_range=&limit=&userId= — top artists (self or a peer). */
export async function getTopArtists(req: Request, res: Response): Promise<void> {
  const result = await spotifyApi.getTopArtists({
    options: parseTopItemsOptions(req),
    store: await resolveStore(req),
  });
  res.json(result);
}

/** GET /me/top/playlists?limit=&userId= — playlists (self or a peer; no time_range). */
export async function getTopPlaylists(req: Request, res: Response): Promise<void> {
  const result = await spotifyApi.getTopPlaylists({
    options: parseTopItemsOptions(req),
    store: await resolveStore(req),
  });
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
    store: await resolveStore(req),
  });
  res.json(result);
}
