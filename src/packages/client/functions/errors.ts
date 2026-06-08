/**
 * Thrown when a backend request fails because the user isn't logged in (no
 * valid session) or hasn't granted the required scope — i.e. an HTTP 401/403.
 *
 * Single canonical class so `err instanceof NotAuthorizedError` holds no matter
 * which fetch helper threw it.
 */
export class NotAuthorizedError extends Error {}
