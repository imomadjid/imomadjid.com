import assert from 'node:assert/strict'
import { test } from 'node:test'

import { wallPlaces } from './guestbook-places'
import { fakeArrivals, fillPages, page } from './guestbook-wall'

const arrivals = fakeArrivals(400, wallPlaces)
const records = fillPages(arrivals)

void test('pages already filled never change as visitors arrive', () => {
  const earlier = fillPages(arrivals.slice(0, 150))
  for (const [index, record] of earlier.entries()) {
    const later = records[index]
    assert.ok(later)
    assert.deepEqual(
      [later.page, later.x, later.y, later.deal.family, later.deal.pictorial],
      [record.page, record.x, record.y, record.deal.family, record.deal.pictorial],
    )
  }
})

void test('a longer guestbook starts with the shorter one', () => {
  const shorter = fakeArrivals(50, wallPlaces)
  for (const [index, arrival] of shorter.entries()) {
    assert.deepEqual(arrival, arrivals[index])
  }
})

void test('every stamp keeps inside its page and pages fill in order', () => {
  let page_ = 0
  for (const record of records) {
    assert.ok(record.page === page_ || record.page === page_ + 1, `stamp ${record.index}`)
    page_ = record.page
    const angle = (record.print.rotation * Math.PI) / 180
    const [cos, sin] = [Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle))]
    const half = {
      x: (record.width * cos + record.height * sin) / 2,
      y: (record.width * sin + record.height * cos) / 2,
    }
    // A stamp too wide for the page at its angle is centred instead.
    if (half.x * 2 < page.width) {
      assert.ok(record.x - half.x >= 0 && record.x + half.x <= page.width, `stamp ${record.index}`)
    }
    assert.ok(record.y - half.y >= 0 && record.y + half.y <= page.height, `stamp ${record.index}`)
  }
})

void test('a page holds a handful of stamps', () => {
  const counts = new Map<number, number>()
  for (const record of records) counts.set(record.page, (counts.get(record.page) ?? 0) + 1)
  const full = [...counts.values()].slice(0, -1)
  const average = full.reduce((sum, count) => sum + count, 0) / full.length
  assert.ok(average >= 4 && average <= 10, `about ${average.toFixed(1)} a page`)
})
