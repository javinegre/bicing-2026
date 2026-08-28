import { distanceMeters, walkingMinutes } from './distance';
import type { Coordinates, Station } from './types';

export interface RankedStation {
  station: Station;
  meters: number;
  /** Pre-formatted for the list, e.g. "3 min". */
  walk: string;
}

/**
 * Stations ranked by walking distance from a point. Out-of-service stations are
 * kept — the design shows them greyed rather than hiding them, so someone
 * doesn't walk to a station they think just isn't listed.
 */
export function rankByDistance(
  stations: readonly Station[],
  center: Coordinates,
  { limit = Infinity, excludeId }: { limit?: number; excludeId?: number | null } = {},
): RankedStation[] {
  const ranked: RankedStation[] = [];
  for (const station of stations) {
    if (station.id === excludeId) continue;
    const meters = distanceMeters(station, center);
    ranked.push({ station, meters, walk: `${walkingMinutes(meters)} min` });
  }
  ranked.sort((a, b) => a.meters - b.meters);
  return limit === Infinity ? ranked : ranked.slice(0, limit);
}

/** Diacritic- and case-insensitive substring match — "gracia" finds "Gràcia". */
export function matchStations(stations: readonly Station[], query: string): Station[] {
  const needle = normalize(query.trim());
  if (!needle) return [];
  return stations.filter((s) => normalize(s.name).includes(needle));
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
