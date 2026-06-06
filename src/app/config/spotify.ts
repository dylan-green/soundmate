/**
 * Centralized Spotify configuration. Reads secrets from the environment so the
 * Client Secret never appears in source or client-side code.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const spotifyConfig = {
  clientId: required('SPOTIFY_CLIENT_ID'),
  clientSecret: required('SPOTIFY_CLIENT_SECRET'),
  redirectUri: required('SPOTIFY_REDIRECT_URI'),

  // Where to send the user after a successful login. Defaults to '/' (same
  // origin as the API, correct in production). In dev the client runs on the
  // Vite server, so set CLIENT_BASE_URL=http://127.0.0.1:5173 in .env.
  clientBaseUrl: process.env.CLIENT_BASE_URL || '/',

  // Minimum-scopes principle: request only what current features need.
  // user-top-read                         → GET /me/top/{type} (top artists/tracks)
  // streaming + user-read-email/private    → Web Playback SDK player
  // user-modify-playback-state             → start playback on the device
  // playlist-read-private                   → GET /me/playlists (user's playlists)
  // user-follow-read                        → GET /me/following (followed artists)
  // user-library-read                       → GET /me/albums + /me/tracks (saved library)
  // NOTE: adding scopes requires existing users to log in again to re-consent.
  scopes: [
    'user-top-read',
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'playlist-read-private',
    'user-follow-read',
    'user-library-read',
  ] as readonly string[],

  accountsBaseUrl: 'https://accounts.spotify.com',
  apiBaseUrl: 'https://api.spotify.com/v1',
} as const;

/**
 * Authorization Code flow authenticates the token request with HTTP Basic auth:
 * `Basic base64(client_id:client_secret)`. Computed once at startup.
 */
export const basicAuthHeader = `Basic ${Buffer.from(
  `${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`,
).toString('base64')}`;
