import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { readoutBar, readoutSlots, readoutSpace } from '#/lib/readout-layout'

const desktop = { x: 0, y: 0, width: 1440, height: 900 }
const phone = { x: 0, y: 0, width: 390, height: 844 }

void test('the bar keeps a landscape photo’s width under a portrait one, centred', () => {
  const portrait = { x: 447, y: 24, width: 546, height: 820 }
  const bar = readoutBar(desktop, 24, [90, 62, 50, 40, 30, 120], 1230, portrait)
  assert.deepEqual(bar, { x: 105, y: 860, width: 1230 })
})

void test('the bar grows past the photos for its cells, up to the margins', () => {
  const slots = [90, 62, 50, 40, 30, 600]
  const photo = { x: 0, y: 0, width: 0, height: 0 }
  assert.equal(readoutBar(desktop, 24, slots, 500, photo).width, 872 + 5 * 32)
  assert.equal(readoutBar(desktop, 24, [...slots, 900], 500, photo).width, 1440 - 48)
})

void test('a phone lays its cells in three columns, each as wide as its widest cell', () => {
  // Columns: max(90, 40), max(62, 30), max(50, 150), two 20 px gaps.
  const bar = readoutBar(phone, 12, [90, 62, 50, 40, 30, 150], 300, 'pinned')
  assert.equal(bar.width, 90 + 62 + 150 + 40)
  assert.equal(bar.x, 24)
  // Never past the margins.
  assert.equal(readoutBar(phone, 12, [90, 62, 50, 40, 30, 400], 300, 'pinned').width, 366)
})

void test('a pinned bar sits on the bottom margin, whatever the photo', () => {
  const bar = readoutBar(phone, 12, [], 366, 'pinned')
  // Two rows of 36 px, 12 px apart, above the 12 px margin.
  assert.equal(bar.y, 844 - 12 - 84)
  assert.equal(readoutSpace(phone.width), 16 + 84)
  assert.equal(readoutSpace(desktop.width), 16 + 36)
})

void test('each slot takes its widest cell, and a set without a recipe has none', () => {
  assert.deepEqual(
    readoutSlots([
      [60, 40, 50, 30, 20, 120],
      [64, 52, 50, 30, 20],
    ]),
    [64, 52, 50, 30, 20, 120],
  )
  assert.deepEqual(readoutSlots([[60, 40]]), [60, 40])
  assert.deepEqual(readoutSlots([]), [])
})
