import bikesBig from './markers/bikes-big.svg?raw';
import bikesSmall from './markers/bikes-small.svg?raw';
import docksBig from './markers/docks-big.svg?raw';
import docksSmall from './markers/docks-small.svg?raw';
import type { MarkerSize, ResourceType, StateColor } from '$lib/domain/types';

const TEMPLATES: Record<ResourceType, Record<MarkerSize, string>> = {
  bikes: { big: bikesBig, small: bikesSmall },
  docks: { big: docksBig, small: docksSmall },
};

const MAIN_FILL: Record<StateColor, string> = {
  orange: '#FF9900',
  red: '#DD0033',
  green: '#AACC22',
  black: '#222222',
  gray: '#BBBBBB',
};

/**
 * The ring/pointer is a constant per size, not per colour — the two families
 * were drawn at different times and never matched (#404040 big, #444444
 * small). Keeping both reproduces the production markers exactly.
 */
const RING_FILL: Record<MarkerSize, string> = { big: '#404040', small: '#444444' };

/**
 * Grey is the out-of-service state, not a sixth colour: it lightens the ring
 * and switches on the strike line(s) that only the `*-big` templates carry.
 * Everything else renders `stroke="none"`, which also keeps the pointer
 * triangle un-stroked and therefore the same size it has always been.
 */
const OUT_OF_SERVICE_STROKE = '#808080';

/**
 * ~500 markers re-read their icon on every zoom, filter and 60 s status
 * refresh. There are only 20 possible results, so build and encode each once.
 */
const cache = new Map<string, string>();

export function getMarkerIconUrl(
  resource: ResourceType,
  size: MarkerSize,
  color: StateColor,
): string {
  const key = `${resource}-${size}-${color}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const outOfService = color === 'gray';
  const svg = TEMPLATES[resource][size]
    .replace(/\{\{MAIN\}\}/g, MAIN_FILL[color])
    .replace(/\{\{RING\}\}/g, outOfService ? OUT_OF_SERVICE_STROKE : RING_FILL[size])
    .replace(/\{\{LINE\}\}/g, outOfService ? OUT_OF_SERVICE_STROKE : 'none');

  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}

/** Exposed for tests; not part of the rendering path. */
export function markerCacheSize(): number {
  return cache.size;
}
