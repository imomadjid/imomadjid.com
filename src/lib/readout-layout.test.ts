import { strict as assert } from 'node:assert'
import { test } from 'node:test'

import { readoutBar, readoutSpace } from '#/lib/readout-layout'

const desktop = { x: 0, y: 0, width: 1440, height: 900 }
const phone = { x: 0, y: 0, width: 390, height: 844 }

void test('the bar keeps a landscape photo’s width under a portrait one, centred', () => {
  const portrait = { x: 447, y: 24, width: 546, height: 820 }
  assert.deepEqual(readoutBar(desktop, 24, 1230, portrait), {
    center: 720,
    y: 860,
    minWidth: 1230,
    maxWidth: 1392,
    grid: false,
  })
})

void test('a phone’s bar is a grid on the bottom margin, whatever the photo', () => {
  const photo = { x: 12, y: 160, width: 366, height: 244 }
  const bar = readoutBar(phone, 12, 366, photo)
  assert.equal(bar.grid, true)
  // Two rows of 36 px, 12 px apart, above the 12 px margin.
  assert.equal(bar.y, 844 - 12 - 84)
  assert.equal(bar.minWidth, 366)
})

void test('the photo leaves a row under it, or a phone’s two', () => {
  assert.equal(readoutSpace(desktop.width), 16 + 36)
  assert.equal(readoutSpace(phone.width), 16 + 84)
})

void test('the bar never takes more than the viewport less its margins', () => {
  const photo = { x: 0, y: 0, width: 0, height: 0 }
  assert.equal(readoutBar(desktop, 24, 2000, photo).minWidth, 1392)
})
