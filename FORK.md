# Fork: automatic Command Code catalog sync

Fork of [`patlux/pi-commandcode-provider`](https://github.com/patlux/pi-commandcode-provider)
that keeps the catalog current without manual releases.

## What this fork changes

- `scripts/prune-catalog-overrides.ts` — drops `MODEL_EFFORT_OVERRIDES` entries as
  soon as the generated catalog ships selectable efforts for the same model.
  Upstream's sync job fails at `test:models` in that case and needs a human; this
  is why upstream's daily sync has been red since 2026-09-04.
- `.github/workflows/model-metadata.yml` — the daily sync now commits the
  regenerated catalog to `main`, bumps the patch version, tags it, and (when
  enabled) publishes to npm. No pull request, no human merge.
- Package renamed to `@rcharrisg/pi-commandcode-provider` (the upstream npm name
  cannot be reused).

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
   pi remove npm:pi-commandcode-provider
   pi install npm:@rcharrisg/pi-commandcode-provider
   ```

## Maintenance

- Daily sync runs on GitHub Actions (cron `17 6 * * *`); nothing runs on the
  workstation. `pi update --extensions` picks up new versions.
- If the sync script itself breaks (Command Code changed its bundle layout),
  merge `upstream/main` into this fork — the fix usually lands there first.
- Pricing stays manual (upstream treats it as review-only).
