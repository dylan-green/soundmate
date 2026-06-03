import { Router } from 'express';
import {
  beginLogin,
  handleCallback,
  loginStatus,
} from '../controllers/login.controller.js';

// Mounted at '/login' in index.ts, so paths here are relative to that.
const router: Router = Router();

router.get('/', beginLogin); // GET /login           -> redirect to Spotify
router.get('/callback', handleCallback); // GET /login/callback  -> token exchange
router.get('/status', loginStatus); // GET /login/status    -> auth state (no tokens)

export default router;
