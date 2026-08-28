import { apiFetch } from './client';
import type { BikeTypeFilter, Coordinates, ResourceType } from '$lib/domain/types';

/**
 * The slice of preferences that is genuinely about *the person*, not the
 * device: it should follow them from phone to laptop.
 *
 * Deliberately excluded: the live geolocation fix (`userLocation` and its 2 h
 * TTL in the 2023 app). That is a property of the device holding the app right
 * now — syncing it would teleport a desktop session to wherever the phone last
 * was — so it stays in localStorage. See README, "What moved server-side".
 */
export interface UserConfig {
  mapCenter: Coordinates | null;
  mapZoom: number | null;
  resourceShown: ResourceType;
  bikeTypeFilter: BikeTypeFilter;
  bookmarks: {
    home: Coordinates | null;
    work: Coordinates | null;
    favorite: Coordinates | null;
  };
  /** Stations starred individually, shown under "Saved stations". */
  savedStationIds: number[];
}

export const DEFAULT_CONFIG: UserConfig = {
  mapCenter: null,
  mapZoom: null,
  resourceShown: 'bikes',
  bikeTypeFilter: null,
  bookmarks: { home: null, work: null, favorite: null },
  savedStationIds: [],
};

interface ConfigResponse {
  success: boolean;
  config: UserConfig;
  updatedAt: number;
}

export async function fetchUserConfig(): Promise<UserConfig> {
  const res = await apiFetch<ConfigResponse>('/config');
  return { ...DEFAULT_CONFIG, ...res.config };
}

/**
 * Upsert. The server merges at the top level and rejects unknown keys, so a
 * client that only touched the zoom sends only the zoom.
 */
export async function saveUserConfig(patch: Partial<UserConfig>): Promise<UserConfig> {
  const res = await apiFetch<ConfigResponse>('/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return { ...DEFAULT_CONFIG, ...res.config };
}
