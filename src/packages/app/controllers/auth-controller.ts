import type { Request, Response } from 'express';
import type { UserTokenResponse } from '@soundmate/common/auth';
import { ownerUserStore } from '../lib/session-users.js';
import * as spotifyAuth from '../services/spotify-auth-service.js';

/**
 * GET /auth/token — return a valid Spotify access token for the browser
 * (e.g. the Web Playback SDK's getOAuthToken callback).
 *
 * Scoped to the session OWNER (the member this browser authenticated as), NOT
 * the switchable active member — so a second person who joins the session and
 * switches active can't exfiltrate another member's bearer token.
 *
 * getValidAccessToken() refreshes transparently and throws 401 if the user
 * isn't authenticated. The Client Secret and refresh token NEVER leave the
 * server — only the short-lived access token is sent to the client.
 */
export async function getAccessToken(
  req: Request,
  res: Response,
): Promise<void> {
  const store = ownerUserStore(req);
  const accessToken = await spotifyAuth.getValidAccessToken(store);
  // getValidAccessToken refreshes in place, so the stored expiry is current.
  const expiresAt = (await store.get())?.expiresAt ?? 0;
  // Don't let the browser or any proxy cache a bearer token.
  res.set('Cache-Control', 'no-store');
  const payload: UserTokenResponse = { accessToken, expiresAt };
  res.json(payload);
}
