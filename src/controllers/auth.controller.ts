import type { Request, Response } from 'express';
import { sessionTokenStore } from '../lib/sessionTokenStore.js';
import * as spotifyAuth from '../services/spotifyAuth.service.js';

/**
 * GET /auth/token — return a valid Spotify access token for the browser
 * (e.g. the Web Playback SDK's getOAuthToken callback).
 *
 * getValidAccessToken() refreshes transparently and throws 401 if the user
 * isn't authenticated. The Client Secret and refresh token NEVER leave the
 * server — only the short-lived access token is sent to the client.
 */
export async function getAccessToken(
  req: Request,
  res: Response,
): Promise<void> {
  const accessToken = await spotifyAuth.getValidAccessToken(sessionTokenStore(req));
  // Don't let the browser or any proxy cache a bearer token.
  res.set('Cache-Control', 'no-store');
  res.json({ accessToken });
}
