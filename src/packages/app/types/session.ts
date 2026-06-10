import 'express-session';

// Augment express-session's SessionData with our per-session fields. Tokens no
// longer live here — they're stored per-user in Redis (users:<id>:tokens) so a
// session can hold many members. The session only tracks WHO is connected.
declare module 'express-session' {
  interface SessionData {
    /**
     * Roster of member Spotify ids connected to this session. Each is the Redis
     * namespace for that user's tokens + library. This (and activeUserId) are the
     * ONLY source of ids for reads/writes — never the client (row-level security).
     */
    users?: string[];
    /**
     * The member that blended views (library, playback, top items) act as.
     * Freely switchable via POST /session/active to any roster member, so it must
     * NEVER gate release of a raw access token to the browser — see ownerUserId.
     * Always one of `users` (or undefined when the roster is empty).
     */
    activeUserId?: string;
    /**
     * The member this browser actually authenticated as (set only on a real OAuth
     * login, never by switching active). It is the ONLY member whose raw access
     * token GET /auth/token will release — so a second person who JOINS this
     * session and switches `activeUserId` still cannot exfiltrate another member's
     * bearer token. Cleared if that member is removed from the roster.
     */
    ownerUserId?: string;
    /** Pending OAuth CSRF state, set on /login and verified on /login/callback. */
    oauthState?: string;
  }
}
