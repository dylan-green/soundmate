import type { SessionView } from '@soundmate/common/auth';
import { apiFetch } from './api';

/**
 * Fetch the session's membership: the connected member ids and which one is
 * active (playback/token act as the active member). The session is multi-user —
 * see the server's GET /session.
 */
export async function getSession(): Promise<SessionView> {
  const response = await apiFetch('/session');
  if (!response.ok) {
    throw new Error(`Failed to fetch session (HTTP ${response.status})`);
  }
  return (await response.json()) as SessionView;
}
