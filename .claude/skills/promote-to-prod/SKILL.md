---
name: promote-to-prod
description: Promote already-validated staging changes to production — fast-forwards origin/main to origin/staging and builds the result on the droplet's prod bicing-2026 clone at negre.co/bicing-2026/. Use when the user says staging has been validated and is ready to ship to production.
---

# Promote staging to production

Only run this after `deploy-staging` succeeded and the change was manually
verified at https://negre.co/staging-bicing-2026/.

Runs `promote-to-prod.sh`, which:

1. Fetches `origin/staging` and `origin/main`.
2. Exits early (no-op) if `main` already matches `staging`.
3. Verifies `origin/main` is an ancestor of `origin/staging` — i.e. that
   promoting is a genuine fast-forward. If it isn't (main and staging have
   diverged), it aborts rather than rebasing or force-pushing; that needs a
   human to sort out.
4. Fast-forwards `main` with
   `git push origin origin/staging:refs/heads/main`. This pushes the fetched
   ref straight to the remote — it never checks out `main` or touches your
   local working branch.
5. SSHes to the droplet (`dig-oce`) and, in
   `/home/javi/negre.co-server/apps/bicing-2026`:
   - `git fetch` + `git reset --hard origin/main`
   - `npm ci`
   - `BASE_PATH=/bicing-2026/ npm run build`
6. Checks `pm2 describe negre-co-server` is `online` — as a health check only.

## Why "rebase" became "fast-forward"

The original idea was to rebase staging onto master, but staging is a
disposable branch that gets force-pushed on every `deploy-staging` run —
there's no independent history on it to replay. Since staging is always
built from local work and validated before promotion, the correct operation
is a plain fast-forward of `main` to staging's tip: it lands the exact
commits that were tested, with no risk of new commit SHAs or rebase
conflicts. If a fast-forward isn't possible, something is wrong (main moved
independently) and it should be investigated rather than papered over.

## Why there's no PM2 reload

Same reasoning as `deploy-staging`: `/bicing-2026/` also has no nginx alias
and is mounted as a plain `express.static` in `server.ts`, so a fresh build
is served immediately without restarting `negre-co-server`.

## Running it

```bash
bash .claude/skills/promote-to-prod/promote-to-prod.sh
```
