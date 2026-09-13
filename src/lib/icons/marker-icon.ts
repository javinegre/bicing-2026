import bikesXs from './markers/bikes-xs.svg?raw';
import bikesS from './markers/bikes-s.svg?raw';
import bikesM from './markers/bikes-m.svg?raw';
import bikesL from './markers/bikes-l.svg?raw';
import docksXs from './markers/docks-xs.svg?raw';
import docksS from './markers/docks-s.svg?raw';
import docksM from './markers/docks-m.svg?raw';
import docksL from './markers/docks-l.svg?raw';
import type { MarkerSize, ResourceType, StateColor } from '$lib/domain/types';

const TEMPLATES: Record<ResourceType, Record<MarkerSize, string>> = {
  bikes: { xs: bikesXs, s: bikesS, m: bikesM, l: bikesL },
  docks: { xs: docksXs, s: docksS, m: docksM, l: docksL },
};

const MAIN_FILL: Record<StateColor, string> = {
  orange: '#FF9900',
  red: '#DD0033',
  green: '#AACC22',
  black: '#222222',
  gray: '#BBBBBB',
};

/** `xs`/`s` share the small drawing, `m`/`l` share the big one. */
const FAMILY: Record<MarkerSize, 'small' | 'big'> = { xs: 'small', s: 'small', m: 'big', l: 'big' };

/**
 * The ring/pointer is a constant per family, not per colour — the two
 * drawings were made at different times and never matched (#404040 big,
 * #444444 small). Keeping both reproduces the production markers exactly.
 */
const RING_FILL: Record<'small' | 'big', string> = { big: '#404040', small: '#444444' };

/**
 * Grey is the out-of-service state, not a sixth colour: it lightens the ring
 * and switches on the strike line(s) that only the `m`/`l` templates carry.
 * Everything else renders `stroke="none"`, which also keeps the pointer
 * triangle un-stroked and therefore the same size it has always been.
 */
const OUT_OF_SERVICE_STROKE = '#808080';

/**
 * ~500 markers re-read their icon on every zoom, filter and 60 s status
 * refresh. There are only 40 possible results, so build and encode each once.
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
    .replace(/\{\{RING\}\}/g, outOfService ? OUT_OF_SERVICE_STROKE : RING_FILL[FAMILY[size]])
    .replace(/\{\{LINE\}\}/g, outOfService ? OUT_OF_SERVICE_STROKE : 'none');

  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  cache.set(key, url);
  return url;
}

/** Exposed for tests; not part of the rendering path. */
export function markerCacheSize(): number {
  return cache.size;
}
