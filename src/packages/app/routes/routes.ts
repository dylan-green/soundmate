import { Router } from 'express';
import {
  getPlaylistTracks,
  getTopArtists,
  getTopPlaylists,
  getTopTracks,
} from '../controllers/spotify-controller.js';
import { startPlayback } from '../controllers/playback-controller.js';
import {
  getSyncStatus,
  getUserLibrary,
  startSync,
} from '../controllers/sync-controller.js';

// Mounted at '/me' in index.ts.
const router: Router = Router();

router.post('/sync', startSync); // POST /me/sync          -> begin library fetch
router.get('/sync/status', getSyncStatus); // GET  /me/sync/status   -> sync progress
router.get('/library', getUserLibrary); // GET  /me/library       -> cached library

router.get('/top/tracks', getTopTracks); // GET /me/top/tracks
router.get('/top/artists', getTopArtists); // GET /me/top/artists
router.get('/top/playlists', getTopPlaylists); // GET /me/top/playlists
router.get('/playlists/:id/tracks', getPlaylistTracks); // GET /me/playlists/:id/tracks
router.put('/player/play', startPlayback); // PUT /me/player/play

export default router;
