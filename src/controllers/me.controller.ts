import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/AppError.js';
import { sessionTokenStore } from '../lib/sessionTokenStore.js';
import * as topItemsService from '../services/topItems.service.js';

const paramsSchema = z.object({
  type: z.enum(['artists', 'tracks']),
});

const querySchema = z.object({
  time_range: z
    .enum(['long_term', 'medium_term', 'short_term'])
    .default('medium_term'),
  // Query values arrive as strings; coerce and bound to Spotify's limits.
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** GET /me/top/:type?time_range=&limit= — the user's top artists or tracks. */
export async function getTopItems(req: Request, res: Response): Promise<void> {
  const params = paramsSchema.safeParse(req.params);
  if (!params.success) {
    throw new BadRequestError('type must be "artists" or "tracks"');
  }

  const query = querySchema.safeParse(req.query);
  if (!query.success) {
    const details = query.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new BadRequestError('Invalid query parameters', details);
  }

  const result = await topItemsService.getTopItems(
    params.data.type,
    {
      timeRange: query.data.time_range,
      limit: query.data.limit,
    },
    sessionTokenStore(req),
  );
  res.json(result);
}
