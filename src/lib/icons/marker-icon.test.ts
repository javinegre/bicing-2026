import { describe, expect, it } from 'vitest';
import { getMarkerIconUrl, markerCacheSize } from './marker-icon';
import type { ResourceType, StateColor, MarkerSize } from '$lib/domain/types';

const decode = (url: string) => decodeURIComponent(url.replace('data:image/svg+xml,', ''));
const lineCount = (svg: string) => (svg.match(/<line/g) ?? []).length;

const RESOURCES: ResourceType[] = ['bikes', 'docks'];
const SIZES: MarkerSize[] = ['big', 'small'];
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
    expect(decode(getMarkerIconUrl('bikes', 'big', 'green'))).toContain('#AACC22');
    expect(decode(getMarkerIconUrl('docks', 'small', 'red'))).toContain('#DD0033');
  });

  it('keeps the two ring greys the original files used', () => {
    expect(decode(getMarkerIconUrl('bikes', 'big', 'orange'))).toContain('#404040');
    expect(decode(getMarkerIconUrl('bikes', 'small', 'orange'))).toContain('#444444');
  });

  it('strikes through and lightens only the out-of-service marker', () => {
    const gray = decode(getMarkerIconUrl('bikes', 'big', 'gray'));
    expect(gray).toContain('stroke="#808080"');
    expect(gray).toContain('#BBBBBB');

    // In service, the strike line and the pointer outline resolve to none, so
    // the pointer keeps exactly the size it has in the original artwork.
    expect(decode(getMarkerIconUrl('bikes', 'big', 'green'))).toContain('stroke="none"');
  });

  it('has no strike line at small size, where the source art never had one', () => {
    expect(decode(getMarkerIconUrl('bikes', 'small', 'gray'))).not.toContain('<line');
    expect(decode(getMarkerIconUrl('docks', 'small', 'gray'))).not.toContain('<line');
  });

  it('draws one strike for bikes and two for docks', () => {
    expect(lineCount(decode(getMarkerIconUrl('bikes', 'big', 'gray')))).toBe(1);
    expect(lineCount(decode(getMarkerIconUrl('docks', 'big', 'gray')))).toBe(2);
  });

  it('caches, so ~500 markers never rebuild the same string twice', () => {
    const first = getMarkerIconUrl('bikes', 'big', 'green');
    const before = markerCacheSize();
    expect(getMarkerIconUrl('bikes', 'big', 'green')).toBe(first);
    expect(markerCacheSize()).toBe(before);
    // 2 resources x 2 sizes x 5 colours is the whole space.
    expect(before).toBeLessThanOrEqual(20);
  });
});
