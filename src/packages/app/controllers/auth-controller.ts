import type { Request, Response } from 'express';
import type { UserTokenResponse } from '@soundmate/common/auth';
import { sessionTokenStore } from '../lib/session-token-storage.js';
import * as spotifyAuth from '../services/spotify-auth-service.js';

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
  const store = sessionTokenStore(req);
  const accessToken = await spotifyAuth.getValidAccessToken(store);
  // getValidAccessToken refreshes in place, so the stored expiry is current.
  const expiresAt = store.get()?.expiresAt ?? 0;
  // Don't let the browser or any proxy cache a bearer token.
  res.set('Cache-Control', 'no-store');
  const payload: UserTokenResponse = { accessToken, expiresAt };
  res.json(payload);
}
