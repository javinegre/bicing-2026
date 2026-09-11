# Bicing 2026

Barcelona bike-share map. Successor to [bicing-2023](https://github.com/javinegre/bicing-2023),
rebuilt on Svelte 5 with per-user settings stored server-side instead of in
`localStorage`.

Deployed as static files under negre.co by
[negre.co-server](https://github.com/javinegre/negre.co-server), which also
provides the API and the shared sign-in.

## Quick start

```sh
nvm use                # Node 24 — Vite 8 needs ≥20.19
npm install
cp .env.sample .env    # add a Google Maps browser key
npm run dev
```

| Script                            | What it does                                                 |
| --------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                     | Vite dev server on :5173                                     |
| `npm run build`                   | `check` then `vite build` → `dist/`                          |
| `npm run preview`                 | Serve the built bundle                                       |
| `npm run check`                   | `svelte-check` — types, a11y, unused CSS                     |
| `npm run lint`                    | oxlint, warnings fatal                                       |
| `npm run format` / `format:check` | Prettier                                                     |
| `npm test` / `test:watch`         | Vitest                                                       |
| `npm run validate`                | `format:check && lint && check && test` — what CI should run |

`BASE_PATH=/bicing-2026/ npm run build` while this runs alongside the 2023 app;
the default is `/bicing/`.

A staging build lives at `https://negre.co/staging-bicing-2026/` — see
[Deploying](#deploying).

## Stack, and why

| Choice                                  | Reason                                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Svelte 5 + Vite, not SvelteKit**      | Six tab-switched screens, no routes, no server rendering, no data loading that a route boundary would help with. SvelteKit would add an adapter and a build target for nothing. |
| **Runes over stores**                   | State classes read as plain objects; a `$derived` list of nearby stations is one line instead of a `derived()` pyramid.                                                         |
| **Tailwind v4 via `@tailwindcss/vite`** | Configured in CSS with `@theme` — the design tokens live in one block in `src/app.css`, not in a JS config the CSS then re-imports. There is no `tailwind.config.js`.           |
| **Bits UI**                             | Headless primitives. Only the resource toggle needs one today, but the sheet and modals will. All styling is ours.                                                              |
| **Vitest + Testing Library**            | Same Vite pipeline as the app, so aliases, SVG imports and the Svelte compiler behave identically in tests.                                                                     |
| **oxlint over ESLint**                  | Fast enough to run on every save, and covers this codebase's rules without a plugin graph.                                                                                      |
| **Google Maps JS API**                  | See below — this is the one external commitment.                                                                                                                                |

### The one external dependency

The map needs a **Google Cloud project and a browser API key**
(`VITE_GOOGLE_MAPS_API_KEY`). Flagging it explicitly: it is a console, a billing
account, and a key to rotate.

It is continuity rather than a new commitment — bicing-2023 used the same vendor
and the design's basemap _is_ a Google Maps style array (`src/lib/map/map-options.ts`)
— but it is worth knowing that swapping to MapLibre plus a tile provider later
would touch `MapCanvas.svelte`, `google-maps.ts` and `map-options.ts` and nothing
else. Markers already render from a data URI, which any renderer accepts.

Without a key the app boots, every screen works, and the Map screen shows an
explanatory message where the tiles would be.

`google.maps.Marker` is used rather than `AdvancedMarkerElement` on purpose:
advanced markers require a cloud-configured Map ID, which disables the local
`styles` array the design depends on.

## What moved server-side

The 2023 app kept everything in `localStorage`, so settings were per-browser.
They are now per-user, behind negre.co's shared sign-in.

**Synced to the account** (`GET`/`PUT /bicing/api/v2/config`):

| Key                              | Was                                                |
| -------------------------------- | -------------------------------------------------- |
| `mapCenter`, `mapZoom`           | `mapCenter`, `mapZoom`                             |
| `resourceShown`                  | `resourceShown`                                    |
| `bikeTypeFilter`                 | `bikeTypeFilter`                                   |
| `bookmarks.{home,work,favorite}` | `bookmarkHome`, `bookmarkWork`, `bookmarkFavorite` |
| `savedStationIds`                | _new_ — the design's "Saved stations" list         |

**Deliberately still on the device**: `userLocation` and `userLocationTimestamp`
(2 h TTL, now `bicing2026:userLocation`). A geolocation fix describes _this
device right now_; syncing it would drag a desktop session to wherever the phone
last was. It is a cache, not a preference.

Signed out, the same shape is written to `localStorage` under
`bicing2026:config`, and the first sign-in adopts it if the account is still
empty — so signing in never looks like the app forgot everything.

`prefsState` hides which backend is in play: callers mutate fields, and writes
are debounced 800 ms so a map drag is one request, not one per frame.

## Layout

```
src/
  app.css                  design tokens (@theme) — see DESIGN.md
  App.svelte               shell: boot order and tab switch
  lib/
    api/                   fetch layer (stations, user config)
    domain/                pure logic: colour thresholds, distance, ranking, search
    icons/                 SVG registry + the recolorable marker templates
    map/                   Google Maps loader and style array
    state/                 *.svelte.ts state classes
    components/            shared UI
    screens/               one file per tab
```

### State convention

State lives in `.svelte.ts` modules as **exported class instances**:

```ts
class PlanState {
  origin = $state<Station | null>(null);
}
export const planState = new PlanState();
```

The export is the _instance_. Reactivity travels through the object reference, so
a reassignable `export let` would break tracking.

Boot order in `App.svelte` is load-bearing: session → preferences → map view →
station polling. Preferences decide whether they come from the account or the
device, and they carry the map view the user left.

### Marker icons

Twenty static SVGs became **four templates** with `{{MAIN}}`, `{{RING}}` and
`{{LINE}}` placeholders (`src/lib/icons/markers/`), rendered at runtime by
`getMarkerIconUrl()` into data URIs and cached by
`${resource}-${size}-${color}` — 20 entries maximum. ~500 markers re-read their
icon on every zoom, filter change and 60 s refresh, so the build-and-encode work
has to happen once per combination, not once per marker.

Two things the original artwork does that the templates preserve:

- The ring grey differs by size — `#404040` at big, `#444444` at small. They were
  drawn at different times and never matched.
- Out of service is a state, not a sixth colour: it lightens the ring to
  `#808080` and switches on strike lines that only the `*-big` templates carry
  (one for bikes, two for docks). In service, `{{LINE}}` resolves to `none`,
  which also leaves the pointer triangle un-stroked — so it keeps exactly the
  size it has in production rather than growing by a stroke width.

## Testing

`npm test` runs 45 tests: the domain helpers, the marker cache, the icon
registry, the plan state machine, and two component tests through Testing
Library.

Two conventions:

- A test that uses runes must be named `*.test.svelte.ts` (see
  `src/lib/state/plan.test.svelte.ts`). Only files ending in `.svelte.ts` get
  compiled by `vite-plugin-svelte`; a plain `.test.ts` leaves `$state`
  unprocessed.
- `$state` wraps objects in a proxy, so a stored object is never `toBe` the one
  that went in. Compare with `toEqual`.

## Sharp edges

Things that cost real time to rediscover, and how this repo handles them.

1. **`svelteTesting()` must be a top-level Vite plugin.** Nested under
   `test.plugins` it silently fails to flip resolve conditions to Svelte's
   browser build, and every `render()` dies with
   `lifecycle_function_unavailable: mount(...) is not available on the server`.
   Gated on `mode === 'test'` in `vite.config.ts`.

2. **`$lib` needs an explicit alias, not just tsconfig `paths`.** Vite 8 resolves
   tsconfig `paths` natively (`resolve.tsconfigPaths`), but only for importers it
   treats as TS/JS — so every `$lib/...` import _inside a `.svelte` file_ fails
   with "Failed to resolve import". One line of `resolve.alias` fixes it. This is
   still not `vite-tsconfig-paths`.

3. **oxlint respects `.gitignore`, including a parent repo's.** This app lives
   under `apps/`, which negre.co-server gitignores, so before `git init` here
   oxlint reported _"No files found to lint"_ and exited 0 — a pass that checked
   nothing. Verified after `git init` by introducing a deliberate `eval` and
   confirming it was reported.

4. **oxlint 1.80 _does_ lint `.svelte` files** — their `<script>` blocks, at
   least. Older guidance says it only handles TS/JS. It caught a real bug in
   `MapCanvas.svelte` (a `bind:this` target the linter saw as never assigned).
   It still does not check _template_ markup, so `svelte-check` remains
   necessary and `validate` runs both.

5. **TypeScript 7 does not work here yet.** `svelte-check@4.7.6` peers on
   `typescript@^5 || ^6`, so this pins **6.0.3**. Revisit when svelte-check ships
   TS 7 support.

6. **Svelte 5 function bindings** are the correct way to intercept a child's
   write to a bound prop: `bind:value={() => v, (next) => {…}}`. With a Bits UI
   toggle group, a one-way `value` plus an `onValueChange` guard leaves the
   child's internal state diverged — clicking the active item deselects it and
   the guard cannot correct it. See `ResourceSwitch.svelte`.

## Deploying

Built as static files, mounted by negre.co-server. Note that `/bicing-2026/`
is currently served by that router's `express.static`, not by an nginx alias —
only `/files`, `/.well-known`, `/bicing/` and `/bicing-2021/` have alias blocks
in `nginx/negre.co.conf`.

### Staging

`https://negre.co/staging-bicing-2026/` is a second clone of this repo at
`apps/staging-bicing-2026` on the droplet, developed on and built in place:

```sh
BASE_PATH=/staging-bicing-2026/ npm run build
```

No PM2 reload is needed after a rebuild — `express.static` reads from disk per
request. It is deliberately not on a `stg.` subdomain: `session.svelte.ts` and
`AccountScreen.svelte` hardcode `/api/auth/get-session`, `/api/auth/sign-out`
and `/login` as origin-relative paths with no env override, and `apiFetch`
sends `credentials: 'include'`. Off negre.co the session fetch 404s into a
swallowed `catch` (the app then renders permanently signed out, showing no
error) and the config endpoints would need CORS with credentials. Staying
same-origin also means the referrer-restricted Maps key needs no change.

Leave `VITE_BICING_API_BASE_URL` at its default there. Staging shares
production's per-user config document, so a settings change in staging is a
real settings change — and because `PUT /v2/config` rejects unknown keys,
testing a brand-new setting still needs the `bicing-api` change shipped first.

### Server-side mounts

The per-user config API needs its route mounted in negre.co-server's
`server.ts`, _ahead_ of the general Bicing API mount so `requireAuth` wraps only
those routes:

```ts
const BicingConfigApi = require('./apis/bicing-api/config-api');
app.use('/bicing/api/v2/config', requireAuth, BicingConfigApi);
app.use('/bicing/api/', BicingApi);
```

Its `express.json()` lives inside that router on purpose — a global one would sit
ahead of better-auth's handler, which reads the raw body itself, and leave the
sign-in client hanging with no error.

## Not built yet

- The two maps inside the Plan screen (the halves render the design's empty-state
  hatch as a stand-in).
- Recent searches on the Search screen.
- Bookmark editing beyond set-from-centre, and the "Edit" affordance on Saved.
