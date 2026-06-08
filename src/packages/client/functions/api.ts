// Single entry point for all calls to the soundmate API.
//
// In dev, VITE_API_BASE_URL is unset so paths stay relative ("/me/..."), and the
// Vite proxy forwards them to the API on :8080 — same-origin, so the session
// cookie just works. In production the client is a separate static origin, so
// VITE_API_BASE_URL points at the API origin and every request must opt into
// sending the cross-site cookie via `credentials: 'include'` (the API sets
// `SameSite=None; Secure` + CORS `credentials: true` to match).
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

/**
 * Absolute URL to a backend endpoint. Use this for **full-page navigations**
 * that can't go through fetch/CORS — notably the OAuth login link, where the
 * browser must physically travel to the API, then to Spotify's consent page,
 * and back. In dev VITE_API_BASE_URL is unset so this stays a relative path and
 * the Vite proxy forwards it; in prod it resolves to the separate API origin.
 */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), { ...init, credentials: 'include' });
}
