import { describe, expect, it } from 'vitest';
import { availabilitySplit, mergeStations, resourceCount, stateColor } from './station';
import type { Station } from './types';

const station = (over: Partial<Station> = {}): Station => ({
  id: 1,
  name: 'Rosselló, 178',
  lat: 41.39,
  lng: 2.16,
  mechanical: 12,
  electrical: 4,
  docks: 6,
  status: 1,
  ...over,
});

describe('stateColor', () => {
  it.each([
    [0, 'black'],
    [1, 'red'],
    [2, 'red'],
    [3, 'orange'],
    [5, 'orange'],
    [6, 'green'],
    [40, 'green'],
  ])('maps %i to %s', (count, expected) => {
    expect(stateColor(count)).toBe(expected);
  });

  it('greys out-of-service stations whatever they report', () => {
    expect(stateColor(20, false)).toBe('gray');
    expect(stateColor(0, false)).toBe('gray');
  });
});

describe('resourceCount', () => {
  it('sums both drivetrains when no filter is set', () => {
    expect(resourceCount(station(), 'bikes')).toBe(16);
  });

  it('narrows to one drivetrain when filtered', () => {
    expect(resourceCount(station(), 'bikes', 'mechanical')).toBe(12);
    expect(resourceCount(station(), 'bikes', 'electrical')).toBe(4);
  });

  it('ignores the bike filter when showing docks', () => {
    expect(resourceCount(station(), 'docks', 'electrical')).toBe(6);
  });
});

describe('availabilitySplit', () => {
  it('splits by total capacity', () => {
    const split = availabilitySplit({ mechanical: 12, electrical: 4, docks: 4 });
    expect(split.mechanical).toBeCloseTo(60);
    expect(split.electrical).toBeCloseTo(20);
    expect(split.docks).toBeCloseTo(20);
  });

  it('does not divide by zero on an empty station', () => {
    const split = availabilitySplit({ mechanical: 0, electrical: 0, docks: 0 });
    expect(split).toEqual({ mechanical: 0, electrical: 0, docks: 0 });
  });
});

describe('mergeStations', () => {
  it('drops stations missing from either feed', () => {
    const merged = mergeStations(
      [
        { id: 1, name: 'A', lat: 0, lng: 0 },
        { id: 2, name: 'B', lat: 0, lng: 0 },
      ],
      [{ id: 1, mechanical: 1, electrical: 0, docks: 3, status: 1 }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ id: 1, name: 'A', docks: 3 });
  });
});
