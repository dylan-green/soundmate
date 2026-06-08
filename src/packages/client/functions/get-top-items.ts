import type { TopItemsResponse } from "@soundmate/common/top-items";
import { apiFetch } from './api';
import { NotAuthorizedError } from './errors';

export async function getTopItems(
  type: 'artists' | 'tracks' | 'playlists',
): Promise<TopItemsResponse> {
  const response = await apiFetch(`/me/top/${type}?limit=50`);

  if (response.status === 401 || response.status === 403) {
    throw new NotAuthorizedError();
  }
  if (!response.ok) {
    throw new Error(`Failed to load top ${type} (HTTP ${response.status})`);
  }
  return (await response.json()) as TopItemsResponse;
}
