import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/** Whether we've checked auth yet, and the result. */
export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  /** Granted scopes (space-separated). Present only when authenticated. */
  scope?: string | undefined;
  /**
   * Cached browser access token. IN-MEMORY ONLY — never persisted to
   * localStorage/sessionStorage. The session cookie is the source of truth; on
   * reload this is re-fetched from GET /auth/token. The refresh token and
   * Client Secret never reach the browser.
   */
  accessToken?: string | undefined;
  /** Epoch ms when the cached access token expires (from GET /auth/token). */
  expiresAt?: number | undefined;
}

const initialState: AuthState = { status: 'unknown' };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Mirror GET /login/status (token-free) into the slice. */
    setAuthStatus(
      state,
      action: PayloadAction<{ status: AuthStatus; scope?: string | undefined }>,
    ) {
      state.status = action.payload.status;
      state.scope = action.payload.scope;
      if (action.payload.status !== 'authenticated') {
        state.accessToken = undefined;
        state.expiresAt = undefined;
      }
    },
    /** Cache a freshly fetched browser access token (from GET /auth/token). */
    setAccessToken(
      state,
      action: PayloadAction<{ accessToken: string; expiresAt: number }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.expiresAt = action.payload.expiresAt;
      state.status = 'authenticated';
    },
    /** Drop all auth state — e.g. after a 401 from the API. */
    clearAuth(state) {
      state.status = 'unauthenticated';
      state.scope = undefined;
      state.accessToken = undefined;
      state.expiresAt = undefined;
    },
  },
});

const { setAuthStatus, setAccessToken, clearAuth } = authSlice.actions;

export const AuthStore = {
  initialState,
  authSlice,
  setAuthStatus,
  setAccessToken,
  clearAuth,
};
