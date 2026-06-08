import { createClient, type RedisClientType } from 'redis';

/**
 * Lazily-connected, process-wide Redis client. This is the infrastructure layer
 * — it knows nothing about Express or Spotify; the repository builds on top of it.
 *
 * `getRedis()` connects on first use and reuses the same connection thereafter.
 */
let client: RedisClientType | undefined;
let connecting: Promise<RedisClientType> | undefined;

export async function getRedis(): Promise<RedisClientType> {
  if (client?.isReady) {
    return client;
  }
  // Collapse concurrent first-callers onto a single connect().
  if (!connecting) {
    const instance: RedisClientType = createClient({
      url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    });
    instance.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    connecting = instance
      .connect()
      .then(() => {
        client = instance;
        return instance;
      })
      .catch((err) => {
        // Don't cache a failed connect — let the next caller retry.
        connecting = undefined;
        throw err;
      });
  }
  return connecting;
}
