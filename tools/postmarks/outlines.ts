// Fetches the outlines of a few real places from OpenStreetMap (Nominatim) for the postmark
// prototype on /dev/postmarks, and writes them to src/dev/postmark-places.json as SVG paths
// fitted to a 100 x 100 box. Outline data © OpenStreetMap contributors, ODbL.
//
// Usage: bun tools/postmarks/outlines.ts
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const userAgent = 'imomadjid.com postmark tools (https://imomadjid.com)'

// A visitor's place as the stamp names it, and the Nominatim search that finds its boundary.
const places = [
  {
    key: 'depok',
    name: 'Depok',
    region: 'West Java',
    country: 'Indonesia',
    query: 'Depok, Jawa Barat',
  },
  {
    key: 'jakarta-barat',
    name: 'West Jakarta',
    region: 'Jakarta',
    country: 'Indonesia',
    query: 'Jakarta Barat',
  },
  {
    key: 'bandung',
    name: 'Bandung',
    region: 'West Java',
    country: 'Indonesia',
    query: 'Kota Bandung',
  },
  {
    key: 'yogyakarta',
    name: 'Yogyakarta',
    region: 'Yogyakarta',
    country: 'Indonesia',
    query: 'Kota Yogyakarta',
  },
  {
    key: 'san-francisco',
    name: 'San Francisco',
    region: 'California',
    country: 'United States',
    query: 'San Francisco, California',
  },
  { key: 'shibuya', name: 'Shibuya', region: 'Tokyo', country: 'Japan', query: 'Shibuya, Tokyo' },
  {
    key: 'london',
    name: 'London',
    region: 'England',
    country: 'United Kingdom',
    query: 'Greater London',
  },
  {
    key: 'singapore',
    name: 'Singapore',
    region: 'Singapore',
    country: 'Singapore',
    query: 'Singapore',
  },
]

type Ring = [number, number][]
type Geometry =
  | { type: 'Polygon'; coordinates: Ring[] }
  | { type: 'MultiPolygon'; coordinates: Ring[][] }

function area(ring: Ring) {
  let sum = 0
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index] ?? [0, 0]
    const [x2, y2] = ring[(index + 1) % ring.length] ?? [0, 0]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum / 2)
}

// The largest outer ring: a city's mainland, without far-off islands.
function mainRing(geometry: Geometry) {
  const rings =
    geometry.type === 'Polygon'
      ? [geometry.coordinates[0]]
      : geometry.coordinates.map((polygon) => polygon[0])
  return rings.filter((ring): ring is Ring => Boolean(ring)).sort((a, b) => area(b) - area(a))[0]
}

// Equirectangular, scaled by the cosine of the latitude, fitted into 100 x 100 and centred.
function toPath(ring: Ring) {
  const latitude = ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length
  const scale = Math.cos((latitude * Math.PI) / 180)
  const points = ring.map(([lon, lat]) => [lon * scale, -lat] as const)
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ]
  const size = Math.max(maxX - minX, maxY - minY)
  const offsetX = (size - (maxX - minX)) / 2
  const offsetY = (size - (maxY - minY)) / 2
  const fit = (value: number, min: number, offset: number) =>
    (((value - min + offset) / size) * 100).toFixed(1)
  const commands = points.map(
    ([x, y], index) =>
      `${index === 0 ? 'M' : 'L'}${fit(x, minX, offsetX)} ${fit(y, minY, offsetY)}`,
  )
  return `${commands.join('')}Z`
}

const out = []
for (const place of places) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: place.query,
    format: 'jsonv2',
    polygon_geojson: '1',
    polygon_threshold: '0.0007',
    limit: '1',
  })}`
  const response = await fetch(url, { headers: { 'User-Agent': userAgent } })
  if (!response.ok) throw new Error(`Nominatim answered ${response.status} for ${place.query}`)
  const [hit]: { geojson?: Geometry }[] = await response.json()
  const ring = hit?.geojson ? mainRing(hit.geojson) : undefined
  if (!ring) throw new Error(`No boundary for ${place.query}`)
  const { query: _query, ...rest } = place
  out.push({ ...rest, outline: toPath(ring) })
  console.log(`${place.name}: ${ring.length} points`)
  // Nominatim's usage policy allows one request a second.
  await sleep(1100)
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
