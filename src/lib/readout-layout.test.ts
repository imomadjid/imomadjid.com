import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { readoutBar, readoutRow, readoutSpace, wrapLines } from '#/lib/readout-layout'

const desktop = { x: 0, y: 0, width: 1440, height: 900 }
const phone = { x: 0, y: 0, width: 390, height: 844 }

void test('items that fit with their gaps stay on one line', () => {
  assert.equal(wrapLines([100, 100, 100], 320, 10), 1)
  assert.equal(wrapLines([], 320, 10), 1)
})

void test('the item that would overflow starts the next line', () => {
  assert.equal(wrapLines([100, 100, 100], 319, 10), 2)
  assert.equal(wrapLines([100, 100, 100, 100], 210, 10), 2)
  assert.equal(wrapLines([100, 100, 100], 150, 10), 3)
})

void test('an item wider than the row takes a line of its own', () => {
  assert.equal(wrapLines([50, 400, 50], 300, 10), 3)
})

void test('the row spans a photo wide enough for its line, from its left edge', () => {
  const photo = { x: 105, y: 24, width: 1230, height: 820 }
  const row = readoutRow(desktop, 24, [120, 90, 90, 60, 40], photo)
  assert.deepEqual(row, { x: 105, y: 856, width: 1230, lines: 1, gap: 24 })
})

void test('under a narrow photo the row grows past it, centred, rather than wrap', () => {
  const photo = { x: 447, y: 24, width: 546, height: 820 }
  const row = readoutRow(desktop, 24, [120, 90, 90, 60, 40, 140], photo)
  const oneLine = 540 + 5 * 24
  assert.equal(row.width, oneLine)
  assert.equal(row.x, 447 + (546 - oneLine) / 2)
  assert.equal(row.lines, 1)
})

void test('past the viewport the row stops at its margins and wraps', () => {
  const photo = { x: 12, y: 120, width: 366, height: 549 }
  const row = readoutRow(phone, 12, [120, 90, 95, 64, 40, 130], photo)
  assert.equal(row.x, 12)
  assert.equal(row.width, 366)
  assert.equal(row.lines, 2)
  // The line count doesn't need the photo.
  assert.equal(readoutRow(phone, 12, [120, 90, 95, 64, 40, 130]).lines, 2)
})

void test('unmeasured, the row takes the photo and a line', () => {
  const photo = { x: 12, y: 120, width: 366, height: 549 }
  assert.deepEqual(readoutRow(phone, 12, [], photo), {
    x: 12,
    y: 681,
    width: 366,
    lines: 1,
    gap: 16,
  })
  assert.equal(readoutSpace(2), 12 + 20 + 4 + 20)
})

void test('the bar keeps a landscape photo’s width under a portrait one, centred', () => {
  const portrait = { x: 447, y: 24, width: 546, height: 820 }
  const bar = readoutBar(desktop, 24, [[120, 90, 90, 60, 40]], 1230, portrait)
  assert.deepEqual(bar, { x: 105, y: 856, width: 1230, lines: 1, gap: 24 })
})

void test('the bar grows past the photos for its longest readout, up to the margins', () => {
  const short = [120, 90, 90, 60, 40]
  const long = [120, 90, 90, 60, 40, 600]
  assert.equal(readoutBar(desktop, 24, [short, long], 500).width, 1000 + 5 * 24)
  assert.equal(readoutBar(desktop, 24, [short, [...long, 400]], 500).width, 1440 - 48)
})

void test('the bar takes as many lines as the readout that wraps most', () => {
  const bar = readoutBar(
    phone,
    12,
    [
      [120, 90],
      [120, 90, 95, 64, 40, 130],
    ],
    366,
  )
  assert.equal(bar.lines, 2)
  assert.equal(bar.x, 12)
  assert.equal(readoutBar(phone, 12, []).lines, 1)
})
