import { spotifyConfig } from '../config/spotify.js';
import { AppError } from '../errors/app-error.js';
import { fetchWithBackoff } from '../lib/spotify-http.js';
import type { TokenStore } from '@soundmate/common/auth';
import { getValidAccessToken } from './spotify-auth-service.js';

/**
 * Authenticated GET against the Spotify Web API for a given session's tokens.
 * - getValidAccessToken() refreshes the token transparently if needed.
 * - fetchWithBackoff() handles 429 (Retry-After + exponential backoff).
 * - Non-2xx responses are mapped to AppErrors the central handler can format.
 */
export async function spotifyApiGet<T>(path: string, store: TokenStore): Promise<T> {
  const accessToken = await getValidAccessToken(store);

  const response = await fetchWithBackoff(`${spotifyConfig.apiBaseUrl}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw await toAppError(response);
  }
  return (await response.json()) as T;
}

/**
 * Authenticated PUT against the Spotify Web API (e.g. playback control).
 * These endpoints return 204 No Content on success, so there's no JSON body.
 */
export async function spotifyApiPut(
  path: string,
  body: unknown,
  store: TokenStore,
): Promise<void> {
  const accessToken = await getValidAccessToken(store);

  const response = await fetchWithBackoff(`${spotifyConfig.apiBaseUrl}${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await toAppError(response);
  }
}

/** Map a Spotify API error response to a meaningful AppError. */
async function toAppError(response: Response): Promise<AppError> {
  const message = await readApiErrorMessage(response);
  switch (response.status) {
    case 401:
      return new AppError('Spotify session expired — please log in again.', 401);
    case 403:
      return new AppError(
        `Insufficient Spotify permissions (${message}). Log in again to grant access.`,
        403,
      );
    case 404:
      // For playback this is usually "Device not found" / no active device.
      return new AppError(message || 'Spotify resource not found.', 404);
    case 429:
      return new AppError('Spotify rate limit exceeded — please retry shortly.', 429);
    default:
      return new AppError(`Spotify API error: ${message}`, 502);
  }
}

/** Web API errors use the shape { error: { status, message } }. */
async function readApiErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } | string };
    if (typeof data.error === 'string') {
      return data.error;
    }
    return data.error?.message ?? `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}
