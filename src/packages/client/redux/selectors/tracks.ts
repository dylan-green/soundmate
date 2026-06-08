import type { RootState } from "../store";
import type { TopTrack } from "@soundmate/common/top-items";

// Selectors
export const selectTracks = (s: RootState): TopTrack[] => s.tracks.items;
export const selectCurrentIndex = (s: RootState): number => s.tracks.currentIndex;
export const selectCurrentTrack = (s: RootState): TopTrack | null =>
  s.tracks.currentIndex >= 0 ? (s.tracks.items[s.tracks.currentIndex] ?? null) : null;