// A place's outline from OpenStreetMap (Nominatim) as an SVG path fitted to a 100 x 100 box, for
// postmarks of places nobody has drawn yet. tools/postmarks/outlines.ts uses it for the
// prototype's places, and the postmark ledger (postmark-ledger.ts) for each new visitor's place.
// Outline data © OpenStreetMap contributors, ODbL.

type Ring = [number, number][]
type Geometry =
  | { type: 'Polygon'; coordinates: Ring[] }
  | { type: 'MultiPolygon'; coordinates: Ring[][] }
  | { type: string; coordinates?: unknown }

// Nominatim's usage policy asks for an identifying User-Agent and at most a request a second.
const nominatimAgent = 'imomadjid.com postmarks (https://imomadjid.com)'
const requestGap = 1100
let nextRequest = 0

/** Waits for this caller's turn, so requests start at least `requestGap` apart. */
async function turn() {
  const now = Date.now()
  const at = Math.max(now, nextRequest)
  nextRequest = at + requestGap
  if (at > now) await new Promise((resolve) => setTimeout(resolve, at - now))
}

// A stamp's outline needs no more points than this to read.
const mostPoints = 400

function area(ring: Ring) {
  let sum = 0
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index] ?? [0, 0]
    const [x2, y2] = ring[(index + 1) % ring.length] ?? [0, 0]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum / 2)
}

/** The largest outer ring: a place's mainland, without far-off islands. None for a point. */
function mainRing(geometry: Geometry): Ring | undefined {
  // SAFETY: the type says which shape `coordinates` has; anything else has no ring.
  const rings =
    geometry.type === 'Polygon'
      ? [(geometry.coordinates as Ring[])[0]]
      : geometry.type === 'MultiPolygon'
        ? (geometry.coordinates as Ring[][]).map((polygon) => polygon[0])
        : []
  let largest: Ring | undefined
  let largestArea = -1
  for (const ring of rings) {
    if (!Array.isArray(ring) || ring.length < 4) continue
    const size = area(ring)
    if (size > largestArea) [largest, largestArea] = [ring, size]
  }
  return largest
}

/** Equirectangular, scaled by the cosine of the latitude, fitted into 100 x 100 and centred. */
function toPath(ring: Ring) {
  const step = Math.max(1, Math.ceil(ring.length / mostPoints))
  const kept = ring.filter((_, index) => index % step === 0)
  const latitude = kept.reduce((sum, [, lat]) => sum + lat, 0) / kept.length
  const scale = Math.cos((latitude * Math.PI) / 180)
  const points = kept.map(([lon, lat]) => [lon * scale, -lat] as const)
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

/**
 * The outline of the first boundary Nominatim finds for `search` (free text as `{ q }`, or a
 * structured search such as `{ city, state, country }`), or undefined where it has none, as for
 * a place it only knows as a point. `detail` is how far apart, in degrees, the points it returns
 * may lie. Requests from one process start at least a second apart, as Nominatim asks.
 */
export async function nominatimOutline(
  search: Record<string, string>,
  { detail = 0.0007, signal }: { detail?: number; signal?: AbortSignal } = {},
) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    ...search,
    format: 'jsonv2',
    polygon_geojson: '1',
    polygon_threshold: String(detail),
    limit: '1',
  })}`
  await turn()
  const response = await fetch(url, { headers: { 'User-Agent': nominatimAgent }, signal })
  if (!response.ok) throw new Error(`Nominatim answered ${response.status}`)
  // SAFETY: Nominatim's jsonv2 search answers a list of places, each with its GeoJSON boundary.
  const [hit] = (await response.json()) as { geojson?: Geometry }[]
  const ring = hit?.geojson ? mainRing(hit.geojson) : undefined
  return ring ? toPath(ring) : undefined
}

/**
 * A place's map outline, one of its region's drawings: its region's boundary, else its country's,
 * a little coarser. The ledger draws each new place's with it, and tools/postmarks/region-outlines.ts
 * the made-up visitors'.
 */
export async function regionOutline({
  region,
  countryCode,
}: {
  region: string
  countryCode: string
}) {
  const searches: [Record<string, string>, number][] = []
  if (region) searches.push([{ state: region, countrycodes: countryCode }, 0.004])
  searches.push([{ country: countryCode }, 0.02])
  for (const [query, detail] of searches) {
    // Only a search Nominatim has no boundary for falls back to the next, coarser one; one that
    // fails or takes too long throws, so the place is tried again rather than kept coarse.
    const outline = await nominatimOutline(query, { detail, signal: AbortSignal.timeout(12_000) })
    if (outline) return outline
  }
  return undefined
}
