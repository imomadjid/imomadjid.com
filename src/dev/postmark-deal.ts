import { classic } from './postmark-classic'
import { familyLayouts } from './postmark-families'
import type { Drawn } from './postmark-families'
import {
  accepts,
  axisValues,
  families,
  generator,
  hash,
  pick,
  postmarkDesign,
  postmarkStyle,
  shapes,
  visitorPrint,
} from './postmark-kit'
import type { Family, InkName, Kit, PictorialKey, PostmarkPlace, Style } from './postmark-kit'
import { pictorials } from './postmark-pictorials'

// How each visitor's postmark is dealt. A city has a house style, one ink and three or four
// frame families, so its stamps read as related on the wall; each visitor then gets the next
// family and pictorial from the city's shuffle bags, and their own lettering, date format,
// ornaments, border and design details, so no two of its stamps repeat until a bag runs out.
// Pictorials come from the city's own drawings, its region's and its country's, weighted to the
// city. `ordinal` is the visitor's place among the city's visitors, 0 for the first.

export function drawFamily(family: Family, kit: Kit): Drawn {
  return family === 'classic' ? classic(kit) : familyLayouts[family](kit)
}

// The smallest a place's name may be lettered, in viewBox units: about 5 px on a 128 px wall
// tile. A family that can't set the name this large isn't in the place's house style.
export const readableName = 9

const nameSizes = new Map<string, number>()

/**
 * The smallest size a family letters a place's name at, over every option a visitor can be dealt
 * that moves it: the heaviest, widest lettering with each border, ornament and variant, and each
 * classic shape. Infinity for a family that doesn't letter the name.
 */
export function smallestName(family: Family, place: PostmarkPlace) {
  const key = `${family}:${place.key}:${place.name}`
  const known = nameSizes.get(key)
  if (known !== undefined) return known
  const name = place.name.toUpperCase()
  const list = accepts(family)
  const design = postmarkDesign(place.key, 0)
  const print = visitorPrint(place.key, 0)
  let smallest = Number.POSITIVE_INFINITY
  for (const shape of family === 'classic' ? shapes : [design.shape]) {
    for (const border of list.border) {
      for (const ornament of list.ornament) {
        for (const variant of [false, true]) {
          // The name's own line is the largest that holds it: a region or country line can
          // repeat the name (Yogyakarta, Singapore) in smaller lettering.
          let largest = 0
          drawFamily(family, {
            id: 'measure',
            place,
            design: { ...design, shape, variant },
            print,
            style: {
              ink: 'red',
              weight: 'black',
              tracking: 'wide',
              date: list.date[0] ?? 'long',
              ornament,
              border,
            },
            pictorial: undefined,
            outline: true,
            measure: (text, size) => {
              if (text.includes(name)) largest = Math.max(largest, size)
            },
          })
          if (largest > 0) smallest = Math.min(smallest, largest)
        }
      }
    }
  }
  nameSizes.set(key, smallest)
  return smallest
}

function shuffled<T>(items: readonly T[], next: () => number) {
  const order = [...items]
  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = Math.floor(next() * (index + 1))
    const [a, b] = [order[index], order[other]]
    if (a === undefined || b === undefined) continue
    order[index] = b
    order[other] = a
  }
  return order
}

export type HouseStyle = { ink: InkName; families: Family[] }

/**
 * A city's house style: its ink, and three or four frame families, chosen from those that letter
 * its name readably. A name too long for most frames keeps the three that set it largest. Families
 * without the name never make a house.
 */
export function houseStyle(place: PostmarkPlace, salt: number): HouseStyle {
  const next = generator(hash(`${place.key}:${salt}:house`))
  const ink = pick(next, axisValues.ink)
  // A guestbook stamp says where its visitor came from, so a family that letters no name (mute)
  // stays out of every house.
  const naming = families.filter((family) => Number.isFinite(smallestName(family, place)))
  const legible = naming.filter((family) => smallestName(family, place) >= readableName)
  const pool =
    legible.length >= 3
      ? legible
      : naming.sort((a, b) => smallestName(b, place) - smallestName(a, place)).slice(0, 3)
  const count = Math.min(pool.length, next() < 0.5 ? 3 : 4)
  return { ink, families: shuffled(pool, next).slice(0, count) }
}

// One round of a shuffle bag, with no item twice in a row where the bag allows it.
function roundOf<T>(items: readonly T[], seed: string, round: number) {
  const order = shuffled(items, generator(hash(`${seed}:${round}`)))
  for (let index = 1; index < order.length; index += 1) {
    if (order[index] !== order[index - 1]) continue
    const swap = order.findIndex((item, at) => at > index && item !== order[index - 1])
    if (swap < 0) break
    const [a, b] = [order[index], order[swap]]
    if (a === undefined || b === undefined) break
    order[index] = b
    order[swap] = a
  }
  return order
}

/**
 * The item a shuffle bag deals at `ordinal`: each round deals every item once (or as often as it
 * is listed) in a fresh seeded order, and a round opens with another item than the last one closed
 * on wherever that keeps its own neighbours apart.
 */
export function dealFrom<T>(items: readonly T[], ordinal: number, seed: string): T | undefined {
  if (items.length === 0) return undefined
  const round = Math.floor(ordinal / items.length)
  const order = roundOf(items, seed, round)
  if (round > 0 && order[0] === roundOf(items, seed, round - 1).at(-1)) {
    // Open on another item, where that keeps this round's own neighbours apart.
    for (let swap = 1; swap < order.length; swap += 1) {
      const trial = [...order]
      const [first, other] = [trial[0], trial[swap]]
      if (first === undefined || other === undefined || other === first) continue
      trial[0] = other
      trial[swap] = first
      if (trial.every((item, at) => at === 0 || item !== trial[at - 1]))
        return trial[ordinal % items.length]
    }
  }
  return order[ordinal % items.length]
}

function isPictorialKey(key: string): key is PictorialKey {
  return Object.hasOwn(pictorials, key)
}

const pictorialKeys = Object.keys(pictorials).filter(isPictorialKey)

// Each drawing's scopes, as a set per drawing.
const scopeSets = new Map<PictorialKey, ReadonlySet<string>>(
  pictorialKeys.map((key) => [key, new Set<string>(pictorials[key].scopes)]),
)

// How often each level's drawings come up, out of 10, among the levels a place has drawings at.
const levelWeights = { city: 5, region: 3, country: 2 } as const

/**
 * A place's pictorial bag: its city's drawings, its region's and its country's, each level taking
 * about 5 : 3 : 2 of the bag among the levels that have drawings, and each drawing at least once.
 * Empty where nothing is drawn yet, and the postmark shows the place's map outline.
 */
export function pictorialPool(place: PostmarkPlace): PictorialKey[] {
  const scopes = {
    city: `city:${place.key}`,
    region: `region:${place.countryCode}:${place.region}`,
    country: `country:${place.countryCode}`,
  } as const
  const taken = new Set<PictorialKey>()
  const levels = (['city', 'region', 'country'] as const).map((level) => {
    const keys = pictorialKeys.filter(
      (key) => !taken.has(key) && scopeSets.get(key)?.has(scopes[level]),
    )
    for (const key of keys) taken.add(key)
    return { weight: levelWeights[level], keys }
  })
  const present = levels.filter((level) => level.keys.length > 0)
  if (taken.size <= 1) return [...taken]
  const total = present.reduce((sum, level) => sum + level.weight, 0)
  return present.flatMap(({ weight, keys }) => {
    const slots = Math.max(keys.length, Math.round((10 * weight) / total))
    return Array.from({ length: slots }, (_, index) => keys[index % keys.length]).filter(
      (key) => key !== undefined,
    )
  })
}

export type Deal = {
  house: HouseStyle
  family: Family
  pictorial: PictorialKey | undefined
  design: ReturnType<typeof postmarkDesign>
  style: Style
}

/**
 * The postmark dealt to a place's visitor at `ordinal`: the next family and pictorial from the
 * place's bags, in its house ink, with the visitor's own design details and lettering. `family`
 * and `choices` override the deal, for the playground.
 */
export function dealPostmark(
  place: PostmarkPlace,
  ordinal: number,
  salt: number,
  { family, choices }: { family?: Family; choices?: Partial<Style> } = {},
): Deal {
  const house = houseStyle(place, salt)
  const dealt =
    family ?? dealFrom(house.families, ordinal, `${place.key}:${salt}:families`) ?? 'classic'
  const seed = `${place.key}#${ordinal}`
  return {
    house,
    family: dealt,
    pictorial: dealFrom(pictorialPool(place), ordinal, `${place.key}:${salt}:pictorials`),
    design: postmarkDesign(seed, salt),
    style: postmarkStyle(seed, salt, dealt, { ink: house.ink, ...choices }),
  }
}
