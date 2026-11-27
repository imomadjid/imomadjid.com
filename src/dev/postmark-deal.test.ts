import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  dealFrom,
  dealPostmark,
  houseStyle,
  mapOutline,
  pictorialPool,
  readableName,
  smallestName,
} from './postmark-deal'
import { accepts, axisValues } from './postmark-kit'
import type { PostmarkPlace } from './postmark-kit'
import places from './postmark-places.json'
import { stressPlaces } from './postmark-stress-places'

const realPlaces: PostmarkPlace[] = places
const everyPlace = [...realPlaces, ...stressPlaces]

function placeOf(key: string) {
  const place = everyPlace.find((candidate) => candidate.key === key)
  assert.ok(place, key)
  return place
}

void test('a shuffle bag deals every item once a round, never twice in a row', () => {
  const items = ['a', 'b', 'c', 'd']
  const dealt = Array.from({ length: 40 }, (_, ordinal) => dealFrom(items, ordinal, 'bag'))
  for (let round = 0; round < 10; round += 1) {
    const slice = dealt.slice(round * 4, round * 4 + 4)
    assert.deepEqual(new Set(slice), new Set(items), `round ${round}`)
  }
  for (let index = 1; index < dealt.length; index += 1) {
    assert.notEqual(dealt[index], dealt[index - 1], `at ${index}`)
  }
})

void test('a bag listing an item twice deals it twice a round, apart', () => {
  const items = ['city', 'city', 'region']
  const dealt = Array.from({ length: 30 }, (_, ordinal) => dealFrom(items, ordinal, 'weighted'))
  for (let round = 0; round < 10; round += 1) {
    assert.deepEqual(dealt.slice(round * 3, round * 3 + 3), ['city', 'region', 'city'])
  }
  assert.equal(dealFrom([], 0, 'empty'), undefined)
})

void test('a house style is seeded, and letters its name readably in three or four families', () => {
  for (const place of everyPlace) {
    for (const salt of [0, 1, 2]) {
      const house = houseStyle(place, salt)
      assert.deepEqual(houseStyle(place, salt), house, `${place.key} is seeded`)
      assert.ok(axisValues.ink.includes(house.ink))
      assert.ok(house.families.length >= 3 && house.families.length <= 4, place.key)
      assert.equal(new Set(house.families).size, house.families.length, place.key)
      assert.ok(!house.families.includes('mute'), `${place.key} letters its name`)
      const legible = house.families.filter((family) => smallestName(family, place) >= readableName)
      // A name too long for most frames keeps its three roomiest, which may still be small.
      if (place.key !== 'saint-remy-de-provence' && place.key !== 'llanfairpwllgwyngyll') {
        assert.deepEqual(legible, house.families, `${place.key} at salt ${salt}`)
      }
    }
  }
})

void test('names fit the roomy families and long names drop the cramped ones', () => {
  const depok = placeOf('depok')
  assert.ok(smallestName('classic', depok) >= readableName)
  assert.ok(smallestName('first-day', placeOf('san-francisco')) < readableName)
  assert.ok(smallestName('mute', depok) === Number.POSITIVE_INFINITY, 'mute letters no name')
  const long = placeOf('thiruvananthapuram')
  for (const family of houseStyle(long, 0).families) {
    assert.ok(smallestName(family, long) >= readableName, family)
  }
})

void test("a place's bag holds its city's and region's drawings and its region's outline", () => {
  const count = (pool: string[], key: string) => pool.filter((item) => item === key).length
  const us = (name: string, region: string): PostmarkPlace => ({
    key: `us-${region}-${name}`.toLowerCase().replaceAll(' ', '-'),
    name,
    region,
    country: 'United States',
    countryCode: 'US',
    outline: '',
  })
  // Each drawing is weighted by its level, city 4 to region 3, and the outline is a region drawing.
  const bandung = pictorialPool(placeOf('bandung'))
  assert.equal(count(bandung, 'bandung'), 4)
  assert.equal(count(bandung, 'west-java-tangkuban-perahu'), 3)
  assert.equal(count(bandung, 'west-java-tea'), 3)
  assert.equal(count(bandung, mapOutline), 3)
  for (const item of new Set(bandung))
    assert.equal(count(bandung, item), item === 'bandung' ? 4 : 3, item)
  // A city's landmark stays in its city: Chicago gets its water tower, a small Illinois town
  // only what belongs anywhere in Illinois, its outline among it.
  const chicago = pictorialPool(us('Chicago', 'Illinois'))
  assert.equal(count(chicago, 'illinois-water-tower'), 4)
  assert.equal(count(chicago, mapOutline), 3)
  assert.deepEqual(pictorialPool(us('Carbondale', 'Illinois')), [
    'illinois-white-oak',
    'illinois-corn-elevator',
    mapOutline,
  ])
  // A state symbol reaches every town in the state, alongside the state's outline.
  const reedsburg = pictorialPool(us('Reedsburg', 'Wisconsin'))
  assert.ok(reedsburg.includes('wisconsin-holstein') && reedsburg.includes(mapOutline))
  // The country's drawings never reach a place in a region, however few the region has.
  assert.ok(!bandung.includes('borobudur'))
  assert.ok(!pictorialPool(placeOf('shibuya')).includes('japan-fuji'))
  assert.deepEqual(pictorialPool(placeOf('wloclawek')), [mapOutline])
  assert.deepEqual(pictorialPool(placeOf('thiruvananthapuram')), [mapOutline])
  // Only a place Cloudflare knows no region for falls back to its country, outline and all.
  const usa: PostmarkPlace = { ...us('United States', ''), region: '' }
  assert.deepEqual(pictorialPool(usa), ['us-bison', mapOutline])
  // Jakarta's Monas reaches West Jakarta through its region.
  assert.ok(pictorialPool(placeOf('jakarta-barat')).includes('jakarta-monas'))
  // A city with no drawing of its own deals its region's drawings and outline evenly.
  const cimahi: PostmarkPlace = { ...placeOf('bandung'), key: 'cimahi', name: 'Cimahi' }
  const cimahiPool = pictorialPool(cimahi)
  assert.deepEqual(cimahiPool, [...new Set(cimahiPool)], 'each once')
  assert.deepEqual(new Set(cimahiPool), new Set(bandung.filter((item) => item !== 'bandung')))
  // A motif scoped to every region of Japan is a region drawing in each, beside its own.
  const tochigi = pictorialPool({ ...placeOf('shibuya'), key: 'utsunomiya', region: 'Tochigi' })
  assert.deepEqual(tochigi, [
    'tochigi-strawberry',
    'japan-sakura',
    'japan-pagoda',
    'japan-maneki-neko',
    mapOutline,
  ])
  assert.ok(pictorialPool(placeOf('shibuya')).includes('japan-sakura'))
})

void test('a stamp dealt the outline records no pictorial, so it draws its map outline', () => {
  assert.equal(dealPostmark(placeOf('wloclawek'), 0, 0).pictorial, undefined)
})

void test('visitors from one place share its ink and frames and are dealt each in turn', () => {
  const depok = placeOf('depok')
  const house = houseStyle(depok, 0)
  const deals = Array.from({ length: 12 }, (_, ordinal) => dealPostmark(depok, ordinal, 0))
  for (const deal of deals) {
    assert.equal(deal.style.ink, house.ink)
    assert.ok(house.families.includes(deal.family))
    for (const axis of ['weight', 'tracking', 'date', 'ornament', 'border'] as const) {
      const accepted: readonly string[] = accepts(deal.family)[axis]
      assert.ok(accepted.includes(deal.style[axis]), `${deal.family} ${axis}`)
    }
  }
  const families = deals.slice(0, house.families.length).map((deal) => deal.family)
  assert.deepEqual(new Set(families), new Set(house.families))
  assert.deepEqual(dealPostmark(depok, 5, 0), deals[5], 'a deal is seeded')
  assert.equal(dealPostmark(depok, 0, 0, { family: 'mute' }).family, 'mute')
})
