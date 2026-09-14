import { describe, expect, it } from 'vitest';
import { ICON_NAMES, iconSvg } from './index';

describe('icon registry', () => {
  it('resolves every declared name to a real file', () => {
    const missing = ICON_NAMES.filter((name) => !iconSvg(name).includes('<svg'));
    expect(missing).toEqual([]);
  });

  it('strips fixed dimensions so the size prop wins', () => {
    expect(iconSvg('tab-map')).not.toMatch(/\swidth="/);
  });

  it('keeps width/height on a nested shape, not just the root svg', () => {
    // tab-plan's destination <rect> needs its own size — a global strip
    // zeroes it out and the shape silently vanishes.
    expect(iconSvg('tab-plan')).toMatch(/<rect[^>]*\swidth="4.8"[^>]*\sheight="4.8"/);
  });
});
