import { configureStore, type Store } from '@reduxjs/toolkit';
import { TrackStore } from '../redux/slices/tracks';
import { ArtistsStore } from '../redux/slices/artists'
import { PlaylistsStore } from '../redux/slices/playlists';
import { PlayerStore } from '../redux/slices/player';
import { LibraryStore } from '../redux/slices/library';

export const store: Store = configureStore({
  reducer: {
    tracks: TrackStore.tracksSlice.reducer,
    artists: ArtistsStore.artistSlice.reducer,
    playlists: PlaylistsStore.playlistsSlice.reducer,
    player: PlayerStore.playerSlice.reducer,
    library: LibraryStore.librarySlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
