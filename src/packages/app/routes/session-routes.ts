import { Router } from 'express';
import {
  createInvite,
  getSession,
  removeUser,
  setActiveUser,
} from '../controllers/session-controller.js';

// Mounted at '/session' in index.ts.
const router: Router = Router();

router.get('/', getSession); // GET    /session            -> roster + active + group
router.post('/invite', createInvite); // POST   /session/invite     -> mint a join link
router.post('/active', setActiveUser); // POST   /session/active     -> switch active member
router.delete('/users/:id', removeUser); // DELETE /session/users/:id -> per-member logout

export default router;
