import type { RequestHandler } from 'express';

/**
 * Content-Security-Policy tuned for soundmate + the Spotify Web Playback SDK.
 *
 * Why this matters here: the browser holds a short-lived Spotify access token in
 * memory (the auth slice). The only realistic way that token leaks is XSS, so a
 * strict CSP — especially `script-src` without `'unsafe-inline'` — is the main
 * mitigation. Keep it tight; loosen a directive only when a feature needs it.
 *
 * Spotify-specific sources:
 *  - script/frame `https://sdk.scdn.co` — the SDK bootstrap script + its iframe
 *    (the actual playback/EME runs inside that cross-origin frame, which has its
 *    own CSP — so the parent does NOT need `'unsafe-eval'`).
 *  - connect `https://api.spotify.com https://*.spotify.com wss://*.spotify.com`
 *    — Web API calls plus the SDK's realtime "dealer" websocket.
 *  - img `https://*.scdn.co https://*.spotifycdn.com` — album / playlist art.
 *
 * `style-src 'unsafe-inline'` is intentionally allowed: Lit injects component
 * styles, and index.html has an inline <style>. Inline *styles* can't exfiltrate
 * a token the way inline *scripts* can, so this is a deliberate, low-risk relax.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://sdk.scdn.co",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.scdn.co https://*.spotifycdn.com",
  "media-src 'self' blob: https://*.scdn.co",
  "connect-src 'self' https://api.spotify.com https://*.spotify.com wss://*.spotify.com",
  'frame-src https://sdk.scdn.co',
  'child-src https://sdk.scdn.co blob:',
  'worker-src blob:',
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

/**
 * Apply security response headers to every request. Mount this early, before
 * routes and the static handler, so both API responses and the served SPA
 * carry the policy.
 */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  // Block MIME sniffing, leak less referrer data, and refuse to be framed.
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-Frame-Options', 'DENY');
  next();
};
