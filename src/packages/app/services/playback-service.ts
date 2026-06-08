import type { TokenStore } from '@soundmate/common/auth';
import type { PlayRequest } from '@soundmate/common/playback';
import { spotifyApiPut } from './spotify-api.js';

/**
 * Start playback of the given URIs via PUT /me/player/play.
 * Requires the user-modify-playback-state scope and an active/targetable device.
 */
export async function startPlayback(
  store: TokenStore,
  options: PlayRequest,
): Promise<void> {
  const query = options.deviceId
    ? `?device_id=${encodeURIComponent(options.deviceId)}`
    : '';
  await spotifyApiPut(`/me/player/play${query}`, { uris: options.uris }, store);
}
