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
  return rings
    .filter((ring): ring is Ring => Array.isArray(ring) && ring.length >= 4)
    .sort((a, b) => area(b) - area(a))[0]
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
 * may lie.
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
  const response = await fetch(url, { headers: { 'User-Agent': nominatimAgent }, signal })
  if (!response.ok) throw new Error(`Nominatim answered ${response.status}`)
  // SAFETY: Nominatim's jsonv2 search answers a list of places, each with its GeoJSON boundary.
  const [hit] = (await response.json()) as { geojson?: Geometry }[]
  const ring = hit?.geojson ? mainRing(hit.geojson) : undefined
  return ring ? toPath(ring) : undefined
}
