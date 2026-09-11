/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_BICING_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Injected by vite.config.ts `define` — the short commit the bundle was built from. */
declare const __APP_VERSION__: string;

/** Injected by vite.config.ts `define` — which hand-deployed clone this bundle is. */
declare const __APP_ENV__: 'production' | 'staging';
