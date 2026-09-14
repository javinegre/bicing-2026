import { describe, expect, it } from 'vitest';
import { ICON_NAMES, iconSvg, stripSize } from './index';

describe('icon registry', () => {
  it('resolves every declared name to a real file', () => {
    const missing = ICON_NAMES.filter((name) => !iconSvg(name).includes('<svg'));
    expect(missing).toEqual([]);
  });

  it('strips fixed dimensions so the size prop wins', () => {
    expect(iconSvg('tab-map')).not.toMatch(/\swidth="/);
  });

  it('keeps width/height on a nested shape, not just the root svg', () => {
    // A rect (or any nested shape) with its own width/height must survive —
    // a global strip over the whole file zeroes it out and the shape
    // silently vanishes.
    const svg = '<svg width="24" height="24"><rect width="4.8" height="4.8"/></svg>';
    expect(stripSize(svg)).toBe('<svg><rect width="4.8" height="4.8"/></svg>');
  });
});
