---
name: refresh-model-catalog
description: Use when adding or removing Command Code models, refreshing the model catalog snapshot (image, reasoning, effort, output-limit metadata), updating display pricing, or refreshing test fixtures in pi-commandcode-provider.
---

# Refresh Model Catalog

Use this skill whenever the Command Code model catalog changes: new or retired models, changed reasoning efforts, output limits, or pricing. All commands run from the repository root and work on Windows and Linux.

## Core rules

- Do not commit, tag, push, or publish unless the user explicitly asks in the current conversation.
- Display prices are generated from the official `command-code` package reference table. Never copy prices from the live models API.
- `src/pricing.ts` only carries manual overrides: context-dependent tiers, retired aliases, and documented corrections. Everything else comes from the generated catalog.
- Keep the change focused: one refresh per PR, no unrelated refactors.
- Follow [CONTRIBUTING.md](../../../CONTRIBUTING.md) for commit message rules.

## Workflow

### 1. Detect drift

```sh
npm run check:commandcode-catalog
```

This compares the repository snapshot against the latest published `command-code` npm package and reports added/removed models, changed efforts, and version drift. Use the report to scope the work.

### 2. Sync static model metadata

```sh
npm run sync:commandcode-catalog
```

Regenerates `src/commandcode-catalog.ts` and bumps the documented CLI version in `README.md`. Review the diff; the catalog also lists reasoning models without selectable efforts.

Never add efforts to the generated file by hand. Manual effort policy for reasoning models that upstream ships without levels lives in `src/commandcode-catalog-overrides.ts` and is merged at load time. The sync drops an override itself once upstream publishes its own levels. It parses only the `MODEL_EFFORT_OVERRIDES` object literal and preserves neighboring declarations. Keep shared rationale above the declaration; review entry-specific comments after pruning because they may describe removed entries.

### 3. Display pricing

`npm run sync:commandcode-catalog` already regenerates `src/commandcode-pricing-catalog.ts` from the official reference table bundled in the `command-code` package (Model / Context / Efforts / `$in/$out · cache $x (write $y)`), so new models arrive priced and a missing price fails the sync instead of billing `$0`.

Manual work stays in `src/pricing.ts`:

- `MANUAL_MODEL_COSTS` overrides the generated rates. Add an entry only for context-dependent tiers or a documented correction, and say why in a comment.
- `TEMPORARY_PRICING` tracks promotions with an end date, so tests fail when they expire.
- `PRICING_LAST_VERIFIED` follows `CATALOG_PRICING_SYNCED_AT`; do not edit it by hand.

`npm run test:pricing` fails when a model the live API advertises has no price, when the live-list snapshot is older than 14 days (the daily sync stopped running), or when a price comes from neither the catalog nor an override.

### 4. Refresh the test fixtures

```sh
npm run refresh:model-ids
npm run sync:pricing-fixture
```

The first script snapshots the live model-id list into `tests/fixtures/commandcode-model-ids.json`; the second regenerates `tests/fixtures/commandcode-pricing.json` from `MODEL_COSTS`. Both run automatically in the daily sync workflow, so a manual run is only needed when refreshing locally.

### 5. Update test expectations

Adjust the model-specific assertions that the refresh invalidated, typically in:

- `tests/test-pricing.ts`: the `freeModels` set and per-model rate assertions. Do not pin dates: provenance is asserted against the generated catalog, and the live snapshot has a freshness window.
- `tests/test-models.ts`: image/reasoning/effort/output-limit assertions and catalog entry counts.

Do not weaken assertions to make them pass; update them to the verified upstream values.

### 6. Validate

```sh
npm run test:models
npm run test:pricing
npm run typecheck
npm run format:check
git diff --check
```

Run the full `npm test` before reporting the work as done when the environment allows it.

### 7. Document

Add entries to the `Unreleased` section of `CHANGELOG.md` covering new/retired models, effort changes, and pricing refreshes.
