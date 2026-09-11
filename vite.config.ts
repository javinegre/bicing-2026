import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';

/** Short commit of the build, surfaced on the Account screen for bug reports. */
function appVersion(): string {
  try {
    // stderr silenced: a fresh clone with no commits is not an error here.
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'dev';
  }
}

/**
 * Which deploy this bundle is. Set explicitly via `APP_ENV` (e.g.
 * `APP_ENV=staging BASE_PATH=/staging-bicing-2026/ npm run build`) rather
 * than derived from BASE_PATH, so the two stay independent knobs — a local
 * build against a staging-like path doesn't silently flip this. `development`
 * is reserved for running against a local negre.co-server checkout on a
 * laptop; nothing sets it yet — `npm run dev` still defaults to `production`
 * until that's wired up.
 */
function appEnv(): 'production' | 'staging' | 'development' {
  if (process.env.APP_ENV === 'staging') return 'staging';
  if (process.env.APP_ENV === 'development') return 'development';
  return 'production';
}

export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion()),
    __APP_ENV__: JSON.stringify(appEnv()),
  },

  // negre.co-server mounts each app under a path prefix (nginx serves dist/
  // directly), so built asset URLs have to carry it. Override with
  // BASE_PATH=/bicing-2026/ while this runs alongside the 2023 app.
  base: mode === 'production' ? (process.env.BASE_PATH ?? '/bicing/') : '/',

  plugins: [
    svelte(),
    tailwindcss(),
    // Must stay a top-level plugin. Nested under `test.plugins` it silently
    // fails to flip Vite's resolve conditions to Svelte's browser build, and
    // every render() dies with `lifecycle_function_unavailable: mount(...) is
    // not available on the server`.
    ...(mode === 'test' ? [svelteTesting()] : []),
  ],

  resolve: {
    // Vite 8 reads tsconfig `paths` natively (`tsconfigPaths`) — but only for
    // importers it recognises as TS/JS, so every `$lib/...` import inside a
    // .svelte file fails to resolve. An explicit alias covers both; this is
    // still not vite-tsconfig-paths, just one line of config.
    tsconfigPaths: true,
    alias: {
      $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,svelte.ts}'],
  },
}));
