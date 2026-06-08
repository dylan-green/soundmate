import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Library } from '@soundmate/common/library';

/**
 * Holds the per-user library fetched on login and cached in Redis (followed
 * artists, saved albums, saved tracks, etc.). Populated once by <sync-gate>
 * after the sync reports ready; the new library tabs read from here.
 */
const initialState: Library | null = null as Library | null;

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setLibrary(_state, action: PayloadAction<Library>): Library {
      return action.payload;
    },
  },
});

const { setLibrary } = librarySlice.actions;

export const LibraryStore = {
  initialState,
  librarySlice,
  setLibrary,
};
