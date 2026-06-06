import type { LoginStatus } from '../../common/auth';

/**
 * Fetch the current login status from the backend.
 * In dev, Vite proxies /login/* to the Express server (see vite.config.ts).
 */
export async function getLoginStatus(): Promise<LoginStatus> {
  const response = await fetch('/login/status');
  if (!response.ok) {
    throw new Error(`Failed to fetch login status (HTTP ${response.status})`);
  }
  return (await response.json()) as LoginStatus;
}
