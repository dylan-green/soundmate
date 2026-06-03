/** Thrown when the user isn't logged in (no valid session). */
export class NotAuthorizedError extends Error {}

/**
 * Get a valid Spotify access token for use in the browser — e.g. the Web
 * Playback SDK's getOAuthToken callback.
 *
 * The token comes from the backend (GET /auth/token), scoped to the user's
 * session cookie. The Client Secret and refresh token never reach the browser,
 * and the backend refreshes the access token transparently.
 */
export async function getUserToken(): Promise<string> {
  const response = await fetch('/auth/token');

  if (response.status === 401 || response.status === 403) {
    throw new NotAuthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch access token (HTTP ${response.status})`);
  }

  const data = (await response.json()) as { accessToken: string };
  return data.accessToken;
}
