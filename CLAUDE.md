# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## What this is

`bicing-2026` — a Barcelona bike-share map. Plain **Svelte 5 + Vite**, no
SvelteKit, no router, no SSR: it builds to static files that
[negre.co-server](https://github.com/javinegre/negre.co-server) serves under
negre.co (nginx serves `dist/` directly, bypassing Node).

It is its own git repo, checked out as a sibling under that router's `apps/`
directory. That parent repo gitignores `apps/`, which has one consequence worth
remembering: **oxlint sees the parent `.gitignore` and will report "No files
found to lint" and exit 0 if this repo's own `.git` is missing.** A green lint in
a fresh checkout without `git init` means nothing.

Successor to `apps/bicing-2023` (React + MUI + Redux). That app is worth reading
for _domain logic_ — marker colour thresholds, the nearby-area radius, the map
style array, what was in localStorage — and worth ignoring for architecture.
Do not port its store shape, its component split or its MUI theming.

## Commands

```
npm run dev           # Vite dev server on :5173
npm run build         # check, then vite build -> dist/
npm run preview       # serve the built bundle
npm run check         # svelte-check: types, a11y, unused CSS
npm run lint          # oxlint, warnings fatal
npm run format        # prettier --write .
npm test              # vitest run
npm run validate      # format:check && lint && check && test
```

Node 24 (`.nvmrc`) — Vite 8 needs ≥20.19. `cp .env.sample .env` and add a Google
Maps browser key before `npm run dev`; without one every screen still works and
the map shows an explanatory message.

`BASE_PATH=/bicing-2026/ npm run build` to deploy alongside the 2023 app.

## Where things live

```
src/app.css              design tokens in @theme — the only place colours are defined
src/App.svelte           shell: boot order, tab switch
src/lib/api/             fetch layer (stations, user config)
src/lib/domain/          pure logic — no Svelte, fully unit-tested
src/lib/icons/           SVG registry + recolorable marker templates
src/lib/map/             Google Maps loader and style array
src/lib/state/           *.svelte.ts state classes
src/lib/components/      shared UI
src/lib/screens/         one file per tab
```

`$lib` → `src/lib`.

## Conventions

**State is exported class instances in `.svelte.ts` modules.** Not stores, not a
state library:

```ts
class PlanState {
  origin = $state<Station | null>(null);
}
export const planState = new PlanState();
```

The export must be the _instance_ — reactivity travels through the object
reference, so a reassignable `export let` breaks tracking.

**Domain logic goes in `src/lib/domain/`, not in components.** It is plain
TypeScript with no Svelte import, which is what makes it cheap to test. Colour
thresholds, distance, ranking and search all live there; a component that starts
computing one of those is misplaced.

**Design tokens are not negotiable per-component.** `src/app.css` holds the whole
scale — one hairline alpha, three text greys, one accent, three radii, one
small-caps label style. `DESIGN.md` explains where each came from. Reaching for
`rgba(255,255,255,.14)` because it looks right is exactly the drift the design's
turn-3 consistency pass removed.

Use the `label-caps` and `gradient-accent` utilities rather than re-declaring
them. Put `data-count` on any element rendering a number — it applies tabular
figures, without which counts jitter on every 60 s refresh.

**Comments explain why, at the density of the surrounding code.** No narration of
what the next line does.

## Testing

Vitest + `@testing-library/svelte`, jsdom.

- A test using runes must be named `*.test.svelte.ts` — only files ending in
  `.svelte.ts` are compiled by `vite-plugin-svelte`, and a plain `.test.ts`
  leaves `$state` unprocessed. See `src/lib/state/plan.test.svelte.ts`.
- `$state` proxies objects, so a stored object is never `toBe` the one that went
  in. Use `toEqual`.
- `svelteTesting()` must stay a **top-level** Vite plugin gated on
  `mode === 'test'`. Nested under `test.plugins` it silently fails and every
  `render()` dies with `lifecycle_function_unavailable`.

## Things that will bite

- **`$lib` inside `.svelte` files needs `resolve.alias`.** Vite 8's native
  `resolve.tsconfigPaths` only applies to importers it treats as TS/JS, so a
  `$lib/...` import in a component fails without the explicit alias in
  `vite.config.ts`. Do not "fix" this by adding `vite-tsconfig-paths`.
- **TypeScript is pinned to 6.x.** `svelte-check` peers on `^5 || ^6`; TS 7 fails
  to install. Revisit when svelte-check supports it.
- **oxlint does lint `.svelte` script blocks** (1.80+), but not template markup —
  `validate` runs `svelte-check` for that. Both are needed.
- **Bits UI needs function bindings.** `bind:value={() => v, (next) => {…}}`. A
  one-way `value` plus an `onValueChange` guard leaves the child's internal state
  diverged; with a toggle group, clicking the active item deselects it and the
  guard cannot correct it.
- **Markers are imperative.** Google owns their lifetime, so `MapCanvas.svelte`
  keeps them in a plain `Map` outside the reactive graph and reconciles by id.
  Recreating ~500 of them on every refresh drops frames.

## API and auth

Station data comes from `apis/bicing-api` (its own repo) at
`/bicing/api/v2/station-info` and `/station-status`. Info is cached 10 min
upstream, status 60 s — polling faster than 60 s only burns battery.

Per-user settings come from `/bicing/api/v2/config` (`GET`, `PUT`), gated by
negre.co-server's `requireAuth` and keyed by the better-auth user id. `PUT`
merges at the top level and rejects unknown keys, so a client sends only what it
changed.

The app works **signed out** — settings fall back to `localStorage` under
`bicing2026:config`, and the first sign-in adopts the device copy if the account
is empty. Never gate a screen behind a session; an account buys sync, not access.

The live geolocation fix stays on the device (`bicing2026:userLocation`, 2 h
TTL). It is a cache describing this device now, not a preference. Do not move it
into the synced config.

Sign-in and sign-out live in negre.co's shared auth app at `/login` — there is no
passkey or password UI in this bundle.

## Design

`DESIGN.md` is the reference; the handoff bundle it derives from is in
`initial-context/`. In that bundle, **turn 2 defines the screens and turn 3
defines the values**, and turn 3 wins on any disagreement.
