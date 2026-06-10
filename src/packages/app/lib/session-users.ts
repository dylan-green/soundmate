import type { Request } from 'express';
import type { TokenStore } from '@soundmate/common/auth';
import { AppError } from '../errors/app-error.js';
import { userTokenStore } from './user-token-store.js';

/**
 * Helpers for the multi-user session: a session holds a roster of member Spotify
 * ids (`req.session.users`) plus the `activeUserId` that playback/token
 * endpoints act as. Row-level security: every id used to address data comes from
 * the session here, NEVER from the request body/query/params.
 */

/** The session's member roster (empty array if none). */
export function sessionUsers(req: Request): string[] {
  return req.session.users ?? [];
}

/** All members, or 401 if the session has none (not authenticated). */
export function requireSessionUsers(req: Request): string[] {
  const users = sessionUsers(req);
  if (users.length === 0) {
    throw new AppError('Not authenticated', 401);
  }
  return users;
}

/** The active member's id, or 401 if none / it isn't actually in the roster. */
export function requireActiveUserId(req: Request): string {
  const active = req.session.activeUserId;
  if (!active || !sessionUsers(req).includes(active)) {
    throw new AppError('Not authenticated', 401);
  }
  return active;
}

/**
 * The member this browser authenticated as (set only on a real login), or 401.
 * Unlike the active member, this is NOT switchable — it's the only identity whose
 * raw token may be released to the browser. See `ownerUserStore`.
 */
export function requireOwnerUserId(req: Request): string {
  const owner = req.session.ownerUserId;
  if (!owner || !sessionUsers(req).includes(owner)) {
    throw new AppError('Not authenticated', 401);
  }
  return owner;
}

/** A Redis-backed TokenStore for the active member (throws 401 if none). */
export function activeUserStore(req: Request): TokenStore {
  return userTokenStore(requireActiveUserId(req));
}

/**
 * A Redis-backed TokenStore for the session OWNER — the member this browser
 * authenticated as. Use this (never `activeUserStore`) anywhere a raw token is
 * handed to the browser, so switching active can't exfiltrate another member's
 * token. Throws 401 if there's no authenticated owner.
 */
export function ownerUserStore(req: Request): TokenStore {
  return userTokenStore(requireOwnerUserId(req));
}

/**
 * Add a member to the roster (dedup) and make them BOTH the active member and
 * the session owner. The owner is updated here — on a real login only — so the
 * member whose token /auth/token releases is always the last person to actually
 * authenticate on this browser.
 */
export function addSessionUser(req: Request, userId: string): void {
  const users = sessionUsers(req);
  if (!users.includes(userId)) {
    users.push(userId);
  }
  req.session.users = users;
  req.session.activeUserId = userId;
  req.session.ownerUserId = userId;
}

/**
 * Remove a member from the roster. Returns whether they were present. If the
 * removed member was active, the active member falls back to the first remaining
 * one (or undefined when the roster is now empty). If the removed member was the
 * owner, the owner is cleared — a re-login is required before /auth/token will
 * release a token again (we never promote a member this browser didn't authID as).
 */
export function removeSessionUser(req: Request, userId: string): boolean {
  const users = sessionUsers(req);
  const idx = users.indexOf(userId);
  if (idx === -1) {
    return false;
  }
  users.splice(idx, 1);
  req.session.users = users;
  if (req.session.activeUserId === userId) {
    const next = users[0];
    if (next === undefined) {
      delete req.session.activeUserId; // roster now empty
    } else {
      req.session.activeUserId = next;
    }
  }
  if (req.session.ownerUserId === userId) {
    delete req.session.ownerUserId;
  }
  return true;
}
