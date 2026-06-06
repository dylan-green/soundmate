// Barrel for the shared types used by both the server (src/app) and the browser
// client (src/client). Import from here or from the individual modules. Internal
// re-exports use the `.js` extension required by the server's NodeNext config
// (the client's bundler resolution tolerates it too).
export * from './spotify.js';
export * from './top-items.js';
export * from './auth.js';
export * from './playback.js';
