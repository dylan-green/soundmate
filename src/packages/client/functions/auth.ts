import { getLoginStatus } from './get-login-status';
import { getUserToken } from './get-user-token';
import { NotAuthorizedError } from './errors';
import { dispatch } from '../redux/dispatch/dispatch';
import { store } from '../redux/store';
import {
  selectAccessToken,
  selectTokenExpiresAt,
} from '../redux/selectors/auth';

/**
 * Re-fetch the token this many ms BEFORE it actually expires, so an in-flight
 * playback call never races the expiry boundary.
 */
const EXPIRY_SKEW_MS = 60_000;

/**
 * Fetch GET /login/status (token-free) and mirror it into the auth slice.
 * Call this once on app boot to make the UI auth-aware.
 */
export async function loadAuthStatus(): Promise<void> {
  try {
    const status = await getLoginStatus();
    dispatch({
      type: 'setAuthStatus',
      payload: { status: status.status, scope: status.scope },
    });
  } catch {
    // Network/parse failure — treat as not-yet-known but don't crash the UI.
    dispatch({ type: 'setAuthStatus', payload: { status: 'unauthenticated' } });
  }
}

/**
 * Return a valid browser access token. Serves the in-memory cached token from
 * the auth slice while it's still fresh; otherwise re-fetches GET /auth/token
 * (which the backend refreshes transparently) and updates the slice.
 *
 * Throws NotAuthorizedError if the user isn't logged in — and flips the slice
 * to `unauthenticated` so the UI reacts.
 */
export async function getCachedAccessToken(): Promise<string> {
  const state = store.getState();
  const cached = selectAccessToken(state);
  const expiresAt = selectTokenExpiresAt(state);
  if (cached && expiresAt && Date.now() < expiresAt - EXPIRY_SKEW_MS) {
    return cached;
  }

  try {
    const { accessToken, expiresAt: exp } = await getUserToken();
    dispatch({
      type: 'setAccessToken',
      payload: { accessToken, expiresAt: exp },
    });
    return accessToken;
  } catch (err) {
    if (err instanceof NotAuthorizedError) {
      dispatch({ type: 'clearAuth', payload: undefined });
    }
    throw err;
  }
}
