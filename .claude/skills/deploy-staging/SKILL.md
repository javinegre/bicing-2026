---
name: deploy-staging
description: Push the current local bicing-2026 work to origin's staging branch and build it on the droplet's staging-bicing-2026 clone at negre.co/staging-bicing-2026/. Use when the user asks to deploy, ship, or push the app to staging.
---

# Deploy to staging

Runs `deploy-staging.sh`, which:

1. Refuses to run if the local working tree has uncommitted changes (so what
   gets validated is exactly what gets pushed).
2. Runs `npm run validate` locally (format check, lint, `svelte-check`, tests).
3. Force-pushes the current `HEAD` to `origin/staging` with
   `--force-with-lease` (safe: staging is a disposable mirror of local work,
   but this still refuses if the remote branch moved out from under you).
4. SSHes to the droplet (`dig-oce`) and, in
   `/home/javi/negre.co-server/apps/staging-bicing-2026`:
   - `git fetch` + `git reset --hard origin/staging` (this clone should never
     have local edits; `reset --hard` is intentional)
   - `npm ci`
   - `APP_ENV=staging BASE_PATH=/staging-bicing-2026/ npm run build`
5. Checks `pm2 describe negre-co-server` is `online` — as a health check only.

## Why there's no PM2 reload

`/staging-bicing-2026/` has no nginx alias (see negre.co-server's
`CLAUDE.md`) and is mounted in `server.ts` as a plain
`express.static(.../staging-bicing-2026/dist)`. `express.static` stats files
per request rather than caching a directory listing at process start, so a
fresh `dist/` is served immediately after the build finishes. Restarting or
reloading `negre-co-server` is not part of this flow — it would only be
needed if `server.ts` itself changed, which this workflow never touches.

## Running it

```bash
bash .claude/skills/deploy-staging/deploy-staging.sh
```

After it finishes, manually verify at
https://negre.co/staging-bicing-2026/ before running `promote-to-prod`.
