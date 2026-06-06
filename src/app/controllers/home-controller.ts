import type { Request, Response } from 'express';

/**
 * The landing page now lives in the Lit client (src/client) and is served as
 * a static build in production (or by the Vite dev server in development).
 */

/** GET /health — machine-readable health check. */
export function healthCheck(_req: Request, res: Response): void {
  res.json({ status: 'ok', service: 'soundmate' });
}
