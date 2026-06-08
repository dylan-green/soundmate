// Single entry point for all calls to the soundmate API.
//
// In dev, VITE_API_BASE_URL is unset so paths stay relative ("/me/..."), and the
// Vite proxy forwards them to the API on :8080 — same-origin, so the session
// cookie just works. In production the client is a separate static origin, so
// VITE_API_BASE_URL points at the API origin and every request must opt into
// sending the cross-site cookie via `credentials: 'include'` (the API sets
// `SameSite=None; Secure` + CORS `credentials: true` to match).
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, { ...init, credentials: 'include' });
}
