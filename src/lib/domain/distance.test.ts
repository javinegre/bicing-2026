import { describe, expect, it } from 'vitest';
import { NEARBY_RADIUS_M, distanceMeters, isNearby, walkingMinutes } from './distance';

const center = { lat: 41.3869, lng: 2.1702 };

describe('distanceMeters', () => {
  it('is zero for the same point', () => {
    expect(distanceMeters(center, center)).toBe(0);
  });

  it('measures a known offset within a few metres', () => {
    // 0.001° of latitude is ~111 m anywhere on Earth.
    const north = { lat: center.lat + 0.001, lng: center.lng };
    expect(distanceMeters(center, north)).toBeCloseTo(111, 0);
  });

  it('accounts for longitude converging at Barcelona’s latitude', () => {
    const east = { lat: center.lat, lng: center.lng + 0.001 };
    const north = { lat: center.lat + 0.001, lng: center.lng };
    expect(distanceMeters(center, east)).toBeLessThan(distanceMeters(center, north));
  });
});

describe('walkingMinutes', () => {
  it('never reads zero', () => {
    expect(walkingMinutes(0)).toBe(1);
    expect(walkingMinutes(10)).toBe(1);
  });

  it('rounds to whole minutes at 80 m/min', () => {
    expect(walkingMinutes(240)).toBe(3);
  });
});

describe('isNearby', () => {
  it('includes points inside the radius and excludes points outside', () => {
    const inside = { lat: center.lat + 0.001, lng: center.lng };
    const outside = { lat: center.lat + 0.01, lng: center.lng };
    expect(isNearby(inside, center)).toBe(true);
    expect(isNearby(outside, center)).toBe(false);
    expect(NEARBY_RADIUS_M).toBeGreaterThan(0);
  });
});
