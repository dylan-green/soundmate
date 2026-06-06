// Playback API contract — the body of soundmate's PUT /me/player/play. The
// client builds this; the server validates it (zod) and forwards to Spotify.

export interface PlayRequest {
  /** Target device (the Web Playback SDK device id). Omit to use the active one. */
  deviceId?: string | undefined;
  /** Spotify track URIs to play. */
  uris: string[];
}
