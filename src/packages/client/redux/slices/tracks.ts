import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TopTrack } from '@soundmate/common/top-items';

interface TracksState {
  /** The user's fetched top tracks, in display order. */
  items: TopTrack[];
  /** Index of the track currently being played from the list (-1 = none). */
  currentIndex: number;
}

const initialState: TracksState = { items: [], currentIndex: -1 };

const tracksSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    setTracks(state, action: PayloadAction<TopTrack[]>) {
      const next = action.payload;
      // Re-publishing the *same* queue (e.g. a visible list re-dispatching on
      // every re-render) must not reset the playback cursor — only an actual
      // change of list does. Returning without mutating keeps the same state
      // reference, so subscribers aren't notified either.
      const sameList =
        state.items.length === next.length &&
        state.items.every((track, i) => track.uri === next[i]?.uri);
      if (sameList) return;
      state.items = next;
      state.currentIndex = -1;
    },
    setCurrentIndex(state, action: PayloadAction<number>) {
      const index = action.payload;
      if (index >= 0 && index < state.items.length) {
        state.currentIndex = index;
      }
    },
  },
});

const { setTracks, setCurrentIndex } = tracksSlice.actions;

export const TrackStore = {
  initialState,
  tracksSlice,
  setTracks,
  setCurrentIndex,
};
