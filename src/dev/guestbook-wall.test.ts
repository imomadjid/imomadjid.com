import assert from 'node:assert/strict'
import { test } from 'node:test'

import { wallPlaces } from './guestbook-places'
import { fakeArrivals, pileLayout, pileSettings, stampRecords } from './guestbook-wall'

void test('a longer guestbook starts with the shorter one, stamped the same', () => {
  const shorter = stampRecords(fakeArrivals(50, wallPlaces))
  const longer = stampRecords(fakeArrivals(400, wallPlaces))
  for (const [index, record] of shorter.entries()) {
    assert.deepEqual(record, longer[index])
  }
})

void test('the newest stamp lies on top, and stamps sink as visitors arrive', () => {
  const before = pileLayout(100, 1200, 124, 600)
  const after = pileLayout(101, 1200, 124, 600)
  assert.equal(before.spots[0]?.index, 99)
  assert.equal(after.spots[0]?.index, 100)
  for (const spot of before.spots) {
    const later = after.spots.find((candidate) => candidate.index === spot.index)
    if (!later) continue
    // Its place across is its own for good; it only sinks.
    assert.equal(later.across, spot.across)
    assert.ok(later.down > spot.down, `stamp ${spot.index}`)
  }
  assert.ok(after.height >= before.height)
})

void test('a short guestbook makes a short pile, its stamps whole', () => {
  const { spots, height } = pileLayout(6, 1200, 124, 600)
  assert.equal(spots.length, 6)
  assert.ok(height < 600)
  for (const spot of spots) assert.ok(spot.down + 62 <= height + 1e-9, `stamp ${spot.index}`)
})

void test('stamps pack tighter the deeper they lie, and hang off the edges no further than bleed', () => {
  const { spots, height } = pileLayout(1500, 1200, 124, 600)
  assert.ok(spots.length <= pileSettings.depth)
  assert.equal(height, 600, 'a full pile fills its room')
  assert.ok((spots.at(-1)?.down ?? 0) > 600 - 62, 'the oldest run on past its foot')
  const gap = (depth: number) => (spots[depth + 1]?.down ?? 0) - (spots[depth]?.down ?? 0)
  const average = (from: number, to: number) => {
    let total = 0
    for (let depth = from; depth < to; depth += 1) total += gap(depth)
    return total / (to - from)
  }
  const deep = spots.length - 20
  assert.ok(
    average(deep, deep + 18) < average(0, 18) / 1.5,
    'the deep layer packs at least half again as tight',
  )
  const inset = (124 * (0.5 - pileSettings.bleed)) / 1200
  for (const spot of spots) {
    assert.ok(spot.across >= inset - 1e-9 && spot.across <= 1 - inset + 1e-9, `stamp ${spot.index}`)
  }
  assert.ok(
    spots.some((spot) => spot.across < 62 / 1200),
    'some stamps hang off the left side',
  )
})

void test('the top of the pile spreads its stamps across the width', () => {
  const { spots } = pileLayout(300, 1200, 124, 600)
  const top = spots.slice(0, 8).map((spot) => spot.across)
  const thirds = new Set(top.map((across) => Math.min(2, Math.floor(across * 3))))
  assert.equal(thirds.size, 3, 'the newest eight reach every third of the width')
})
