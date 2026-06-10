import { randomUUID } from 'node:crypto';
import { basicAuthHeader, spotifyConfig } from '../config/spotify.js';
import { AppError } from '../errors/app-error.js';
import { fetchWithBackoff } from '../lib/spotify-http.js';
import type { StoredTokens, TokenStore } from '@soundmate/common/auth';

/** Shape of the token endpoint's JSON response (auth-code + refresh). */
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token?: string; // omitted on some refreshes
}

/** Refresh this many ms before actual expiry to avoid races at the boundary. */
const EXPIRY_SKEW_MS = 60_000;

/**
 * Build the Spotify consent URL and return the CSRF `state` for the caller to
 * persist in the user's session (verified on the callback).
 */
export function buildAuthorizeUrl(
  options: { showDialog?: boolean } = {},
): { url: string; state: string } {
  const state = randomUUID();

  const params = new URLSearchParams({
    client_id: spotifyConfig.clientId,
    response_type: 'code',
    redirect_uri: spotifyConfig.redirectUri,
    state,
  });
  if (spotifyConfig.scopes.length > 0) {
    params.set('scope', spotifyConfig.scopes.join(' '));
  }
  // When joining via an invite, force the recipient to authenticate with spotify
  // rather than showing the invitee's pre-cached data
  if (options.showDialog) {
    params.set('show_dialog', 'true');
  }

  return { url: `${spotifyConfig.accountsBaseUrl}/authorize?${params.toString()}`, state };
}

/** Exchange an authorization code for tokens (caller stores them in the session). */
export async function exchangeCodeForTokens(code: string): Promise<StoredTokens> {
  const data = await tokenRequest(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: spotifyConfig.redirectUri,
    }),
  );

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? '',
    scope: data.scope,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Return a valid access token for the given session's tokens, refreshing
 * transparently (and writing the refreshed tokens back) if needed.
 */
export async function getValidAccessToken(store: TokenStore): Promise<string> {
  const current = await store.get();
  if (!current) {
    throw new AppError('Not authenticated', 401);
  }
  if (Date.now() >= current.expiresAt - EXPIRY_SKEW_MS) {
    const refreshed = await refreshTokens(current);
    await store.set(refreshed);
    return refreshed.accessToken;
  }
  return current.accessToken;
}

/** Use a refresh token to obtain a fresh access token. */
async function refreshTokens(current: StoredTokens): Promise<StoredTokens> {
  if (!current.refreshToken) {
    throw new AppError('No refresh token available; user must log in again', 401);
  }

  const data = await tokenRequest(
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refreshToken,
    }),
  );

  return {
    accessToken: data.access_token,
    // Spotify may not return a new refresh token — keep the existing one if so.
    refreshToken: data.refresh_token ?? current.refreshToken,
    scope: data.scope,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/** POST to the token endpoint with Basic auth + form body; map errors. */
async function tokenRequest(body: URLSearchParams): Promise<SpotifyTokenResponse> {
  const response = await fetchWithBackoff(`${spotifyConfig.accountsBaseUrl}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    const message = await readSpotifyError(response);
    const status = response.status === 400 || response.status === 401 ? 401 : 502;
    throw new AppError(`Spotify token request failed: ${message}`, status);
  }

  return (await response.json()) as SpotifyTokenResponse;
}

/** Spotify auth errors use { error, error_description }. */
async function readSpotifyError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
      error_description?: string;
    };
    return data.error_description ?? data.error ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}
