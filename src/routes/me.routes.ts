import { Router } from 'express';
import { getTopItems } from '../controllers/me.controller.js';
import { startPlayback } from '../controllers/playback.controller.js';

// Mounted at '/me' in index.ts.
const router: Router = Router();

router.get('/top/:type', getTopItems); // GET /me/top/:type
router.put('/player/play', startPlayback); // PUT /me/player/play

export default router;
