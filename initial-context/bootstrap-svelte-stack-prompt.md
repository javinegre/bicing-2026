# Prompt: bootstrap an app on the bicing-2026 stack

Copy everything below the line into a fresh Claude Code session, replacing
`<APP_NAME>` and the "What the app does" section.

---

Bootstrap a new front-end app called `<APP_NAME>` using the stack below. Scaffold
it, configure the whole toolchain, and leave me with a working skeleton that
proves the stack end-to-end — not just config files.

## What the app does

<One or two paragraphs. What screens, what data source, what the core
interaction is. If it wraps an imperative third-party widget (a map, an editor,
a canvas library), say so explicitly — it changes how components are structured.>

## Stack

- **Svelte 5** with runes — plain Svelte + Vite, **not SvelteKit** (no routing,
  no SSR; deployed as static files)
- **Vite** (latest) + **TypeScript**, strict
- **Tailwind v4** via `@tailwindcss/vite` — configured in CSS with `@theme`,
  there is no `tailwind.config.js`
- **Bits UI** for headless/accessible primitives (styling is all ours)
- **Vitest** + `@testing-library/svelte` + `@testing-library/user-event` + jsdom
- **oxlint** for linting, **Prettier** for formatting
- `svelte-check` for type/a11y/unused-CSS checking

Pin nothing by hand — resolve the current version of each package with
`npm view <pkg> version` before writing `package.json`, then verify the set
installs together cleanly.

## Conventions

- State lives in `.svelte.ts` modules as **exported class instances**
  (`export const fooState = new FooState()`), not stores and not a state
  library. Runes work in any `.svelte.ts` module. The export must be the
  *instance* — reactivity travels through the object reference, so a
  reassignable `export let` breaks tracking.
- Path alias `$lib` → `src/lib`.
- Scripts: `dev`, `build` (typecheck then build), `preview`, `check`, `lint`,
  `format`, `format:check`, `test`, `test:watch`, and a `validate` that chains
  `format:check && lint && check && test`.
- `.nvmrc`, `.env.sample`, and a README that records the decisions and their
  trade-offs — not just a command list.
- Comments explain *why*, at the density of the surrounding code. No narration
  of what the next line does.

## Known sharp edges — handle these up front

These cost real time to rediscover:

1. **`svelteTesting()` must be a top-level Vite plugin**, not nested under
   `test.plugins`. Nested, it silently fails to flip resolve conditions to the
   browser build and every `render()` dies with
   `lifecycle_function_unavailable: mount(...) is not available on the server`.
   Gate it on `mode === 'test'`.
2. **oxlint does not lint `.svelte` files** — TS/JS only (it has a Vue plugin,
   no Svelte equivalent). Don't assume it covers components. Let `svelte-check`
   cover them and have `validate` run both. Say so in the README.
3. **oxlint respects `.gitignore`**, including a parent repo's. If the app lives
   inside a directory an outer repo ignores, oxlint reports "No files found to
   lint" and exits 0 — looking like a pass. `git init` the app first, then
   verify linting actually works by introducing a deliberate violation and
   confirming it's reported.
4. **Vite 8 resolves tsconfig `paths` natively** via `resolve.tsconfigPaths:
   true`. Don't add `vite-tsconfig-paths`.
5. **TypeScript 6 deprecates `baseUrl`.** Use `paths` without it.
6. **Svelte 5 function bindings** (`bind:value={() => v, (next) => {...}}`) are
   the correct way to intercept a child's write to a bound prop. Passing
   `value={v}` one-way plus an `onValueChange` guard leaves the child's internal
   state diverged from yours — with a Bits UI toggle group, clicking the active
   item deselects it and the guard can't correct it.

## Verify before you report back

Run the real commands and show me the output — don't infer that it works:

- `npm run validate` passes clean
- `npm run build` produces `dist/`
- the dev server actually boots
- confirm oxlint is linting files rather than silently finding none (see #3)

Then `git init`, commit, and tell me the bundle size and anything you had to
deviate from above and why. Flag any decision that locks me into an external
dependency (a cloud console, an API key, a paid tier) rather than quietly
taking it.
