import {
  CATALOG_MODEL_COSTS,
  CATALOG_PRICING_SYNCED_AT,
  CATALOG_PRICING_VERSION,
} from "./commandcode-pricing-catalog.ts"

export interface CommandCodeModelCostRates {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
}

export interface CommandCodeModelCostTier extends CommandCodeModelCostRates {
  inputTokensAbove: number
}

export interface CommandCodeModelCost extends CommandCodeModelCostRates {
  tiers?: readonly CommandCodeModelCostTier[]
}

export interface TemporaryPricing {
  models: readonly string[]
  expiresOn: string
  description: string
}

export const PRICING_SOURCE_URL = "https://commandcode.ai/docs/resources/pricing-limits"
/** Date of the last official catalog sync that produced `CATALOG_MODEL_COSTS`. */
export const PRICING_LAST_VERIFIED = CATALOG_PRICING_SYNCED_AT

export const ZERO_MODEL_COST: CommandCodeModelCost = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
}

/**
 * Manual pricing overlay.
 *
 * Base rates (input/output/cache read/cache write) come from the generated
 * `CATALOG_MODEL_COSTS`, parsed from the official command-code reference table.
 * Only two things belong here:
 *   - context-dependent tiers and other facts the reference table does not publish;
 *   - explicit overrides, each with a reason.
 * Entries here win over the generated catalog.
 */
export const MANUAL_MODEL_COSTS: Readonly<Record<string, Partial<CommandCodeModelCost>>> = {
  "Qwen/Qwen3.7-Plus": {
    tiers: [
      {
        inputTokensAbove: 256_000,
        input: 1.2,
        output: 4.8,
        cacheRead: 0.24,
        cacheWrite: 1.5,
      },
    ],
  },
  "Qwen/Qwen3.7-Flash": {
    tiers: [
      {
        inputTokensAbove: 32_000,
        input: 0.1,
        output: 0.4,
        cacheRead: 0.02,
        cacheWrite: 0.125,
      },
      {
        inputTokensAbove: 256_000,
        input: 0.2,
        output: 0.8,
        cacheRead: 0.04,
        cacheWrite: 0.25,
      },
    ],
  },
  "xai/grok-4.6": {
    tiers: [
      {
        inputTokensAbove: 200_000,
        input: 4,
        output: 12,
        cacheRead: 1,
        cacheWrite: 0,
      },
    ],
  },
  // Free alias retired from the live API; kept so a re-enabled endpoint still reports $0.
  "meituan/LongCat-2.0:free": { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
}

function mergeModelCosts(): Readonly<Record<string, CommandCodeModelCost>> {
  const merged: Record<string, CommandCodeModelCost> = {}
  for (const [modelId, cost] of Object.entries(CATALOG_MODEL_COSTS)) {
    merged[modelId] = { ...ZERO_MODEL_COST, ...cost }
  }
  for (const [modelId, override] of Object.entries(MANUAL_MODEL_COSTS)) {
    merged[modelId] = { ...ZERO_MODEL_COST, ...merged[modelId], ...override }
  }
  return merged
}

/** Official catalog rates plus `MANUAL_MODEL_COSTS`. Model ids absent from this
 * record bill as `ZERO_MODEL_COST`, so keep coverage complete (see test:pricing). */
export const MODEL_COSTS: Readonly<Record<string, CommandCodeModelCost>> = mergeModelCosts()

export const CATALOG_PRICING_SOURCE = `command-code@${CATALOG_PRICING_VERSION}`

export const TEMPORARY_PRICING: readonly TemporaryPricing[] = []
