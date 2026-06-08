import type { Request } from 'express';
import type { TokenStore } from '@soundmate/common/auth';

/**
 * Adapt an Express request's session into the framework-agnostic TokenStore
 * that the auth/data services depend on. Controllers build this and pass it
 * down, so services never touch Express or cookies.
 */
export function sessionTokenStore(req: Request): TokenStore {
  return {
    get: () => req.session.tokens ?? null,
    set: (tokens) => {
      req.session.tokens = tokens;
    },
    clear: () => {
      delete req.session.tokens;
    },
  };
}
