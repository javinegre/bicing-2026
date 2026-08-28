import { describe, expect, it } from 'vitest';
import { matchStations, rankByDistance } from './nearby';
import type { Station } from './types';

const at = (id: number, name: string, lat: number, lng: number): Station => ({
  id,
  name,
  lat,
  lng,
  mechanical: 1,
  electrical: 1,
  docks: 1,
  status: 1,
});

const center = { lat: 41.3869, lng: 2.1702 };
const stations = [
  at(1, 'Far', 41.4, 2.19),
  at(2, 'Near', 41.387, 2.1703),
  at(3, 'Middle', 41.39, 2.175),
];

describe('rankByDistance', () => {
  it('sorts closest first', () => {
    expect(rankByDistance(stations, center).map((r) => r.station.name)).toEqual([
      'Near',
      'Middle',
      'Far',
    ]);
  });

  it('honours limit and excludeId', () => {
    const ranked = rankByDistance(stations, center, { limit: 1, excludeId: 2 });
    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.station.name).toBe('Middle');
  });

  it('formats a walking time', () => {
    expect(rankByDistance(stations, center, { limit: 1 })[0]!.walk).toMatch(/^\d+ min$/);
  });
});

describe('matchStations', () => {
  const named = [at(1, 'Pg. de Gràcia, 45', 0, 0), at(2, 'Rosselló, 178', 0, 0)];

  it('ignores case and diacritics', () => {
    expect(matchStations(named, 'gracia').map((s) => s.id)).toEqual([1]);
    expect(matchStations(named, 'ROSSELLO').map((s) => s.id)).toEqual([2]);
  });

  it('returns nothing for an empty query rather than everything', () => {
    expect(matchStations(named, '   ')).toEqual([]);
  });
});
