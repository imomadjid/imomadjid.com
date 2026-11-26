import { dealPostmark, drawFamily } from './postmark-deal'
import type { Deal } from './postmark-deal'
import { generator, hash, visitorPrint } from './postmark-kit'
import type { PostmarkPlace, Print } from './postmark-kit'

// The Guestbook wall is one shared passport. Each visitor's stamp is saved when they arrive (its
// deal, its print and where it landed), so drawings added later never change it; the backend
// will store these records as they are. Stamps fill a page as passport stamps do, overlapping a
// little at whatever angle they were pressed, and a page that can't take the next stamp without
// covering too much of the others is full: the next one opens a new page. Placing a stamp looks
// only at the stamps before it, so the pages already filled never change as visitors arrive.

// A passport page, 88 x 125 mm, in tenths of a millimetre.
export const page = { width: 880, height: 1250 } as const

// How large a stamp is on the page: a 220-unit round postmark comes out about 30 mm across, as
// real ones are, about a third of the page's width.
export const stampScale = 1.35

// Stamps keep this far inside the page's edge, and clear of the page number at its foot.
const margin = 24
const foot = 90
// The occupancy grid's cell, in page units.
const cell = 10
const columns = Math.ceil(page.width / cell)
const rows = Math.ceil(page.height / cell)
// Where a new stamp may land, tried in turn; the least covered wins.
const candidates = 48
// A new stamp may land on up to this share of inked footprint: a little overlap reads as real,
// more starts hiding names.
const crowded = 0.1
// The share of each stamp's box its footprint spans, a rounded rectangle (a superellipse), so a
// box stamp's edges, where names run, are claimed while round stamps leave their corners free.
const footprint = 0.96

export type Arrival = {
  place: PostmarkPlace
  // The visitor's place among the place's visitors, 0 for the first: it deals their stamp.
  ordinal: number
  // The day they arrived, as the postmark dates it.
  date: { day: number; month: number; year: number }
}

export type StampRecord = Arrival & {
  // Its place on the wall, 0 for the first stamp.
  index: number
  deal: Deal
  print: Print
  page: number
  // Its centre on the page and its unrotated size, in page units; it turns by print.rotation.
  x: number
  y: number
  width: number
  height: number
}

/** The stamp a visitor is dealt and its print, saved as it was on the day they arrived. */
export function stampFor({ place, ordinal, date }: Arrival, salt = 0) {
  const deal = dealPostmark(place, ordinal, salt)
  const print: Print = { ...visitorPrint(place.key, ordinal), ...date }
  const { width, height } = drawFamily(deal.family, {
    id: 'size',
    place,
    design: deal.design,
    print,
    style: deal.style,
    pictorial: deal.pictorial,
    outline: false,
  })
  return { deal, print, width: width * stampScale, height: height * stampScale }
}

type Footprint = { x: number; y: number; width: number; height: number; rotation: number }

// Calls `visit` with each grid cell inside a stamp's rotated footprint, scaled by `share`, until it
// returns false. (Plain arithmetic: this runs for every candidate spot of every stamp.)
function eachCellUnder(
  { x, y, width, height, rotation }: Footprint,
  share: number,
  visit: (index: number) => boolean,
) {
  const angle = (rotation * Math.PI) / 180
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const rx = (width / 2) * share
  const ry = (height / 2) * share
  const reach = Math.hypot(rx, ry)
  const top = Math.max(0, Math.floor((y - reach) / cell))
  const bottom = Math.min(rows - 1, Math.ceil((y + reach) / cell))
  const left = Math.max(0, Math.floor((x - reach) / cell))
  const right = Math.min(columns - 1, Math.ceil((x + reach) / cell))
  for (let row = top; row <= bottom; row += 1) {
    const dy = (row + 0.5) * cell - y
    for (let column = left; column <= right; column += 1) {
      const dx = (column + 0.5) * cell - x
      const u = (dx * cos + dy * sin) / rx
      const v = (-dx * sin + dy * cos) / ry
      const [uu, vv] = [u * u, v * v]
      if (uu * uu + vv * vv <= 1 && !visit(row * columns + column)) return
    }
  }
}

// The share of a stamp's footprint already inked at a spot, or `limit` once it's clear the spot
// covers at least that much.
function coverage(grid: Uint8Array, stamp: Footprint, limit: number) {
  // A superellipse of exponent 4 fills about 0.927 of its box.
  const area = (0.927 * stamp.width * stamp.height * footprint * footprint) / (cell * cell)
  const stop = limit * area
  let inked = 0
  eachCellUnder(stamp, footprint, (index) => {
    if (grid[index] === 1) inked += 1
    return inked < stop
  })
  return Math.min(limit, inked / Math.max(1, area))
}

// How far a stamp reaches from its centre along each axis once it's turned.
function reach(width: number, height: number, rotation: number) {
  const angle = (rotation * Math.PI) / 180
  const [cos, sin] = [Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle))]
  return {
    x: (width * cos + height * sin) / 2,
    y: (width * sin + height * cos) / 2,
  }
}

type Spot = { x: number; y: number; covered: number }

// The least covered spot for a stamp on a page, among seeded candidates that keep it inside.
function bestSpot(grid: Uint8Array, stamp: Omit<Footprint, 'x' | 'y'>, seed: string): Spot {
  const next = generator(hash(seed))
  const extent = reach(stamp.width, stamp.height, stamp.rotation)
  const range = (half: number, size: number) => {
    const [low, high] = [margin + half, size - margin - half]
    return low <= high ? { low, high } : { low: size / 2, high: size / 2 }
  }
  const [xs, ys] = [range(extent.x, page.width), range(extent.y, page.height - foot)]
  let best: Spot = { x: page.width / 2, y: page.height / 2, covered: 1 }
  for (let attempt = 0; attempt < candidates; attempt += 1) {
    const x = xs.low + next() * (xs.high - xs.low)
    const y = ys.low + next() * (ys.high - ys.low)
    const covered = coverage(grid, { ...stamp, x, y }, best.covered)
    if (covered < best.covered) best = { x, y, covered }
    if (covered === 0) break
  }
  return best
}

/**
 * Lays arrivals out on the passport's pages in order: each stamp takes the least covered spot on
 * the current page, or opens a new page when every spot would cover more than `crowded` of it.
 */
export function fillPages(arrivals: readonly Arrival[], salt = 0): StampRecord[] {
  const records: StampRecord[] = []
  let grid = new Uint8Array(columns * rows)
  let current = 0
  let onPage = 0
  for (const [index, arrival] of arrivals.entries()) {
    const stamp = stampFor(arrival, salt)
    const shape = { width: stamp.width, height: stamp.height, rotation: stamp.print.rotation }
    let spot = bestSpot(grid, shape, `page:${current}:${onPage}`)
    if (onPage > 0 && spot.covered > crowded) {
      grid = new Uint8Array(columns * rows)
      current += 1
      onPage = 0
      spot = bestSpot(grid, shape, `page:${current}:${onPage}`)
    }
    eachCellUnder({ ...shape, x: spot.x, y: spot.y }, footprint, (at) => {
      grid[at] = 1
      return true
    })
    records.push({ ...arrival, ...stamp, index, page: current, x: spot.x, y: spot.y })
    onPage += 1
  }
  return records
}

/**
 * Made-up visitors for the prototype: `count` arrivals from 2026 on, one every six hours, each
 * from a place drawn by weight and numbered among their place's visitors in the order they came.
 * A longer list starts with the shorter one, as a real guestbook only grows.
 */
export function fakeArrivals(
  count: number,
  places: readonly { place: PostmarkPlace; weight: number }[],
  seed = 'wall',
): Arrival[] {
  const next = generator(hash(seed))
  const total = places.reduce((sum, { weight }) => sum + weight, 0)
  const seen = new Map<string, number>()
  const start = Date.UTC(2026, 0, 1)
  return Array.from({ length: count }, (_, index) => {
    let roll = next() * total
    const chosen = places.find(({ weight }) => (roll -= weight) < 0) ?? places[0]
    if (!chosen) throw new Error('fakeArrivals needs places')
    const ordinal = seen.get(chosen.place.key) ?? 0
    seen.set(chosen.place.key, ordinal + 1)
    const day = new Date(start + index * 6 * 3_600_000)
    return {
      place: chosen.place,
      ordinal,
      date: { day: day.getUTCDate(), month: day.getUTCMonth(), year: day.getUTCFullYear() },
    }
  })
}
