/**
 * Single source of truth for the per-user Redis namespace. Every key holding a
 * user's data (tokens, library categories, sync status) hangs off this prefix,
 * so a rename happens in exactly one place and the repositories can't drift.
 *
 * The id must always be a server-derived Spotify id (resolved via GET /me at
 * login), never one supplied by the client (row-level security).
 */
export const userNamespace = (userId: string): string => `users:${userId}`;

/**
 * Namespace for a cross-device soundmate GROUP (a shared member roster).
 */
export const groupNamespace = (groupId: string): string => `groups:${groupId}`;
