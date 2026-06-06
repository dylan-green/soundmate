import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TopPlaylist } from '../../../common/top-items';

const initialState: TopPlaylist[] = [];

const playlistsSlice = createSlice({
  name: 'playlists',
  initialState,
  reducers: {
    setPlaylists(_state, action: PayloadAction<TopPlaylist[]>): TopPlaylist[] {
      // Replace the whole list with the fetched playlists (return new state).
      return action.payload;
    },
  },
});

const { setPlaylists } = playlistsSlice.actions;

export const PlaylistsStore = {
  initialState,
  playlistsSlice,
  setPlaylists,
};
