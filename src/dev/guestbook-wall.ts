import { dealPostmark } from './postmark-deal'
import type { Deal } from './postmark-deal'
import { generator, hash, visitorPrint } from './postmark-kit'
import type { PostmarkPlace, Print } from './postmark-kit'

// The Guestbook is a pile of postmarks at the foot of the page. Each visitor's stamp is saved
// when they arrive (its deal and its print), so drawings added later never change it; the
// backend will store these records as they are. The newest stamp lies on top of the pile, the
// older ones under it, packed tighter the older they are: the last few dozen visitors read
// clearly, and the rest settle into a dense layer that darkens and blurs into the footer.

export type Arrival = {
  place: PostmarkPlace
  // The visitor's place among the place's visitors, 0 for the first: it deals their stamp.
  ordinal: number
  // The day they arrived, as the postmark dates it.
  date: { day: number; month: number; year: number }
}

export type StampRecord = Arrival & {
  // Its place in the Guestbook, 0 for the first visitor.
  index: number
  deal: Deal
  print: Print
}

/** Each arrival's stamp, dealt and printed as it was on the day they came. */
export function stampRecords(arrivals: readonly Arrival[], salt = 0): StampRecord[] {
  return arrivals.map((arrival, index) => ({
    ...arrival,
    index,
    deal: dealPostmark(arrival.place, arrival.ordinal, salt),
    print: { ...visitorPrint(arrival.place.key, arrival.ordinal), ...arrival.date },
  }))
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

export const pileSettings = {
  // How many stamps lie across the top of the pile per stamp's height of it: under 1, they
  // overlap a little and every name shows.
  topDensity: 0.7,
  // How tightly the oldest stamps pack, as many again as the top's.
  deepDensity: 2.6,
  // How many stamps down the pile takes to pack from the top's density to the deepest, at most:
  // a pile also packs fully by its reach.
  settle: 140,
  // The deepest stamp drawn, and how tall the pile may grow, in stamps: the rest lie under the
  // footer, out of sight.
  depth: 160,
  reach: 10,
}

export type PileSettings = typeof pileSettings

// The golden ratio's fraction: stepping by it spreads consecutive stamps across the width as
// evenly as any sequence can, and a stamp keeps its spot however many arrive after it.
const golden = 0.6180339887498949

export type PileSpot = {
  // The stamp's place in the Guestbook.
  index: number
  // Its centre: across as a share of the pile's width, down in px from the pile's top.
  across: number
  down: number
}

/**
 * Where each of the newest stamps lies in a pile `width` px wide, with stamps `stamp` px across:
 * the newest first, at the top. A stamp's place across is its own for good, so as visitors
 * arrive it only sinks, and the deeper it lies the more tightly the stamps around it pack.
 */
export function pileLayout(
  count: number,
  width: number,
  stamp: number,
  settings: PileSettings = pileSettings,
) {
  const across = Math.max(1, width / stamp)
  const shown = Math.min(count, settings.depth)
  // A stamp near the edge would hang off it by half: keep centres half a stamp in.
  const inset = Math.min(0.5, stamp / 2 / Math.max(1, width))
  const spots: PileSpot[] = []
  let down = stamp / 2
  for (let depth = 0; depth < shown && down < settings.reach * stamp; depth += 1) {
    const index = count - 1 - depth
    const next = generator(hash(`pile:${index}`))
    const spread = (index * golden + next() * 0.08) % 1
    spots.push({
      index,
      across: inset + spread * (1 - 2 * inset),
      down: down + (next() - 0.5) * stamp * 0.1,
    })
    // Stamps pack tighter with the stamps above them or with how far down the pile they lie,
    // whichever is further along, so a narrow pile reaches its dense layer within its reach.
    const settled = Math.min(1, Math.max(depth / settings.settle, down / (settings.reach * stamp)))
    const eased = settled * settled * (3 - 2 * settled)
    const density = settings.topDensity + (settings.deepDensity - settings.topDensity) * eased
    down += stamp / (across * density)
  }
  return { spots, height: down + stamp / 2 }
}
