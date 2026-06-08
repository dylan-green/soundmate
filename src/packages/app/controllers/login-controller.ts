import type { Request, Response } from 'express';
import type { LoginStatus } from '@soundmate/common/auth';
import { spotifyConfig } from '../config/spotify.js';
import { BadRequestError } from '../errors/app-error.js';
import * as spotifyAuth from '../services/spotify-auth-service.js';

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
  // Store tokens in THIS user's session — never sent to the browser.
  req.session.tokens = tokens;

  res.redirect(spotifyConfig.clientBaseUrl);
}

/** GET /login/status — non-sensitive view of the current session's auth state. */
export function loginStatus(req: Request, res: Response): void {
  const tokens = req.session.tokens;
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
