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
});
