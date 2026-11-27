// Fetches the map outline of each region the made-up visitors come from (postmark-visitor-places.ts)
// from OpenStreetMap (Nominatim), as the ledger draws a real visitor's region, and writes them to
// src/dev/postmark-region-outlines.json by `<country code>:<region>`. A place's map outline is
// one of its region's drawings. Outline data © OpenStreetMap contributors, ODbL.
//
// Usage: bun tools/postmarks/region-outlines.ts
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { regionKey, visitorPlaces } from '../../src/dev/postmark-visitor-places'
import { regionOutline } from '../../src/lib/osm-outline'

const outlines: Record<string, string> = {}
for (const { place } of visitorPlaces) {
  const key = regionKey(place)
  if (key in outlines) continue
  const outline = await regionOutline(place)
  if (!outline) throw new Error(`No boundary for ${key}`)
  outlines[key] = outline
  console.log(key)
}

const file = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'dev',
  'postmark-region-outlines.json',
)
await writeFile(file, `${JSON.stringify(outlines, null, 2)}\n`)
console.log(`${Object.keys(outlines).length} regions → src/dev/postmark-region-outlines.json`)
