import type { LoginStatus } from '@soundmate/common/auth';
import { apiFetch } from './api';

/**
 * Fetch the current login status from the backend.
 * In dev, Vite proxies /login/* to the Express server (see vite.config.ts).
 */
export async function getLoginStatus(): Promise<LoginStatus> {
  const response = await apiFetch('/login/status');
  if (!response.ok) {
    throw new Error(`Failed to fetch login status (HTTP ${response.status})`);
  }
  return (await response.json()) as LoginStatus;
}
