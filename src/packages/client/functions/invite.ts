import type { InviteResponse } from '@soundmate/common/auth';
import { apiFetch } from './api';

/**
 * Mint a shareable invite link for the current session's group. Send the URL to
 * someone on another device; when they open it and log in with Spotify they join
 * this group, so each can browse the other's library (playback stays per-account).
 * See the server's POST /session/invite.
 */
export async function createInvite(): Promise<InviteResponse> {
  const response = await apiFetch('/session/invite', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`Failed to create invite (HTTP ${response.status})`);
  }
  return (await response.json()) as InviteResponse;
}
