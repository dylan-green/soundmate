/** Shape of the JSON returned by the server's GET /login/status endpoint. */
export interface LoginStatus {
  status: 'authenticated' | 'unauthenticated';
  /** Granted scopes (space-separated). Present only when authenticated. */
  scope?: string;
  /** ISO timestamp of access-token expiry. Present only when authenticated. */
  expiresAt?: string;
}
