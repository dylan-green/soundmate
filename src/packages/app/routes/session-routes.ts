import { Router } from 'express';
import { createInvite, getSession } from '../controllers/session-controller.js';

// Mounted at '/session' in index.ts.
const router: Router = Router();

router.get('/', getSession); // GET  /session         -> roster + active + group
router.post('/invite', createInvite); // POST /session/invite  -> mint a join link

export default router;
