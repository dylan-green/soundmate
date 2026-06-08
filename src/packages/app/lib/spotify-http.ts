/**
 * fetch wrapper that respects Spotify's rate limiting.
 *
 * On HTTP 429 it waits for the `Retry-After` header (seconds) if present,
 * otherwise falls back to exponential backoff. It never retries in a tight
 * loop, and gives up after `maxRetries`.
 */
interface BackoffOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  options: BackoffOptions = {},
): Promise<Response> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;

  let attempt = 0;
  for (;;) {
    const response = await fetch(url, init);

    if (response.status !== 429 || attempt >= maxRetries) {
      return response;
    }

    // Prefer the server-provided Retry-After (in seconds); else exponential backoff.
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 0;
    const backoffMs =
      retryAfterMs > 0 ? retryAfterMs : baseDelayMs * 2 ** attempt;

    await delay(backoffMs);
    attempt += 1;
  }
}
