import { Router } from 'express';
import {
  getPlaylistTracks,
  getTopArtists,
  getTopPlaylists,
  getTopTracks,
} from '../controllers/me-controller.js';
import { startPlayback } from '../controllers/playback-controller.js';

// Mounted at '/me' in index.ts.
const router: Router = Router();

router.get('/top/tracks', getTopTracks); // GET /me/top/tracks
router.get('/top/artists', getTopArtists); // GET /me/top/artists
router.get('/top/playlists', getTopPlaylists); // GET /me/top/playlists
router.get('/playlists/:id/tracks', getPlaylistTracks); // GET /me/playlists/:id/tracks
router.put('/player/play', startPlayback); // PUT /me/player/play

export default router;
