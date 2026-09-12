import type { Coordinates } from './types';

/**
 * Barcelona's Bicing area is ~10 km across, so an equirectangular projection
 * is accurate to well under the precision anyone reads off a "3 min" label,
 * and it is cheap enough to run over ~500 stations on every map move.
 */
const EARTH_RADIUS_M = 6_371_000;
const BCN_LAT_COS = Math.cos((41.39 * Math.PI) / 180);

/** Comfortable city walking pace; the design's list shows whole minutes. */
const WALKING_M_PER_MIN = 80;

export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = (((b.lng - a.lng) * Math.PI) / 180) * BCN_LAT_COS;
  return Math.sqrt(dLat * dLat + dLng * dLng) * EARTH_RADIUS_M;
}

/** Never reads "0 min" — the nearest station is always at least a minute away. */
export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALKING_M_PER_MIN));
}

/**
 * The dashed "5 min walk" circle on the map, and the cut-off for what counts as
 * "nearby" in the info bar totals. Carried over from the 2023 app, where it was
 * expressed as a lat/lng ellipse; as metres it is the same ~340 m.
 */
export const NEARBY_RADIUS_M = 340;

export function isNearby(point: Coordinates, center: Coordinates): boolean {
  return distanceMeters(point, center) <= NEARBY_RADIUS_M;
}

/** Google's tile size; zoom N means the world is TILE_SIZE_PX * 2^N pixels wide. */
const TILE_SIZE_PX = 256;

/**
 * Converts a ground distance to on-screen pixels at a given latitude and zoom,
 * matching Google Maps' Web Mercator scale — for sizing the dashed "nearby"
 * circle drawn over the map, which is a screen-space overlay, not a real shape
 * with its own coordinates.
 */
export function metersToPixels(meters: number, lat: number, zoom: number): number {
  const metersPerPixel =
    (2 * Math.PI * EARTH_RADIUS_M * Math.cos((lat * Math.PI) / 180)) / (TILE_SIZE_PX * 2 ** zoom);
  return meters / metersPerPixel;
}
