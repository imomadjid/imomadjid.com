// Fetches the outlines of a few real places from OpenStreetMap (Nominatim) for the postmark
// prototype on /dev/postmarks, and writes them to src/dev/postmark-places.json as SVG paths
// fitted to a 100 x 100 box. Outline data © OpenStreetMap contributors, ODbL.
//
// Usage: bun tools/postmarks/outlines.ts
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { nominatimOutline } from '../../src/lib/osm-outline'

// A visitor's place as the stamp names it, and the Nominatim search that finds its boundary.
const places = [
  {
    key: 'depok',
    name: 'Depok',
    region: 'West Java',
    country: 'Indonesia',
    countryCode: 'ID',
    query: 'Depok, Jawa Barat',
  },
  {
    key: 'jakarta-barat',
    name: 'West Jakarta',
    region: 'Jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    query: 'Jakarta Barat',
  },
  {
    key: 'bandung',
    name: 'Bandung',
    region: 'West Java',
    country: 'Indonesia',
    countryCode: 'ID',
    query: 'Kota Bandung',
  },
  {
    key: 'yogyakarta',
    name: 'Yogyakarta',
    region: 'Yogyakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    query: 'Kota Yogyakarta',
  },
  {
    key: 'san-francisco',
    name: 'San Francisco',
    region: 'California',
    country: 'United States',
    countryCode: 'US',
    query: 'San Francisco, California',
  },
  {
    key: 'shibuya',
    name: 'Shibuya',
    region: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    query: 'Shibuya, Tokyo',
  },
  {
    key: 'london',
    name: 'London',
    region: 'England',
    country: 'United Kingdom',
    countryCode: 'GB',
    query: 'Greater London',
  },
  {
    key: 'singapore',
    name: 'Singapore',
    region: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    query: 'Singapore',
  },
]

const out = []
for (const place of places) {
  const outline = await nominatimOutline({ q: place.query })
  if (!outline) throw new Error(`No boundary for ${place.query}`)
  const { query: _query, ...rest } = place
  out.push({ ...rest, outline })
  console.log(place.name)
}

const file = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'src',
  'dev',
  'postmark-places.json',
)
await writeFile(file, `${JSON.stringify(out, null, 2)}\n`)
console.log(`${out.length} places → src/dev/postmark-places.json`)
