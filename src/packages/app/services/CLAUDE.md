# Spotify Web API — endpoint reference

Endpoint reference for the Spotify Web API calls used by `services/`. The root
`CLAUDE.md` holds the global rules (auth, scopes, tokens, rate limits, ToS); **this
file does not repeat them** — it documents the specific endpoints below. The
[OpenAPI schema](https://developer.spotify.com/reference/web-api/open-api-schema.yaml)
is authoritative for paths, params, and field names; do not guess.

## Conventions shared by these endpoints

- **Base URL:** `https://api.spotify.com/v1`. All calls go through
  `spotifyApiGet<T>(path, store)` (refresh + 429 backoff + error→AppError mapping).
- **Pagination (offset/limit):** most return an offset-paged object —
  `{ href, limit, next, offset, previous, total, items }`. `next`/`previous` are
  nullable URLs. `limit` is **1–50, default 20**; `offset` default 0.
- **Pagination (cursor):** *Get Followed Artists* is the exception — it uses cursors
  (`after`), not `offset`. See below.
- **`market`:** ISO 3166-1 alpha-2 country code. If a user access token is sent, the
  user's account country takes priority over `market`. Affects content availability /
  track relinking — check `is_playable` on tracks when set.
- **Errors:** every endpoint can return **401** (bad/expired token), **403**
  (missing scope / forbidden), **429** (rate limited — respect `Retry-After`). Handle
  all per root rule 8.
- **Scopes** must be added in `src/packages/app/config/spotify.ts` before a feature uses them, and
  scope changes require the user to re-consent (log in again).

---

## 1. Get User's Top Items

- **`GET /me/top/{type}`** — the user's top artists or tracks by listening affinity.
- **Scope:** `user-top-read` *(granted)*.
- **Path param:** `type` — `artists` | `tracks` (required).
- **Query:**
  - `time_range` — `long_term` (~1 yr) | `medium_term` (~6 mo, **default**) |
    `short_term` (~4 wk).
  - `limit` — 1–50, default 20.
  - `offset` — default 0.
- **Response:** offset-paged; `items` is an array of full **Artist** or **Track**
  objects depending on `type`.
- **Use case:** "top tracks" / "top artists" tabs. Already wired:
  `GET /me/top/tracks`, `GET /me/top/artists`.

## 2. Get Followed Artists

- **`GET /me/following`** — artists the current user follows.
- **Scope:** `user-follow-read` *(NOT yet granted — add to `spotify.ts`, re-consent)*.
- **Query:**
  - `type` — **required**, only `artist` is currently supported.
  - `after` — cursor: the last artist ID from the previous page (pagination).
  - `limit` — 1–50, default 20.
- **Response:** root is `{ artists: {...} }` (note the wrapper). The inner object is
  **cursor-paged**: `{ href, limit, next, total, cursors: { after, before }, items }`.
  `items` is an array of full **Artist** objects (`external_urls`, `followers`,
  `genres`, `id`, `images`, `name`, `popularity`, `type`, `uri`).
- **Gotchas:** no `offset` — paginate with `cursors.after`. No `previous`/`offset`
  fields. Response is nested under `artists`, unlike the others.
- **Use case:** a "followed artists" view.

## 3. Get User's Saved Albums

- **`GET /me/albums`** — albums saved in the user's library ("Your Music").
- **Scope:** `user-library-read` *(NOT yet granted — add + re-consent)*.
- **Query:** `limit` (1–50, default 20), `offset` (default 0), `market`.
- **Response:** offset-paged; `items` is an array of **SavedAlbumObject**:
  `{ added_at (ISO 8601), album {...} }`. The `album` carries full metadata
  (artists, tracks, images, copyrights, external IDs).
- **Use case:** a "saved albums" library view.

## 4. Get Current User's Playlists

- **`GET /me/playlists`** — playlists owned or followed by the current user.
- **Scope:** `playlist-read-private` *(granted)* for private playlists.
- **Query:** `limit` (1–50, default 20), `offset` (**0–100,000**).
- **Response:** offset-paged; `items` is an array of **SimplifiedPlaylistObject**:
  `id`, `name`, `uri`, `href`, `collaborative`, `public`, `description` (nullable),
  `owner`, `images` (≤3, largest first), `snapshot_id`, and the track-collection
  metadata.
- **Field rename (root rule 7):** the per-playlist track-count field was renamed
  `tracks` → `items` (`{ href, total }`). Read **`items`**.
- **Use case:** already wired as `GET /me/top/playlists`. To list a playlist's
  contents use `/playlists/{id}/items` (NOT the deprecated `/tracks`).

## 5. Get User's Saved Tracks

- **`GET /me/tracks`** — tracks saved in the user's library ("Liked Songs").
- **Scope:** `user-library-read` *(NOT yet granted — add + re-consent)*.
- **Query:** `limit` (1–50, default 20), `offset` (default 0), `market`.
- **Response:** offset-paged; `items` is an array of **SavedTrackObject**:
  `{ added_at (ISO 8601), track {...} }` with the full track (album, artists,
  duration, `explicit`, availability). Check `is_playable` when `market` is set.
- **Use case:** a "liked songs" view; normalize `track` into `TopTrack` to reuse the
  existing player queue.

---

## Quick reference

| Feature | Endpoint | Scope | Pagination | Granted? |
|---|---|---|---|---|
| Top items | `GET /me/top/{type}` | `user-top-read` | offset | ✅ |
| Followed artists | `GET /me/following?type=artist` | `user-follow-read` | **cursor (`after`)** | ❌ add |
| Saved albums | `GET /me/albums` | `user-library-read` | offset + `market` | ❌ add |
| Current user playlists | `GET /me/playlists` | `playlist-read-private` | offset (≤100k) | ✅ |
| Saved tracks | `GET /me/tracks` | `user-library-read` | offset + `market` | ❌ add |

`user-library-read` covers **both** saved albums and saved tracks — add it once.
