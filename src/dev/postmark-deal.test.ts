import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  dealFrom,
  dealPostmark,
  houseStyle,
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

void test("a place's pictorials come from its city and region, weighted to the city", () => {
  const bandung = pictorialPool(placeOf('bandung'))
  assert.equal(bandung.filter((key) => key === 'bandung').length, 4)
  assert.ok(bandung.includes('west-java-tangkuban-perahu'))
  // The country's drawings don't reach a place whose region has its own.
  assert.ok(!bandung.includes('borobudur'))
  const jakarta = pictorialPool(placeOf('jakarta-barat'))
  assert.ok(jakarta.includes('jakarta-barat'))
  assert.deepEqual(pictorialPool(placeOf('singapore')), ['singapore'])
  assert.deepEqual(pictorialPool(placeOf('wloclawek')), [])
  // A place with no drawing of its own or its region's still gets its country's.
  assert.deepEqual(pictorialPool(placeOf('thiruvananthapuram')), ['india-taj-mahal'])
  // A city with no drawing of its own still gets its region's, at the region's weight.
  const cimahi: PostmarkPlace = { ...placeOf('bandung'), key: 'cimahi', name: 'Cimahi' }
  const cimahiPool = pictorialPool(cimahi)
  assert.ok(cimahiPool.includes('bandung'))
  assert.equal(
    cimahiPool.filter((key) => key === 'bandung').length,
    cimahiPool.filter((key) => key === 'west-java-tangkuban-perahu').length,
  )
  const tampines: PostmarkPlace = { ...placeOf('singapore'), key: 'tampines', name: 'Tampines' }
  assert.deepEqual(pictorialPool(tampines), ['singapore'])
  // Each drawing is weighted by its level: Depok's two drawings come up 4 times each to each of
  // West Java's 3, and each comes up less often as the others gain drawings.
  const depok = pictorialPool(placeOf('depok'))
  assert.equal(depok.filter((key) => key === 'depok').length, 4)
  assert.equal(depok.filter((key) => key === 'depok-kubah-emas').length, 4)
  assert.equal(depok.filter((key) => key === 'bandung').length, 3)
  assert.equal(depok.filter((key) => key === 'west-java-tangkuban-perahu').length, 3)
  assert.equal(depok.length, 14)
  // Jakarta's Monas reaches West Jakarta through its region; Tokyo's gate keeps Mount Fuji from
  // Shibuya, and a Tokyo-less corner of Japan gets Fuji.
  assert.ok(pictorialPool(placeOf('jakarta-barat')).includes('jakarta-monas'))
  assert.ok(!pictorialPool(placeOf('shibuya')).includes('japan-fuji'))
  const utsunomiya: PostmarkPlace = {
    ...placeOf('shibuya'),
    key: 'jp-tochigi-utsunomiya',
    name: 'Utsunomiya',
    region: 'Tochigi',
  }
  assert.deepEqual(pictorialPool(utsunomiya), ['japan-fuji'])
  // A small town with no drawing of its own gets every drawing its state has, never the country's.
  const carbondale: PostmarkPlace = {
    key: 'us-illinois-carbondale',
    name: 'Carbondale',
    region: 'Illinois',
    country: 'United States',
    countryCode: 'US',
    outline: '',
  }
  assert.deepEqual(pictorialPool(carbondale), ['illinois-water-tower'])
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
