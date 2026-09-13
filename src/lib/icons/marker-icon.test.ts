import { describe, expect, it } from 'vitest';
import { getMarkerIconUrl, markerCacheSize } from './marker-icon';
import { markerSizeForZoom } from '$lib/map/map-options';
import type { ResourceType, StateColor, MarkerSize } from '$lib/domain/types';

const decode = (url: string) => decodeURIComponent(url.replace('data:image/svg+xml,', ''));
const lineCount = (svg: string) => (svg.match(/<line/g) ?? []).length;

const RESOURCES: ResourceType[] = ['bikes', 'docks'];
const SIZES: MarkerSize[] = ['xs', 's', 'm', 'l'];
const COLORS: StateColor[] = ['green', 'orange', 'red', 'black', 'gray'];

describe('getMarkerIconUrl', () => {
  it('substitutes every placeholder', () => {
    for (const resource of RESOURCES) {
      for (const size of SIZES) {
        for (const color of COLORS) {
          expect(decode(getMarkerIconUrl(resource, size, color))).not.toContain('{{');
        }
      }
    }
  });

  it('paints the main fill from the colour', () => {
    expect(decode(getMarkerIconUrl('bikes', 'm', 'green'))).toContain('#AACC22');
    expect(decode(getMarkerIconUrl('docks', 's', 'red'))).toContain('#DD0033');
  });

  it('keeps the two ring greys the original drawings used', () => {
    expect(decode(getMarkerIconUrl('bikes', 'm', 'orange'))).toContain('#404040');
    expect(decode(getMarkerIconUrl('bikes', 'l', 'orange'))).toContain('#404040');
    expect(decode(getMarkerIconUrl('bikes', 's', 'orange'))).toContain('#444444');
    expect(decode(getMarkerIconUrl('bikes', 'xs', 'orange'))).toContain('#444444');
  });

  it('strikes through and lightens only the out-of-service marker', () => {
    const gray = decode(getMarkerIconUrl('bikes', 'm', 'gray'));
    expect(gray).toContain('stroke="#808080"');
    expect(gray).toContain('#BBBBBB');

    // In service, the strike line and the pointer outline resolve to none, so
    // the pointer keeps exactly the size it has in the original artwork.
    expect(decode(getMarkerIconUrl('bikes', 'm', 'green'))).toContain('stroke="none"');
  });

  it('has no strike line at xs/s, where the source art never had one', () => {
    expect(decode(getMarkerIconUrl('bikes', 'xs', 'gray'))).not.toContain('<line');
    expect(decode(getMarkerIconUrl('bikes', 's', 'gray'))).not.toContain('<line');
    expect(decode(getMarkerIconUrl('docks', 'xs', 'gray'))).not.toContain('<line');
    expect(decode(getMarkerIconUrl('docks', 's', 'gray'))).not.toContain('<line');
  });

  it('draws one strike for bikes and two for docks at m/l', () => {
    expect(lineCount(decode(getMarkerIconUrl('bikes', 'm', 'gray')))).toBe(1);
    expect(lineCount(decode(getMarkerIconUrl('bikes', 'l', 'gray')))).toBe(1);
    expect(lineCount(decode(getMarkerIconUrl('docks', 'm', 'gray')))).toBe(2);
    expect(lineCount(decode(getMarkerIconUrl('docks', 'l', 'gray')))).toBe(2);
  });

  it('caches, so ~500 markers never rebuild the same string twice', () => {
    const first = getMarkerIconUrl('bikes', 'm', 'green');
    const before = markerCacheSize();
    expect(getMarkerIconUrl('bikes', 'm', 'green')).toBe(first);
    expect(markerCacheSize()).toBe(before);
    // 2 resources x 4 sizes x 5 colours is the whole space.
    expect(before).toBeLessThanOrEqual(40);
  });
});

describe('markerSizeForZoom', () => {
  it.each([
    [13, 'xs'],
    [14, 's'],
    [15, 's'],
    [16, 'm'],
    [17, 'm'],
    [18, 'l'],
  ] as const)('zoom %i -> %s', (zoom, size) => {
    expect(markerSizeForZoom(zoom)).toBe(size);
  });
});
