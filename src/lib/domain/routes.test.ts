import { describe, expect, it } from 'vitest';
import { buildUrl, pathForTab, readSearchQuery, tabFromPath, type Tab } from './routes';

describe('tabFromPath', () => {
  const cases: [string, Tab][] = [
    ['/', 'map'],
    ['/plan', 'plan'],
    ['/search', 'search'],
    ['/saved', 'saved'],
    ['/info', 'info'],
    ['/account', 'account'],
  ];

  it.each(cases)('maps %s to %s under base "/"', (path, tab) => {
    expect(tabFromPath(path, '/')).toBe(tab);
  });

  it('falls back to map for an unknown path', () => {
    expect(tabFromPath('/nope', '/')).toBe('map');
  });

  for (const base of ['/bicing-2026/', '/staging-bicing-2026/']) {
    it(`resolves tabs under base ${base}`, () => {
      expect(tabFromPath(`${base}plan`, base)).toBe('plan');
      expect(tabFromPath(base, base)).toBe('map');
      expect(tabFromPath(base.slice(0, -1), base)).toBe('map');
      expect(tabFromPath(`${base}plan/`, base)).toBe('plan');
    });
  }

  it('falls back to map for a path under a different base', () => {
    expect(tabFromPath('/other-app/plan', '/bicing-2026/')).toBe('map');
  });
});

describe('pathForTab', () => {
  it('builds paths under the root base', () => {
    expect(pathForTab('map', '/')).toBe('/');
    expect(pathForTab('plan', '/')).toBe('/plan');
  });

  it('builds paths under a prefixed base', () => {
    expect(pathForTab('map', '/bicing-2026/')).toBe('/bicing-2026/');
    expect(pathForTab('search', '/bicing-2026/')).toBe('/bicing-2026/search');
  });
});

describe('readSearchQuery', () => {
  it('reads the query param', () => {
    expect(readSearchQuery('')).toBe('');
    expect(readSearchQuery('?query=gracia')).toBe('gracia');
    expect(readSearchQuery('?other=1')).toBe('');
    expect(readSearchQuery('?query=')).toBe('');
  });

  it('percent-decodes the value', () => {
    expect(readSearchQuery('?query=Gr%C3%A0cia')).toBe('Gràcia');
  });
});

describe('buildUrl', () => {
  it('omits the query string for non-search tabs', () => {
    expect(buildUrl('map', 'ignored', '/')).toBe('/');
  });

  it('omits the query string when the search query is empty', () => {
    expect(buildUrl('search', '', '/')).toBe('/search');
  });

  it('appends an encoded query param for the search tab', () => {
    expect(buildUrl('search', 'gracia', '/')).toBe('/search?query=gracia');
  });

  const dangerousValues = ['<script>alert(1)</script>', 'a&b', '#frag', '"quoted"', 'space here'];

  it.each(dangerousValues)('round-trips %j without corrupting the URL', (value) => {
    const built = buildUrl('search', value, '/bicing-2026/');

    expect(built).not.toContain('<script>');
    expect(built).not.toContain('"');

    const url = new URL(built, 'http://example.test');
    expect(tabFromPath(url.pathname, '/bicing-2026/')).toBe('search');
    expect(readSearchQuery(url.search)).toBe(value);
  });
});
