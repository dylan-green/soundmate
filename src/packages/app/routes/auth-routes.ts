import { Router } from 'express';
import { getAccessToken } from '../controllers/auth-controller.js';

// Mounted at '/auth' in index.ts.
const router: Router = Router();

router.get('/token', getAccessToken); // GET /auth/token

export default router;
