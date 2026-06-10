import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../errors/app-error.js';
import { activeUserStore } from '../lib/session-users.js';
import * as playbackService from '../services/playback-service.js';

const bodySchema = z.object({
  deviceId: z.string().optional(),
  uris: z.array(z.string()).min(1).max(50),
});

/** PUT /me/player/play — start playback of the given track URIs on a device. */
export async function startPlayback(req: Request, res: Response): Promise<void> {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new BadRequestError('Invalid playback request', details);
  }

  await playbackService.startPlayback(activeUserStore(req), parsed.data);
  res.status(204).end();
}
