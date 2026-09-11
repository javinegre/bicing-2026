export const TABS = ['map', 'plan', 'search', 'saved', 'info', 'account'] as const;
export type Tab = (typeof TABS)[number];

export const SEARCH_QUERY_PARAM = 'query';

const DEFAULT_TAB: Tab = 'map';

/** URL segment for each tab, relative to the base path — no leading/trailing
 *  slash; `map` is the root itself, so its segment is empty. */
const TAB_SEGMENT: Record<Tab, string> = {
  map: '',
  plan: 'plan',
  search: 'search',
  saved: 'saved',
  info: 'info',
  account: 'account',
};

const SEGMENT_TAB: Record<string, Tab> = Object.fromEntries(
  TABS.map((tab) => [TAB_SEGMENT[tab], tab] as const),
);

/** Strips the app's base path (`import.meta.env.BASE_URL`, e.g. `/bicing-2026/`
 *  in prod, `/staging-bicing-2026/` on staging, `/` in dev/test) from a full
 *  pathname, trimming surrounding slashes (`""` for the root). */
export function stripBase(pathname: string, base: string): string {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  const rest = prefix && pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
  return rest.replace(/^\/+|\/+$/g, '');
}

/** Which tab a full pathname (`location.pathname`) resolves to. Anything not
 *  one of the known segments — including a path under a different base
 *  entirely — falls back to `map`. */
export function tabFromPath(pathname: string, base: string): Tab {
  return SEGMENT_TAB[stripBase(pathname, base)] ?? DEFAULT_TAB;
}

/** Full pathname (including base) for a tab, e.g.
 *  `pathForTab('plan', '/bicing-2026/')` → `/bicing-2026/plan`. */
export function pathForTab(tab: Tab, base: string): string {
  const segment = TAB_SEGMENT[tab];
  return segment ? `${base}${segment}` : base; // base already ends in '/'
}

/** Reads `query` out of a search string (`location.search`) via
 *  `URLSearchParams` — never regex/string-split on raw `location.search`,
 *  which is what keeps `&`, `#`, `<`, `"` etc. from corrupting parsing. */
export function readSearchQuery(search: string): string {
  return new URLSearchParams(search).get(SEARCH_QUERY_PARAM) ?? '';
}

/** Full path (+ `?query=…` for the search tab, when non-empty) for a tab.
 *  Built with `URLSearchParams.set`/`toString`, so special characters are
 *  percent-encoded into the query component rather than concatenated into
 *  the URL structure. */
export function buildUrl(tab: Tab, searchQuery: string, base: string): string {
  const path = pathForTab(tab, base);
  if (tab !== 'search' || !searchQuery) return path;
  const params = new URLSearchParams();
  params.set(SEARCH_QUERY_PARAM, searchQuery);
  return `${path}?${params.toString()}`;
}
