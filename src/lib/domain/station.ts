import type { BikeTypeFilter, ResourceType, Station, StateColor } from './types';

/**
 * Thresholds are inclusive upper bounds on the resource count, checked in
 * order. They come from the 2023 app's `config.app.markerColor` and are
 * restated in the design's legend ("6 or more", "3 to 5", "1 or 2", "No bikes").
 */
const COLOR_THRESHOLDS: ReadonlyArray<readonly [max: number, color: StateColor]> = [
  [0, 'black'],
  [2, 'red'],
  [5, 'orange'],
  [Infinity, 'green'],
];

/** The count the marker colour and the big number both read from. */
export function resourceCount(
  station: Pick<Station, 'mechanical' | 'electrical' | 'docks'>,
  resource: ResourceType,
  bikeFilter: BikeTypeFilter = null,
): number {
  if (resource === 'docks') return station.docks;
  if (bikeFilter === 'mechanical') return station.mechanical;
  if (bikeFilter === 'electrical') return station.electrical;
  return station.mechanical + station.electrical;
}

/**
 * An out-of-service station is grey whatever it is reporting — the count is
 * not trustworthy, so it must not read as "plenty available".
 */
export function stateColor(count: number, inService = true): StateColor {
  if (!inService) return 'gray';
  return COLOR_THRESHOLDS.find(([max]) => count <= max)![1];
}

export function stationColor(
  station: Station,
  resource: ResourceType,
  bikeFilter: BikeTypeFilter = null,
): StateColor {
  return stateColor(resourceCount(station, resource, bikeFilter), station.status === 1);
}

/**
 * The three-segment availability bar: mechanical, electric, free docks. Widths
 * are percentages of the station's total capacity so two stations of different
 * sizes stay visually comparable.
 */
export function availabilitySplit(station: Pick<Station, 'mechanical' | 'electrical' | 'docks'>): {
  mechanical: number;
  electrical: number;
  docks: number;
} {
  const total = station.mechanical + station.electrical + station.docks || 1;
  return {
    mechanical: (station.mechanical / total) * 100,
    electrical: (station.electrical / total) * 100,
    docks: (station.docks / total) * 100,
  };
}

/** Merge the two upstream feeds into one list, dropping stations missing from either. */
export function mergeStations(
  info: ReadonlyArray<{ id: number; name: string; lat: number; lng: number }>,
  status: ReadonlyArray<{
    id: number;
    mechanical: number;
    electrical: number;
    docks: number;
    status: 0 | 1;
  }>,
): Station[] {
  const byId = new Map(status.map((s) => [s.id, s]));
  const merged: Station[] = [];
  for (const i of info) {
    const s = byId.get(i.id);
    if (s) merged.push({ ...i, ...s });
  }
  return merged;
}
