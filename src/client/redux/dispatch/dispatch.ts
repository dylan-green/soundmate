import type { UnknownAction } from '@reduxjs/toolkit';
import { store } from '../store';
import { TrackStore } from '../slices/tracks';
import { ArtistsStore } from '../slices/artists';
import { PlaylistsStore } from '../slices/playlists';
import { PlayerStore } from '../slices/player';
import { LibraryStore } from '../slices/library';

/**
 * Central registry of dispatchable actions: action name → its action creator.
 * This map is the single source of truth — add an entry here and `dispatch()`
 * automatically knows the new action name and the payload type it requires.
 */
const ActionDispatchers = {
  setTracks: TrackStore.setTracks,
  setCurrentIndex: TrackStore.setCurrentIndex,
  setArtists: ArtistsStore.setArtists,
  setPlaylists: PlaylistsStore.setPlaylists,
  setPlayback: PlayerStore.setPlayback,
  setLibrary: LibraryStore.setLibrary,
} as const;

/** Every action name you can dispatch (derived from the registry). */
export type ActionType = keyof typeof ActionDispatchers;

/** The payload type required by a given action (derived from its creator). */
export type PayloadOf<T extends ActionType> = Parameters<
  (typeof ActionDispatchers)[T]
>[0];

/**
 * Dispatch the action registered under `type` with a matching `payload`. The
 * payload is type-checked against the chosen action, so a mismatch (e.g. a
 * `setTracks` action with a `TopArtist[]` payload) is a compile error.
 *
 *   dispatch({ type: 'setTracks', payload: topTracks });
 *   dispatch({ type: 'setArtists', payload: topArtistsResponse });
 */
export function dispatch<T extends ActionType>(args: {
  type: T;
  payload: PayloadOf<T>;
}): void {
  // Indexing with the generic `T` widens to a union of creators, so we narrow
  // back to the precise (payload) -> action signature for this `type`.
  const actionCreator = ActionDispatchers[args.type] as (
    payload: PayloadOf<T>,
  ) => UnknownAction;

  store.dispatch(actionCreator(args.payload));
}
