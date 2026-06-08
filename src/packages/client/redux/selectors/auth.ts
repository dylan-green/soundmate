import type { RootState } from '../store';
import type { AuthStatus } from '../slices/auth';

// Selectors
export const selectAuthStatus = (s: RootState): AuthStatus => s.auth.status;
export const isUserAuthenticated = (s: RootState): boolean =>
  s.auth.status === 'authenticated';
export const selectScope = (s: RootState): string | undefined => s.auth.scope;
export const selectAccessToken = (s: RootState): string | undefined =>
  s.auth.accessToken;
export const selectTokenExpiresAt = (s: RootState): number | undefined =>
  s.auth.expiresAt;
