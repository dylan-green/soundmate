import type { UserTokenResponse } from '@soundmate/common/auth';
import { apiFetch } from './api';
import { NotAuthorizedError } from './errors';

/**
 * Get a valid Spotify access token for use in the browser — e.g. the Web
 * Playback SDK's getOAuthToken callback.
 *
 * The token comes from the backend (GET /auth/token), scoped to the user's
 * session cookie. The Client Secret and refresh token never reach the browser,
 * and the backend refreshes the access token transparently.
 *
 * Returns the token plus its `expiresAt` (epoch ms) so callers can cache it.
 */
export async function getUserToken(): Promise<UserTokenResponse> {
  const response = await apiFetch('/auth/token');

  if (response.status === 401 || response.status === 403) {
    throw new NotAuthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch access token (HTTP ${response.status})`);
  }

  return (await response.json()) as UserTokenResponse;
}
