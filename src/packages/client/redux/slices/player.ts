import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface PlayerState {
  /** URI of the track currently loaded in the Web Playback SDK ('' = none). */
  currentUri: string;
  /** Whether the player is paused (true when nothing is playing). */
  paused: boolean;
}

const initialState: PlayerState = { currentUri: '', paused: true };

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    /**
     * Mirror the Web Playback SDK's state into the store so any component can
     * reflect what's playing and whether it's paused. <soundmate-player>
     * dispatches this on every `player_state_changed`.
     */
    setPlayback(
      state,
      action: PayloadAction<{ currentUri: string; paused: boolean }>,
    ) {
      state.currentUri = action.payload.currentUri;
      state.paused = action.payload.paused;
    },
  },
});

const { setPlayback } = playerSlice.actions;

export const PlayerStore = {
  initialState,
  playerSlice,
  setPlayback,
};
