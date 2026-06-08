import { configureStore, type Store } from '@reduxjs/toolkit';
import { TrackStore } from './slices/tracks';
import { ArtistsStore } from './slices/artists'
import { PlaylistsStore } from './slices/playlists';
import { PlayerStore } from './slices/player';
import { LibraryStore } from './slices/library';
import { AuthStore } from './slices/auth';

export const store: Store = configureStore({
  reducer: {
    tracks: TrackStore.tracksSlice.reducer,
    artists: ArtistsStore.artistSlice.reducer,
    playlists: PlaylistsStore.playlistsSlice.reducer,
    player: PlayerStore.playerSlice.reducer,
    library: LibraryStore.librarySlice.reducer,
    auth: AuthStore.authSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
