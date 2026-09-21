# Fork: automatic Command Code catalog sync

Fork of [`patlux/pi-commandcode-provider`](https://github.com/patlux/pi-commandcode-provider)
that keeps the catalog current without manual releases.

Tracks `upstream/main` (merged up to v0.7.1 on 2026-09-21) plus the automation below.

## What this fork changes

- `scripts/prune-catalog-overrides.ts` — drops `MODEL_EFFORT_OVERRIDES` entries as
  soon as the generated catalog ships selectable efforts for the same model.
  Upstream returns a pull request instead; this fork commits directly so no human
  is in the loop.
- `.github/workflows/model-metadata.yml` — the daily sync regenerates the catalog,
  commits it to `main`, bumps the patch version, tags it, and (when enabled)
  publishes to npm.
- `scripts/local-fallback-refresh.sh` + `~/.config/systemd/user/pi-commandcode-refresh.{service,timer}`
  — weekly local safety net on the workstation (see below).
- Package renamed to `@rcharrisg/pi-commandcode-provider` (the upstream npm name
  cannot be reused).

## The fork cron trap (cost: 10 days of stale catalog, 2026-09-11 → 2026-09-21)

GitHub creates fork workflows in the `disabled_fork` state: **no** `schedule`,
`push`, or `pull_request` run ever fires until the workflow is explicitly enabled,
even though the REST API reports it as `active`. Only `workflow_dispatch` works.

```bash
gh workflow enable model-metadata.yml -R rcharrisg/pi-commandcode-provider
gh api repos/rcharrisg/pi-commandcode-provider/actions/workflows/356179093 --jq .state
```

The Actions UI button next to the workflow is a toggle, so it is easy to leave the
workflow disabled by clicking it while it is already enabled. Second trap: GitHub
disables scheduled workflows in public repositories after 60 days without
repository activity.

## One-time setup

1. Create an npm account (or reuse one) with access to the `@rcharrisg` scope.
2. Create a granular npm access token with **Read and write** permission for
   `@rcharrisg/pi-commandcode-provider`.
3. Store it as a repository secret and enable publishing:

   ```bash
   gh secret set NPM_TOKEN -R rcharrisg/pi-commandcode-provider
   gh variable set NPM_PUBLISH -R rcharrisg/pi-commandcode-provider --body true
   ```

4. Publish once manually: `gh workflow run model-metadata.yml -R rcharrisg/pi-commandcode-provider`
5. Switch pi to the fork:

   ```bash
   pi install git:github.com/rcharrisg/pi-commandcode-provider@main
   ```

## Two sync paths

| Path | Trigger | What it does |
| --- | --- | --- |
| GitHub Actions | daily cron `17 6 * * *` (+ manual dispatch) | sync → prune → typecheck/tests → commit + patch bump + tag on `main` |
| Local systemd timer | weekly, workstation | re-enables the workflow, dispatches it, then runs `pi update --extension …@main` |

Log of the local path: `~/.local/state/pi-commandcode/refresh.log`.
Remove it with `systemctl --user disable --now pi-commandcode-refresh.timer`.

## Maintenance

- If the sync script itself breaks (Command Code changed its bundle layout),
  merge `upstream/main` into this fork — the fix usually lands there first.
- Pricing stays manual (upstream treats it as review-only).

## Install tracking

Installed in pi as `git:github.com/rcharrisg/pi-commandcode-provider@main`; each sync run the workflow advances `main`.
