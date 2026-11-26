import { dealPostmark } from './postmark-deal'
import type { Deal } from './postmark-deal'
import { generator, hash, visitorPrint } from './postmark-kit'
import type { PostmarkPlace, Print } from './postmark-kit'

// The postmark footer is a pile of visitors' postmarks at the foot of the page. Each visitor's stamp is saved
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
  // Its place among the visitors, 0 for the first.
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
 * A longer list starts with the shorter one, as real visits only add up.
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
  topDensity: 0.55,
  // How tightly the oldest stamps pack, on the same measure.
  deepDensity: 1.5,
  // How the pile thins going up: 1 thins evenly from the foot to the top, higher keeps the dense
  // layer low and the rest of the pile open.
  dropoff: 1.8,
  // The most stamps down the pile it takes to pack fully, however tall it is.
  settle: 140,
  // How far a stamp may hang off the sides, as a share of its width.
  bleed: 0.4,
  // How far past the pile's foot stamps keep lying, in stamps' widths. They're drawn without
  // taking up room (postmark-pile.tsx), so a scroll that bounces past the page's end still finds
  // the pile there.
  runOut: 1,
  // The deepest stamp drawn.
  depth: 200,
}

export type PileSettings = typeof pileSettings

// How far down, in stamps, a stamp kept off the visitor's own lies under its centre.
const clearance = 0.95

// The golden ratio's fraction: stepping by it spreads consecutive stamps across the width as
// evenly as any sequence can, and a stamp keeps its spot however many arrive after it.
const golden = 0.6180339887498949

type PileSpot = {
  // The stamp's place among the visitors.
  index: number
  // Its centre: across as a share of the pile's width (past 0 or 1 where it hangs off a side),
  // down in px from the pile's top.
  across: number
  down: number
  // The visitor's own stamp, pinned at the top in the middle.
  you?: true
}

/**
 * Where each of the newest stamps lies in a pile `width` px wide and at most `room` px tall, with
 * stamps `stamp` px across: the newest first, at the top. A stamp's place across is its own for
 * good, so as visitors arrive it only sinks, and the deeper it lies the more tightly the stamps
 * around it pack. Once the pile fills its room, the oldest run on past its foot, `runOut` stamps
 * further, where the page ends.
 *
 * The visitor's own stamp, `you.index`, lies at the top in the middle whenever they come, however
 * long ago they first did, and the rest of the pile is the newest stamps without it. No other
 * stamp near the top lies within `you.left` px to the left of its centre or `you.right` px to the
 * right, which take in the stamp and the note written beside it, so both read clearly.
 */
export function pileLayout(
  count: number,
  width: number,
  stamp: number,
  room: number,
  you?: { index: number; left: number; right: number },
  settings: PileSettings = pileSettings,
) {
  const { topDensity: top, deepDensity: deep, dropoff, settle, bleed, runOut } = settings
  const deepest = settings.depth
  // Centres run from half a stamp in from each side to `bleed` of a stamp past that.
  const from = stamp * (0.5 - bleed)
  const span = Math.max(0, width - 2 * from)
  const across = Math.max(1, span / stamp)
  const shown = Math.min(count, deepest)
  // The last stamps lie past the foot, where the page ends.
  const end = room + stamp * runOut
  // A little over half a stamp, so a turned stamp's corners clear the top edge.
  const first = stamp * 0.6
  let down = first
  const pinned = you && you.index >= 0 && you.index < count ? you : undefined
  const spots: PileSpot[] = pinned
    ? [{ index: pinned.index, across: 0.5, down: first, you: true }]
    : []
  let index = count
  for (let depth = 0; depth < shown && down <= end; depth += 1) {
    index -= 1
    if (index === pinned?.index) index -= 1
    if (index < 0) break
    const next = generator(hash(`pile:${index}`))
    const spread = (index * golden + next() * 0.08) % 1
    const x = from + spread * span
    const jittered = down + (next() - 0.5) * stamp * 0.1
    spots.push({
      index,
      across: x / Math.max(1, width),
      // One that would land on the visitor's own stamp or its note sinks just under them instead.
      down:
        pinned && x > width / 2 - pinned.left && x < width / 2 + pinned.right
          ? Math.max(jittered, first + stamp * clearance)
          : jittered,
    })
    // Stamps pack tighter with the stamps above them or with how far down the pile they lie,
    // whichever is further along, so a short pile still reaches its dense layer at its foot.
    const settled = Math.min(1, Math.max(depth / settle, down / room))
    const packed = top + (deep - top) * settled ** dropoff
    down += stamp / (across * packed)
  }
  const last = spots.at(-1)
  return { spots, height: Math.min(room, (last?.down ?? 0) + stamp / 2) }
}
