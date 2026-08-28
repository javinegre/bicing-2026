I'm building an enhanced version of my Bicing app (Barcelona bike-share map),
based on the existing app at apps/bicing-2023 in this repo
(https://github.com/javinegre/bicing-2023 — Vite + React + MUI). The main
enhancement: move user configuration from browser localStorage to
server-side, per-user storage.

Architecture decisions already made (do not re-litigate these):

1. Database: SQLite via better-sqlite3, stored at negre.co-server/data/,
   alongside the existing data/auth.db. Follow the exact pattern in
   auth/auth.ts — path.join(\_\_dirname, '..', 'data', '<name>.db') with an
   env var override (mirror AUTH_DB_PATH, e.g. BICING_DB_PATH), and
   fs.mkdirSync(path.dirname(dbPath), { recursive: true }) on startup.

2. A new v2 api version has been created under /Users/javi/Documents/www/negre.co-server/apis/bicing-api. Some endpoint already exist and some needs to be created

3. Auth: use the existing better-auth session already wired in server.ts
   (see auth/auth.ts and auth/require-auth.ts) to identify the user via the
   `requireAuth` middleware. Config should be stored per-user (keyed by the
   authenticated user's id), not per-browser/per-device like today's
   localStorage.

What to build:

- Inventory what's currently in localStorage: see
  apps/bicing-2023/src/utils/localStorage.ts and its usages in
  src/store/map/_ and src/store/bookmarks/_. Known keys today: mapCenter,
  mapZoom, bookmarkHome, bookmarkWork, bookmarkFavorite, resourceShown,
  bikeTypeFilter, plus userLocation/userLocationTimestamp (live geolocation
  with a 2h TTL — this one is probably ephemeral/device-specific and should
  likely STAY client-side rather than move server-side; confirm with me if
  unsure rather than assuming).
- Design a minimal schema for the config that does make sense to persist
  per-user (bookmarks, last map position/zoom, filter/resource-shown
  preferences).
- Build CRUD endpoints (get + upsert) under /bicing-api/.., following
  the existing bicing-api router style.

Before writing code, read server.ts, auth/auth.ts, auth/require-auth.ts,
and apis/bicing-api/src/api.routes.ts to match existing conventions
(TypeScript style, error handling, response shape). Ask me if anything
about scope or schema is ambiguous rather than guessing on data that's
awkward to migrate later.
