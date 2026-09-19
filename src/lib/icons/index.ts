/**
 * Icons are inlined as raw SVG rather than <img src>, so a single `color` on an
 * ancestor drives fill and stroke (the tab bar needs the same glyph in white
 * and in accent red).
 */
const modules = import.meta.glob('./{ui,hints,misc,markers}/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Listed explicitly so `name` is a checked union rather than an open string.
 * `icons.test.ts` asserts every entry here actually resolves to a file.
 */
export const ICON_NAMES = [
  'bike',
  'bolt',
  'briefcase',
  'chevron-right',
  'clock',
  'close',
  'edit',
  'gears',
  'home',
  'info',
  'parking',
  'refresh',
  'route',
  'search',
  'settings',
  'star',
  'street-view',
  'swap',
  'tab-account',
  'tab-info',
  'tab-map',
  'tab-plan',
  'tab-plan-origin',
  'tab-plan-destination',
  'tab-search',
  'time-refresh',
  'user-location',
  'warning',
  'zoom-in',
  'zoom-out',
  'crosshair',
  'my-location',
  'github',
  'bookmark-home',
  'bookmark-work',
  'bookmark-favorite',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/**
 * Fixed width/height on the root `<svg>` would fight the `size` prop, so
 * strip them there — but only there. The replace must stay scoped to the
 * opening tag: a global replace over the whole string also strips a
 * `width`/`height` on a nested shape (a `<rect>`, an `<image>`), zeroing its
 * size and making it vanish entirely.
 */
export const stripSize = (svg: string) =>
  svg.replace(/^<svg\b[^>]*>/, (openTag) => openTag.replace(/\s(width|height)="[^"]*"/g, ''));

const registry = new Map<string, string>();
for (const [path, svg] of Object.entries(modules)) {
  const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length);
  registry.set(name, stripSize(svg));
}

export function iconSvg(name: IconName): string {
  return registry.get(name) ?? '';
}
