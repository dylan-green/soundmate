import type { PlayRequest } from '@soundmate/common/playback';
import { apiFetch } from '../../functions/api';
import { store } from '../../redux/store';
import { dispatch } from '../../redux/dispatch/dispatch';
import { selectTracks } from '../../redux/selectors/tracks';
import { NotAuthorizedError } from '../../functions/get-user-token';

/**
 * The Web Playback SDK device id, published by <soundmate-player> when it
 * becomes ready. Shared here so other components (e.g. <top-items>) can target
 * the soundmate device when starting playback.
 */
let activeDeviceId: string | null = null;

export function setPlaybackDevice(deviceId: string | null): void {
  activeDeviceId = deviceId;
}

export function getPlaybackDevice(): string | null {
  return activeDeviceId;
}

/**
 * The live Web Playback SDK player instance, published by <soundmate-player>
 * once it's connected. Shared so other components (the track/playlist lists)
 * can pause/resume the current track without reaching into the player element.
 */
let activePlayer: Spotify.Player | null = null;

export function setActivePlayer(player: Spotify.Player | null): void {
  activePlayer = player;
}

/**
 * Toggle play/pause on the soundmate device. The resulting state change is
 * reported back via the SDK's `player_state_changed` event (which updates the
 * `player` store slice), so every component's icons stay in sync.
 */
export async function togglePlayback(): Promise<void> {
  await activePlayer?.togglePlay();
}

/** Start playback of the given track URIs on the soundmate device. */
export async function playUris(uris: string[]): Promise<void> {
  const body: PlayRequest = {
    deviceId: activeDeviceId ?? undefined,
    uris,
  };
  const response = await apiFetch('/me/player/play', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    throw new NotAuthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Playback failed (HTTP ${response.status})`);
  }
}

/**
 * Play the track at `index` in the store's tracks list, and record it as the
 * current track. This is what the play button and the player's prev/next use.
 */
export async function playTrackAt(index: number): Promise<void> {
  const items = selectTracks(store.getState());
  const track = items[index];
  if (!track) return;
  dispatch({ type: 'setCurrentIndex', payload: index });
  await playUris([track.uri]);
}

/** Play the next track in the list (no-op past the end). */
export function playNext(): void {
  const { items, currentIndex } = store.getState().tracks;
  const next = currentIndex + 1;
  if (next < items.length) {
    playTrackAt(next).catch(() => { });
  }
}

/** Play the previous track in the list (no-op before the start). */
export function playPrev(): void {
  const { currentIndex } = store.getState().tracks;
  const prev = currentIndex - 1;
  if (prev >= 0) {
    playTrackAt(prev).catch(() => { });
  }
}
