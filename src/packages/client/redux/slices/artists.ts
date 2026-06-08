import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TopArtist } from '@soundmate/common/top-items';
import type { TopArtistsResponse } from '@soundmate/common/top-items';

const initialState: TopArtist[] = [];

const artistSlice = createSlice({
  name: 'artists',
  initialState,
  reducers: {
    setArtists(_state, action: PayloadAction<TopArtistsResponse>): TopArtist[] {
      // Replace the whole list with the response's items (return new state —
      // reassigning the `state` param would be a no-op under Immer).
      return action.payload.items;
    },
  },
});

const { setArtists } = artistSlice.actions;

export const ArtistsStore = {
  initialState,
  artistSlice,
  setArtists,
};