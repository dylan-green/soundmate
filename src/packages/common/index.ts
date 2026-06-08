// Barrel for the shared types used by both @soundmate/app (server, NodeNext) and
// @soundmate/client (browser, bundler). Import from here or from the individual
// subpath modules (e.g. `@soundmate/common/auth`). Internal re-exports use the
// `.js` extension required by the server's NodeNext config (the client's bundler
// resolution tolerates it too).
export * from './spotify.js';
export * from './top-items.js';
export * from './auth.js';
export * from './playback.js';
export * from './library.js';
