/**
 * Prunes `MODEL_EFFORT_OVERRIDES` entries once the generated catalog ships
 * selectable efforts for the same model.
 *
 * `npm run sync:commandcode-catalog` regenerates `src/commandcode-catalog.ts`
 * but never touches the manual override file, while `tests/test-models.ts`
 * fails as soon as an override shadows upstream efforts. This script bridges
 * the two so the automated catalog sync can land unattended.
 *
 * Fork addition (see FORK.md); upstream keeps this step manual.
 */
import { readFile, writeFile } from "node:fs/promises"

import { MODEL_EFFORTS } from "../src/commandcode-catalog.ts"

const OVERRIDES_URL = new URL("../src/commandcode-catalog-overrides.ts", import.meta.url)
const MARKER = "export const MODEL_EFFORT_OVERRIDES"

const source = await readFile(OVERRIDES_URL, "utf-8")
const markerIndex = source.indexOf(MARKER)
if (markerIndex < 0) throw new Error(`Could not find ${MARKER}`)

const braceStart = source.indexOf("{", markerIndex)
if (braceStart < 0) throw new Error("Could not find the overrides object literal")

let depth = 0
let braceEnd = -1
for (let index = braceStart; index < source.length; index += 1) {
  const character = source[index]
  if (character === "{") depth += 1
  else if (character === "}" && --depth === 0) {
    braceEnd = index
    break
  }
}
if (braceEnd < 0) throw new Error("Unterminated overrides object literal")

const body = source.slice(braceStart + 1, braceEnd)
const entries: string[] = []
const removed: string[] = []

for (const line of body.split("\n")) {
  if (line.trim() === "" || line.trim().startsWith("//")) continue

  const match = /^\s*"([^"]+)"\s*:\s*\[[^\]]*\],\s*$/.exec(line)
  if (!match) throw new Error(`Unexpected override line: ${line}`)

  const modelId = match[1]
  if (modelId !== undefined && modelId in MODEL_EFFORTS) {
    removed.push(modelId)
  } else {
    entries.push(line.trim())
  }
}

if (removed.length === 0) {
  console.log("MODEL_EFFORT_OVERRIDES is already pruned; nothing to do.")
  process.exit(0)
}

const bodyNew = entries.length === 0 ? "" : `\n${entries.map((entry) => `  ${entry}`).join("\n")}\n`
const next = `${source.slice(0, braceStart)}{${bodyNew}}${source.slice(braceEnd + 1)}`
await writeFile(OVERRIDES_URL, next, "utf-8")
console.log(`Removed overrides now shipped by the catalog: ${removed.join(", ")}`)
