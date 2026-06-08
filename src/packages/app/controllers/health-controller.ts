import type { Request, Response } from 'express';
import { getRedis } from '../redis/redis-client.js';

/**
 * The landing page now lives in the Lit client (src/client) and is served as
 * a static build in production (or by the Vite dev server in development).
 */

/**
 * Ping Redis, time-bounded so an unreachable endpoint can't hang the health
 * check. Never throws — resolves to 'ok' or 'unavailable'.
 */
async function pingRedis(timeoutMs = 1500): Promise<'ok' | 'unavailable'> {
  const attempt = (async (): Promise<'ok' | 'unavailable'> => {
    try {
      const redis = await getRedis();
      return (await redis.ping()) === 'PONG' ? 'ok' : 'unavailable';
    } catch {
      return 'unavailable';
    }
  })();
  const timeout = new Promise<'unavailable'>((resolve) => {
    setTimeout(() => resolve('unavailable'), timeoutMs);
  });
  return Promise.race([attempt, timeout]);
}

/**
 * GET /health — machine-readable health check. Always 200 while the process is
 * alive (so the load balancer keeps the instance in service); `redis` reports
 * cache connectivity separately.
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const redis = await pingRedis();
  res.json({ status: 'ok', service: 'soundmate', redis });
}
