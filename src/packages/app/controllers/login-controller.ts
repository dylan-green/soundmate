import type { Request, Response } from 'express';
import type { LoginStatus } from '@soundmate/common/auth';
import { spotifyConfig } from '../config/spotify.js';
import { BadRequestError } from '../errors/app-error.js';
import { addSessionUser } from '../lib/session-users.js';
import { memoryTokenStore } from '../lib/user-token-store.js';
import { getTokens, setTokens } from '../redis/token-repository.js';
import { createSpotifyApiService } from '../services/spotify-api-service.js';
import * as spotifyAuth from '../services/spotify-auth-service.js';

const spotifyApi = createSpotifyApiService();

/** GET /login — redirect the user to Spotify's consent screen. */
export function beginLogin(req: Request, res: Response): void {
  const { url, state } = spotifyAuth.buildAuthorizeUrl();
  // Bind the CSRF state to THIS user's session.
  req.session.oauthState = state;
  res.redirect(url);
}

/** GET /login/callback — Spotify redirects here with ?code & ?state (or ?error). */
export async function handleCallback(req: Request, res: Response): Promise<void> {
  const error = req.query.error;
  if (typeof error === 'string') {
    throw new BadRequestError(`Spotify authorization failed: ${error}`);
  }

  const code = req.query.code;
  if (typeof code !== 'string') {
    throw new BadRequestError('Missing authorization code');
  }

  // CSRF protection: the state must match the one stored in this session.
  const state = req.query.state;
  const expected = req.session.oauthState;
  if (typeof state !== 'string' || !expected || state !== expected) {
    throw new BadRequestError('Invalid or missing state parameter');
  }
  delete req.session.oauthState;

  const tokens = await spotifyAuth.exchangeCodeForTokens(code);

  // Resolve the Spotify id so we can key the tokens by user (an ephemeral
  // in-memory store lets us call GET /me before the persistent store exists).
  // Tokens are persisted in Redis (users:<id>:tokens), never sent to the browser
  // and never kept in the session blob.
  const user = await spotifyApi.getCurrentUser(memoryTokenStore(tokens));
  await setTokens(user.id, tokens);

  // Add user to the session roster. A second person logging in on the
  // same session JOINS it (multi-user).
  addSessionUser(req, user.id);

  res.redirect(spotifyConfig.clientBaseUrl);
}

/**
 * GET /login/status — non-sensitive auth state of the ACTIVE member. Kept for
 * the existing client; richer roster info is at GET /session.
 */
export async function loginStatus(req: Request, res: Response): Promise<void> {
  const activeUserId = req.session.activeUserId;
  const tokens = activeUserId ? await getTokens(activeUserId) : null;
  if (!tokens) {
    const payload: LoginStatus = { status: 'unauthenticated' };
    res.json(payload);
    return;
  }
  const payload: LoginStatus = {
    status: 'authenticated',
    scope: tokens.scope,
    expiresAt: new Date(tokens.expiresAt).toISOString(),
  };
  res.json(payload);
}
